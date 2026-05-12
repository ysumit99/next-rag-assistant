import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import type { Source } from "./mockData";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "rag-responses.json");

type Entry = { response: string; sources: Source[]; embedding?: number[] };
type CacheMap = Record<string, Entry>;

function load(): CacheMap {
  if (!existsSync(CACHE_FILE)) return {};
  try { return JSON.parse(readFileSync(CACHE_FILE, "utf8")); } catch { return {}; }
}

function save(map: CacheMap) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(map, null, 2));
}

export function cacheKey(query: string): string {
  return createHash("sha256").update(query.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function getCached(key: string): Entry | null {
  return load()[key] ?? null;
}

export function setCached(key: string, entry: Entry): void {
  const map = load();
  map[key] = entry;
  save(map);
}