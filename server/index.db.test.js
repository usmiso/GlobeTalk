/**
 * @jest-environment node
 */

const request = require('supertest');

// Robust firebase-admin mock: initialized (apps length > 0), with a Firestore-like shape
const makeStore = () => {
  const docMock = () => ({
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  });

  it('POST /api/profile with language array enriches each string and ignores non-strings', async () => {
    const setProfile = jest.fn();
    const setLang = jest.fn();
    const getLang = jest.fn(async () => ({ exists: false }));
    const setTz = jest.fn();
    const getTz = jest.fn(async () => ({ exists: false }));

    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ set: setProfile })) };
      }
      if (name === 'available_languages') {
        return { doc: jest.fn(() => ({ get: getLang, set: setLang })) };
      }
      if (name === 'available_countries') {
        return { doc: jest.fn(() => ({ get: getTz, set: setTz })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });

    const body = {
      userID: 'u1',
      intro: 'hello',
      ageRange: '18-25',
      hobbies: ['reading'],
      timezone: 'UTC',
      language: ['English', null, 'French', 5],
      country: 'ZA',
    };
    const res = await request(app).post('/api/profile').send(body);
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalledTimes(1);
    // Two valid strings should be attempted to set in available_languages
    expect(setLang).toHaveBeenCalledTimes(2);
    // timezone enrichment attempted
    expect(setTz).toHaveBeenCalledTimes(1);
  });

  it('POST /api/profile continues 200 even if language enrichment throws', async () => {
    const setProfile = jest.fn();
    const throwingGet = jest.fn(async () => { throw new Error('lang get failed'); });
    const setTz = jest.fn();
    const getTz = jest.fn(async () => ({ exists: false }));

    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ set: setProfile })) };
      }
      if (name === 'available_languages') {
        return { doc: jest.fn(() => ({ get: throwingGet, set: jest.fn() })) };
      }
      if (name === 'available_countries') {
        return { doc: jest.fn(() => ({ get: getTz, set: setTz })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });

    const body = {
      userID: 'u1', intro: 'hi', ageRange: '18-25', hobbies: [], timezone: 'UTC', language: 'English', country: 'ZA'
    };
    const res = await request(app).post('/api/profile').send(body);
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalled();
  });

  it('POST /api/profile continues 200 even if timezone enrichment throws', async () => {
    const setProfile = jest.fn();
    const setLang = jest.fn();
    const getLang = jest.fn(async () => ({ exists: false }));
    const throwingGetTz = jest.fn(async () => { throw new Error('tz get failed'); });

    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ set: setProfile })) };
      }
      if (name === 'available_languages') {
        return { doc: jest.fn(() => ({ get: getLang, set: setLang })) };
      }
      if (name === 'available_countries') {
        return { doc: jest.fn(() => ({ get: throwingGetTz, set: jest.fn() })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });

    const body = {
      userID: 'u1', intro: 'hi', ageRange: '18-25', hobbies: [], timezone: 'UTC', language: 'English', country: 'ZA'
    };
    const res = await request(app).post('/api/profile').send(body);
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalled();
  });
  const colObj = {
    doc: jest.fn(() => docMock()),
    get: jest.fn(),
    where: jest.fn().mockReturnThis(),
  };
  return {
    collection: jest.fn(() => colObj),
  };
};

const store = makeStore();
const firestoreMockFn = jest.fn(() => store);
firestoreMockFn.FieldValue = {
  serverTimestamp: jest.fn(() => Date.now()),
  arrayUnion: jest.fn((v) => v),
  increment: jest.fn((n) => n),
};

jest.mock('firebase-admin', () => ({
  apps: [{}],
  credential: { cert: jest.fn() },
  initializeApp: jest.fn(),
  firestore: firestoreMockFn,
  auth: jest.fn(() => ({})),
}));

// Prevent dotenv side effects in tests
jest.mock('dotenv', () => ({ config: jest.fn() }));

const app = require('./index');

