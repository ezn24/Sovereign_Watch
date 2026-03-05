# Release - v0.17.1 - Constellation Filters Patch

Sovereign Watch v0.17.1 introduces a targeted quality-of-life update to the Orbital Dashboard, improving the usability and performance of satellite constellation filtering.

- **Collapsible Subcategories**: Constellation nested filters now feature expand/collapse chevrons, saving significant vertical HUD space.
- **Default Optimization**: The Starlink constellation class is now disabled by default on fresh loads, preventing browser memory exhaustion from rendering all 9,000+ assets simultaneously.
- **Filter Reliability**: Restored missing metadata routing in the TAK serialization pipeline, ensuring selective constellation filtering works flawlessly across the system.

_(No special upgrade commands required, standard `docker compose up -d --build frontend` applies)._
