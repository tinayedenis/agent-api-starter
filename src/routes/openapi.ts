import { Hono } from "hono";

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Agent API Starter",
    version: "0.1.0",
    description:
      "Pay-per-use HTTP API designed for AI agents. Authenticate with Bearer agt_... keys. Each summarize call costs 1 credit.",
  },
  servers: [{ url: "http://localhost:8787", description: "Local dev" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "agt_...",
        description: "API key starting with agt_",
      },
    },
    schemas: {
      SummarizeRequest: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string", minLength: 1, maxLength: 100000 },
          maxSentences: { type: "integer", minimum: 1, maximum: 20, default: 3 },
        },
      },
      SummarizeResponse: {
        type: "object",
        properties: {
          summary: { type: "string" },
          sentencesUsed: { type: "integer" },
          usage: {
            type: "object",
            properties: {
              creditsCharged: { type: "integer" },
              creditsRemaining: { type: "integer" },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/v1/summarize": {
      post: {
        operationId: "summarize",
        summary: "Extractive text summarization",
        description: "Charges 1 credit per successful call. No external LLM keys required.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SummarizeRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Summary",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SummarizeResponse" },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "402": { description: "Insufficient credits" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/v1/me": {
      get: {
        operationId: "me",
        summary: "Current key balance and metadata",
        responses: {
          "200": { description: "Account info" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/v1/billing/topup": {
      post: {
        operationId: "topup",
        summary: "Fake credit top-up (dev)",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  amount: { type: "integer", minimum: 1, default: 100 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Top-up applied" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/health": {
      get: {
        operationId: "health",
        security: [],
        summary: "Health check",
        responses: { "200": { description: "OK" } },
      },
    },
  },
} as const;

export const openApiRoutes = new Hono();

openApiRoutes.get("/openapi.json", (c) => c.json(openApiSpec));

openApiRoutes.get("/docs", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Agent API Starter — Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;
  return c.html(html);
});
