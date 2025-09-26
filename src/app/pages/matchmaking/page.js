"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import Sidebar from '../../components/Sidebar';
import Navbar from "@/app/components/Navbar";

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

  // SVG icons
  const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
  );
  const UserIcon = () => (
    <svg className="w-6 h-6 text-blue-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 8-4 8-4s8 0 8 4" /></svg>
  );
  const LanguageIcon = () => (
    <svg className="w-6 h-6 text-green-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l-1.414-1.414M6.05 6.05L4.636 7.464" /></svg>
  );
  const TimezoneIcon = () => (
    <svg className="w-6 h-6 text-purple-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
  );
  const ChatIcon = () => (
    <svg className="w-5 h-5 text-white inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-100 py-2 px-4 relative overflow-x-hidden">
      {/* Decorative background images */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="flex justify-end items-end h-full w-full">
          <img src="/images/globe.png" alt="Globe" className="w-[420px] opacity-10 mr-8 mb-8 select-none hidden md:block" />
        </div>
        <div className="flex justify-start items-end h-full w-full absolute top-0 left-0">
          <img src="/images/nations.png" alt="Nations" className="w-[1000px] h-[655px] opacity-10 select-none hidden md:block" />
        </div>
      </div>
      <Navbar />
      <div className="max-w-3xl mx-auto p-12 bg-white rounded-3xl shadow-2xl mt-10 border border-blue-200 transition-all duration-300 hover:shadow-blue-200 z-10 relative">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img src="/images/LogoVPP-1.png" alt="Logo" className="w-14 h-14 rounded-full border-2 border-blue-200 shadow" />
          <h1 className="text-4xl font-extrabold text-blue-700 drop-shadow-lg tracking-tight flex items-center gap-2">
            <span role="img" aria-label="globe">🌍</span> Find a Match
          </h1>
        </div>
        <div className="mb-4 text-center">
          <div className="text-lg font-semibold flex items-center justify-center gap-2">
            <TimezoneIcon /> <LanguageIcon /> Filter by Timezone, Country, or Both
          </div>
          <div className="text-gray-600 text-sm">Use the search boxes below to filter users by timezone, country, or both. You can leave one blank to filter by only one criterion.</div>
        </div>

        {/* Timezone filter */}
  <div className="mb-3 relative" ref={timezoneOptionsRef}>
          <label htmlFor="timezone-search" className="mb-1 font-medium flex items-center gap-1">
            <TimezoneIcon /> Timezone
          </label>
          <div className="flex gap-2 mb-2 relative">
            <span className="absolute left-3 top-2.5"><SearchIcon /></span>
            <input
              id="timezone-search"
              type="text"
              placeholder="Search timezone..."
              className="border border-blue-200 rounded-lg px-9 py-2 w-full focus:ring-2 focus:ring-blue-400 transition-all"
              value={timezoneSearch}
              onChange={(e) => setTimezoneSearch(e.target.value)}
              onFocus={() => setShowTimezoneOptions(true)}
            />
            {(timezone || timezoneSearch) && (
              <button
                type="button"
                className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-blue-100 shadow border border-blue-200"
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
            <div className="max-h-40 overflow-y-auto border border-blue-200 rounded-lg bg-white w-full mt-0.5 shadow-xl animate-fade-in">
              {timezones
                .filter((tz) => (tz.name || tz.text || tz.value).toLowerCase().includes(timezoneSearch.toLowerCase()))
                .map((tz, idx) => {
                  const label = tz.name || tz.text || tz.value;
                  return (
                    <div
                      key={tz.id || tz.value || tz.name || idx}
                      className={`px-3 py-2 cursor-pointer hover:bg-blue-100 transition-all ${timezone === label ? 'bg-blue-200 font-semibold' : ''}`}
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
            <div className="mt-1 text-sm text-blue-700 flex items-center gap-1"><TimezoneIcon /> Selected: {timezone}</div>
          )}
        </div>

        {/* Language filter */}
  <div className="mb-3 relative" ref={languageOptionsRef}>
          <label htmlFor="language-search" className="mb-1 font-medium flex items-center gap-1">
            <LanguageIcon /> Language
          </label>
          <div className="flex gap-2 mb-2 relative">
            <span className="absolute left-3 top-2.5"><SearchIcon /></span>
            <input
              id="language-search"
              type="text"
              placeholder="Search language..."
              className="border border-blue-200 rounded-lg px-9 py-2 w-full focus:ring-2 focus:ring-blue-400 transition-all"
              value={languageSearch}
              onChange={(e) => setLanguageSearch(e.target.value)}
              onFocus={() => setShowLanguageOptions(true)}
            />
            {(selectedLanguage || languageSearch) && (
              <button
                type="button"
                className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-blue-100 shadow border border-blue-200"
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
            <div className="max-h-40 overflow-y-auto border border-blue-200 rounded-lg bg-white w-full mt-0.5 shadow-xl animate-fade-in">
              {languages
                .filter((lang) => (lang.name || lang.value).toLowerCase().includes(languageSearch.toLowerCase()))
                .map((lang, idx) => {
                  const label = lang.name || lang.value;
                  return (
                    <div
                      key={lang.id || lang.value || lang.name || idx}
                      className={`px-3 py-2 cursor-pointer hover:bg-blue-100 transition-all ${selectedLanguage === label ? 'bg-blue-200 font-semibold' : ''}`}
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
            <div className="mt-1 text-sm text-blue-700 flex items-center gap-1"><LanguageIcon /> Selected: {selectedLanguage}</div>
          )}
        </div>

        {/* Find Match button */}
  <div className="mb-2" />
  {!match && (
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 hover:bg-blue-700 transition-all duration-200 font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleMatch}
            disabled={loading || (!timezone && !selectedLanguage)}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                Matching...
              </>
            ) : (
              <>
                <UserIcon /> Find Match
              </>
            )}
          </button>
        )}

        {/* Error message */}
  {error && <div className="text-red-600 mt-2 text-center animate-shake">{error}</div>}

        {/* Matched user card */}
        {match && (
          <div className="mt-6 p-6 border-2 border-blue-200 rounded-2xl bg-white shadow-xl animate-fade-in">
            <h2 className="font-bold mb-3 text-xl text-blue-700 flex items-center gap-2"><UserIcon />Matched User</h2>
            {match.username || match.avatar || match.name || match.email || match.language || match.timezone ? (
              <div className="space-y-2">
                {(match.avatarURL || match.avatar) && (
                  <div className="flex flex-col items-center">
                    <span className="font-medium">Avatar:</span><br />
                    <img src={match.avatarURL ? match.avatarURL : match.avatar} alt="avatar" className="w-20 h-20 rounded-full border-4 border-blue-200 shadow-lg" />
                  </div>
                )}
                {match.username && (
                  <div><span className="font-medium">Username:</span> <span className="text-blue-700">{match.username}</span></div>
                )}
                {match.name && (
                  <div><span className="font-medium">Name:</span> {match.name}</div>
                )}
                {match.email && (
                  <div><span className="font-medium">Email:</span> {match.email}</div>
                )}
                {match.language && (
                  <div><span className="font-medium">Language:</span> <span className="text-green-700">{match.language}</span></div>
                )}
                {match.timezone && (
                  <div><span className="font-medium">Timezone:</span> <span className="text-purple-700">{match.timezone}</span></div>
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
              <div className="mt-6 flex gap-4 justify-center">
                <button
                  className="px-6 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 hover:scale-105 transition-all font-semibold shadow border border-blue-200"
                  onClick={() => setChatType("one-time")}
                >
                  <ChatIcon /> One Time Chat
                </button>
                <button
                  className="px-6 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 hover:scale-105 transition-all font-semibold shadow border border-blue-200"
                  onClick={() => setChatType("long-term")}
                >
                  <ChatIcon /> Long Term Chat
                </button>
              </div>
            )}
            {/* Proceed to chat button */}
            {chatType && (
              <div className="mt-6 text-center">
                <div className="mb-2 text-blue-700 font-medium animate-fade-in">Selected: {chatType === "one-time" ? "One Time Chat" : "Long Term Chat"}</div>
                <button
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 hover:bg-blue-700 transition-all duration-200 font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleProceedToChat}
                  disabled={proceeding || proceeded}
                >
                  {proceeded ? (
                    <>
                      <svg className="w-5 h-5 text-white mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                      Match Created!
                    </>
                  ) : proceeding ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ChatIcon /> Proceed to chat
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(.4,0,.2,1) both; }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s; }
      `}</style>
    </div>
  );
}
