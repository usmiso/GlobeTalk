/**
 * @jest-environment node
 */

const request = require('supertest');

// Helper to load the server with fresh module cache and optional mocks
function loadServerWithMocks({ adminMock, cronMock } = {}) {
  jest.resetModules();
  jest.doMock('dotenv', () => ({ config: jest.fn() }));
  if (adminMock) {
    jest.doMock('firebase-admin', () => adminMock);
  }
  if (cronMock) {
    jest.doMock('node-cron', () => cronMock);
  }
  // Provide a harmless swagger-ui-express mock that returns valid middleware
  jest.doMock('swagger-ui-express', () => ({
    serve: (req, res, next) => next(),
    setup: () => (req, res, next) => next(),
  }));
  // eslint-disable-next-line global-require
  const app = require('./index');
  return app;
}

function createFirestoreWithStore(store) {
  const firestoreMockFn = jest.fn(() => store);
  firestoreMockFn.FieldValue = {
    serverTimestamp: jest.fn(() => Date.now()),
    arrayUnion: jest.fn((v) => v),
    increment: jest.fn((n) => n),
  };
  return firestoreMockFn;
}

// ============ Basic API tests (no Firestore initialized) ============

describe('server/index.js API (no Firestore)', () => {
  let app;
  beforeAll(() => {
    app = loadServerWithMocks({
      adminMock: {
        apps: [],
        credential: { cert: jest.fn() },
        initializeApp: jest.fn(),
        firestore: jest.fn(),
      },
    });
  });

  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ status: 'ok' }));
  });

  test('GET /api/profile returns 500 when Firestore not initialized', async () => {
    const res = await request(app).get('/api/profile').query({ userID: 'any' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Firestore not initialized' }));
  });

  test('Unknown route returns 404', async () => {
    const res = await request(app).get('/this/does/not/exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Not found' }));
  });
});

// ============ API tests with Firestore initialized (db mocks) ============

