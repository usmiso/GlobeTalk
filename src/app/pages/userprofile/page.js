'use client';

import React, { useEffect, useState } from "react";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Dashboard from "../dashboard/page";
import Link from "next/link";
import Navbar from '@/app/components/Navbar';

// API base - prefer NEXT_PUBLIC_API_URL, fallback to localhost:5000 for dev
const API = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5000';

export default function UserProfile() {

    const router = useRouter();
    const [activeTab, setActiveTab] = useState("about");
    const [intro, setIntro] = useState("");
    const [ageRange, setAgeRange] = useState("");
    const [hobbies, setHobbies] = useState([]);
    const [timezones, setTimezones] = useState([]);
    const [timezone, setTimezone] = useState("");
    const [language, setLanguage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [customHobby, setCustomHobby] = useState("");
    const [customLanguage, setCustomLanguage] = useState("");
    const [allLanguages, setAllLanguages] = useState([]);
    const [selectedLang, setSelectedLang] = useState("");
    const [langQuery, setQueryLang] = useState("");
    const [favorites, setFavorites] = useState("");
    const [facts, setFacts] = useState("");
    const [country, setCountry] = useState("");
    const [sayings, setSayings] = useState("");


    const ageRanges = [
        "Under 18",
        "18 - 24",
        "25 - 34",
        "35 - 44",
        "45 - 54",
        "55 - 64",
        "65+",
    ];

    const allHobbies = [
        "Cooking",
        "Hiking",
        "Afrobeats",
        "Reading",
        "Traveling",
        "Gardening",
        "Photography",
        "Cycling",
        "Painting",
        "Gaming",
        "Dancing",
        "Writing",
        "Fishing",
        "Yoga",
        "Running",
        "Swimming",
        "Knitting",
        "Singing",
        "Volunteering",
        "Crafting"
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setTimeout(() => fetchProfile(user.uid), 500);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);


    const fetchProfile = async (uid) => {

        try {
            const apiUrl = API;
            const res = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
            // const res = await fetch(`http://localhost:5000/api/profile?userID=${uid}`);
            // console.log("Fetched language:", data.language);

            if (res.ok) {
                const data = await res.json();
                setIntro(data.intro || "");
                setAgeRange(data.ageRange || "");
                setHobbies(Array.isArray(data.hobbies) ? data.hobbies : []);
                setTimezone(data.timezone || "");
                if (Array.isArray(data.language)) {
                    setLanguage(data.language);
                } else if (typeof data.language === "string" && data.language.trim() !== "") {
                    setLanguage([data.language]);
                } else {
                    setLanguage([]);
                }
                setTimezone(data.timezone || "");
                setSayings(data.sayings || []);
                setUsername(data.username || "");
                setAvatarUrl(data.avatarUrl || "");
                setFavorites(data.favorites || "");
                setFacts(data.facts || "");
                setCountry(data.country || "");
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }

        setLoading(false);
    };

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const res = await fetch("https://restcountries.com/v3.1/all?fields=languages");
                if (!res.ok) throw new Error("Failed to fetch languages");
                const countries = await res.json();
                const langs = new Set();
                countries.forEach((c) => {
                    if (c.languages) {
                        Object.values(c.languages).forEach((lang) => langs.add(lang));
                    }
                });

                setAllLanguages(Array.from(langs)); // store in state
            } catch (err) {
                console.error("Error fetching languages:", err);
            }
        };

        fetchLanguages();
    }, []);

    useEffect(() => {
        const fetchTimezones = async () => {
            try {
                const res = await fetch("/assets/timezones.json");
                if (!res.ok) throw new Error("Failed to fetch timezones");
                const data = await res.json();

                const validZones = Array.isArray(data)
                    ? data.filter(tz => tz && tz.value && tz.text)
                    : [];

                console.log("✅ Loaded timezones:", validZones);
                setTimezones(validZones);
            } catch (err) {
                console.error("Error fetching timezones:", err);
                setTimezones([]);
            }
        };

        fetchTimezones();
    }, []);


    // Handle dropdown change
    const handleSelectedLang = (e) => {
        const lang = e.target.value;
        if (lang && !language.includes(lang)) {
            setLanguage([...language, lang]);
        }
        setSelectedLang("");
    };

    // Remove a chip
    const removeLanguage = (lang) => {
        setLanguage(language.filter((l) => l !== lang));
    };

    const filteredLangs =
        langQuery === ""
            ? allLanguages
            : allLanguages.filter((lang) =>
                lang.toLowerCase().includes(langQuery.toLowerCase())
            );


    // Generate random username
    const generateUsername = async () => {
        try {
            const res = await fetch("https://randomuser.me/api/");
            if (!res.ok) return;
            const data = await res.json();
            if (data.results?.[0]?.login?.username) {
                setUsername(data.results[0].login.username);
            }
        } catch (err) {
            console.error("Error generating username:", err);
        }
    };

    // Generate random avatar (Dicebear)
    const generateAvatar = () => {
        const randomSeed = Math.random().toString(36).substring(2, 10);
        const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}`;
        setAvatarUrl(avatarUrl);
    };


    const handleSubmitSave = async (e) => {
        console.log("🔥 Save button clicked");   // debug
        if (e) e.preventDefault();
        setError('');
        setSaving(true);
    setSaveSuccess(false);

        const user = auth.currentUser;
        if (!user) {
            setError('User not authenticated.');
            setSaving(false);
            return;
        }

        try {
            // ...existing code...
            const tzObj = timezones.find(tz => tz.timezone_id === timezone);
            let countryToSave = country;
            if (!countryToSave) {
                const tzObjInner = timezones.find(tz => tz.timezone_id === timezone);
                const safeCountryMap = (typeof countryMap !== 'undefined' && countryMap) ? countryMap : undefined;
                if (tzObjInner && tzObjInner.country_code && safeCountryMap && safeCountryMap[tzObjInner.country_code]) {
                    countryToSave = safeCountryMap[tzObjInner.country_code];
                }
            }
            const res = await fetch(`${API}/api/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userID: user.uid,
                    intro,
                    ageRange,
                    hobbies,
                    timezone,
                    language,
                    favorites: favorites || "",
                    facts,
                    sayings: sayings || [],
                    username,
                    avatarUrl,
                    country: countryToSave,
                    countryCode: tzObj?.country_code || ''
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to save profile.');
                setSaving(false);
                return;
            }
            await fetchProfile(user.uid);
            setSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 1500);
            setReadOnly(true);
        } catch (err) {
            console.error("Save failed:", err);
            setError('Failed to connect to server.');
            setSaving(false);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    return (


        <div className="flex min-h-screen">


            <main className="flex flex-col items-center w-full min-h-screen px-">
                <Navbar />
                {/* Profile Card */}
                <div className="bg-white w-full flex flex-col gap-4 rounded-xl border border-gray-100
                max-w-3xl mx-auto p-10 shadow-2xl mt-8 transition-all duration-300 hover:shadow-blue-200 z-10 relative">

                    {/* Avatar */}
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden mb-4">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center h-full text-gray-400 text-sm">
                                    No Avatar
                                </span>
                            )}
                        </div>

                        {/* Display Name */}
                        <h1 className="text-2xl font-bold mb-2">{username}</h1>
                        <p className="text-sm text-gray-500">{timezone || "No location set"}</p>
                    </div>



                    {/* Bio */}
                    <section>
                        <h2 className="text-md font-semibold mb-2">Bio</h2>
                        <textarea
                            placeholder="Write something about yourself..."
                            value={intro}
                            onChange={(e) => setIntro(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                        />
                    </section>

                    {/* Age Range */}
                    <section>
                        <h2 className="text-md font-semibold mb-2">Age Range</h2>
                        <select
                            value={ageRange}
                            onChange={(e) => setAgeRange(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Select age range</option>
                            {ageRanges.map((range, i) => (
                                <option key={i} value={range}>
                                    {range}
                                </option>
                            ))}
                        </select>
                    </section>

                    {/* Languages */}
                    <section>
                        <h2 className="text-md font-semibold mb-2">Languages</h2>

                        {/* Chips */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {language.map((lang, i) => (
                                <span
                                    key={i}
                                    className="flex items-center gap-2 px-3 bg-green-100 border
                                 rounded-md  
                                text-sm  border-gray-300 font-medium 
                      duration-200 hover:bg-green-100 hover:border-green-300 hover:text-green-700 cursor-pointer
                     py-2 
             transition-transform transform hover:scale-105 hover:shadow-md"
                                >
                                    {lang}
                                    <button
                                        type="button"
                                        onClick={() => removeLanguage(lang)}
                                        className="text-gray-500 hover:text-red-600"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Dropdown */}
                        <select
                            value={selectedLang}
                            onChange={handleSelectedLang}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
                        >
                            <option value="">Select a language</option>
                            {filteredLangs.map((lang, i) => (
                                <option key={i} value={lang}>
                                    {lang}
                                </option>
                            ))}
                        </select>

                        {/* Custom input */}
                        <input
                            type="text"
                            value={customLanguage}
                            onChange={(e) => setCustomLanguage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const lang = customLanguage.trim();
                                    if (lang && !language.includes(lang)) {
                                        setLanguage([...language, lang]);
                                    }
                                    setCustomLanguage("");
                                }
                            }}
                            placeholder="Or type your own and press Enter"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </section>

                    {/* Interests & Hobbies */}
                    <section>
                        <h2 className="text-md font-semibold mb-2">Interests & Hobbies</h2>

                        {/* Chips */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {hobbies.map((hobby, i) => (
                                <span
                                    key={i}
                                    className="flex items-center gap-2 rounded-md bg-blue-100 border
                                    px-3 text-sm  border-gray-300 font-medium 
                      duration-200 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 cursor-pointer
                     py-2 
             transition-transform transform hover:scale-105 hover:shadow-md"
                                >
                                    {hobby}
                                    <button
                                        type="button"
                                        onClick={() => setHobbies(hobbies.filter((h) => h !== hobby))}
                                        className="text-gray-500 hover:text-red-600"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Dropdown */}
                        <select
                            onChange={(e) => {
                                const hobby = e.target.value;
                                if (hobby && !hobbies.includes(hobby)) {
                                    setHobbies([...hobbies, hobby]);
                                }
                                e.target.value = "";
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
                        >
                            <option value="">Select a hobby</option>
                            {allHobbies.map((hobby, i) => (
                                <option key={i} value={hobby}>
                                    {hobby}
                                </option>
                            ))}
                        </select>

                        {/* Custom input */}
                        <input
                            type="text"
                            value={customHobby}
                            onChange={(e) => setCustomHobby(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const hobby = customHobby.trim();
                                    if (hobby && !hobbies.includes(hobby)) {
                                        setHobbies([...hobbies, hobby]);
                                    }
                                    setCustomHobby("");
                                }
                            }}
                            placeholder="Or type your own and press Enter"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </section>

                    {/* Favorites */}
                    <section>
                        <h2 className="text-md font-semibold mb-2">Favorites</h2>
                        <textarea
                            placeholder="List your favorites..."
                            value={favorites}
                            onChange={(e) => setFavorites(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                        />
                    </section>

                    {/* Facts */}
                    <section>
                        <h2 className="text-md font-semibold mb-2">Facts</h2>
                        <textarea
                            placeholder="Fun facts about your country or region..."
                            value={facts}
                            onChange={(e) => setFacts(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                        />
                    </section>

                    {/* Common Sayings */}
                    <section>
                        <h2 className="text-md font-semibold mb-2">Common Sayings</h2>
                        <textarea
                            placeholder="Any favourite catchphrases?"
                            value={sayings}
                            onChange={(e) => setSayings(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                        />
                    </section>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSubmitSave}
                            className={`bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md h-12 border border-gray-200 flex flex-col justify-center items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200 relative ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={saving}
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : saveSuccess ? (
                                <span className="flex items-center gap-2 text-green-200">
                                    <svg className="h-5 w-5 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Saved!
                                </span>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </div>
            </main>

        </div >
    );
}