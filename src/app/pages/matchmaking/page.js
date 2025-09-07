"use client";
import React, { useState, useEffect } from "react";
import { auth } from "../../firebase/auth";
import LANGUAGES_LIST from "../../../../public/assets/languages.js";

// API base - prefer NEXT_PUBLIC_API_URL, fallback to localhost:5000 for dev
const API = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5000';

export default function MatchmakingPage() {
  const [timezones, setTimezones] = useState([]);
  const [timezone, setTimezone] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const res = await fetch("/Assets/timezones.json");
        if (res.ok) {
          const data = await res.json();
          setTimezones(data.filter((tz) => tz && tz.value && tz.text));
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
    setError("");
    setMatch(null);
    try {
      const user = auth.currentUser;
      const params = new URLSearchParams();
      if (timezone) params.append("timezone", timezone);
      if (selectedLanguage) params.append("language", selectedLanguage);
      if (user && user.uid) params.append("excludeUserID", user.uid);

  const res = await fetch(`${API}/api/matchmaking?${params.toString()}`);
      if (!res.ok) throw new Error((await res.json()).error || "No match found");
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
        <label htmlFor="timezone-select" className="block mb-1 font-medium">
          Timezone
        </label>
        <input
          id="timezone-search"
          type="text"
          placeholder="Search timezone..."
          className="border rounded px-3 py-2 w-full mb-2"
          value={timezoneSearch}
          onChange={(e) => setTimezoneSearch(e.target.value)}
        />
        <select
          id="timezone-select"
          aria-label="Timezone"
          className="border rounded px-3 py-2 w-full"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          <option value="">Select region/timezone</option>
          {timezones
            .filter((tz) => tz.text.toLowerCase().includes(timezoneSearch.toLowerCase()))
            .map((tz, idx) => (
              <option key={`${tz.value}-${idx}`} value={tz.text}>
                {tz.text}
              </option>
            ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="language-select" className="block mb-1 font-medium">
          Language
        </label>
        <input
          id="language-search"
          type="text"
          placeholder="Search language..."
          className="border rounded px-3 py-2 w-full mb-2"
          value={languageSearch}
          onChange={(e) => setLanguageSearch(e.target.value)}
        />
        <select
          id="language-select"
          aria-label="Language"
          className="border rounded px-3 py-2 w-full"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="">Select a language</option>
          {languageOptions
            .filter(
              (lang) =>
                lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                (lang.nativeName &&
                  lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase()))
            )
            .map((lang) => (
              <option key={lang.code} value={lang.name}>
                {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ""}
              </option>
            ))}
        </select>
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleMatch}
        disabled={loading || !timezone || !selectedLanguage}
      >
        {loading ? "Matching..." : "Find Match"}
      </button>

      {error && <div className="text-red-600 mt-4">{error}</div>}
      {match && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Matched User</h2>
          {match.username || match.avatar || match.name || match.email || match.language || match.timezone ? (
            <div className="space-y-2">
              {(match.avatarURL || match.avatar) && (
                <div>
                  <span className="font-medium">Avatar:</span><br />
                  <img src={match.avatarURL ? match.avatarURL : match.avatar} alt="avatar" className="w-16 h-16 rounded-full border" />
                </div>
              )}
              {match.username && (
                <div><span className="font-medium">Username:</span> {match.username}</div>
              )}
              {match.name && (
                <div><span className="font-medium">Name:</span> {match.name}</div>
              )}
              {match.email && (
                <div><span className="font-medium">Email:</span> {match.email}</div>
              )}
              {match.language && (
                <div><span className="font-medium">Language:</span> {match.language}</div>
              )}
              {match.timezone && (
                <div><span className="font-medium">Timezone:</span> {match.timezone}</div>
              )}
              {match.intro && (
                <div><span className="font-medium">Intro:</span> {match.intro}</div>
              )}
              {(match.ageMin || match.ageMax) && (
                <div>
                  <span className="font-medium">Age Range:</span> {match.ageMin ? match.ageMin : "?"} - {match.ageMax ? match.ageMax : "?"}
                </div>
              )}
              {match.hobbies && Array.isArray(match.hobbies) && match.hobbies.length > 0 && (
                <div>
                  <span className="font-medium">Hobbies:</span> {match.hobbies.join(", ")}
                </div>
              )}
            </div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(match, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
