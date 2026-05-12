import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { MOCK_SOURCES, isMockMode } from "@/lib/mockData";

export async function POST(req: Request) {
    if (isMockMode()) {
        return NextResponse.json({ sources: MOCK_SOURCES });
    }

    const { query } = await req.json();
    const embedding = await getEmbedding(query);
    const index = getPineconeIndex();

    const results = await index.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
    });

    const sources = results.matches
        .filter((m) => (m.score ?? 0) > 0.5)
        .map((m) => ({
            docId: m.metadata?.docId as string,
            text: m.metadata?.text as string,
            score: m.score ?? 0,
        }));

    return NextResponse.json({ sources });
}