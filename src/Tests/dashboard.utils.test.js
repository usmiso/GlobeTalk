/**
 * @jest-environment jsdom
 */

describe('dashboard lib utils.js', () => {
  test('toArray returns same array when given an array', async () => {
    const { toArray } = await import('../app/pages/dashboard/lib/utils.js');
    const arr = ['a'];
    expect(toArray(arr)).toBe(arr);
  });

  test('toArray wraps non-empty string in array', async () => {
    const { toArray } = await import('../app/pages/dashboard/lib/utils.js');
    expect(toArray('x')).toEqual(['x']);
  });

  test('toArray trims and returns empty array for empty/whitespace string or others', async () => {
    const { toArray } = await import('../app/pages/dashboard/lib/utils.js');
    expect(toArray('   ')).toEqual([]);
    expect(toArray('')).toEqual([]);
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray(0)).toEqual([]);
  });

  test('normalizeProfile converts language/hobbies via toArray', async () => {
    const { normalizeProfile } = await import('../app/pages/dashboard/lib/utils.js');
    const input = { language: 'English', hobbies: ['reading'], username: 'Bob' };
    const out = normalizeProfile(input);
    expect(out).toEqual({ language: ['English'], hobbies: ['reading'], username: 'Bob' });
    // Ensure original object not mutated
    expect(input.language).toBe('English');
  });
});
