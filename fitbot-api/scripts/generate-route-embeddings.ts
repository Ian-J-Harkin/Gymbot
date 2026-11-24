import { pipeline } from '@huggingface/transformers';
import * as fs from 'fs';
import * as path from 'path';
import { EMBEDDING_MODEL } from '../src/embedding/embedding.service';

const routes = [
  {
    name: 'rag_synthesis',
    utterances: [
      "Compare the premium membership to the basic plan",
      "Why does my card keep getting declined at the front desk?",
      "Summarize the cancellation and refund policy",
      "What are all the differences between annual and monthly plans?",
    ],
  },
  {
    name: 'standard_search',
    utterances: [
      "What are the opening hours?",
      "Where is the car park?",
      "How much is a day pass?",
      "Do you have a swimming pool?",
      "What's the WiFi password?",
    ],
  },
];

async function generate() {
  console.log(`Loading model (${EMBEDDING_MODEL})...`);
  const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, {
    dtype: 'q8',
  });
  
  const generatedRoutes: any[] = [];

  for (const route of routes) {
    console.log(`Processing route: ${route.name}`);
    const embeddings: number[][] = [];
    for (const utterance of route.utterances) {
      const output = await extractor(utterance, { pooling: 'mean', normalize: true });
      // Convert Float32Array to number[] for JSON serialization
      const embeddingArray = Array.from(output.data) as number[];
      embeddings.push(embeddingArray);
    }
    generatedRoutes.push({
      name: route.name,
      embeddings: embeddings
    });
  }

  const outPath = path.resolve(__dirname, '../src/semantic-router/route-anchors.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(generatedRoutes, null, 2), 'utf-8');
  console.log(`Route anchors saved to ${outPath}`);
}

generate().catch(console.error);
