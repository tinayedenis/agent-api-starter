import { Hono } from "hono";
import { z } from "zod";
import { getConfig } from "../config.js";
import { getStore } from "../db/store.js";
import { requireApiKey } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { summarizeText } from "../services/summarize.js";

const bodySchema = z.object({
  text: z.string().min(1, "text is required").max(100_000),
  maxSentences: z.number().int().min(1).max(20).optional().default(3),
});

export const summarizeRoutes = new Hono();

summarizeRoutes.post("/summarize", requireApiKey, rateLimit, async (c) => {
  let json: unknown;
  try {
    json = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json", message: "Request body must be JSON" }, 400);
  }

  const parsed = bodySchema.safeParse(json);
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

  const cfg = getConfig();
  const apiKey = c.get("apiKey") as string;
  const store = getStore();
  const record = store.getKey(apiKey)!;

  if (record.credits < cfg.summarizeCost) {
    return c.json(
      {
        error: "insufficient_credits",
        message: "Out of credits. Call POST /v1/billing/topup to add more (dev/fake).",
        credits: record.credits,
        required: cfg.summarizeCost,
      },
      402,
    );
  }

  const result = summarizeText(parsed.data.text, parsed.data.maxSentences);
  const updated = store.charge(apiKey, cfg.summarizeCost);

  return c.json({
    summary: result.summary,
    sentencesUsed: result.sentencesUsed,
    usage: {
      creditsCharged: cfg.summarizeCost,
      creditsRemaining: updated.credits,
    },
  });
});
