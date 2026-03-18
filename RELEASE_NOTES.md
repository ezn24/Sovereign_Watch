# Release - v0.35.1 - AI Documentation & Env Refinement

## High-Level Summary

This patch release focuses on strengthening the project's documentation and environment configuration, specifically targeting the newly implemented triple-model AI architecture. It ensures that operators have clear guidance on configuring and deploying the `secure-core` (local), `public-flash` (Gemini), and `deep-reasoner` (Claude) models, while also providing a more robust `.env.example` template for easier system stand-up.

## Key Features

- **AI Triple-Model Documentation**: A complete overhaul of the configuration guides to clearly explain the fail-closed routing and data sovereignty policies of the local AI core.
- **Enhanced Environment Templates**: `.env.example` now includes comprehensive coverage for all LiteLLM and RF Pulse variables, reducing the "guesswork" for new deployments.
- **Documentation Hygiene**: Fixed multiple broken internal links and stabilized table layouts for better readability across various Markdown viewers.

## Technical Details

- **Version Bump**: UI bumped to `0.35.1`.
- **Config Schema**: Added explicit environment variables for `ANTHROPIC_MODEL`, `GEMINI_MODEL`, and `OPEN_API_MODEL` to allow finer control over model versions without changing the underlying backend code.
- **Documentation**: Unified the formatting of intelligence poller tables across the entire `Documentation/` directory.

## Upgrade Instructions

1. **Pull the latest changes**:
   ```bash
   git pull origin dev
   ```

2. **Update your `.env` file**:
   Check `.env.example` for new variables related to AI model strings and ensure your local configuration matches the new triple-layer architecture.

3. **Rebuild and Restart**:
   ```bash
   docker compose up -d --build
   ```
