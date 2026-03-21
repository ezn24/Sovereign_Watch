# Release - v0.43.0 - Space Weather & Geomagnetic Intelligence

## Summary

This minor release introduces comprehensive space weather and geomagnetic intelligence to the Sovereign Watch platform. By integrating NOAA SWPC data streams, operators now have real-time visibility into planetary K-index (Kp) metrics, GPS degradation risks, and active Auroral Oval boundaries. We have also introduced a new Jamming Forecaster layer to visualize active RF jamming and GNSS degradation zones across the globe.

To support these new layers, the UI has been updated with a centralized Environmental ("ENV") filter suite, seamlessly integrating these critical atmospheric metrics alongside existing RF and Network infrastructure controls.

## Key Features

*   **Auroral Oval Visualization**: Live, 3D animated tracking of the Northern and Southern Lights on both the Situation Globe and Orbital views.
*   **Persistent Kp-Index Widget**: A new tactical HUD badge integrated directly into the Top Bar, providing instant planetary K-index readings and GPS degradation risk assessments across all operational views.
*   **Jamming Forecaster**: Active RF jamming and GNSS degradation zones are now visualized as interactive intelligence layers on the tactical map.
*   **Environmental Filter Suite**: A streamlined header toggle group ("ENV") consolidates all space weather and environmental layers, accessible from both the main dashboard and the Orbital Map's object panel.

## Technical Details

*   **Frontend Integration**: Wired space weather telemetry (`auroraData`, `jammingData`) into `OrbitalMap.tsx` and `SituationGlobe.tsx` using `useAnimationLoop` and Deck.gl.
*   **HUD Optimization**: Relocated `KpIndexWidget` from the tactical map overlay to the persistent `TopBar.tsx`, ensuring uniform visibility across Tactical, Orbital, Radio, and Dashboard modes.
*   **Backend Polling**: Introduced dedicated data polling from `/api/space-weather/aurora` and `/api/jamming/active` at optimized 60-second intervals.

## Upgrade Instructions

Standard hot-reload deployment. Provide the necessary `.env` variables for space weather endpoints if applicable.

```bash
git pull origin main
docker compose build frontend
docker compose up -d
```
