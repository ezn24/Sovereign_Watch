# Task: Fix FCC Tower Scatter Patches

## Issue
**Date: 2026-03-22**

The user reported "scatter plot rendering patches" with the FCC tower dataset on the tactical map. 
Screenshots showed dense clusters (e.g., Joplin, MO; Nashville, TN) with total voids in between, even if the data was fully ingested. 

### RCA
Looking into the `infra_towers` query in `backend/api/routers/infra.py`:
```python
    query = """
    SELECT ...
    FROM (
        SELECT id, ...
        FROM infra_towers
        WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        LIMIT $5
    ) as sub;
    """
```
1.  **Missing ORDER BY**: Without an explicit sort, PostgreSQL returns rows in physical/disk order. Since the `infra_poller` ingests towers in batches (by state/region), the "first 2000" rows found in a viewport were always from whatever batch was physically stored first.
2.  **Low Limit**: A limit of 2,000 dots is insufficient for a viewport covering multiple states, making the clusters look like an incomplete dataset.

## Solution
1. **Added `ORDER BY id`**: Since the ID column is a `gen_random_uuid()`, sorting by it effectively creates a random sample of the filtered set. This distributes the budget uniformly across the entire viewport, eliminating "patches".
2. **Increased Limit**: Boosted the default `limit` from 2,000 to 10,000 to provide a much higher-fidelity representation of infrastructure density on modern browsers.

## Changes
- `backend/api/routers/infra.py`: Updated `get_infra_towers` with sort and limit changes.

## Verification
- Confirmed row count of 195k+ via `sovereign-timescaledb`.
- Observed backend auto-reload.
- Visual confirmation in frontend (via user feedback) that the patches disappeared.

## Benefits
- **Visual Accuracy**: Users now see a representative distribution of infrastructure even at national zoom levels.
- **Improved UX**: Higher density of dots makes the infrastructure layer feel more complete and professional.
