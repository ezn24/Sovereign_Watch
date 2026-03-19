# Issue
Aviation poller checks failed after resolving environment imports:
- Tests imported modules via `backend.ingestion.aviation_poller.*`, which broke when running `pytest` from the poller directory.
- H3 sharding tests expected old Resolution-4 behavior, while implementation now uses Resolution-2 sizing.

# Solution
- Updated test imports to local module imports so they work from the poller root.
- Removed an unused `math` import flagged by Ruff.
- Updated stale H3 test expectations to match current Resolution-2 constants and behavior.

# Changes
- Modified `backend/ingestion/aviation_poller/tests/test_utils.py`
  - Removed unused `math` import.
  - Changed import to `from utils import ...`.
- Modified `backend/ingestion/aviation_poller/tests/test_classification.py`
  - Changed import to `from classification import ...`.
- Modified `backend/ingestion/aviation_poller/tests/test_h3_sharding.py`
  - Updated seeded cell-count expectation for 150nm region from 469 to 7.
  - Renamed and updated area sanity test for Resolution-2 range.

# Verification
Executed once from `backend/ingestion/aviation_poller`:
- `uvx ruff check .`
- `uv run pytest`

Result:
- Ruff: all checks passed.
- Pytest: `143 passed`.

# Benefits
- Restores reliable local test execution in the poller directory.
- Aligns tests with current H3 sharding architecture.
- Keeps lint and test gates green for future changes.
