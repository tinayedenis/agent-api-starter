import { Hono } from "hono";
import { getStore } from "../db/store.js";
import { requireApiKey } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const meRoutes = new Hono();

meRoutes.get("/me", requireApiKey, rateLimit, async (c) => {
  const apiKey = c.get("apiKey") as string;
  const record = getStore().getKey(apiKey)!;
  return c.json({
    keyPrefix: `${record.key.slice(0, 12)}...`,
    name: record.name,
    credits: record.credits,
    totalCharged: record.totalCharged,
    createdAt: record.createdAt,
  });
});
