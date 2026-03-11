# Release - v0.23.0 - RF Multisource Ingestion

Sovereign Watch takes a massive leap forward in signal intelligence with **v0.23.0**, fundamentally restructuring how radio frequency (RF) infrastructure is ingested, parsed, and visualized across the tactical grid.

### Key Features

- **RF_Pulse Ingestion Engine**: We have deprecated our fragmented scraping scripts in favor of a unified, highly concurrent Python microservice: `rf_pulse`. This dedicated poller seamlessly aggregates data from RepeaterBook, Amateur Radio Directory (ARD), NOAA Weather Radio, and now **RadioReference**.
- **RadioReference SOAP Integration**: Advanced intelligence comes online. Using `zeep`, Sovereign Watch now supports fully authenticated sessions against the RadioReference database to pull trunked and conventional radio systems. Just supply your API keys in the `.env` file.
- **Tactical Band Badges**: The map UI has been upgraded. Selecting an RF relay will dynamically compute its band designation (`2m`, `70cm`, `WX (VHF)`) and present it neatly beside the `IDENTIFIED_TARGET` header alignment block for rapid operator recognition.

### Technical Details

- **Dependencies**: The `rf_pulse` poller utilizes `zeep` for SOAP API interactions, and pairs `beautifulsoup4` with `lxml` for exceptionally fast scraping of community repositories like ARD.
- **Architecture Updates**: The `README.md` and system diagrams have been formally expanded to cover these new capabilities.

### Upgrade Instructions

1. **Pull the latest code** from the repository context.
2. Ensure you have populated your `.env` with `RADIOREF_APP_KEY`, `RADIOREF_USERNAME`, and `RADIOREF_PASSWORD`.
3. Rebuild the cluster to compile the new dependencies:
   ```bash
   docker compose up -d --build
   ```
