import { describe, it, expect, beforeEach } from "vitest";
import "./setup.js";
import { createApp } from "../src/app.js";
import { getStore } from "../src/db/store.js";

const DEMO = "agt_demo_sk_live_7f3a9c2e1b8d4e6f";

describe("auth", () => {
  beforeEach(() => {
    getStore();
  });

  it("rejects missing Authorization", async () => {
    const app = createApp();
    const res = await app.request("/v1/me");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("rejects non-agt_ keys", async () => {
    const app = createApp();
    const res = await app.request("/v1/me", {
      headers: { Authorization: "Bearer sk_wrong_format" },
    });
    expect(res.status).toBe(401);
  });

  it("rejects unknown agt_ keys", async () => {
    const app = createApp();
    const res = await app.request("/v1/me", {
      headers: { Authorization: "Bearer agt_unknown_key_zzzz" },
    });
    expect(res.status).toBe(401);
  });

  it("accepts seeded demo key", async () => {
    const app = createApp();
    const res = await app.request("/v1/me", {
      headers: { Authorization: `Bearer ${DEMO}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.credits).toBe(100);
    expect(body.name).toBe("demo");
  });
});
