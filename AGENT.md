# AGENT.md — Agent API Starter

Machine-oriented guide for AI agents discovering and calling this API.

## What this service is

Pay-per-use HTTP API. Authenticate with a Bearer API key (`agt_...`). Capabilities are versioned under `/v1`. Credits are deducted per successful paid call. When credits are exhausted, endpoints return HTTP **402**.

## Base URL

Local default: `http://localhost:8787`

## Discovery

| Resource | URL |
|----------|-----|
| OpenAPI 3.1 | `GET /openapi.json` |
| Human docs (Swagger UI) | `GET /docs` |
| Health | `GET /health` |
| This file | `AGENT.md` (repo root) |

Prefer `/openapi.json` as the source of truth for request/response schemas.

## Authentication

```http
Authorization: Bearer agt_<your_key>
```

- Keys always start with `agt_`.
- Missing/invalid/unknown key → **401**.
- Demo key for local boot (see `.env.example`): `agt_demo_sk_live_7f3a9c2e1b8d4e6f`

## Metering

- Unit: **credit**
- `POST /v1/summarize` costs **1** credit per successful response
- `GET /v1/me` — inspect remaining credits (does not charge beyond rate-limit accounting)
- `POST /v1/billing/topup` — **fake** top-up for local/dev only; body `{ "amount": number }`
- Insufficient credits → **402** with `{ "error": "insufficient_credits", ... }`
- Rate limit exceeded → **429**

## Endpoints (quick)

### POST /v1/summarize

Extractive summarization (no external LLM keys).

Request:

```json
{ "text": "string (required)", "maxSentences": 3 }
```

Response **200**:

```json
{
  "summary": "string",
  "sentencesUsed": 2,
  "usage": { "creditsCharged": 1, "creditsRemaining": 99 }
}
```

### GET /v1/me

Response **200**:

```json
{
  "keyPrefix": "agt_demo_sk_...",
  "name": "demo",
  "credits": 100,
  "totalCharged": 0,
  "createdAt": "ISO-8601"
}
```

### POST /v1/billing/topup

```json
{ "amount": 100 }
```

Dev-only credit grant. Do not rely on this in production deployments.

## Agent workflow (recommended)

1. `GET /openapi.json` — confirm paths and schemas
2. `GET /v1/me` — verify key + credits
3. Call capability endpoints (`/v1/summarize`, …)
4. On **402**, call `/v1/billing/topup` in local/dev, or follow the operator’s real billing flow in production
5. On **429**, back off using `X-RateLimit-Reset`

## Errors

| Status | Meaning |
|--------|---------|
| 400 | Validation / invalid JSON |
| 401 | Auth failure |
| 402 | Out of credits |
| 404 | Unknown route |
| 429 | Rate limited |
| 500 | Internal error |

Error bodies are JSON: `{ "error": "snake_case_code", "message": "..." }`.

## Extending

Operators replace `src/services/summarize.ts` / `src/routes/summarize.ts` with their product capability while keeping auth + metering. Always re-check `/openapi.json` after upgrades.
