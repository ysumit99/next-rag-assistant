import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { isMockMode, MOCK_CHAT_RESPONSE, MOCK_SOURCES } from "@/lib/mockData";
import { chatRatelimit, getIP, rateLimitResponse } from "@/lib/ratelimit";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV2 } from "ai/test";

export const maxDuration = 30;

export interface Source {
  docId: string;
  text: string;
  score: number;
}

export async function POST(req: Request) {
  // ── Rate limiting ──────────────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    const ip = getIP(req);
    const { success, remaining } = await chatRatelimit.limit(ip);
    if (!success) return rateLimitResponse(remaining);
  }

  // ── Mock mode bypass ───────────────────────────────────────────
  if (isMockMode()) {
  const result = streamText({
    model: new MockLanguageModelV2({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: MOCK_CHAT_RESPONSE.split(" ").map((w) => ({
            type: "text-delta", id: "1", delta: w + " ",
          })).concat([{ type: "finish", finishReason: "stop", usage: { inputTokens: 0, outputTokens: 0 } }]),
        }),
      }),
    }),
    messages: [],
  });
  return result.toUIMessageStreamResponse({
    headers: { "X-Sources": JSON.stringify(MOCK_SOURCES) },
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
  let sources: Source[] = [];

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

      // Collect sources with metadata
      sources = queryResponse.matches
        .filter((match) => (match.score ?? 0) > 0.7)
        .map((match) => ({
          docId: (match.metadata?.docId as string) || "Unknown",
          text: (match.metadata?.text as string) || "",
          score: match.score ?? 0,
        }));

      contextText = sources.map((s) => s.text).join("\n\n");
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

  return result.toUIMessageStreamResponse({
    headers: sources.length > 0
      ? { "X-Sources": JSON.stringify(sources) }
      : {},
  });
}
