import { Hono } from "hono";
import { cors } from "hono/cors";
import { summarizeRoutes } from "./routes/summarize.js";
import { meRoutes } from "./routes/me.js";
import { billingRoutes } from "./routes/billing.js";
import { openApiRoutes } from "./routes/openapi.js";

export function createApp() {
  const app = new Hono();

  app.use("*", cors());

  app.get("/", (c) =>
    c.json({
      name: "agent-api-starter",
      message: "Sell software to AI agents. See AGENT.md, /openapi.json, and /docs.",
      endpoints: {
        health: "GET /health",
        openapi: "GET /openapi.json",
        docs: "GET /docs",
        summarize: "POST /v1/summarize",
        me: "GET /v1/me",
        topup: "POST /v1/billing/topup",
      },
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));

  app.route("/", openApiRoutes);
  app.route("/v1", summarizeRoutes);
  app.route("/v1", meRoutes);
  app.route("/v1", billingRoutes);

  app.notFound((c) =>
    c.json({ error: "not_found", message: `No route for ${c.req.method} ${c.req.path}` }, 404),
  );

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "internal_error", message: err.message }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
