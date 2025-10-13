/**
 * @jest-environment node
 */

const request = require('supertest');

// Mock firebase-admin so Firestore is not initialized (db = null)
jest.mock('firebase-admin', () => ({
  apps: [],
  credential: { cert: jest.fn() },
  initializeApp: jest.fn(),
  firestore: jest.fn(),
}));

// Prevent dotenv side effects in tests
jest.mock('dotenv', () => ({ config: jest.fn() }));

const app = require('./index');

describe('server/index.js API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ status: 'ok' })
    );
  });

  it('GET /api/profile returns 500 when Firestore not initialized', async () => {
    const res = await request(app).get('/api/profile').query({ userID: 'any' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({ error: 'Firestore not initialized' })
    );
  });

  it('Unknown route returns 404', async () => {
    const res = await request(app).get('/this/does/not/exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({ error: 'Not found' })
    );
  });
});
