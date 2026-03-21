"""space-pulse: Unified space domain ingestion service.

Combines:
  - Orbital TLE propagation (Celestrak → sgp4 → Kafka orbital_raw)
  - SatNOGS transmitter catalog (db.satnogs.org → Kafka satnogs_transmitters)
  - SatNOGS observations (network.satnogs.org → Kafka satnogs_observations)
  - Space weather (NOAA SWPC Kp-index + Aurora → Redis + TimescaleDB)
"""
import asyncio
import logging
import signal

from service import SpacePulseService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s"
)


async def main():
    svc = SpacePulseService()
    loop = asyncio.get_running_loop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(svc.shutdown()))

    await svc.setup()
    await svc.run()


if __name__ == "__main__":
    asyncio.run(main())
