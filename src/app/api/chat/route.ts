import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { getEmbedding } from '@/lib/embeddings';
import { getPineconeIndex } from '@/lib/pinecone';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  // Ensure all messages have standard string content instead of experimental parts array
  const sanitizedMessages = messages.map((m: any) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : (m.parts ? m.parts.map((p: any) => p.text).join('') : '')
  }));

  const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
  let contextText = '';

  try {
    if (process.env.PINECONE_API_KEY && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      // 1. Get embedding for the user's query
      const embedding = await getEmbedding(lastMessage.content);
      
      // 2. Query Pinecone
      const index = getPineconeIndex();
      const queryResponse = await index.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
      });

      // 3. Extract text from matches
      contextText = queryResponse.matches
        .map((match) => match.metadata?.text)
        .filter(Boolean)
        .join('\n\n');
    }
  } catch (error) {
    console.error('Error fetching context from Pinecone:', error);
  }

  const systemPrompt = `You are a helpful, professional AI assistant for a Next.js RAG application. Provide concise and accurate answers.
  
${contextText ? `Use the following context to answer the user's question. If the answer is not in the context, just say you don't know based on the provided documents.\n\nContext:\n${contextText}` : 'No document context available. Answer based on your general knowledge.'}
`;

  // Call the language model
  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: sanitizedMessages,
    system: systemPrompt,
  });

  // Respond with the stream
  return result.toUIMessageStreamResponse();
}
