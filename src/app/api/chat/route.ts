import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { isMockMode, MOCK_CHAT_RESPONSE } from "@/lib/mockData";
import { chatRatelimit, getIP, rateLimitResponse } from "@/lib/ratelimit";

export const maxDuration = 30;

export async function POST(req: Request) {
  // ── Rate limiting ──────────────────────────────────────────────
  // Skip rate limiting in development to avoid Upstash calls during local dev
  if (process.env.NODE_ENV === "production") {
    const ip = getIP(req);
    const { success, remaining } = await chatRatelimit.limit(ip);
    if (!success) return rateLimitResponse(remaining);
  }

  // ── Mock mode bypass ───────────────────────────────────────────
  // Set USE_MOCK=true in .env.local to skip all API calls during UI development
  if (isMockMode()) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Stream mock response word by word for realistic feel
        const words = MOCK_CHAT_RESPONSE.split(" ");
        for (const word of words) {
          controller.enqueue(encoder.encode(`0:"${word} "\n`));
          await new Promise((r) => setTimeout(r, 30));
        }
        controller.enqueue(encoder.encode('d:{"finishReason":"stop"}\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "X-Mock-Mode": "true",
      },
    });
  }

  // ── Real RAG pipeline ──────────────────────────────────────────
  const { messages } = await req.json();

  const sanitizedMessages = messages.map((m: any) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : m.parts
          ? m.parts.map((p: any) => p.text).join("")
          : "",
  }));

  const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
  let contextText = "";

  try {
    if (
      process.env.PINECONE_API_KEY &&
      process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ) {
      const embedding = await getEmbedding(lastMessage.content);
      const index = getPineconeIndex();

      const queryResponse = await index.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
      });

      contextText = queryResponse.matches
        .filter((match) => (match.score ?? 0) > 0.7) // only high-confidence matches
        .map((match) => match.metadata?.text)
        .filter(Boolean)
        .join("\n\n");
    }
  } catch (error) {
    console.error("Error fetching context from Pinecone:", error);
  }

  const systemPrompt = `You are a helpful, professional AI assistant for a Next.js RAG application. Provide concise and accurate answers.

${contextText
      ? `Use the following context to answer the user's question. If the answer is not in the context, say you don't know based on the provided documents.\n\nContext:\n${contextText}`
      : "No document context available. Answer based on your general knowledge."
    }`;

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: sanitizedMessages,
    system: systemPrompt,
  });

  return result.toUIMessageStreamResponse();
}
