

"use client";
import React, { useState } from 'react';
import { auth } from '../../firebase/auth';


import LANGUAGES_LIST from '../../../../public/assets/languages.js';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export default function MatchmakingPage() {
  const [timezones, setTimezones] = useState([]);
  const [timezone, setTimezone] = useState('');
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load timezones on mount
  React.useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const res = await fetch('/Assets/timezones.json');
        if (res.ok) {
          const data = await res.json();
          setTimezones(data.filter(tz => tz && tz.value && tz.text));
        }
      } catch {
        setTimezones([]);
      }
    };
    fetchTimezones();
  }, []);

  const languageOptions = Object.entries(LANGUAGES_LIST).map(([code, lang]) => ({
    code,
    name: lang.name,
    nativeName: lang.nativeName,
  }));

  const handleMatch = async () => {
    setLoading(true);
    setError('');
    setMatch(null);
    try {
      const user = auth.currentUser;
      const params = new URLSearchParams();
      if (timezone) params.append('timezone', timezone);
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (user && user.uid) params.append('excludeUserID', user.uid);
  const res = await fetch(`${apiUrl}/api/matchmaking?${params.toString()}`);
      if (!res.ok) throw new Error((await res.json()).error || 'No match found');
      setMatch(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Find a Match</h1>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Timezone</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full mb-2"
          placeholder="Search timezone..."
          value={timezoneSearch}
          onChange={e => setTimezoneSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 w-full"
          value={timezone}
          onChange={e => setTimezone(e.target.value)}
        >
          <option value="">Select region/timezone</option>
          {timezones
            .filter(tz => tz.text.toLowerCase().includes(timezoneSearch.toLowerCase()))
            .map((tz, idx) => (
              <option key={`${tz.value}-${idx}`} value={tz.text}>{tz.text}</option>
            ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Language</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full mb-2"
          placeholder="Search language..."
          value={languageSearch}
          onChange={e => setLanguageSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 w-full"
          value={selectedLanguage}
          onChange={e => setSelectedLanguage(e.target.value)}
        >
          <option value="">Select a language</option>
          {languageOptions
            .filter(lang =>
              lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
              (lang.nativeName && lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase()))
            )
            .map(lang => (
              <option key={lang.code} value={lang.name}>
                {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ''}
              </option>
            ))}
        </select>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleMatch}
        disabled={loading || !timezone || !selectedLanguage}
      >
        {loading ? 'Matching...' : 'Find Match'}
      </button>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {match && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Matched User</h2>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(match, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
