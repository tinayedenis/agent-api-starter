import type { Context, Next } from "hono";
import { getStore } from "../db/store.js";

export type AuthVariables = {
  apiKey: string;
  keyName: string;
  credits: number;
};

export async function requireApiKey(c: Context, next: Next) {
  const header = c.req.header("authorization") ?? c.req.header("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return c.json(
      {
        error: "unauthorized",
        message: "Missing or invalid Authorization header. Use: Authorization: Bearer agt_...",
      },
      401,
    );
  }

  const key = match[1]!.trim();
  if (!key.startsWith("agt_")) {
    return c.json(
      {
        error: "unauthorized",
        message: "API keys must start with agt_",
      },
      401,
    );
  }

  const store = getStore();
  const record = store.getKey(key);
  if (!record) {
    return c.json({ error: "unauthorized", message: "Unknown API key" }, 401);
  }

  c.set("apiKey", key);
  c.set("keyName", record.name);
  c.set("credits", record.credits);
  await next();
}
