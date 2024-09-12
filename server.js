const express = require('express');
const couchbase = require('couchbase');
const cors = require('cors');
const openai = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Initialize OpenAI client
const openaiclient = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Import the helper functions
const { generateQueryEmbedding, storeEmbedding } = require('./helpers');

let cluster;

// Initialize Couchbase connection
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

/**
 * Retrieves stored embeddings from the specified bucket in Couchbase.
 * 
 * @param {Array} queryEmbedding - The embedding for the search query.
 * @returns {Array} An array of objects containing the id and embeddings of stored data.
 */
async function getStoredEmbeddings(queryEmbedding) {
  const cluster = await init();
  const scope = cluster.bucket(process.env.COUCHBASE_BUCKET).scope('_default');
  const search_index = process.env.COUCHBASE_VECTOR_SEARCH_INDEX;

  const search_req = couchbase.SearchRequest.create(
    couchbase.VectorSearch.fromVectorQuery(
      couchbase.VectorQuery.create(
         `${process.env.COUCHBASE_BUCKET}.embeddings`,
        queryEmbedding
      ).numCandidates(5)
    )
  );

  const result = await scope.search(
    search_index,
    search_req
  );

  return result.rows.map(row => {
    return {
      id: row.id,
      embeddings: row.content[process.env.COUCHBASE_BUCKET].embeddings
    };
  });
}

/**
 * Search blog posts using the query embedding.
 * 
 * @param {string} query - The search term.
 * @returns {Array} Search results.
 */
async function searchBlogPosts(query) {
  const queryEmbedding = await generateQueryEmbedding(query);
  const storedEmbeddings = await getStoredEmbeddings(queryEmbedding);

  const cluster = await init();
  const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
  const collection = bucket.defaultCollection();
  const results = await Promise.all(
    storedEmbeddings.map(async ({ id }) => {
      const docId = id.replace('embedding::', '');
      const result = await collection.get(docId);
      return result.content;
    })
  );

  return results;
}

// Route to handle search requests
app.post('/search', async (req, res) => {
  const searchTerm = req.body.q || '';
  if (!searchTerm) {
    return res.status(400).json({ error: 'No search term provided' });
  }

  try {
    const searchResults = await searchBlogPosts(searchTerm);
    res.json(searchResults);
  } catch (err) {
    console.error('Error searching blog posts:', err);
    res.status(500).json({ error: 'Error searching blog posts' });
  }
});

// Route to embed and store markdown files
app.post('/embed', async (req, res) => {
  const filePaths = req.body.files || [];
  
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  try {
    const results = await Promise.all(filePaths.map(async (filePath) => {
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File ${filePath} does not exist`);
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const result = await storeEmbedding(content, path.basename(filePath));
      return result;
    }));

    res.json(results);
  } catch (err) {
    console.error('Error embedding and storing files:', err);
    res.status(500).json({ error: 'Error embedding and storing files' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