describe('server/index.js API (db initialized mocks)', () => {
  let store;
  let app;

  beforeAll(() => {
    store = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), update: jest.fn() })),
        get: jest.fn(),
        where: jest.fn().mockReturnThis(),
      })),
    };

    const adminMock = {
      apps: [{}],
      credential: { cert: jest.fn() },
      initializeApp: jest.fn(),
      firestore: createFirestoreWithStore(store),
      auth: jest.fn(() => ({})),
    };

    app = loadServerWithMocks({ adminMock });
  });

  beforeEach(() => {
    if (store.collection && store.collection.mockReset) store.collection.mockReset();
    store.collection.mockImplementation(() => ({
      doc: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), update: jest.fn() })),
      get: jest.fn(),
      where: jest.fn().mockReturnThis(),
    }));
  });

  test('GET /api/matchmaking respects excludeUserID and previous matches', async () => {
    const profiles = [
      { userID: 'me', timezone: 'UTC', language: 'English' },
      { userID: 'prev', timezone: 'UTC', language: 'English' },
      { userID: 'new', timezone: 'UTC', language: 'English' },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'matches') {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn(async () => ({
            forEach: (cb) => cb({ data: () => ({ users: ['me', 'prev'] }) }),
          })),
        };
      }
      if (name === 'profiles') {
        return {
          get: jest.fn(async () => ({
            forEach: (cb) => profiles.forEach((p) => cb({ data: () => p })),
          })),
        };
      }
      return {};
    });
    const origRandom = Math.random;
    Math.random = () => 0;
    const res = await request(app)
      .get('/api/matchmaking')
      .query({ timezone: 'UTC', language: 'English', excludeUserID: 'me' });
    expect(res.status).toBe(200);
    expect(res.body.userID).toBe('new');
    Math.random = origRandom;
  });

  test('GET /api/profile returns 400 when userID missing', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  test('POST /api/chat/report returns 500 when save fails', async () => {
    const add = jest.fn(async () => { throw new Error('write failed'); });
    store.collection.mockImplementation((name) => {
      if (name === 'reports') return { add };
      return { add: jest.fn() };
    });
    const payload = { chatId: 'c1', message: { text: 'bad' }, reporter: 'u2' };
    const res = await request(app).post('/api/chat/report').send(payload);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('stack');
  });

  test('GET /api/chat returns 400 when chatId missing', async () => {
    const res = await request(app).get('/api/chat');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing chatId' }));
  });

  test('POST /api/user/ip returns 500 when db write fails', async () => {
    const setUser = jest.fn(async () => { throw new Error('set failed'); });
    store.collection.mockImplementation((name) => {
      if (name === 'users') return { doc: jest.fn(() => ({ set: setUser })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/user/ip').send({ uid: 'u9', ipAddress: '1.2.3.4' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Internal server error' });
  });

  test('POST /api/profile/edit returns 400 when userID missing', async () => {
    const res = await request(app).post('/api/profile/edit').send({ intro: 'hi' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  test('GET /api/blocked/:userID returns blocked true via profile fallback', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'blocked_users') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      }
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => ({ blocked: true, blockedAt: 2 }) })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/blocked/u3');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ blocked: true, source: 'profile_flag' }));
  });

  test('POST /api/profile returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/profile').send({ userID: 'u1', intro: 'hi' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing required fields' }));
  });

  test('POST /api/reports/:id/validate updates using reportedUserId when no message present', async () => {
    const setReport = jest.fn();
    const getReport = jest.fn(async () => ({ exists: true, data: () => ({ reportedUserId: 'victim', reason: 'spam' }) }));
    const setProfile = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'reports') return { doc: jest.fn(() => ({ get: getReport, set: setReport })) };
      if (name === 'profiles') return { doc: jest.fn(() => ({ set: setProfile })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/r2/validate');
    expect(res.status).toBe(200);
    expect(setReport).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }), { merge: true });
    expect(setProfile).toHaveBeenCalled();
  });

  test('POST /api/reports/:id/validate swallows profile update error and still returns 200', async () => {
    const setReport = jest.fn();
    const getReport = jest.fn(async () => ({ exists: true, data: () => ({ reportedUserId: 'victim' }) }));
    const throwingSetProfile = jest.fn(async () => { throw new Error('profile update failed'); });
    store.collection.mockImplementation((name) => {
      if (name === 'reports') return { doc: jest.fn(() => ({ get: getReport, set: setReport })) };
      if (name === 'profiles') return { doc: jest.fn(() => ({ set: throwingSetProfile })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/r3/validate');
    expect(res.status).toBe(200);
    expect(setReport).toHaveBeenCalled();
  });

  test('GET /api/matchedUsers returns [] when user has no chats', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => ({ userID: 'u1', chats: [] }) })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/matchedUsers').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET /api/stats returns avg response N/A when no replies detected', async () => {
    const now = Date.now();
    const chats = [
      {
        id: 'u1_u2',
        data: () => ({
          users: ['u1', 'u2'],
          createdAt: { toMillis: () => now - 5000 },
          messages: [
            { sender: 'u1', text: 'hello', deliveryTime: now - 2000 },
            { sender: 'u1', text: 'still me', deliveryTime: now - 1000 },
          ],
        }),
      },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'chats') return { where: jest.fn().mockReturnThis(), get: jest.fn(async () => ({ docs: chats })) };
      if (name === 'profiles') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => ({ username: 'Bob' }) })) })) };
      return {};
    });
    const res = await request(app).get('/api/stats').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('averageResponseTime', 'N/A');
    expect(res.body).toHaveProperty('totalLetters', 2);
  });

  test('POST /api/profile/avatar returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/profile/avatar').send({ userID: 'u1', username: 'alice' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.stringMatching(/Missing required fields/) }));
  });

  test('GET /api/matchmaking returns 400 when both filters are missing', async () => {
    const res = await request(app).get('/api/matchmaking');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'At least one of timezone or language is required' }));
  });

  test('POST /api/match returns 400 when user IDs missing', async () => {
    const res = await request(app).post('/api/match').send({ userA: 'u1' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing user IDs' }));
  });

  test('POST /api/chat/send returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/chat/send').send({ chatId: 'c1', message: { sender: 'u1', text: 'hi' } });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.stringMatching(/Missing required fields/) }));
  });

  test('POST /api/chat/report returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/chat/report').send({ chatId: 'c1', message: 'hello' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.stringMatching(/Missing required fields/) }));
  });

  test('POST /api/user/ip returns 400 when uid missing', async () => {
    const res = await request(app).post('/api/user/ip').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing user ID' }));
  });

  test('POST /api/blockUser returns 400 when userID missing', async () => {
    const res = await request(app).post('/api/blockUser').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  test('GET /api/matchedUsers returns 400 when userID missing', async () => {
    const res = await request(app).get('/api/matchedUsers');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  test('GET /api/stats returns 400 when userID missing', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  test('GET /api/profile returns 404 when profile not found', async () => {
    store.collection.mockImplementationOnce((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/profile').query({ userID: 'any' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Profile not found' }));
  });

  test('GET /api/quiz returns quiz when found', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'quizzes') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => ({ questions: [] }) })) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/quiz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ questions: [] });
  });

  test('GET /api/quiz returns 404 when not found', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'quizzes') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/quiz');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Quiz not found' }));
  });

  test('GET /api/quiz returns 500 on error', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'quizzes') return { doc: jest.fn(() => ({ get: jest.fn(async () => { throw new Error('boom'); }) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/quiz');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ============ Happy path API tests (db initialized) ============

describe('server/index.js API (happy paths with mocked Firestore)', () => {
  let store;
  let app;

  beforeAll(() => {
    store = { collection: jest.fn(() => ({})) };
    const adminMock = {
      apps: [{}],
      credential: { cert: jest.fn() },
      initializeApp: jest.fn(),
      firestore: createFirestoreWithStore(store),
      auth: jest.fn(() => ({})),
    };
    app = loadServerWithMocks({ adminMock });
  });

  beforeEach(() => { if (store.collection && store.collection.mockReset) store.collection.mockReset(); });

  test('GET /api/profile returns 200 with profile data when found', async () => {
    const profile = { userID: 'u1', username: 'Alice' };
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => profile })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/profile').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(profile);
  });

  test('POST /api/profile saves profile and enriches language/timezone', async () => {
    const setProfile = jest.fn();
    const setLang = jest.fn();
    const setTz = jest.fn();
    const getLang = jest.fn(async () => ({ exists: false }));
    const getTz = jest.fn(async () => ({ exists: false }));
    const langDocIds = [];

    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { doc: jest.fn(() => ({ set: setProfile })) };
      if (name === 'available_languages') return { doc: jest.fn((id) => { langDocIds.push(id); return { get: getLang, set: setLang }; }) };
      if (name === 'available_countries') return { doc: jest.fn(() => ({ get: getTz, set: setTz })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });

    const body = { userID: 'u1', intro: 'hello', ageRange: '18-25', hobbies: ['reading'], timezone: 'UTC', language: 'English', country: 'ZA', username: 'Alice' };
    const res = await request(app).post('/api/profile').send(body);
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalledTimes(1);
    expect(setProfile.mock.calls[0][0]).toEqual(expect.objectContaining(body));
    expect(setProfile.mock.calls[0][1]).toEqual({ merge: true });
    expect(setLang).toHaveBeenCalled();
    expect(setTz).toHaveBeenCalled();
    expect(langDocIds[0]).toBe(encodeURIComponent('English'));
  });

  test('POST /api/profile swallows errors when adding languages/timezone', async () => {
    const setProfile = jest.fn();
    const getLang = jest.fn(async () => { throw new Error('lang get failed'); });
    const getTz = jest.fn(async () => { throw new Error('tz get failed'); });

    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { doc: jest.fn(() => ({ set: setProfile })) };
      if (name === 'available_languages') return { doc: jest.fn(() => ({ get: getLang, set: jest.fn() })) };
      if (name === 'available_countries') return { doc: jest.fn(() => ({ get: getTz, set: jest.fn() })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });

    const body = { userID: 'u1', intro: 'hello', ageRange: '18-25', hobbies: ['reading'], timezone: 'UTC', language: 'English', country: 'ZA' };
    const res = await request(app).post('/api/profile').send(body);
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalled();
  });

  test('GET /api/facts returns basic attributes from profiles', async () => {
    const docs = [
      { ageRange: '18-25', hobbies: ['r'], timezone: 'UTC', language: 'English' },
      { ageRange: '26-30', hobbies: ['s'], timezone: 'PST', language: ['French'] },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb({ data: () => d })) })) };
      }
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });
    const res = await request(app).get('/api/facts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual({ ageRange: '18-25', hobbies: ['r'], timezone: 'UTC', language: 'English' });
  });

  test('GET /api/matchmaking returns 404 when no users match filters', async () => {
    const docs = [
      { userID: 'u1', timezone: 'PST', language: 'English' },
      { userID: 'u2', timezone: 'CET', language: 'German' },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb({ data: () => d })) })) };
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });
    const res = await request(app).get('/api/matchmaking').query({ timezone: 'UTC' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'No users found for the given filters' }));
  });

  test('GET /api/chat returns 404 when chat not found', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'chats') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/chat').query({ chatId: 'c1' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Chat not found' }));
  });

  test('POST /api/chat/send appends message and returns 200', async () => {
    const update = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'chats') return { doc: jest.fn(() => ({ update })) };
      return { doc: jest.fn(() => ({ update: jest.fn() })) };
    });
    const message = { sender: 'u1', text: 'hello', deliveryTime: Date.now() };
    const res = await request(app).post('/api/chat/send').send({ chatId: 'c1', message });
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalled();
    const updateArg = update.mock.calls[0][0];
    expect(updateArg).toHaveProperty('messages');
    expect(updateArg.messages).toEqual(message);
  });

  test('POST /api/chat/report saves a report and returns 200', async () => {
    const add = jest.fn(async () => ({ id: 'r1' }));
    store.collection.mockImplementation((name) => {
      if (name === 'reports') return { add };
      return { add: jest.fn() };
    });
    const payload = { chatId: 'c1', message: { text: 'bad' }, reporter: 'u2' };
    const res = await request(app).post('/api/chat/report').send(payload);
    expect(res.status).toBe(200);
    expect(add).toHaveBeenCalledWith(expect.objectContaining(payload));
  });

  test('GET /api/available_languages returns list', async () => {
    const docs = [
      { id: 'English', data: () => ({ name: 'English' }) },
      { id: 'French', data: () => ({ name: 'French' }) },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'available_languages') return { get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb(d)) })) };
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });
    const res = await request(app).get('/api/available_languages');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 'English', name: 'English' },
      { id: 'French', name: 'French' },
    ]);
  });

  test('GET /api/available_languages returns 500 on error', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'available_languages') return { get: jest.fn(async () => { throw new Error('fail'); }) };
      return { get: jest.fn() };
    });
    const res = await request(app).get('/api/available_languages');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/available_timezones returns list', async () => {
    const docs = [
      { id: 'UTC', data: () => ({ name: 'UTC' }) },
      { id: 'PST', data: () => ({ name: 'PST' }) },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'available_countries') return { get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb(d)) })) };
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });
    const res = await request(app).get('/api/available_timezones');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 'UTC', name: 'UTC' },
      { id: 'PST', name: 'PST' },
    ]);
  });

  test('GET /api/available_timezones returns 500 on error', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'available_countries') return { get: jest.fn(async () => { throw new Error('fail'); }) };
      return { get: jest.fn() };
    });
    const res = await request(app).get('/api/available_timezones');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/reports returns list', async () => {
    const docs = [
      { id: 'r1', data: () => ({ chatId: 'c1', message: { text: 'bad' } }) },
      { id: 'r2', data: () => ({ chatId: 'c2', message: { text: 'worse' } }) },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'reports') return { get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb(d)) })) };
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toEqual(expect.objectContaining({ id: 'r1', _id: 'r1' }));
  });

  test('POST /api/reports/:id/validate marks report resolved and updates reported profile', async () => {
    const setReport = jest.fn();
    const getReport = jest.fn(async () => ({ exists: true, data: () => ({ message: { sender: 'u2', text: 'bad' } }) }));
    const setProfile = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'reports') return { doc: jest.fn(() => ({ get: getReport, set: setReport })) };
      if (name === 'profiles') return { doc: jest.fn(() => ({ set: setProfile })) };
      return { doc: jest.fn(() => ({ set: jest.fn(), get: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/r1/validate');
    expect(res.status).toBe(200);
    expect(setReport).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }), { merge: true });
    expect(setProfile).toHaveBeenCalled();
  });

  test('POST /api/reports/:id/invalidate marks report rejected', async () => {
    const setReport = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'reports') return { doc: jest.fn(() => ({ set: setReport })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/r1/invalidate');
    expect(res.status).toBe(200);
    expect(setReport).toHaveBeenCalledWith({ status: 'rejected' }, { merge: true });
  });

  test('POST /api/blockUser blocks a user and writes to collections', async () => {
    const setProfile = jest.fn();
    const setBlocked = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { doc: jest.fn(() => ({ set: setProfile })) };
      if (name === 'blocked_users') return { doc: jest.fn(() => ({ set: setBlocked })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/blockUser').send({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalled();
    expect(setBlocked).toHaveBeenCalled();
  });

  test('POST /api/blockUser attaches email when adminAuth returns user', async () => {
    const setProfile = jest.fn();
    const setBlocked = jest.fn();
    // Recreate app with adminAuth mock to return email
    const localStore = {
      collection: jest.fn((name) => {
        if (name === 'profiles') return { doc: jest.fn(() => ({ set: setProfile })) };
        if (name === 'blocked_users') return { doc: jest.fn(() => ({ set: setBlocked })) };
        return { doc: jest.fn(() => ({ set: jest.fn() })) };
      }),
    };
    const adminMock = {
      apps: [{}],
      credential: { cert: jest.fn() },
      initializeApp: jest.fn(),
      firestore: createFirestoreWithStore(localStore),
      auth: jest.fn(() => ({ getUser: jest.fn(async () => ({ email: 'a@b.com' })) })),
    };
    const localApp = loadServerWithMocks({ adminMock });
    const res = await request(localApp).post('/api/blockUser').send({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalledWith(expect.objectContaining({ blockedEmail: 'a@b.com' }), { merge: true });
    expect(setBlocked).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }), { merge: true });
  });

  test('POST /api/blockUser proceeds when adminAuth.getUser throws', async () => {
    const setProfile = jest.fn();
    const setBlocked = jest.fn();
    const localStore = {
      collection: jest.fn((name) => {
        if (name === 'profiles') return { doc: jest.fn(() => ({ set: setProfile })) };
        if (name === 'blocked_users') return { doc: jest.fn(() => ({ set: setBlocked })) };
        return { doc: jest.fn(() => ({ set: jest.fn() })) };
      }),
    };
    const adminMock = {
      apps: [{}],
      credential: { cert: jest.fn() },
      initializeApp: jest.fn(),
      firestore: createFirestoreWithStore(localStore),
      auth: jest.fn(() => ({ getUser: jest.fn(async () => { throw new Error('no user'); }) })),
    };
    const localApp = loadServerWithMocks({ adminMock });
    const res = await request(localApp).post('/api/blockUser').send({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalled();
    expect(setBlocked).toHaveBeenCalled();
  });

  test('GET /api/matchedUsers returns 404 when user profile missing', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/matchedUsers').query({ userID: 'uX' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'User profile not found' }));
  });

  test('GET /api/matchedUsers returns 500 on error', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { doc: jest.fn(() => ({ get: jest.fn(async () => { throw new Error('boom'); }) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/matchedUsers').query({ userID: 'u1' });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/profile/avatar saves avatar and username', async () => {
    const set = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { doc: jest.fn(() => ({ set })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/profile/avatar').send({ userID: 'u1', username: 'a', avatarUrl: 'http://x' });
    expect(res.status).toBe(200);
    expect(set).toHaveBeenCalledWith({ userID: 'u1', username: 'a', avatarUrl: 'http://x' }, { merge: true });
  });

  test('POST /api/profile/avatar returns 500 when db write fails', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { doc: jest.fn(() => ({ set: jest.fn(async () => { throw new Error('fail'); }) })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/profile/avatar').send({ userID: 'u1', username: 'a', avatarUrl: 'http://x' });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/matchedUsers returns unique timezones of matches', async () => {
    const profileDocs = {
      u1: { userID: 'u1', chats: ['u1_u2', 'u1_u3'] },
      u2: { userID: 'u2', timezone: 'UTC' },
      u3: { userID: 'u3', timezone: 'PST' },
    };
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn((id) => ({ get: jest.fn(async () => ({ exists: !!profileDocs[id], data: () => profileDocs[id] })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/matchedUsers').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body.sort()).toEqual(['PST', 'UTC']);
  });

  test('GET /api/stats returns computed stats', async () => {
    const now = Date.now();
    const chats = [
      {
        id: 'u1_u2',
        data: () => ({
          users: ['u1', 'u2'],
          createdAt: { toMillis: () => now - 10000 },
          messages: [
            { sender: 'u2', text: 'hi', deliveryTime: now - 7200000 },
            { sender: 'u1', text: 'hey', deliveryTime: now - 3600000 },
            { sender: 'u1', text: 'how are you?', deliveryTime: now - 1000 },
          ],
        }),
      },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'chats') return { where: jest.fn().mockReturnThis(), get: jest.fn(async () => ({ docs: chats })) };
      if (name === 'profiles') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => ({ username: 'Bob' }) })) })) };
      return {};
    });
    const res = await request(app).get('/api/stats').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalLetters', 2);
    expect(res.body).toHaveProperty('activePenPals', 1);
    expect(res.body).toHaveProperty('countriesConnected', 1);
    expect(res.body).toHaveProperty('averageResponseTime');
    expect(typeof res.body.averageResponseTime).toBe('string');
    expect(Array.isArray(res.body.activity)).toBe(true);
  });

  test('GET /api/matchmaking returns a matching user when filters match', async () => {
    const docs = [
      { userID: 'u1', timezone: 'UTC', language: 'English' },
      { userID: 'u2', timezone: 'UTC', language: ['English'] },
    ];
    const originalRandom = Math.random;
    Math.random = () => 0;
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb({ data: () => d })) })) };
      if (name === 'matches') return { where: jest.fn().mockReturnThis(), get: jest.fn(async () => ({ forEach: () => {} })) };
      return {};
    });
    const res = await request(app).get('/api/matchmaking').query({ timezone: 'UTC' });
    expect(res.status).toBe(200);
    expect(['u1', 'u2']).toContain(res.body.userID);
    Math.random = originalRandom;
  });

  test('POST /api/match creates match and chat and updates user profiles', async () => {
    const setMatch = jest.fn();
    const setChat = jest.fn();
    const setProfileA = jest.fn();
    const setProfileB = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'matches') return { doc: jest.fn(() => ({ set: setMatch })) };
      if (name === 'chats') return { doc: jest.fn(() => ({ set: setChat })) };
      if (name === 'profiles') return { doc: jest.fn((id) => ({ set: id === 'a' ? setProfileA : setProfileB })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/match').send({ userA: 'a', userB: 'b' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('chatId');
    expect(setMatch).toHaveBeenCalled();
    expect(setChat).toHaveBeenCalled();
    expect(setProfileA).toHaveBeenCalled();
    expect(setProfileB).toHaveBeenCalled();
  });

  test('POST /api/user/ip stores IP when provided', async () => {
    const setUser = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'users') return { doc: jest.fn(() => ({ set: setUser })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/user/ip').send({ uid: 'u9', ipAddress: '1.2.3.4' });
    expect(res.status).toBe(200);
    expect(setUser).toHaveBeenCalledWith({ ipAddress: '1.2.3.4' }, { merge: true });
  });

  test('GET /api/chat returns 200 when chat found', async () => {
    const chatData = { chatId: 'c1', users: ['a', 'b'], messages: [] };
    store.collection.mockImplementation((name) => {
      if (name === 'chats') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => chatData })) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/chat').query({ chatId: 'c1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(chatData);
  });

  test('POST /api/reports/:id/validate returns 404 when report not found', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'reports') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/missing/validate');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'Report not found' }));
  });

  test('GET /api/blocked/:userID returns blocked true when in blocked_users', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'blocked_users') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => ({ source: 'admin_action', blockedAt: 1 }) })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
    });
    const res = await request(app).get('/api/blocked/u1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ blocked: true }));
  });

  test('GET /api/blocked/:userID returns blocked false when not present', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'blocked_users') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      if (name === 'profiles') return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/blocked/u2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ blocked: false });
  });

  test('POST /api/profile/edit saves defaults and returns 200', async () => {
    const set = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') return { doc: jest.fn(() => ({ set })) };
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/profile/edit').send({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ userID: 'u1' }), { merge: true });
  });
});

