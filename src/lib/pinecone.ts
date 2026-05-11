import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'dummy-key', // Prevent crash on build if missing
});

export const getPineconeIndex = () => {
  return pinecone.index(process.env.PINECONE_INDEX || 'default-index');
};
