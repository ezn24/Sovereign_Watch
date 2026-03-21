"""
SatNOGSPulseService
===================
Orchestrates SatNOGS data collection for spectrum verification.

Sources:
  - SatNOGSDBSource    : Satellite transmitter catalog (frequencies/modes per NORAD ID)
  - SatNOGSNetworkSource: Recent ground-station observations (actual received signals)

Kafka topics produced:
  - satnogs_transmitters : Transmitter catalog records
  - satnogs_observations : Ground-station observation records
"""

import asyncio
import json
import logging
import os

import redis.asyncio as aioredis
from aiokafka import AIOKafkaProducer

from sources.satnogs_db import SatNOGSDBSource
from sources.satnogs_network import SatNOGSNetworkSource

logger = logging.getLogger("satnogs_pulse")

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "sovereign-redpanda:9092")
REDIS_HOST    = os.getenv("REDIS_HOST", "sovereign-redis")
REDIS_PORT    = int(os.getenv("REDIS_PORT", "6379"))

TOPIC_TRANSMITTERS  = "satnogs_transmitters"
TOPIC_OBSERVATIONS  = "satnogs_observations"

# Fetch intervals (configurable via env)
DB_INTERVAL_H      = int(os.getenv("SATNOGS_DB_INTERVAL_H", "24"))       # Transmitter catalog: daily
NETWORK_INTERVAL_H = int(os.getenv("SATNOGS_NETWORK_INTERVAL_H", "1"))   # Observations: hourly


class SatNOGSPulseService:
    def __init__(self):
        self.running      = True
        self.producer     = None
        self.redis_client = None
        self.sources      = []

    async def setup(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BROKERS,
            value_serializer=lambda v: json.dumps(v).encode(),
        )
        await self.producer.start()
        logger.info("Kafka producer started -> topics: %s, %s", TOPIC_TRANSMITTERS, TOPIC_OBSERVATIONS)

        self.redis_client = await aioredis.from_url(
            f"redis://{REDIS_HOST}:{REDIS_PORT}", decode_responses=True
        )
        logger.info("Redis connected")

        self.sources = [
            SatNOGSDBSource(
                producer=self.producer,
                redis_client=self.redis_client,
                topic=TOPIC_TRANSMITTERS,
                fetch_interval_h=DB_INTERVAL_H,
            ),
            SatNOGSNetworkSource(
                producer=self.producer,
                redis_client=self.redis_client,
                topic=TOPIC_OBSERVATIONS,
                fetch_interval_h=NETWORK_INTERVAL_H,
            ),
        ]

    async def run(self):
        """Run all source loops concurrently."""
        tasks = [asyncio.create_task(src.loop()) for src in self.sources]
        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            pass

    async def shutdown(self):
        logger.info("satnogs-pulse shutting down...")
        self.running = False
        if self.producer:
            await self.producer.stop()
        if self.redis_client:
            await self.redis_client.close()
