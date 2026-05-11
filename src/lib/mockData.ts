// Mock data for development — avoids burning API quota during UI work
// Enable by setting USE_MOCK=true in .env.local

export const MOCK_CHAT_RESPONSE =
  "This is a **mock response** for development. The RAG pipeline is disabled to conserve API quota.\n\n" +
  "In production, I would:\n" +
  "1. Embed your query using Gemini\n" +
  "2. Search Pinecone for relevant chunks\n" +
  "3. Pass context to Gemini 2.5 Flash\n" +
  "4. Stream the response back\n\n" +
  "Set `USE_MOCK=false` in `.env.local` to test the real pipeline.";

export const MOCK_INGEST_RESPONSE = {
  success: true,
  message: "Mock ingestion complete. 5 chunks processed (no API calls made).",
  chunks: 5,
};

export function isMockMode(): boolean {
  return process.env.USE_MOCK === "true";
}
