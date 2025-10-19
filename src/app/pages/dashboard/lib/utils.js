// Small helpers to keep page.js clean.

export const EMPTY_STATS = {
  totalLetters: 0,
  activePenPals: 0,
  countriesConnected: 0,
  averageResponseTime: "—",
  lettersThisMonth: 0,
  favoriteLetters: 0,
  activity: [],
};

export function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim() !== "") return [value];
  return [];
}

export function normalizeProfile(profile) {
  const data = { ...profile };
  data.language = toArray(data.language);
  data.hobbies = toArray(data.hobbies);
  return data;
}
