import {
  fetchQuizCategories,
  fetchAllQuizzes,
  previewQuizSession,
  fetchQuizzesWithHeaders,
} from '@/app/explore/lib/externalQuizApi';

describe('externalQuizApi', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('fetches quiz categories (success)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ categories: ['a', 'b'] }) });
    const data = await fetchQuizCategories();
    expect(data).toEqual({ categories: ['a', 'b'] });
    expect(global.fetch).toHaveBeenCalledWith('https://language-quiz-api.onrender.com/api/v1/quizzes/categories');
  });

  it('fetches all quizzes (failure throws)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    await expect(fetchAllQuizzes()).rejects.toThrow('Failed to fetch quizzes');
  });

  it('previews a quiz session by id', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: '123', preview: true }) });
    const data = await previewQuizSession('123');
    expect(data).toEqual({ id: '123', preview: true });
    expect(global.fetch).toHaveBeenCalledWith('https://language-quiz-api.onrender.com/api/v1/quiz-sessions/preview/123');
  });

  it('fetches with headers', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ quizzes: [] }) });
    const data = await fetchQuizzesWithHeaders('stu-1', 'user-9');
    expect(data).toEqual({ quizzes: [] });
    expect(global.fetch).toHaveBeenCalledWith('https://language-quiz-api.onrender.com/api/v1/quizzes', expect.objectContaining({
      headers: expect.objectContaining({ 'X-Student-ID': 'stu-1', 'X-User-ID': 'user-9' }),
    }));
  });
});