// ============ Coverage additions: cron, tempip endpoint, openapi ============

describe('server/index.js coverage additions', () => {
  test('GET /api/tempip_blocked/:ip returns 500 when Firestore not initialized', async () => {
    const app = loadServerWithMocks({
      adminMock: {
        apps: [],
        credential: { cert: jest.fn() },
        initializeApp: jest.fn(),
        firestore: jest.fn(),
        auth: jest.fn(() => ({})),
      },
    });
    const res = await request(app).get('/api/tempip_blocked/1.2.3.4');
    expect(res.status).toBe(500);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Firestore not initialized' }));
  });

  test('GET /api/tempip_blocked/:ip returns blocked:false when doc does not exist', async () => {
    const store = { collection: jest.fn(() => ({ doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) })) };
    const app = loadServerWithMocks({
      adminMock: {
        apps: [{}],
        credential: { cert: jest.fn() },
        initializeApp: jest.fn(),
        firestore: jest.fn(() => store),
        auth: jest.fn(() => ({})),
      },
    });
    const res = await request(app).get('/api/tempip_blocked/9.9.9.9');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ blocked: false });
  });

  test('GET /api/tempip_blocked/:ip deletes expired and returns blocked:false', async () => {
    const deleteFn = jest.fn();
    const now = Date.now();
    const store = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(async () => ({
            exists: true,
            data: () => ({
              userId: 'u1',
              blockedAt: { toDate: () => new Date(now - 1000) },
              expiresAt: { toDate: () => new Date(now - 1), toMillis: () => now - 1 },
              source: 'test',
            }),
            ref: { delete: deleteFn },
          })),
        })),
      })),
    };
    const app = loadServerWithMocks({
      adminMock: {
        apps: [{}],
        credential: { cert: jest.fn() },
        initializeApp: jest.fn(),
        firestore: jest.fn(() => store),
        auth: jest.fn(() => ({})),
      },
    });
    const res = await request(app).get('/api/tempip_blocked/2.2.2.2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ blocked: false });
    expect(deleteFn).toHaveBeenCalled();
  });

  test('GET /api/tempip_blocked/:ip returns details when blocked and not expired', async () => {
    const now = Date.now();
    const store = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(async () => ({
            exists: true,
            data: () => ({
              userId: 'u2',
              blockedAt: { toDate: () => new Date(now - 1000) },
              expiresAt: { toDate: () => new Date(now + 60000), toMillis: () => now + 60000 },
              source: 'manual',
            }),
            ref: { delete: jest.fn() },
          })),
        })),
      })),
    };
    const app = loadServerWithMocks({
      adminMock: {
        apps: [{}],
        credential: { cert: jest.fn() },
        initializeApp: jest.fn(),
        firestore: jest.fn(() => store),
        auth: jest.fn(() => ({})),
      },
    });
    const res = await request(app).get('/api/tempip_blocked/3.3.3.3');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ blocked: true, userId: 'u2', source: 'manual' }));
    expect(res.body).toHaveProperty('blockedAt');
    expect(res.body).toHaveProperty('expiresAt');
  });

  test('Cron job schedules and deletes expired docs', async () => {
    const prev = process.env.ENABLE_CRON_IN_TESTS;
    process.env.ENABLE_CRON_IN_TESTS = '1';
    const deleteFn = jest.fn();
    const forEachMock = jest.fn((cb) => cb({ data: () => ({ expiresAt: { toMillis: () => Date.now() - 1 } }), ref: { delete: deleteFn } }));
    let scheduledFn;
    const cronMock = { schedule: jest.fn((spec, fn) => { scheduledFn = fn; return { stop: jest.fn() }; }) };

    const store = {
      collection: jest.fn(() => ({
        get: jest.fn(async () => ({ forEach: forEachMock })),
        where: jest.fn().mockReturnValue({ get: jest.fn(async () => ({ forEach: forEachMock })) }),
      })),
    };

    const app = loadServerWithMocks({
      adminMock: {
        apps: [{}],
        credential: { cert: jest.fn() },
        initializeApp: jest.fn(),
        firestore: jest.fn(() => store),
        auth: jest.fn(() => ({})),
      },
      cronMock,
    });

    expect(cronMock.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
    await scheduledFn();
    expect(forEachMock).toHaveBeenCalled();
    process.env.ENABLE_CRON_IN_TESTS = prev;
  });

  test('OpenAPI spec route returns JSON when spec present', async () => {
    const store = { collection: jest.fn(() => ({ get: jest.fn(async () => ({ forEach: () => {} })) })) };
    const app = loadServerWithMocks({
      adminMock: {
        apps: [{}],
        credential: { cert: jest.fn() },
        initializeApp: jest.fn(),
        firestore: jest.fn(() => store),
        auth: jest.fn(() => ({})),
      },
    });
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
    expect(res.body).toHaveProperty('openapi');
  });
});
