"""satnogs-pulse: SatNOGS spectrum verification ingestion service."""
import asyncio
import logging
import signal

from service import SatNOGSPulseService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s"
)


async def main():
    svc = SatNOGSPulseService()
    loop = asyncio.get_running_loop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(svc.shutdown()))

    await svc.setup()
    await svc.run()


if __name__ == "__main__":
    asyncio.run(main())
