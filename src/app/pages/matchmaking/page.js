"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";


const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function MatchmakingPage() {
  const router = useRouter();
  const [timezones, setTimezones] = useState([]);
  const [timezone, setTimezone] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const [languages, setLanguages] = useState([]);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTimezoneOptions, setShowTimezoneOptions] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [chatType, setChatType] = useState("");
  const [proceeding, setProceeding] = useState(false);
  const [proceeded, setProceeded] = useState(false);
  // Handle proceed to chat
  const handleProceedToChat = async () => {
    if (!auth.currentUser || !match || !match.userID) return;
    setProceeding(true);
    try {
      const res = await fetch(`${apiUrl}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userA: auth.currentUser.uid, userB: match.userID })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create match");
      setProceeded(true);
      // Redirect to inbox after a short delay
      setTimeout(() => {
        router.push("/pages/inbox");
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setProceeding(false);
    }
  };
  const timezoneOptionsRef = useRef(null);
  const languageOptionsRef = useRef(null);
  // Hide options when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        timezoneOptionsRef.current &&
        !timezoneOptionsRef.current.contains(event.target)
      ) {
        setShowTimezoneOptions(false);
      }
      if (
        languageOptionsRef.current &&
        !languageOptionsRef.current.contains(event.target)
      ) {
        setShowLanguageOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Fetch available timezones and languages from backend
  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const tzRes = await fetch(`${apiUrl}/api/available_timezones`);
        const langRes = await fetch(`${apiUrl}/api/available_languages`);
        const tzData = tzRes.ok ? await tzRes.json() : [];
        const langData = langRes.ok ? await langRes.json() : [];
        setTimezones(Array.isArray(tzData) ? tzData : []);
        setLanguages(Array.isArray(langData) ? langData : []);
      } catch {
        setTimezones([]);
        setLanguages([]);
      }
    };
    fetchAvailable();
  }, []);

  const handleMatch = async () => {
    setLoading(true);
    setError("");
    setMatch(null);
    try {
      const user = auth.currentUser;
      const params = new URLSearchParams();
      // Prompt logic: allow filtering by timezone, language, or both
      if (timezone) params.append("timezone", timezone);
      if (selectedLanguage) params.append("language", selectedLanguage);
      if (user && user.uid) params.append("excludeUserID", user.uid);

      if (!timezone && !selectedLanguage) {
        setError("Please select at least a timezone or a language to filter.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${apiUrl}/api/matchmaking?${params.toString()}`);
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
      <div className="mb-6">
        <div className="text-lg font-medium mb-1">Filter by Timezone, Country, or Both</div>
        <div className="text-gray-600 text-sm">Use the search boxes below to filter users by timezone, country, or both. You can leave one blank to filter by only one criterion.</div>
      </div>

  <div className="mb-4 relative" ref={timezoneOptionsRef}>
        <label htmlFor="timezone-search" className="block mb-1 font-medium">
          Timezone
        </label>
        <div className="flex gap-2 mb-2">
          <input
            id="timezone-search"
            type="text"
            placeholder="Search timezone..."
            className="border rounded px-3 py-2 w-full"
            value={timezoneSearch}
            onChange={(e) => setTimezoneSearch(e.target.value)}
            onFocus={() => setShowTimezoneOptions(true)}
          />
          {(timezone || timezoneSearch) && (
            <button
              type="button"
              className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => {
                setTimezone("");
                setTimezoneSearch("");
              }}
            >
              Clear
            </button>
          )}
        </div>
        {showTimezoneOptions && (
          <div className="max-h-40 overflow-y-auto border rounded bg-white w-full mt-0.5 shadow-lg">
            {timezones
              .filter((tz) => (tz.name || tz.text || tz.value).toLowerCase().includes(timezoneSearch.toLowerCase()))
              .map((tz, idx) => {
                const label = tz.name || tz.text || tz.value;
                return (
                  <div
                    key={tz.id || tz.value || tz.name || idx}
                    className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${timezone === label ? 'bg-blue-200 font-semibold' : ''}`}
                    onClick={() => {
                      setTimezone(label);
                      setShowTimezoneOptions(false);
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            {timezones.filter((tz) => (tz.name || tz.text || tz.value).toLowerCase().includes(timezoneSearch.toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-gray-400">No results</div>
            )}
          </div>
        )}
        {timezone && (
          <div className="mt-1 text-sm text-blue-700">Selected: {timezone}</div>
        )}
      </div>

  <div className="mb-4 relative" ref={languageOptionsRef}>
        <label htmlFor="language-search" className="block mb-1 font-medium">
          Language
        </label>
        <div className="flex gap-2 mb-2">
          <input
            id="language-search"
            type="text"
            placeholder="Search language..."
            className="border rounded px-3 py-2 w-full"
            value={languageSearch}
            onChange={(e) => setLanguageSearch(e.target.value)}
            onFocus={() => setShowLanguageOptions(true)}
          />
          {(selectedLanguage || languageSearch) && (
            <button
              type="button"
              className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => {
                setSelectedLanguage("");
                setLanguageSearch("");
              }}
            >
              Clear
            </button>
          )}
        </div>
        {showLanguageOptions && (
          <div className="max-h-40 overflow-y-auto border rounded bg-white w-full mt-0.5 shadow-lg">
            {languages
              .filter((lang) => (lang.name || lang.value).toLowerCase().includes(languageSearch.toLowerCase()))
              .map((lang, idx) => {
                const label = lang.name || lang.value;
                return (
                  <div
                    key={lang.id || lang.value || lang.name || idx}
                    className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${selectedLanguage === label ? 'bg-blue-200 font-semibold' : ''}`}
                    onClick={() => {
                      setSelectedLanguage(label);
                      setShowLanguageOptions(false);
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            {languages.filter((lang) => (lang.name || lang.value).toLowerCase().includes(languageSearch.toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-gray-400">No results</div>
            )}
          </div>
        )}
        {selectedLanguage && (
          <div className="mt-1 text-sm text-blue-700">Selected: {selectedLanguage}</div>
        )}
      </div>

      {!match && (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleMatch}
          disabled={loading || (!timezone && !selectedLanguage)}
        >
          {loading ? "Matching..." : "Find Match"}
        </button>
      )}

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

          {/* Chat type selection */}
          {!chatType && (
            <div className="mt-4 flex gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setChatType("one-time")}
              >
                One Time Chat
              </button>
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setChatType("long-term")}
              >
                Long Term Chat
              </button>
            </div>
          )}
          {/* Proceed to chat button */}
          {chatType && (
            <div className="mt-4">
              <div className="mb-2 text-green-700 font-medium">Selected: {chatType === "one-time" ? "One Time Chat" : "Long Term Chat"}</div>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
                onClick={handleProceedToChat}
                disabled={proceeding || proceeded}
              >
                {proceeded ? "Match Created!" : proceeding ? "Processing..." : "Proceed to chat"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
