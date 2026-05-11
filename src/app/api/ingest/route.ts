import { NextResponse } from 'next/server';
import { getEmbedding } from '@/lib/embeddings';
import { getPineconeIndex } from '@/lib/pinecone';
// @ts-expect-error: Bypassing missing types for the inner module to avoid index.js bugs in Next.js
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export async function POST(req: Request) {
  try {
    let text = '';
    let docId = `doc-${Date.now()}`;

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 });
      }
      
      docId = file.name || docId;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else {
        // Assume plain text
        text = buffer.toString('utf-8');
      }
    } else {
      // Fallback for JSON requests (e.g. from curl tests)
      const body = await req.json();
      text = body.text;
      if (body.docId) docId = body.docId;
    }
    
    if (!text) {
      return NextResponse.json({ error: 'Text content could not be extracted' }, { status: 400 });
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
