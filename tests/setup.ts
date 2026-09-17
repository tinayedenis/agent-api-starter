import { mkdirSync, rmSync } from "node:fs";
import { afterEach, beforeEach } from "vitest";
import { resetStoreSingleton } from "../src/db/store.js";
import { resetRateLimits } from "../src/middleware/rateLimit.js";

export const TEST_DATA = "./data/test-store.json";

beforeEach(() => {
  process.env.DATA_FILE = TEST_DATA;
  process.env.DEMO_API_KEY = "agt_demo_sk_live_7f3a9c2e1b8d4e6f";
  process.env.DEMO_CREDITS = "100";
  process.env.RATE_LIMIT_MAX = "60";
  resetStoreSingleton();
  resetRateLimits();
  mkdirSync("./data", { recursive: true });
  try {
    rmSync(TEST_DATA, { force: true });
  } catch {
    /* ignore */
  }
});

afterEach(() => {
  resetStoreSingleton();
  resetRateLimits();
  try {
    rmSync(TEST_DATA, { force: true });
  } catch {
    /* ignore */
  }
});
