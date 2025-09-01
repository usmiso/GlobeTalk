// src/Tests/Index.test.js
// Add TextEncoder/TextDecoder polyfill at the VERY TOP
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 🚨 MOCK FIREBASE ADMIN BEFORE ANY OTHER IMPORTS 🚨
jest.mock('firebase-admin', () => {
  // Create mock functions that support method chaining
  const mockDoc = {
    get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
    set: jest.fn().mockResolvedValue(),
  };

  const mockCollection = {
    doc: jest.fn(() => mockDoc),
    get: jest.fn().mockResolvedValue({
      forEach: (callback) => [] // Empty array by default
    }),
  };

  const mockFirestore = {
    collection: jest.fn(() => mockCollection),
    doc: jest.fn(() => mockDoc),
  };

  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    firestore: jest.fn(() => mockFirestore),
    apps: [{ name: 'test-app' }],
  };
});

// Now import other dependencies AFTER mocking
const request = require('supertest');
const admin = require('firebase-admin');

// Import your app AFTER mocking Firebase
const app = require('../../server/index');

describe('GlobeTalk Backend Tests', () => {
  let mockDb;
  let mockDoc;
  let mockCollection;

  beforeEach(() => {
    // Get fresh mock instances for each test
    mockDb = admin.firestore();
    mockCollection = mockDb.collection('profiles');
    mockDoc = mockCollection.doc('test-user-123');
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockDoc.get.mockResolvedValue({ exists: false, data: () => ({}) });
    mockDoc.set.mockResolvedValue();
    mockCollection.get.mockResolvedValue({ 
      forEach: (callback) => [] 
    });
  });

  afterAll(async () => {
    // Clean up
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Health Check', () => {
    it('GET /api/health should return status ok', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        message: 'GlobeTalk backend is running!'
      });
    });
  });

  describe('Profile Endpoints', () => {
    const mockProfile = {
      userID: 'test-user-123',
      intro: 'Hello world',
      ageRange: '25-30',
      hobbies: ['reading', 'traveling'],
      timezone: 'UTC+1',
      language: 'English'
    };

    it('POST /api/profile should create profile successfully', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send(mockProfile);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Profile saved successfully' });
      expect(mockDb.collection).toHaveBeenCalledWith('profiles');
      expect(mockCollection.doc).toHaveBeenCalledWith('test-user-123');
      expect(mockDoc.set).toHaveBeenCalledWith(mockProfile, { merge: true });
    });

    it('POST /api/profile should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send({ userID: 'test-user' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('GET /api/profile should return profile when exists', async () => {
      // Mock the document to exist with our profile data
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProfile
      });

      const response = await request(app)
        .get('/api/profile?userID=test-user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfile);
      expect(mockDb.collection).toHaveBeenCalledWith('profiles');
      expect(mockCollection.doc).toHaveBeenCalledWith('test-user-123');
    });

    it('GET /api/profile should return 404 when profile not found', async () => {
      // Mock the document to not exist
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const response = await request(app)
        .get('/api/profile?userID=non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Profile not found');
    });
  });

  describe('Avatar Endpoint', () => {
    it('POST /api/profile/avatar should save avatar and username', async () => {
      const avatarData = {
        userID: 'test-user-123',
        username: 'testuser',
        avatarUrl: 'https://example.com/avatar.jpg'
      };

      const response = await request(app)
        .post('/api/profile/avatar')
        .send(avatarData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Avatar and username saved successfully');
      expect(mockDb.collection).toHaveBeenCalledWith('profiles');
      expect(mockCollection.doc).toHaveBeenCalledWith('test-user-123');
      expect(mockDoc.set).toHaveBeenCalledWith(avatarData, { merge: true });
    });

    it('POST /api/profile/avatar should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/profile/avatar')
        .send({ userID: 'test-user' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('Facts Endpoint', () => {
    it('GET /api/facts should return facts array', async () => {
      const mockFacts = [
        { 
          ageRange: '25-30', 
          hobbies: ['reading'], 
          timezone: 'UTC+1', 
          language: 'English',
          userID: 'user1',
          intro: 'Test user'
        }
      ];

      // Mock the collection to return our test data
      mockCollection.get.mockResolvedValueOnce({
        forEach: (callback) => mockFacts.forEach(callback)
      });

      const response = await request(app).get('/api/facts');
      expect(response.status).toBe(200);
      
      // Extract only the expected fields
      const expectedFacts = mockFacts.map(({ ageRange, hobbies, timezone, language }) => ({
        ageRange, hobbies, timezone, language
      }));
      
      expect(response.body).toEqual(expectedFacts);
    });
  });

  describe('Matchmaking Endpoint', () => {
    const mockProfiles = [
      {
        userID: 'user1',
        timezone: 'UTC+1',
        language: 'English',
        intro: 'User 1',
        ageRange: '25-30',
        hobbies: ['reading']
      },
      {
        userID: 'user2',
        timezone: 'UTC+2',
        language: 'Spanish',
        intro: 'User 2',
        ageRange: '30-35',
        hobbies: ['traveling']
      }
    ];

    it('GET /api/matchmaking should find matching user', async () => {
      mockCollection.get.mockResolvedValueOnce({
        forEach: (callback) => mockProfiles.forEach(callback)
      });

      const response = await request(app)
        .get('/api/matchmaking?timezone=UTC+1&language=English');

      expect(response.status).toBe(200);
      expect(response.body.userID).toBe('user1');
    });

    it('GET /api/matchmaking should return 404 for no matches', async () => {
      mockCollection.get.mockResolvedValueOnce({
        forEach: (callback) => mockProfiles.forEach(callback)
      });

      const response = await request(app)
        .get('/api/matchmaking?timezone=UTC+3&language=French');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No users found');
    });

    it('GET /api/matchmaking should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/api/matchmaking?timezone=UTC+1');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Both timezone and language are required');
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors', async () => {
      mockDoc.set.mockRejectedValueOnce(new Error('Firestore error'));

      const response = await request(app)
        .post('/api/profile')
        .send({
          userID: 'test-user',
          intro: 'test',
          ageRange: '25-30',
          hobbies: ['test'],
          timezone: 'UTC+1',
          language: 'English'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Firestore error');
    });

    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });
  });
});