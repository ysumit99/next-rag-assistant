# 🧠 AI-Powered RAG Assistant

A production-ready, full-stack AI Document Assistant built with **Next.js 16**, **Vercel AI SDK**, **Google Gemini**, and **Pinecone**. This application allows users to upload PDF documents, securely store their vectorized embeddings, and chat with an AI that specifically references the uploaded documents to answer questions (Retrieval-Augmented Generation).

## 🚀 Features
*   **End-to-End RAG Pipeline**: Ingests, chunks, embeds, and indexes PDF documents in real-time.
*   **Semantic Search**: Leverages Pinecone's serverless vector database to instantly retrieve relevant document context based on user queries.
*   **Real-time Streaming UI**: Uses the Vercel AI SDK to stream responses character-by-character for a ChatGPT-like experience.
*   **Serverless Architecture**: Fully optimized to run on Vercel Edge/Serverless functions.
*   **Modern UI/UX**: Built with Tailwind CSS, Lucide icons, and a sleek dark-mode aesthetic.

## 🛠 Tech Stack
*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **AI Engine**: Vercel AI SDK (`ai` v6)
*   **LLM Model**: Google Gemini (`gemini-2.5-flash`)
*   **Embedding Model**: Google Gemini (`gemini-embedding-001`)
*   **Vector Database**: Pinecone Serverless
*   **PDF Parsing**: `pdf-parse` (Native Node.js extraction)
*   **Deployment**: Vercel

## ⚙️ Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ysumit99/next-rag-assistant.git
   cd next-rag-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX=your_pinecone_index_name
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment
This app is designed to be deployed instantly on Vercel:
1. Push your code to GitHub.
2. Import the repository into your Vercel Dashboard.
3. Add the three environment variables (`GOOGLE_GENERATIVE_AI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`).
4. Click Deploy!

---
*Built by [Sumit Yadav](https://github.com/ysumit99).*
