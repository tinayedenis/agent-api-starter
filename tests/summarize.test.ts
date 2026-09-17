import { describe, it, expect, beforeEach } from "vitest";
import "./setup.js";
import { createApp } from "../src/app.js";
import { getStore } from "../src/db/store.js";
import { summarizeText } from "../src/services/summarize.js";

const DEMO = "agt_demo_sk_live_7f3a9c2e1b8d4e6f";

describe("summarize service", () => {
  it("extracts top sentences", () => {
    const text =
      "Cats sleep a lot. Dogs chase cats often. Cats sleep during the day. Birds fly south.";
    const result = summarizeText(text, 2);
    expect(result.sentencesUsed).toBe(2);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.allSentenceCount).toBe(4);
  });

  it("handles single sentence", () => {
    const result = summarizeText("Just one sentence.");
    expect(result.sentencesUsed).toBe(1);
    expect(result.summary).toContain("Just one");
  });
});

describe("summarize endpoint", () => {
  beforeEach(() => {
    getStore();
  });

  it("returns summary and usage", async () => {
    const app = createApp();
    const res = await app.request("/v1/summarize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEMO}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Alpha beta gamma. Delta epsilon zeta. Eta theta iota. Kappa lambda mu.",
        maxSentences: 2,
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.summary).toBe("string");
    expect(body.sentencesUsed).toBe(2);
    expect(body.usage.creditsCharged).toBe(1);
  });

  it("validates body", async () => {
    const app = createApp();
    const res = await app.request("/v1/summarize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEMO}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("exposes openapi", async () => {
    const app = createApp();
    const res = await app.request("/openapi.json");
    expect(res.status).toBe(200);
    const spec = await res.json();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.paths["/v1/summarize"]).toBeTruthy();
  });
});