describe('server/index.js API (db initialized mocks)', () => {
  beforeEach(() => {
    // Reset store.collection to a clean default between tests
    if (store.collection && store.collection.mockReset) {
      store.collection.mockReset();
    }
    store.collection.mockImplementation(() => ({
      doc: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), update: jest.fn() })),
      get: jest.fn(),
      where: jest.fn().mockReturnThis(),
    }));
  });

  it('GET /api/matchmaking respects excludeUserID and previous matches', async () => {
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
    // Fix random to pick index 0 deterministically
    const origRandom = Math.random;
    Math.random = () => 0;
    const res = await request(app).get('/api/matchmaking').query({ timezone: 'UTC', language: 'English', excludeUserID: 'me' });
    expect(res.status).toBe(200);
    expect(res.body.userID).toBe('new');
    Math.random = origRandom;
  });

  it('GET /api/profile returns 400 when userID missing', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  it('POST /api/chat/report returns 500 when save fails', async () => {
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

  it('GET /api/chat returns 400 when chatId missing', async () => {
    const res = await request(app).get('/api/chat');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing chatId' }));
  });

  it('POST /api/user/ip returns 500 when db write fails', async () => {
    const setUser = jest.fn(async () => { throw new Error('set failed'); });
    store.collection.mockImplementation((name) => {
      if (name === 'users') {
        return { doc: jest.fn(() => ({ set: setUser })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/user/ip').send({ uid: 'u9', ipAddress: '1.2.3.4' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Internal server error' });
  });

  it('POST /api/profile/edit returns 400 when userID missing', async () => {
    const res = await request(app)
      .post('/api/profile/edit')
      .send({ intro: 'hi' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  it('GET /api/blocked/:userID returns blocked true via profile fallback', async () => {
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

  it('POST /api/profile returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/profile')
      .send({ userID: 'u1', intro: 'hi' }); // missing several required fields
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing required fields' }));
  });

  it('POST /api/reports/:id/validate updates using reportedUserId when no message present', async () => {
    const setReport = jest.fn();
    const getReport = jest.fn(async () => ({ exists: true, data: () => ({ reportedUserId: 'victim', reason: 'spam' }) }));
    const setProfile = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'reports') {
        return { doc: jest.fn(() => ({ get: getReport, set: setReport })) };
      }
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ set: setProfile })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/r2/validate');
    expect(res.status).toBe(200);
    expect(setReport).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }), { merge: true });
    expect(setProfile).toHaveBeenCalled();
  });

  it('POST /api/reports/:id/validate swallows profile update error and still returns 200', async () => {
    const setReport = jest.fn();
    const getReport = jest.fn(async () => ({ exists: true, data: () => ({ reportedUserId: 'victim' }) }));
    const throwingSetProfile = jest.fn(async () => { throw new Error('profile update failed'); });
    store.collection.mockImplementation((name) => {
      if (name === 'reports') {
        return { doc: jest.fn(() => ({ get: getReport, set: setReport })) };
      }
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ set: throwingSetProfile })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/r3/validate');
    expect(res.status).toBe(200);
    expect(setReport).toHaveBeenCalled();
  });

  it('GET /api/matchedUsers returns [] when user has no chats', async () => {
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

  it('GET /api/stats returns avg response N/A when no replies detected', async () => {
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
      if (name === 'chats') {
        return { where: jest.fn().mockReturnThis(), get: jest.fn(async () => ({ docs: chats })) };
      }
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => ({ username: 'Bob' }) })) })) };
      }
      return {};
    });
    const res = await request(app).get('/api/stats').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('averageResponseTime', 'N/A');
    expect(res.body).toHaveProperty('totalLetters', 2);
  });

  it('POST /api/profile/avatar returns 400 when fields missing', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .send({ userID: 'u1', username: 'alice' }); // missing avatarUrl
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.stringMatching(/Missing required fields/) }));
  });

  it('GET /api/matchmaking returns 400 when both filters are missing', async () => {
    const res = await request(app).get('/api/matchmaking');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'At least one of timezone or language is required' }));
  });

  it('POST /api/match returns 400 when user IDs missing', async () => {
    const res = await request(app)
      .post('/api/match')
      .send({ userA: 'u1' }); // missing userB
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing user IDs' }));
  });

  it('POST /api/chat/send returns 400 when fields missing', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .send({ chatId: 'c1', message: { sender: 'u1', text: 'hi' } }); // missing deliveryTime
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.stringMatching(/Missing required fields/) }));
  });

  it('POST /api/chat/report returns 400 when fields missing', async () => {
    const res = await request(app)
      .post('/api/chat/report')
      .send({ chatId: 'c1', message: 'hello' }); // missing reporter
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.stringMatching(/Missing required fields/) }));
  });

  it('POST /api/user/ip returns 400 when uid missing', async () => {
    const res = await request(app)
      .post('/api/user/ip')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing user ID' }));
  });

  it('GET /api/matchedUsers returns 400 when userID missing', async () => {
    const res = await request(app).get('/api/matchedUsers');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  it('GET /api/stats returns 400 when userID missing', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Missing userID' }));
  });

  it('GET /api/profile returns 404 when profile not found', async () => {
    // Arrange: next call to collection('profiles').doc('any').get() should return not found
    store.collection.mockImplementationOnce((name) => {
      if (name === 'profiles') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn(async () => ({ exists: false }))
          }))
        };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/profile').query({ userID: 'any' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Profile not found' }));
  });
});

