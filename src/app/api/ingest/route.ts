import { NextResponse } from 'next/server';
import { getEmbedding } from '@/lib/embeddings';
import { getPineconeIndex } from '@/lib/pinecone';

export async function POST(req: Request) {
  try {
    const { text, docId = 'doc-1' } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Simplistic chunking: split by paragraphs
    const chunks = text.split('\n\n').filter((c: string) => c.trim().length > 0);
    const index = getPineconeIndex();
    
    const records = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i].trim();
      if (!chunkText) continue;

      const embedding = await getEmbedding(chunkText);
      
      records.push({
        id: `${docId}-chunk-${i}`,
        values: Array.from(embedding),
        metadata: { text: chunkText, docId },
      });
    }

    if (records.length > 0) {
      await index.upsert({ records });
    }

    return NextResponse.json({ success: true, message: `Ingested ${records.length} chunks.` });
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: 'Failed to ingest data', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
