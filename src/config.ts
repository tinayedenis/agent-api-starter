import { config as loadEnv } from "dotenv";

loadEnv();

/** Read env at call time so tests can override before each case. */
export function getConfig() {
  return {
    port: Number(process.env.PORT ?? 8787),
    host: process.env.HOST ?? "0.0.0.0",
    dataFile: process.env.DATA_FILE ?? "./data/store.json",
    demoApiKey: process.env.DEMO_API_KEY ?? "agt_demo_sk_live_7f3a9c2e1b8d4e6f",
    demoCredits: Number(process.env.DEMO_CREDITS ?? 100),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 60),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    summarizeCost: 1,
  };
}

/** Convenience snapshot for server boot (index.ts). */
export const config = getConfig();
