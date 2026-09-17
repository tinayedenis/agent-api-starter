import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { getStore } from "./db/store.js";

// Ensure store + demo key exist on boot
getStore();

const app = createApp();

console.log(`Agent API listening on http://${config.host}:${config.port}`);
console.log(`OpenAPI: http://localhost:${config.port}/openapi.json`);
console.log(`Docs:    http://localhost:${config.port}/docs`);
console.log(`Demo key (from env): ${config.demoApiKey.slice(0, 12)}...`);

serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
});
