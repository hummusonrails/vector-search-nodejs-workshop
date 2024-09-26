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

const useLocalEmbedding = process.env.USE_LOCAL_EMBEDDING === 'true';

let openaiclient = null;
if (!useLocalEmbedding) {
  // Initialize OpenAI client only if local embedding is not being used
  openaiclient = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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
 * @returns {Array} An array of objects containing the id and score of stored data.
 */
async function getStoredEmbeddings(queryEmbedding) {
  const cluster = await init();
  const scope = cluster.bucket(process.env.COUCHBASE_BUCKET).scope('_default');
  const searchIndex = 'vector-search-index';

  let request = couchbase.SearchRequest.create(
    couchbase.VectorSearch.fromVectorQuery(
      couchbase.VectorQuery.create('_default.embedding', queryEmbedding).numCandidates(5)
    )
  );
  
  const result = await scope.search(searchIndex, request);

  return result.rows.map(row => {
    return {
      id: row.id,
      score: row.score
    };
  });
}

/**
 * Fetches full document from Couchbase by ID
 * 
 * @param {Array} storedEmbeddings - The search result containing document IDs and scores.
 * @returns {Array} An array of documents with their content and relevance score.
 */
async function fetchDocumentsByIds(storedEmbeddings) {
  const cluster = await init();
  const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
  const collection = bucket.defaultCollection();

  const results = await Promise.all(
    storedEmbeddings.map(async ({ id, score }) => {
      try {
        const result = await collection.get(id);
        const content = result.content;
        
        // Remove embedding from content
        if (content && content._default && content._default.embedding) {
          delete content._default.embedding;
        }

        return {
          content: content,
          score: score 
        };
      } catch (err) {
        console.error(`Error fetching document with ID ${id}:`, err);
        return null;
      }
    })
  );

  return results.filter(doc => doc !== null); 
}

/**
 * Search blog posts using the query embedding or from local file.
 * 
 * @param {string} query - The search term.
 * @param {boolean} useLocalEmbedding - Whether to use a local embedding from file.
 * @returns {Array} Search results.
 */
async function searchBlogPosts(query, useLocalEmbedding = false) {
  let queryEmbedding;

  if (useLocalEmbedding) {
    const filePath = path.resolve('./data/query_with_embedding/query_with_embedding.json');
    if (!fs.existsSync(filePath)) {
      throw new Error('Local embedding file not found');
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileData = JSON.parse(fileContent);

    queryEmbedding = fileData.data[0].embedding;
  } else {
    queryEmbedding = await generateQueryEmbedding(query);
  }

  const storedEmbeddings = await getStoredEmbeddings(queryEmbedding);

  const documents = await fetchDocumentsByIds(storedEmbeddings);

  return documents;
}

// Route to handle search requests
app.post('/search', async (req, res) => {
  const searchTerm = req.body.q || '';
  const useLocalEmbedding = req.body.useLocalEmbedding || false;

  if (!searchTerm && !useLocalEmbedding) {
    return res.status(400).json({ error: 'No search term or embedding provided' });
  }

  try {
    const searchResults = await searchBlogPosts(searchTerm, useLocalEmbedding);
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
