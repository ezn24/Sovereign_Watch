# Release - v0.43.2 - UI Cleanup

This patch cleans up the TopBar by removing the redundant global AI widget, shifting focus to the fully integrated Analyst Panel. Furthermore, opening the Analyst Panel no longer triggers a potentially expensive or unwanted auto-run analysis, instead correctly waiting for user input.

### Key Features
- **Decluttered TopBar**: Removed orphaned `AIEngineWidget`.
- **Analyst UX**: Operator-controlled AI execution instead of auto-running.

### Technical Details
- Removed `AIEngineWidget.tsx` and updated `TopBar.tsx` references.
- Stripped auto-run timing triggers from `App.tsx`.

### Upgrade Instructions
```bash
git pull origin dev
docker compose down
docker compose up -d --build frontend
```
