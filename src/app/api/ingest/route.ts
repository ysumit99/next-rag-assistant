import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { isMockMode, MOCK_INGEST_RESPONSE } from "@/lib/mockData";
import { getCachedEmbedding, setCachedEmbedding } from "@/lib/embeddingCache";
import { ingestRatelimit, getIP, rateLimitResponse } from "@/lib/ratelimit";
// @ts-expect-error: Bypassing missing types for the inner module
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function POST(req: Request) {
  // ── Rate limiting ──────────────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    const ip = getIP(req);
    const { success, remaining } = await ingestRatelimit.limit(ip);
    if (!success) return rateLimitResponse(remaining);
  }

  // ── Mock mode bypass ───────────────────────────────────────────
  if (isMockMode()) {
    // Simulate processing delay for realistic feel
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json(MOCK_INGEST_RESPONSE);
  }

  // ── Real ingestion pipeline ────────────────────────────────────
  try {
    let text = "";
    let docId = `doc-${Date.now()}`;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 }
        );
      }

      docId = file.name || docId;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === "application/pdf") {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else {
        text = buffer.toString("utf-8");
      }
    } else {
      const body = await req.json();
      text = body.text;
      if (body.docId) docId = body.docId;
    }

    if (!text) {
      return NextResponse.json(
        { error: "Text content could not be extracted" },
        { status: 400 }
      );
    }

    // Chunk by paragraphs
    const chunks = text
      .split("\n\n")
      .map((c: string) => c.trim())
      .filter((c: string) => c.length > 0);

    const index = getPineconeIndex();
    const records = [];
    let cacheHits = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      if (!chunkText) continue;

      // Check cache first — avoids redundant embedding API calls
      let embedding = getCachedEmbedding(chunkText);

      if (!embedding) {
        embedding = await getEmbedding(chunkText);
        setCachedEmbedding(chunkText, embedding);
      } else {
        cacheHits++;
      }

      records.push({
        id: `${docId}-chunk-${i}`,
        values: Array.from(embedding),
        metadata: { text: chunkText, docId },
      });
    }

    if (records.length > 0) {
      await index.upsert({ records });
    }

    return NextResponse.json({
      success: true,
      message: `Ingested ${records.length} chunks. (${cacheHits} from cache)`,
      chunks: records.length,
      cacheHits,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      {
        error: "Failed to ingest data",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
