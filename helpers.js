const openai = require('openai');
const couchbase = require('couchbase');
require('dotenv').config();

const useLocalEmbedding = process.env.USE_LOCAL_EMBEDDING === 'true';

let openaiclient = null;
if (!useLocalEmbedding) {
  // Initialize OpenAI client only if local embedding is not being used
  openaiclient = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateQueryEmbedding(query) {
  if (useLocalEmbedding) {
    throw new Error('Local embedding mode is enabled, but no local embedding function is provided here.');
  }

  if (!openaiclient) {
    throw new Error('OpenAI client is not initialized.');
  }

  const response = await openaiclient.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  return response.data[0].embedding;
}

let cluster;
async function init() {
  if (!cluster) {
    cluster = await couchbase.connect(process.env.COUCHBASE_URL, {
      username: process.env.COUCHBASE_USERNAME,
      password: process.env.COUCHBASE_PASSWORD,
      configProfile: "wanDevelopment",
    });
  }
  return cluster;
}

async function storeEmbedding(content, id) {
  try {
    console.log(`Generating embedding for ${id}...`);

    let embedding;
    if (useLocalEmbedding) {
      throw new Error('Local embedding mode is enabled, but storeEmbedding function is not set up for local embedding.');
    } else {
      embedding = await generateQueryEmbedding(content);
    }

    console.log(`Embedding generated for ${id}.`);

    console.log(`Initializing Couchbase connection for ${id}...`);
    const cluster = await init();
    console.log(`Couchbase initialized for ${id}.`);

    const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
    const collection = bucket.defaultCollection();

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseErr) {
      console.error(`Invalid JSON in file ${id}:`, parseErr);
      throw new Error(`Invalid JSON in file ${id}: ${parseErr.message}`);
    }

    const document = { ...parsedContent, embedding };

    const docId = `embedding::${id}`;
    console.log(`Storing embedding for ${docId}...`);
    await collection.upsert(docId, document);
    console.log(`Embedding stored for ${docId}.`);

    return { docId, embedding };
  } catch (err) {
    console.error(`Error in storeEmbedding for ${id}:`, err);
    throw err;
  }
}

module.exports = { generateQueryEmbedding, storeEmbedding };
