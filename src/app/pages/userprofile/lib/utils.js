export function normalizeLanguage(input) {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string' && input.trim() !== '') return [input];
  return [];
}

// Determine country name from timezone selection and optional country map
export function pickCountryFromTimezone({ timezones, timezone, country, countryMap }) {
  if (country && country.trim()) return country;
  const tzObj = Array.isArray(timezones)
    ? timezones.find((tz) => tz && (tz.timezone_id === timezone || tz.value === timezone))
    : undefined;
  const code = tzObj?.country_code;
  if (!code || !countryMap) return country;
  return countryMap[code] || country;
}

export function extractLanguagesFromCountries(countriesJson) {
  const langs = new Set();
  (countriesJson || []).forEach((c) => {
    if (c && c.languages) {
      Object.values(c.languages).forEach((lang) => langs.add(lang));
    }
  });
  return Array.from(langs);
}

export function validateTimezoneList(data) {
  return Array.isArray(data)
    ? data.filter((tz) => tz && (tz.value && tz.text || tz.timezone_id && tz.text))
    : [];
}
