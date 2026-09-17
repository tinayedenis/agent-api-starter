import { describe, it, expect, beforeEach } from "vitest";
import "./setup.js";
import { createApp } from "../src/app.js";
import { getStore } from "../src/db/store.js";

const DEMO = "agt_demo_sk_live_7f3a9c2e1b8d4e6f";

describe("metering", () => {
  beforeEach(() => {
    getStore();
  });

  it("charges 1 credit per summarize", async () => {
    const app = createApp();
    const before = await (
      await app.request("/v1/me", { headers: { Authorization: `Bearer ${DEMO}` } })
    ).json();

    const res = await app.request("/v1/summarize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEMO}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Hello world. This is a second sentence. And a third one here.",
        maxSentences: 2,
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.usage.creditsCharged).toBe(1);
    expect(body.usage.creditsRemaining).toBe(before.credits - 1);
  });

  it("returns 402 when out of credits", async () => {
    const store = getStore();
    const record = store.getKey(DEMO)!;
    while (record.credits > 0) {
      store.charge(DEMO, 1);
    }

    const app = createApp();
    const res = await app.request("/v1/summarize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEMO}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: "Only one sentence here." }),
    });
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toBe("insufficient_credits");
  });

  it("topup restores credits", async () => {
    const store = getStore();
    const record = store.getKey(DEMO)!;
    while (record.credits > 0) store.charge(DEMO, 1);

    const app = createApp();
    const top = await app.request("/v1/billing/topup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEMO}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: 25 }),
    });
    expect(top.status).toBe(200);
    const body = await top.json();
    expect(body.credits).toBe(25);
  });
});
