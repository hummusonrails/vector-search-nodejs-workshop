const request = require('supertest');
const { app, server } = require('../server'); // Import both app and server
const { generateQueryEmbedding, storeEmbedding } = require('../helpers');
const fs = require('fs');

// Mock the helper functions
jest.mock('../helpers', () => ({
  generateQueryEmbedding: jest.fn(),
  storeEmbedding: jest.fn(),
}));

// Mock the 'couchbase' module
jest.mock('couchbase', () => ({
  connect: jest.fn(),
  SearchRequest: {
    create: jest.fn(),
  },
  VectorSearch: {
    fromVectorQuery: jest.fn(),
  },
  VectorQuery: {
    create: jest.fn(() => ({
      numCandidates: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock console.log and console.error to suppress test log output
beforeAll(() => {
  jest.spyOn(global.console, 'log').mockImplementation(() => {});
  jest.spyOn(global.console, 'error').mockImplementation(() => {});
});

// Restore mocks after the tests
afterAll(() => {
  jest.restoreAllMocks();
  server.close();
});

describe('POST /search', () => {
  it('should return 400 if no search term is provided and useLocalEmbedding is false', async () => {
    const res = await request(server).post('/search').send({ useLocalEmbedding: false });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No search term or embedding provided');
  });

  it('should return 500 if the search query fails', async () => {
    generateQueryEmbedding.mockImplementationOnce(() => {
      throw new Error('Error searching blog posts');
    });

    const res = await request(server).post('/search').send({ q: 'test' });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error searching blog posts');
  });

  it('should use local embedding when useLocalEmbedding is true', async () => {
    const mockEmbedding = [0.013601735];

    // Mock the file read operation
    jest.spyOn(fs, 'readFileSync').mockImplementationOnce(() =>
      JSON.stringify({
        object: 'list',
        data: [{ object: 'embedding', embedding: mockEmbedding }],
      })
    );

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    // Mock the Couchbase vector search functionality
    const { VectorQuery, VectorSearch, SearchRequest, connect } = require('couchbase');
    const mockSearchRequestCreate = jest.fn();
    const mockVectorSearchFromVectorQuery = jest.fn();

    VectorSearch.fromVectorQuery.mockReturnValue(mockVectorSearchFromVectorQuery);
    SearchRequest.create.mockReturnValue(mockSearchRequestCreate);

    // Mock the scope search method and return a mock result
    const mockSearchResult = {
      rows: [
        {
          id: 'embedding::1',
          score: 1.23,
          content: { id: '1', title: 'Mocked Star Wars Post' },
        },
      ],
    };

    const mockScopeSearch = jest.fn().mockResolvedValueOnce(mockSearchResult);

    // Mock the Couchbase cluster and bucket behavior
    const mockCluster = {
      bucket: () => ({
        scope: () => ({
          search: mockScopeSearch,
        }),
        defaultCollection: () => ({
          get: jest.fn().mockResolvedValueOnce({
            content: { id: '1', title: 'Mocked Star Wars Post' },
          }),
        }),
      }),
    };

    // Mock the Couchbase connect method to return the mocked cluster
    connect.mockResolvedValue(mockCluster);

    // Send the POST request to /search
    const res = await request(server).post('/search').send({ useLocalEmbedding: true });

    // Assert the response status and body
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        content: { id: '1', title: 'Mocked Star Wars Post' },
        score: 1.23,
      },
    ]);
  });
});

describe('POST /embed', () => {
  it('should return 400 if no files are provided', async () => {
    const res = await request(server).post('/embed').send({ files: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No files provided');
  });

  it('should return 500 if the file embedding fails', async () => {
    storeEmbedding.mockImplementationOnce(() => {
      throw new Error('Error embedding and storing files');
    });

    const res = await request(server).post('/embed').send({ files: ['./tests/test.md'] });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error embedding and storing files');
  });

  it('should successfully embed files if they exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true); 
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'file content'); 

    const mockEmbeddingResult = { id: 'file-embedding-id' };
    storeEmbedding.mockResolvedValueOnce(mockEmbeddingResult);

    const res = await request(server).post('/embed').send({ files: ['test.md'] });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([mockEmbeddingResult]);
  });
});