describe('server/index.js API (happy paths with mocked Firestore)', () => {
  beforeEach(() => {
    // Reset mocks
    if (store.collection && store.collection.mockReset) {
      store.collection.mockReset();
    }
  });

  it('GET /api/profile returns 200 with profile data when found', async () => {
    const profile = { userID: 'u1', username: 'Alice' };
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return {
          doc: jest.fn((id) => ({
            get: jest.fn(async () => ({ exists: true, data: () => profile })),
          })),
        };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/profile').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(profile);
  });

  it('POST /api/profile saves profile and enriches language/timezone', async () => {
    const setProfile = jest.fn();
    const langDocIds = [];
    const setLang = jest.fn();
    const setTz = jest.fn();
    const getLang = jest.fn(async () => ({ exists: false }));
    const getTz = jest.fn(async () => ({ exists: false }));

    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return {
          doc: jest.fn((id) => ({ set: setProfile })),
        };
      }
      if (name === 'available_languages') {
        return {
          doc: jest.fn((id) => {
            langDocIds.push(id);
            return { get: getLang, set: setLang };
          }),
        };
      }
      if (name === 'available_countries') {
        return {
          doc: jest.fn((id) => ({ get: getTz, set: setTz })),
        };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });

    const body = {
      userID: 'u1',
      intro: 'hello',
      ageRange: '18-25',
      hobbies: ['reading'],
      timezone: 'UTC',
      language: 'English',
      country: 'ZA',
      username: 'Alice',
    };
    const res = await request(app).post('/api/profile').send(body);
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalledTimes(1);
    expect(setProfile.mock.calls[0][0]).toEqual(expect.objectContaining(body));
    expect(setProfile.mock.calls[0][1]).toEqual({ merge: true });
    // Language enrichment should be attempted
    expect(setLang).toHaveBeenCalled();
    // timezone enrichment stored in available_countries
    expect(setTz).toHaveBeenCalled();
    // ensure language doc id is encoded
    expect(langDocIds[0]).toBe(encodeURIComponent('English'));
  });

  it('GET /api/facts returns basic attributes from profiles', async () => {
    const docs = [
      { ageRange: '18-25', hobbies: ['r'], timezone: 'UTC', language: 'English' },
      { ageRange: '26-30', hobbies: ['s'], timezone: 'PST', language: ['French'] },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return {
          get: jest.fn(async () => ({
            forEach: (cb) => docs.forEach((d) => cb({ data: () => d })),
          })),
        };
      }
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });

    const res = await request(app).get('/api/facts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual({ ageRange: '18-25', hobbies: ['r'], timezone: 'UTC', language: 'English' });
  });

  it('GET /api/matchmaking returns 404 when no users match filters', async () => {
    const docs = [
      { userID: 'u1', timezone: 'PST', language: 'English' },
      { userID: 'u2', timezone: 'CET', language: 'German' },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return {
          get: jest.fn(async () => ({
            forEach: (cb) => docs.forEach((d) => cb({ data: () => d })),
          })),
        };
      }
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });

    const res = await request(app).get('/api/matchmaking').query({ timezone: 'UTC' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'No users found for the given filters' }));
  });

  it('GET /api/chat returns 404 when chat not found', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'chats') {
        return {
          doc: jest.fn((id) => ({ get: jest.fn(async () => ({ exists: false })) })),
        };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/chat').query({ chatId: 'c1' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ error: 'Chat not found' }));
  });

  it('POST /api/chat/send appends message and returns 200', async () => {
    const update = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'chats') {
        return {
          doc: jest.fn((id) => ({ update })),
        };
      }
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

  it('POST /api/chat/report saves a report and returns 200', async () => {
    const add = jest.fn(async () => ({ id: 'r1' }));
    store.collection.mockImplementation((name) => {
      if (name === 'reports') {
        return { add };
      }
      return { add: jest.fn() };
    });
    const payload = { chatId: 'c1', message: { text: 'bad' }, reporter: 'u2' };
    const res = await request(app).post('/api/chat/report').send(payload);
    expect(res.status).toBe(200);
    expect(add).toHaveBeenCalledWith(expect.objectContaining(payload));
  });

  it('GET /api/available_languages returns list', async () => {
    const docs = [
      { id: 'English', data: () => ({ name: 'English' }) },
      { id: 'French', data: () => ({ name: 'French' }) },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'available_languages') {
        return {
          get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb(d)) })),
        };
      }
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });
    const res = await request(app).get('/api/available_languages');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 'English', name: 'English' },
      { id: 'French', name: 'French' },
    ]);
  });

  it('GET /api/available_timezones returns list', async () => {
    const docs = [
      { id: 'UTC', data: () => ({ name: 'UTC' }) },
      { id: 'PST', data: () => ({ name: 'PST' }) },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'available_countries') {
        return {
          get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb(d)) })),
        };
      }
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });
    const res = await request(app).get('/api/available_timezones');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 'UTC', name: 'UTC' },
      { id: 'PST', name: 'PST' },
    ]);
  });

  it('GET /api/reports returns list', async () => {
    const docs = [
      { id: 'r1', data: () => ({ chatId: 'c1', message: { text: 'bad' } }) },
      { id: 'r2', data: () => ({ chatId: 'c2', message: { text: 'worse' } }) },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'reports') {
        return {
          get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb(d)) })),
        };
      }
      return { get: jest.fn(async () => ({ forEach: () => {} })) };
    });
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toEqual(expect.objectContaining({ id: 'r1', _id: 'r1' }));
  });

  it('POST /api/reports/:id/validate marks report resolved and updates reported profile', async () => {
    const setReport = jest.fn();
    const getReport = jest.fn(async () => ({ exists: true, data: () => ({ message: { sender: 'u2', text: 'bad' } }) }));
    const setProfile = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'reports') {
        return { doc: jest.fn(() => ({ get: getReport, set: setReport })) };
      }
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ set: setProfile })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn(), get: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/r1/validate');
    expect(res.status).toBe(200);
    expect(setReport).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }), { merge: true });
    expect(setProfile).toHaveBeenCalled();
  });

  it('POST /api/reports/:id/invalidate marks report rejected', async () => {
    const setReport = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'reports') {
        return { doc: jest.fn(() => ({ set: setReport })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/r1/invalidate');
    expect(res.status).toBe(200);
    expect(setReport).toHaveBeenCalledWith({ status: 'rejected' }, { merge: true });
  });

  it('POST /api/blockUser blocks a user and writes to collections', async () => {
    const setProfile = jest.fn();
    const setBlocked = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ set: setProfile })) };
      }
      if (name === 'blocked_users') {
        return { doc: jest.fn(() => ({ set: setBlocked })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/blockUser').send({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(setProfile).toHaveBeenCalled();
    expect(setBlocked).toHaveBeenCalled();
  });

  it('GET /api/matchedUsers returns unique timezones of matches', async () => {
    const profileDocs = {
      'u1': { userID: 'u1', chats: ['u1_u2', 'u1_u3'] },
      'u2': { userID: 'u2', timezone: 'UTC' },
      'u3': { userID: 'u3', timezone: 'PST' },
    };
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return {
          doc: jest.fn((id) => ({
            get: jest.fn(async () => ({ exists: !!profileDocs[id], data: () => profileDocs[id] })),
          })),
        };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/matchedUsers').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body.sort()).toEqual(['PST', 'UTC']);
  });

  it('GET /api/stats returns computed stats', async () => {
    const now = Date.now();
    const chats = [
      {
        id: 'u1_u2',
        data: () => ({
          users: ['u1', 'u2'],
          createdAt: { toMillis: () => now - 10000 },
          messages: [
            { sender: 'u2', text: 'hi', deliveryTime: now - 7200000 }, // 2h before
            { sender: 'u1', text: 'hey', deliveryTime: now - 3600000 }, // respond after 1h
            { sender: 'u1', text: 'how are you?', deliveryTime: now - 1000 },
          ],
        }),
      },
    ];
    store.collection.mockImplementation((name) => {
      if (name === 'chats') {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn(async () => ({ docs: chats })),
        };
      }
      if (name === 'profiles') {
        return {
          doc: jest.fn((id) => ({ get: jest.fn(async () => ({ exists: true, data: () => ({ username: 'Bob' }) })) })),
        };
      }
      return {};
    });
    const res = await request(app).get('/api/stats').query({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalLetters', 2); // two messages from u1
    expect(res.body).toHaveProperty('activePenPals', 1);
    expect(res.body).toHaveProperty('countriesConnected', 1);
    expect(res.body).toHaveProperty('averageResponseTime');
    expect(typeof res.body.averageResponseTime).toBe('string');
    expect(Array.isArray(res.body.activity)).toBe(true);
  });

  it('GET /api/matchmaking returns a matching user when filters match', async () => {
    const docs = [
      { userID: 'u1', timezone: 'UTC', language: 'English' },
      { userID: 'u2', timezone: 'UTC', language: ['English'] },
    ];
    // Force deterministic selection
    const originalRandom = Math.random;
    Math.random = () => 0; // pick first match
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return {
          get: jest.fn(async () => ({ forEach: (cb) => docs.forEach((d) => cb({ data: () => d })) })),
        };
      }
      if (name === 'matches') {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn(async () => ({ forEach: () => {} })),
        };
      }
      return {};
    });
    const res = await request(app).get('/api/matchmaking').query({ timezone: 'UTC' });
    expect(res.status).toBe(200);
    expect(['u1', 'u2']).toContain(res.body.userID);
    Math.random = originalRandom;
  });

  it('POST /api/match creates match and chat and updates user profiles', async () => {
    const setMatch = jest.fn();
    const setChat = jest.fn();
    const setProfileA = jest.fn();
    const setProfileB = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'matches') {
        return { doc: jest.fn(() => ({ set: setMatch })) };
      }
      if (name === 'chats') {
        return { doc: jest.fn(() => ({ set: setChat })) };
      }
      if (name === 'profiles') {
        return {
          doc: jest.fn((id) => ({ set: id === 'a' ? setProfileA : setProfileB })),
        };
      }
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

  it('POST /api/user/ip stores IP when provided', async () => {
    const setUser = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'users') {
        return { doc: jest.fn(() => ({ set: setUser })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/user/ip').send({ uid: 'u9', ipAddress: '1.2.3.4' });
    expect(res.status).toBe(200);
    expect(setUser).toHaveBeenCalledWith({ ipAddress: '1.2.3.4' }, { merge: true });
  });

  it('GET /api/chat returns 200 when chat found', async () => {
    const chatData = { chatId: 'c1', users: ['a', 'b'], messages: [] };
    store.collection.mockImplementation((name) => {
      if (name === 'chats') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: true, data: () => chatData })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/chat').query({ chatId: 'c1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(chatData);
  });

  it('POST /api/reports/:id/validate returns 404 when report not found', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'reports') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).post('/api/reports/missing/validate');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'Report not found' }));
  });

  it('GET /api/blocked/:userID returns blocked true when in blocked_users', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'blocked_users') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn(async () => ({
              exists: true,
              data: () => ({ source: 'admin_action', blockedAt: 1 })
            }))
          }))
        };
      }
      return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
    });
    const res = await request(app).get('/api/blocked/u1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ blocked: true }));
  });

  it('GET /api/blocked/:userID returns blocked false when not present', async () => {
    store.collection.mockImplementation((name) => {
      if (name === 'blocked_users') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      }
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })) };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });
    const res = await request(app).get('/api/blocked/u2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ blocked: false });
  });

  it('POST /api/profile/edit saves defaults and returns 200', async () => {
    const set = jest.fn();
    store.collection.mockImplementation((name) => {
      if (name === 'profiles') {
        return { doc: jest.fn(() => ({ set })) };
      }
      return { doc: jest.fn(() => ({ set: jest.fn() })) };
    });
    const res = await request(app).post('/api/profile/edit').send({ userID: 'u1' });
    expect(res.status).toBe(200);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ userID: 'u1' }), { merge: true });
  });
});
