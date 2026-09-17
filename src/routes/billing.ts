import { Hono } from "hono";
import { z } from "zod";
import { getStore } from "../db/store.js";
import { requireApiKey } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const topupSchema = z.object({
  amount: z.number().int().min(1).max(1_000_000).default(100),
});

export const billingRoutes = new Hono();

billingRoutes.post("/billing/topup", requireApiKey, rateLimit, async (c) => {
  let json: unknown = {};
  try {
    const text = await c.req.text();
    if (text.trim()) json = JSON.parse(text);
  } catch {
    return c.json({ error: "invalid_json", message: "Request body must be JSON" }, 400);
  }

  const parsed = topupSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return c.json(
      {
        error: "validation_error",
        message: "Invalid request body",
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const apiKey = c.get("apiKey") as string;
  const updated = getStore().topup(apiKey, parsed.data.amount);

  return c.json({
    ok: true,
    message: "Fake top-up applied (local/dev only — replace with real billing).",
    amountAdded: parsed.data.amount,
    credits: updated.credits,
  });
});
