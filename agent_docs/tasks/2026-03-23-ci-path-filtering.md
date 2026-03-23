# CI Path-Based Filtering

## Issue

The CI pipeline introduced in the previous task ran all 9 test suites on every push and pull request, regardless of what changed. Editing a single line in the frontend triggered Aviation Poller tests; fixing a typo in a GDELT source file kicked off the full JS8Call suite. This wastes runner minutes and slows PR feedback loops.

## Solution

Added a dedicated `changes` job (the first job in the workflow) that uses **`dorny/paths-filter@v3`** to inspect which file paths differ between the base and the PR head (or between the previous and current commit on `main`). Each of the 9 test jobs now declares `needs: changes` and a matching `if: needs.changes.outputs.<key> == 'true'` condition; they skip themselves entirely when their source tree is untouched.

Any edit to `.github/workflows/ci.yml` itself always sets every flag to `true`, ensuring pipeline changes are validated against all suites before merging.

## Changes

### `.github/workflows/ci.yml`

New `changes` job with `dorny/paths-filter@v3`:

```yaml
changes:
  name: Detect changed paths
  runs-on: ubuntu-latest
  outputs:
    frontend:        ${{ steps.filter.outputs.frontend }}
    backend-api:     ${{ steps.filter.outputs.backend-api }}
    aviation-poller: ${{ steps.filter.outputs.aviation-poller }}
    # … all 9 outputs …
  steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          frontend:
            - 'frontend/**'
            - '.github/workflows/ci.yml'
          backend-api:
            - 'backend/api/**'
            - '.github/workflows/ci.yml'
          # … one block per component …
```

Each test job gains two new fields:

```yaml
needs: changes
if: needs.changes.outputs.<key> == 'true'
```

### Path → job mapping

| Job | Watched paths |
|-----|---------------|
| `frontend` | `frontend/**` |
| `backend-api` | `backend/api/**` |
| `aviation-poller` | `backend/ingestion/aviation_poller/**` |
| `maritime-poller` | `backend/ingestion/maritime_poller/**` |
| `rf-pulse` | `backend/ingestion/rf_pulse/**` |
| `space-pulse` | `backend/ingestion/space_pulse/**` |
| `infra-poller` | `backend/ingestion/infra_poller/**` |
| `gdelt-pulse` | `backend/ingestion/gdelt_pulse/**` |
| `js8call` | `js8call/**` |

All jobs also watch `.github/workflows/ci.yml` itself.

## Verification

YAML syntax validated locally with `python3 -c "import yaml; yaml.safe_load(...)"`.  
CodeQL Actions scan found 0 alerts.

## Benefits

- **Faster PR feedback**: a change that only touches the maritime poller spins up one job instead of nine.
- **Lower runner cost**: skipped jobs consume no minutes.
- **Safe workflow edits**: any change to `ci.yml` still triggers the full suite.
- **No false skips**: `dorny/paths-filter` compares against the PR base branch (not just the last commit), so squash-merged feature branches are handled correctly.
