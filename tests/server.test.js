const request = require('supertest');
const { app, server } = require('../server'); // Import both app and server
const { generateQueryEmbedding, storeEmbedding } = require('../helpers');

// Mock the helper functions
jest.mock('../helpers', () => ({
  generateQueryEmbedding: jest.fn(),
  storeEmbedding: jest.fn(),
}));

// Mock console.log and console.error to suppress test log output
beforeAll(() => {
  jest.spyOn(global.console, 'log').mockImplementation(() => {});
  jest.spyOn(global.console, 'error').mockImplementation(() => {});
});

describe('POST /search', () => {
  it('should return 400 if no search term is provided', async () => {
    const res = await request(server).post('/search').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No search term provided');
  });

  it('should return 500 if the search query fails', async () => {
    generateQueryEmbedding.mockImplementationOnce(() => {
      throw new Error('Error searching blog posts');
    });

    const res = await request(server).post('/search').send({ q: 'test' });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error searching blog posts');
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

    const res = await request(server).post('/embed').send({ files: ['test.md'] });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error embedding and storing files');
  });
});

// Close the server after all tests are done
afterAll(() => {
  server.close();
  console.log.mockRestore();
  console.error.mockRestore();
});
