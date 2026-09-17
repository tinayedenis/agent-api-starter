# Agent API Starter

**Sell software to AI agents** — not just to humans clicking dashboards.

This is a lean TypeScript starter for an **agent-callable HTTP API** with **Bearer API keys**, **pay-per-use credit metering**, OpenAPI discovery, and a replaceable demo capability (`POST /v1/summarize`).

Agents are becoming economic actors: they browse docs, call APIs, and pay for tools that help them finish tasks. Human-oriented SaaS (marketing sites, OAuth popup flows, monthly seats) is a poor fit. Agents want:

1. A machine-readable contract (`/openapi.json`, `AGENT.md`)
2. Simple auth (`Authorization: Bearer agt_...`)
3. Predictable metering (credits per call, `402` when empty)
4. A capability they can invoke without browser UI

This repo ships that skeleton so you can swap the demo summarizer for *your* product.

## Stack

- **Hono** — fast, lean HTTP framework
- **Zod** — request validation
- **JSON file store** — zero native deps (works with `npm` on Linux without compiling SQLite)
- **Vitest** — tests
- **TypeScript** + `tsx` for local dev

## Quickstart

```bash
npm install
cp .env.example .env
npm run dev
```

Server defaults to `http://localhost:8787`.

Demo API key (also in `.env.example`):

```text
agt_demo_sk_live_7f3a9c2e1b8d4e6f
```

### Curl examples

**Summarize** (costs 1 credit):

```bash
curl -s http://localhost:8787/v1/summarize \
  -H "Authorization: Bearer agt_demo_sk_live_7f3a9c2e1b8d4e6f" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Agents buy APIs. Humans buy UIs. Cats sleep a lot. Dogs chase cats. Cats sleep during the day.",
    "maxSentences": 2
  }' | jq
```

**Balance**:

```bash
curl -s http://localhost:8787/v1/me \
  -H "Authorization: Bearer agt_demo_sk_live_7f3a9c2e1b8d4e6f" | jq
```

**Fake top-up** (local/dev only):

```bash
curl -s http://localhost:8787/v1/billing/topup \
  -H "Authorization: Bearer agt_demo_sk_live_7f3a9c2e1b8d4e6f" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50}' | jq
```

**OpenAPI / docs**:

- `GET /openapi.json`
- `GET /docs` (Swagger UI)
- `GET /health`

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Watch mode via `tsx` |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled server |
| `npm test` | Vitest |

## Auth & metering

- Keys must start with `agt_` and are sent as `Authorization: Bearer <key>`.
- On first boot, the demo key from `DEMO_API_KEY` is seeded with `DEMO_CREDITS` (default 100).
- `POST /v1/summarize` charges **1 credit**. Out of credits → **402**.
- Simple per-key rate limit via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` → **429**.
- Persistence: `DATA_FILE` (default `./data/store.json`). No secrets are committed; `.env` and `data/` are gitignored.

## Replace the demo capability

The summarizer is intentionally dumb (extractive, no API keys) so the starter runs offline.

1. Add a new route under `src/routes/` (copy `summarize.ts`).
2. Put business logic in `src/services/`.
3. Charge credits with `getStore().charge(apiKey, cost)` after success (or check balance first like summarize does).
4. Register the route in `src/app.ts`.
5. Update `src/routes/openapi.ts` and `AGENT.md`.
6. Add a Vitest file under `tests/`.

Keep the metering + auth middleware; change only the capability.

## Project layout

```text
src/
  index.ts           # server entry
  app.ts             # Hono app wiring
  config.ts          # env helpers
  db/store.ts        # JSON persistence + credits
  middleware/        # auth + rate limit
  routes/            # HTTP endpoints + OpenAPI
  services/          # summarize (demo)
tests/               # auth, metering, summarize
AGENT.md             # agent-oriented discovery doc
```

## Production notes

This is a **starter**, not production billing:

- Replace fake `POST /v1/billing/topup` with Stripe / crypto / invoice webhooks.
- Hash API keys at rest; issue real keys via an admin flow.
- Move from JSON file store to Postgres / SQLite when you need multi-instance.
- Put the API behind TLS and proper observability.

## License

MIT
