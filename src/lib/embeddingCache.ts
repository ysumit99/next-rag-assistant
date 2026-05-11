// Embedding cache for development — prevents re-embedding same text chunks
// Saves embeddings to .embedding-cache/ directory (gitignored)
// Only active in development mode

import fs from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), ".embedding-cache");

function getHash(text: string): string {
  return crypto.createHash("md5").update(text).digest("hex");
}

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function getCachedEmbedding(text: string): number[] | null {
  // Only use cache in development
  if (process.env.NODE_ENV !== "development") return null;

  try {
    ensureCacheDir();
    const hash = getHash(text);
    const cachePath = path.join(CACHE_DIR, `${hash}.json`);

    if (fs.existsSync(cachePath)) {
      console.log(`[EmbeddingCache] HIT for chunk (${text.slice(0, 40)}...)`);
      return JSON.parse(fs.readFileSync(cachePath, "utf8"));
    }
  } catch (err) {
    console.warn("[EmbeddingCache] Read error:", err);
  }

  return null;
}

export function setCachedEmbedding(text: string, embedding: number[]): void {
  // Only cache in development
  if (process.env.NODE_ENV !== "development") return;

  try {
    ensureCacheDir();
    const hash = getHash(text);
    const cachePath = path.join(CACHE_DIR, `${hash}.json`);
    fs.writeFileSync(cachePath, JSON.stringify(embedding));
    console.log(`[EmbeddingCache] STORED for chunk (${text.slice(0, 40)}...)`);
  } catch (err) {
    console.warn("[EmbeddingCache] Write error:", err);
  }
}

export function clearCache(): void {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true });
      console.log("[EmbeddingCache] Cache cleared");
    }
  } catch (err) {
    console.warn("[EmbeddingCache] Clear error:", err);
  }
}
