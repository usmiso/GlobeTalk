/**
 * @jest-environment jsdom
 */

describe('dashboard lib api.js', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('fetchUserProfile returns the raw Response', async () => {
    // Arrange
    const body = { userID: 'u1' };
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    // Load module fresh
    const { fetchUserProfile } = await import('../app/pages/dashboard/lib/api.js');

    // Act
    const res = await fetchUserProfile('u1');

    // Assert
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json).toEqual(body);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/profile\?userID=u1/));
  });

  test('fetchUserStats returns parsed JSON on success', async () => {
    const stats = { totalLetters: 2 };
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify(stats), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const { fetchUserStats } = await import('../app/pages/dashboard/lib/api.js');
    const res = await fetchUserStats('u1');
    expect(res).toEqual(stats);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/stats\?userID=u1/));
  });

  test('fetchUserStats throws on non-ok response', async () => {
    global.fetch.mockResolvedValueOnce(new Response('oops', { status: 500 }));
    const { fetchUserStats } = await import('../app/pages/dashboard/lib/api.js');
    await expect(fetchUserStats('u1')).rejects.toThrow('Stats fetch failed');
  });
});
