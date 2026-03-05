import asyncio
import logging
import json
from typing import Dict
from fastapi import WebSocket, WebSocketDisconnect
from aiokafka import AIOKafkaConsumer
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError
from uvicorn.protocols.utils import ClientDisconnected

from core.config import settings
from services.tak import transform_to_proto

logger = logging.getLogger("SovereignWatch.Broadcast")

# Max messages queued per client before we start dropping (oldest dropped first).
# At ~37s orbital cycles emitting 11k messages, 256 gives ~23ms grace before dropping.
_CLIENT_QUEUE_SIZE = 256


class BroadcastManager:
    def __init__(self):
        # ws → (queue, worker_task)
        self._clients: Dict[WebSocket, tuple[asyncio.Queue, asyncio.Task]] = {}
        self.consumer: AIOKafkaConsumer | None = None
        self.consumer_task: asyncio.Task | None = None
        self.running = False

    @property
    def active_connections(self):
        return set(self._clients.keys())

    async def connect(self, websocket: WebSocket):
        """Register a new WebSocket client with its own send queue."""
        q: asyncio.Queue = asyncio.Queue(maxsize=_CLIENT_QUEUE_SIZE)
        task = asyncio.create_task(self._client_worker(websocket, q))
        self._clients[websocket] = (q, task)
        logger.info(f"Client connected. Total clients: {len(self._clients)}")

    async def disconnect(self, websocket: WebSocket):
        """Unregister a WebSocket client and cancel its worker."""
        entry = self._clients.pop(websocket, None)
        if entry:
            q, task = entry
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            try:
                await websocket.close()
            except Exception:
                pass
            logger.info(f"Client disconnected. Total clients: {len(self._clients)}")

    async def start(self):
        """Start the Kafka consumer and broadcast loop."""
        if self.running:
            return

        self.running = True
        try:
            self.consumer = AIOKafkaConsumer(
                "adsb_raw", "ais_raw", "orbital_raw",
                bootstrap_servers=settings.KAFKA_BROKERS,
                group_id=None,  # broadcast mode — every instance gets all messages
                auto_offset_reset="latest",
            )
            await self.consumer.start()
            logger.info("Broadcast Kafka Consumer started")
            self.consumer_task = asyncio.create_task(self._consume())
        except Exception as e:
            logger.error(f"Failed to start Broadcast Consumer: {e}")
            self.running = False

    async def stop(self):
        """Stop the consumer and close all connections."""
        self.running = False

        if self.consumer_task:
            self.consumer_task.cancel()
            try:
                await self.consumer_task
            except asyncio.CancelledError:
                pass
            self.consumer_task = None

        if self.consumer:
            await self.consumer.stop()
            self.consumer = None
            logger.info("Broadcast Kafka Consumer stopped")

        for ws in list(self._clients.keys()):
            await self.disconnect(ws)

    async def _consume(self):
        """Consume from Kafka and enqueue to each client — never blocked by slow clients."""
        if not self.consumer:
            logger.error("Consumer not initialized!")
            return

        try:
            async for msg in self.consumer:
                if not self.running:
                    break

                try:
                    data = json.loads(msg.value.decode("utf-8"))
                    tak_bytes = transform_to_proto(data)
                except Exception as e:
                    logger.error(f"Error transforming message: {e}")
                    continue

                if not self._clients:
                    continue

                # Enqueue to every client. If their queue is full, drop the oldest
                # message so we never block the consume loop.
                for ws, (q, _) in list(self._clients.items()):
                    if q.full():
                        try:
                            q.get_nowait()  # drop oldest
                        except asyncio.QueueEmpty:
                            pass
                    try:
                        q.put_nowait(tak_bytes)
                    except asyncio.QueueFull:
                        pass  # race-condition safety

        except Exception as e:
            logger.critical(f"Broadcast loop failed: {e}", exc_info=True)
            self.running = False
            for ws in list(self._clients.keys()):
                try:
                    await ws.close(code=1011)
                except Exception:
                    pass
            self._clients.clear()

    async def _client_worker(self, ws: WebSocket, q: asyncio.Queue):
        """Background task per client: dequeue and send, with a generous timeout."""
        try:
            while True:
                tak_bytes = await q.get()
                try:
                    await asyncio.wait_for(ws.send_bytes(tak_bytes), timeout=3.0)
                except asyncio.TimeoutError:
                    logger.warning("Client send timed out — disconnecting")
                    break
                except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError, ClientDisconnected):
                    break
                except Exception as e:
                    logger.error(f"Client send error: {e}")
                    break
        except asyncio.CancelledError:
            pass
        finally:
            # Ensure we remove ourselves if the worker exits for any reason
            entry = self._clients.pop(ws, None)
            if entry:
                try:
                    await ws.close()
                except Exception:
                    pass
                logger.info(f"Client worker exited. Total clients: {len(self._clients)}")


# Global Instance
broadcast_service = BroadcastManager()
