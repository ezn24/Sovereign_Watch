# 2026-03-21-fix-system-status-syntax-error.md

## Issue
The `SystemStatus` component in the frontend was failing to compile with a syntax error: `'/' expected` at line 422. This was caused by an unclosed `<div>` tag in the "Global Network" infrastructure filter section, which was likely introduced during the implementation of the "Environmental Filter" section.

## Solution
Identified the missing `</div>` tag at the end of the "Global Network" filter section and closed it properly. Additionally, refactored the "Environmental Filter" section to match the standard UI pattern of the other filter groups (RF, Global Network), adding an expandable header with a main toggle and sub-filter support.

## Changes
- Modified `frontend/src/components/widgets/SystemStatus.tsx`:
    - Added `envExpanded` state for the Environmental section.
    - Fixed unclosed `</div>` for the "Global Network" block.
    - Refactored Environmental section to use the standard expandable header pattern.
    - Added "Aurora Forecast" as an explicit sub-filter within the expanded Environmental group.
    - Standardized naming and iconography for the section.
    - Added a quick-toggle `Globe` button to the widget header.
    - Reordered header quick-toggles to: **RF | INFRA | ENV**.
- Modified `frontend/src/components/widgets/OrbitalCategoryPills.tsx`:
    - Added a `Globe` quick-toggle button to the header, left of the track count.
    - Fixed potential undefined `filters` access via optional chaining.
    - Cleaned up unused `stats` state, interfaces, and associated API calls.
- Modified `frontend/src/components/map/OrbitalMap.tsx`:
    - Wired in aurora and jamming data polling and rendering.
    - Cleaned up unused props and resolved linting warnings.
- Modified `frontend/src/components/map/TacticalMap.tsx`:
    - Removed `KpIndexWidget` from the map corner rendering.
- Modified `frontend/src/components/layouts/TopBar.tsx`:
    - Integrated `KpIndexWidget` into the top bar, positioned next to the view mode selector.
- Modified `frontend/src/components/widgets/KpIndexWidget.tsx`:
    - Refactored styles for a more compact and transparent HUD aesthetic that matches the top bar.
- Modified `frontend/src/components/map/SituationGlobe.tsx`:
    - Added aurora forecast polling and rendering.
    - Integrated `buildAuroraLayer` into the global situation display.

## Verification
- Verified JSX tag balancing in `SystemStatus.tsx`.
- Verified UI consistency with RF and Global Network sections.
- Ran `eslint` on `SystemStatus.tsx` to ensure zero syntax errors.

## Benefits
- Restores frontend compilation.
- Ensures properly nested UI components.
