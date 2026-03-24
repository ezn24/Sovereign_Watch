# CI Security Hardening

## Issue

A review of `.github/workflows/ci.yml` identified three classes of attack vectors that could be exploited by a malicious pull request:

1. **Supply-chain attack via mutable action tags** – All `uses:` steps referenced floating semver tags (e.g. `@v4`, `@v3`). A tag can be silently re-pointed to a different (malicious) commit by the action's maintainer or by an attacker who compromises the maintainer's account. Because GitHub Actions are resolved at runtime, a tag reassignment would immediately affect all subsequent workflow runs without any visible change to the repository's own files.

2. **Unpinned tool version (`pnpm version: latest`)** – The `pnpm/action-setup` step used `version: latest`, meaning the runner would download and execute whatever version of pnpm was tagged `latest` on npm at the time the job ran. This allows a compromised npm publish to inject arbitrary code into the CI runner.

3. **No job timeouts** – Without `timeout-minutes`, a malicious PR containing an infinite loop, long sleep, or resource-intensive computation could hold a runner indefinitely, exhausting GitHub Actions minutes (resource-exhaustion / denial-of-service against CI).

## Solution

- **Pin every `uses:` reference to its immutable commit SHA**, with the human-readable tag preserved in an inline comment.  SHA references cannot be silently re-pointed; only an attacker who can rewrite the target repository's git history (which GitHub does not permit for public repos) could change what code runs.
- **Replace `version: latest` with `version: 9`** to bind pnpm to the major version whose lockfile format (`lockfileVersion: '9.0'`) is already in use. This prevents both unexpected breakage from a v10 upgrade and the (lower-probability) risk of a malicious `latest` tag.
- **Add `timeout-minutes` to every job** (`changes`: 5 min, `frontend-smoke` / `python-smoke`: 15 min) to bound the maximum runner time any PR can consume.

## Changes

### `.github/workflows/ci.yml`

| Location | Before | After |
|----------|--------|-------|
| `changes` job | no timeout | `timeout-minutes: 5` |
| `frontend-smoke` job | no timeout | `timeout-minutes: 15` |
| `python-smoke` job | no timeout | `timeout-minutes: 15` |
| `actions/checkout` (×3) | `@v4` | `@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4` |
| `dorny/paths-filter` | `@v3` | `@de90cc6fb38fc0963ad72b210f1f284cd68cea36 # v3` |
| `pnpm/action-setup` | `@v4` + `version: latest` | `@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v4` + `version: 9` |
| `actions/setup-node` | `@v4` | `@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4` |
| `actions/setup-python` | `@v5` | `@a26af69be951a213d495a4c3e4e4022e16d87065 # v5` |

## Verification

- YAML validated with `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml').read())"` — no errors.
- SHA values confirmed by querying the HEAD commit of each action's tag branch via the GitHub API.

## Benefits

- **Supply-chain safety**: Actions are locked to the exact code that was reviewed, regardless of future tag mutations.
- **Deterministic toolchain**: The pnpm version is bound to the lockfile format already in use; no surprise breakage from a major-version bump.
- **Bounded resource usage**: Malicious PRs cannot hold runners indefinitely; jobs are killed after a defined window.
- **No functional regression**: The same actions and the same workflow logic are preserved; only the version references and timeout fields change.
