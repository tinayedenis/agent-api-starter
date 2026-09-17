import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { getConfig } from "../config.js";

export type ApiKeyRecord = {
  key: string;
  name: string;
  credits: number;
  createdAt: string;
  totalCharged: number;
};

export type StoreData = {
  keys: Record<string, ApiKeyRecord>;
};

function emptyStore(): StoreData {
  return { keys: {} };
}

export class JsonStore {
  private data: StoreData;
  private readonly filePath: string;

  constructor(filePath?: string) {
    const cfg = getConfig();
    this.filePath = filePath ?? cfg.dataFile;
    this.data = this.load();
    this.ensureDemoKey();
  }

  private load(): StoreData {
    try {
      if (!existsSync(this.filePath)) return emptyStore();
      const raw = readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as StoreData;
      if (!parsed.keys || typeof parsed.keys !== "object") return emptyStore();
      return parsed;
    } catch {
      return emptyStore();
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }

  private ensureDemoKey(): void {
    const cfg = getConfig();
    if (!this.data.keys[cfg.demoApiKey]) {
      this.data.keys[cfg.demoApiKey] = {
        key: cfg.demoApiKey,
        name: "demo",
        credits: cfg.demoCredits,
        createdAt: new Date().toISOString(),
        totalCharged: 0,
      };
      this.persist();
    }
  }

  getKey(key: string): ApiKeyRecord | undefined {
    return this.data.keys[key];
  }

  charge(key: string, amount: number): ApiKeyRecord {
    const record = this.data.keys[key];
    if (!record) throw new Error("Unknown API key");
    if (record.credits < amount) {
      const err = new Error("Insufficient credits") as Error & { status: number };
      err.status = 402;
      throw err;
    }
    record.credits -= amount;
    record.totalCharged += amount;
    this.persist();
    return { ...record };
  }

  topup(key: string, amount: number): ApiKeyRecord {
    const record = this.data.keys[key];
    if (!record) throw new Error("Unknown API key");
    if (amount <= 0) throw new Error("Top-up amount must be positive");
    record.credits += amount;
    this.persist();
    return { ...record };
  }

  reset(data?: StoreData): void {
    this.data = data ?? emptyStore();
    this.ensureDemoKey();
    this.persist();
  }
}

let singleton: JsonStore | null = null;

export function getStore(): JsonStore {
  if (!singleton) singleton = new JsonStore();
  return singleton;
}

export function resetStoreSingleton(): void {
  singleton = null;
}
