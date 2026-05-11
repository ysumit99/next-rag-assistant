# 🧠 AI-Powered RAG Assistant

> A production-ready, full-stack AI Document Assistant built with **Next.js 16**, **Vercel AI SDK**, **Google Gemini**, and **Pinecone**.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_App-5e8cf4?style=for-the-badge&logo=vercel&logoColor=white)](https://next-rag-assistant.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js_16-000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Pinecone](https://img.shields.io/badge/Pinecone-000?style=for-the-badge&logo=pinecone&logoColor=white)](https://pinecone.io/)

Upload PDF documents and chat with an AI that specifically references your documents to answer questions — powered by Retrieval-Augmented Generation (RAG).

**[🚀 Try the Live Demo →](https://next-rag-assistant.vercel.app/)**

---

## ✨ Features

- **End-to-End RAG Pipeline** — Ingests, chunks, embeds, and indexes PDF documents in real-time
- **Semantic Search** — Leverages Pinecone's serverless vector database to instantly retrieve relevant document context
- **Real-time Streaming UI** — Uses the Vercel AI SDK to stream responses character-by-character for a ChatGPT-like experience
- **Serverless Architecture** — Fully optimized for Vercel Edge/Serverless functions — scales to zero, zero ops overhead
- **Modern UI/UX** — Built with Tailwind CSS, Lucide icons, and a sleek dark-mode aesthetic

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        RAG Pipeline                          │
│                                                             │
│  PDF Upload → Text Extraction → Chunking → Embedding        │
│                                                    ↓        │
│                                           Pinecone Index     │
│                                                    ↑        │
│  User Query → Query Embedding → Semantic Search             │
│                                                    ↓        │
│                              Context Retrieval → Gemini     │
│                                                    ↓        │
│                                          Streamed Response  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Architecture Decisions

Every technical decision in this project was deliberate. Here's the reasoning:

**Why RAG over fine-tuning?**
RAG is more practical for dynamic documents — no retraining needed when documents change. Fine-tuning is expensive and static; RAG is cheap and always up to date.

**Why Pinecone over pgvector?**
Pinecone Serverless is purpose-built for vector similarity search at low latency with zero infrastructure management. pgvector is great but requires a running Postgres instance — overkill for a serverless app.

**Why Gemini over OpenAI?**
Gemini 2.5 Flash offers a 1M token context window, competitive embedding quality via `gemini-embedding-001`, and strong cost efficiency for production workloads.

**Why Vercel AI SDK?**
It abstracts streaming, tool calling, and provider switching behind a clean API. Swapping from Gemini to Claude or GPT-4 is a one-line change — critical for production flexibility.

**Why chunking matters**
Documents are split into overlapping chunks to preserve context across boundaries. Chunk size and overlap directly impact retrieval quality — this is one of the most underappreciated decisions in RAG systems.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server components, API routes, edge functions |
| **Language** | TypeScript | Type safety across the full stack |
| **Styling** | Tailwind CSS | Rapid, consistent UI development |
| **AI SDK** | Vercel AI SDK v6 | Streaming, provider abstraction |
| **LLM** | Google Gemini 2.5 Flash | 1M context window, cost efficient |
| **Embeddings** | gemini-embedding-001 | High quality semantic embeddings |
| **Vector DB** | Pinecone Serverless | Purpose-built for similarity search |
| **PDF Parsing** | pdf-parse | Native Node.js text extraction |
| **Deployment** | Vercel | Zero-config, edge-optimized |

---

## ⚙️ Local Setup

**1. Clone the repository**
```bash
git clone https://github.com/ysumit99/next-rag-assistant.git
cd next-rag-assistant
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Environment Variables**

Create a `.env.local` file:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name
```

**4. Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deployment

Designed for instant Vercel deployment:

1. Push your code to GitHub
2. Import the repository into your [Vercel Dashboard](https://vercel.com)
3. Add the three environment variables
4. Click Deploy ✅

---

## 🗺️ Roadmap

- [ ] Multi-document support with document management
- [ ] Source citations — show which document chunk answered the query
- [ ] Conversation history — multi-turn RAG
- [ ] Document deletion and re-indexing

---

*Built by [Sumit Yadav](https://github.com/ysumit99) · [Blog](https://sumityadav-dev.vercel.app) · [LinkedIn](https://www.linkedin.com/in/sumityadav-dev/)*
