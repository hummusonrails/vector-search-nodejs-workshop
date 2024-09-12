const openai = require('openai');

// Initialize OpenAI client
const openaiclient = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateQueryEmbedding(query) {
  const response = await openaiclient.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  return response.data[0].embedding;
}

async function storeEmbedding(content, id) {
  const embedding = await generateQueryEmbedding(content);
  const cluster = await init(); // Assuming init() is available in your server
  const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
  const collection = bucket.defaultCollection();

  const docId = `embedding::${id}`;
  await collection.upsert(docId, { content, embedding });

  return { docId, embedding };
}

module.exports = { generateQueryEmbedding, storeEmbedding };
