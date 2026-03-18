# AI & LLM Configuration Guide

Sovereign Watch uses a dual-layer configuration system to manage AI models. This separation allows the platform to present a clean, user-friendly catalog in the UI while maintaining complex technical routing and security logic in the background.

---

## The Two-Layer System

To add or modify an AI model, you must update two separate files. Think of this as the **Catalog** (what the user sees) and the **Plumbing** (how the system connects).

### 1. The Model Registry (`models.yaml`)
**Location:** Project Root (`/models.yaml`)

This file defines how models are presented in the **AI Analyst** dropdown and settings panels. It contains non-sensitive metadata for the frontend.

| Field | Description |
| :--- | :--- |
| `id` | The internal unique identifier (alias) used to link to the routing config. |
| `label` | The human-readable name shown to the operator (e.g., "Claude 3.5 Sonnet"). |
| `provider` | The branding shown in the UI (e.g., "Anthropic", "Google", "Local"). |
| `local` | Boolean. If `true`, the UI adds a "Secure/Local" badge to the model. |

**Example:**
```yaml
models:
  - id: deep-reasoner
    label: Claude 3.5 Sonnet
    provider: Anthropic
    local: false
```

---

### 2. The Routing Config (`backend/ai/litellm_config.yaml`)
**Location:** `backend/ai/litellm_config.yaml`

This is the technical infrastructure layer powered by [LiteLLM](https://docs.litellm.ai/). it maps the `id` from the registry to actual API endpoints, keys, and model versions.

**Why is this separate?**
- **Security:** It handles sensitive API key references (via `os.environ`).
- **Complexity:** It manages provider-specific prefixes (e.g., `anthropic/`, `gemini/`, `ollama/`).
- **Resilience:** It defines fallback logic (e.g., "If Gemini is down, use Claude").
- **Privacy:** It configures PII redaction (via Presidio) before data leaves the secure environment.

**Example:**
```yaml
model_list:
  - model_name: deep-reasoner  # MUST match the 'id' in models.yaml
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20240620
      api_key: os.environ/ANTHROPIC_API_KEY
```

---

## Adding a New Model (Workflow)

If you want to add a new model (e.g., GPT-4o), you must perform a **manual sync** across both files:

1.  **Update `models.yaml`**: Add the new entry so it appears in the UI dropdown.
2.  **Update `litellm_config.yaml`**: Add the corresponding `model_name` and technical parameters.
3.  **Update `.env`**: If the new model requires a new API key (e.g., `OPENAI_API_KEY`), add it to your environment.
4.  **Restart**: Run `docker compose up -d --build backend-api` to apply the changes.

---

## Dynamic Reloading

- **Registry (`models.yaml`)**: The Backend API reloads this file **dynamically on every request** to the configuration endpoint. You can update labels or add models to the registry without restarting the containers (though the backend won't be able to "route" to new models until the routing config is also updated).
- **Routing (`litellm_config.yaml`)**: Because this file initializes the LiteLLM proxy and environment mappings, it typically requires a **container restart** to fully apply complex routing or fallback changes.

---

## Related
- [General Configuration](./Configuration.md)
- [UI User Guide](./UI_Guide.md)
- [LiteLLM Documentation](https://docs.litellm.ai/docs/proxy/configs)
