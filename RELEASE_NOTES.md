# Release - v0.37.0 - Semantic Intelligence & Architectural Visualization

## High-Level Summary

This feature release significantly enhances the project's **Developer Experience (DX)** and **AI-Analyst capabilities**. By integrating the **Model Context Protocol (MCP)** with specialized Language Servers (LSPs) for both Python and TypeScript, we've enabled deep semantic awareness across the entire codebase—eliminating text-search guesses and replacing them with bulletproof symbol resolution. Additionally, we've integrated **graph-it-live** to provide real-time architectural insights.

## Key Features

- **Semantic Intelligence Integration**: Added full MCP support for specialized LSP servers.
    - **Pyright (Backend)**: Enabled deep semantic analysis and "Go to Definition" capabilities for all poller-based ingestion services.
    - **tsserver (Frontend)**: Automated TypeScript symbol resolution for the 30+ Tactical Map and HUD components.
- **Architectural Visualization**: Integrated the **graph-it-live** MCP server, providing real-time dependency graphing to understand the relationship between our 15+ microservices and the React frontend.
- **Tooling Isolation**: Introduced `docker-compose-tools.yml` to run all MCP and LSP infrastructure in isolated containers—no more manual host-side dependency installs.
- **IDE Reliability**: Standardized `.gitignore` and `.vscode/settings.json` to ensure code formatting (Black/Prettier) and analysis paths stay consistent for every developer on the team.

## Technical Details

- **Protocol Bridge**: Implemented `isaacphi/mcp-language-server` to bridge Docker-based LSPs into the AI agent context.
- **Service Specialization**: Split analysis services into `mcp-lsp` (Pyright) and `mcp-tsserver` (TypeScript) in our tools stack.
- **Multi-Source Support**: Updated `.mcp.json` to concurrently support multiple specialized servers.

## Upgrade Instructions

1. **Pull the latest changes**:
   ```bash
   git pull origin dev
   ```

2. **Initialize the Tools stack**:
   ```bash
   docker compose -f docker-compose-tools.yml build
   ```

3. **Verify MCP status**:
   ```bash
   # Check Pyright status
   docker compose -f docker-compose-tools.yml run --rm mcp-lsp
   ```

4. **Restart core services**:
   ```bash
   docker compose up -d
   ```
