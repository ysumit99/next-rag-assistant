import { embed } from 'ai';
import { google } from '@ai-sdk/google';

export async function getEmbedding(text: string) {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: text.replace(/\n/g, ' '),
    });
    return embedding as number[];
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
