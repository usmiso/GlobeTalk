/* eslint-disable react/display-name */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Index from '@/app/pages/index/index';

// ✅ Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );

// ✅ Mock next/image (so tests don’t complain about <Image />)
jest.mock('next/image', () => (props) => {
  return <img alt={props.alt || ''} {...props} />;
});

// ✅ Mock useRouter from next/navigation
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('Index page', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('renders the main heading', () => {
    render(<Index />);
    expect(
      screen.getByRole('heading', { name: /Say Hello to your New Random Bestie!/i })
    ).toBeInTheDocument();
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