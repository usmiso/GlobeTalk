'use client';

import React, { useState, useEffect } from "react";
import { auth } from "../../firebase/auth";
import LANGUAGES_LIST from "../../../../public/assets/languages.js";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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

      const res = await fetch(`${apiUrl}/api/matchmaking?${params.toString()}`);
      if (!res.ok) throw new Error((await res.json()).error || "No match found");
      setMatch(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Theme Colors — Based on #476C8A
  const theme = {
    primary: '#476C8A',
    primaryDark: '#3A5A72',
    primaryLight: '#E3EDF5',     // Full page background
    primaryLighter: '#F0F5F9',   // Input backgrounds
    textDark: '#2D3748',
    textLight: '#718096',
    cardBg: '#FFFFFF',
    borderLight: 'rgba(71, 108, 138, 0.2)',
    error: '#E53E3E',
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: theme.primaryLight }}
    >
      <div
        className="shadow-xl rounded-2xl p-6 w-full max-w-3xl  flex flex-col space-y-5"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.borderLight}`,
          boxShadow: '0 10px 30px rgba(71, 108, 138, 0.1)',
        }}
      >
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
            Find a Match
          </h1>
          <p className="text-sm" style={{ color: theme.textLight }}>
            Connect with someone who shares your timezone and language.
          </p>
        </div>

        {/* Timezone Selector */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="timezone-select" className="block text-xs font-medium" style={{ color: theme.textDark }}>
            Timezone
          </label>
          <input
            id="timezone-search"
            type="text"
            placeholder="Search timezone..."
            className="w-full px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-1 transition"
            style={{
              backgroundColor: theme.primaryLighter,
              borderColor: theme.borderLight,
              color: theme.textDark,
            }}
            value={timezoneSearch}
            onChange={(e) => setTimezoneSearch(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = theme.primary)}
            onBlur={(e) => (e.target.style.borderColor = theme.borderLight)}
          />
          <select
            id="timezone-select"
            aria-label="Timezone"
            className="w-full px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-1 transition"
            style={{
              backgroundColor: theme.primaryLighter,
              borderColor: theme.borderLight,
              color: theme.textDark,
            }}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = theme.primary)}
            onBlur={(e) => (e.target.style.borderColor = theme.borderLight)}
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

        {/* Language Selector */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="language-select" className="block text-xs font-medium" style={{ color: theme.textDark }}>
            Language
          </label>
          <input
            id="language-search"
            type="text"
            placeholder="Search language..."
            className="w-full px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-1 transition"
            style={{
              backgroundColor: theme.primaryLighter,
              borderColor: theme.borderLight,
              color: theme.textDark,
            }}
            value={languageSearch}
            onChange={(e) => setLanguageSearch(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = theme.primary)}
            onBlur={(e) => (e.target.style.borderColor = theme.borderLight)}
          />
          <select
            id="language-select"
            aria-label="Language"
            className="w-full px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-1 transition"
            style={{
              backgroundColor: theme.primaryLighter,
              borderColor: theme.borderLight,
              color: theme.textDark,
            }}
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = theme.primary)}
            onBlur={(e) => (e.target.style.borderColor = theme.borderLight)}
          >
            <option value="">Select a language</option>
            {languageOptions
              .filter(
                (lang) =>
                  lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                  (lang.nativeName && lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase()))
              )
              .map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ""}
                </option>
              ))}
          </select>
        </div>

        {/* Match Button */}
        <button
          onClick={handleMatch}
          disabled={loading || !timezone || !selectedLanguage}
          className="w-full py-3 px-6 rounded-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: theme.primary,
            border: 'none',
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = theme.primaryDark)}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = theme.primary)}
        >
          {loading ? "Matching..." : "Find Match"}
        </button>

        {/* Error Message */}
        {error && (
          <div
            className="text-sm p-3 rounded-lg text-white"
            style={{
              backgroundColor: theme.error,
            }}
          >
            {error}
          </div>
        )}

        {/* Match Result */}
        {match && (
          <div
            className="p-4 rounded-lg space-y-3"
            style={{
              backgroundColor: theme.primaryLighter,
              border: `1px solid ${theme.borderLight}`,
            }}
          >
            <h2 className="font-semibold" style={{ color: theme.primary }}>Matched User</h2>
            <div className="space-y-2 text-sm">
              {(match.avatarURL || match.avatar) && (
                <div>
                  <span className="font-medium" style={{ color: theme.textDark }}>Avatar:</span><br />
                  <img
                    src={match.avatarURL || match.avatar}
                    alt="avatar"
                    className="w-16 h-16 rounded-full border mt-1"
                    style={{ borderColor: theme.borderLight }}
                  />
                </div>
              )}
              {match.username && (
                <div><span className="font-medium" style={{ color: theme.textDark }}>Username:</span> {match.username}</div>
              )}
              {match.name && (
                <div><span className="font-medium" style={{ color: theme.textDark }}>Name:</span> {match.name}</div>
              )}
              {match.email && (
                <div><span className="font-medium" style={{ color: theme.textDark }}>Email:</span> {match.email}</div>
              )}
              {match.language && (
                <div><span className="font-medium" style={{ color: theme.textDark }}>Language:</span> {match.language}</div>
              )}
              {match.timezone && (
                <div><span className="font-medium" style={{ color: theme.textDark }}>Timezone:</span> {match.timezone}</div>
              )}
              {match.intro && (
                <div><span className="font-medium" style={{ color: theme.textDark }}>Intro:</span> {match.intro}</div>
              )}
              {(match.ageMin || match.ageMax) && (
                <div>
                  <span className="font-medium" style={{ color: theme.textDark }}>Age Range:</span> {match.ageMin || "?"} - {match.ageMax || "?"}
                </div>
              )}
              {match.hobbies && Array.isArray(match.hobbies) && match.hobbies.length > 0 && (
                <div>
                  <span className="font-medium" style={{ color: theme.textDark }}>Hobbies:</span> {match.hobbies.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}