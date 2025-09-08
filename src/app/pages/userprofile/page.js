'use client';

import React, { useEffect, useState } from "react";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

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
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [editingField, setEditingField] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [customHobby, setCustomHobby] = useState("");
    const [customLanguage, setCustomLanguage] = useState("");
    const [allLanguages, setAllLanguages] = useState([]);
    const [selectedLang, setSelectedLang] = useState("");
    const [langQuery, setQueryLang] = useState("");
    const [favorites, setFavorites] = useState("");
    const [facts, setFacts] = useState("");
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
                // setRegion(data.region || "");
                setSayings(data.sayings || []);
                setUsername(data.username || "");
                setAvatarUrl(data.avatarUrl || "");
                setFavorites(data.favorites || "");
                setFacts(data.facts || "");
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

        const user = auth.currentUser;
        if (!user) {
            setError('User not authenticated.');
            setSaving(false);
            return;
        }

        try {
            console.log("Submitting profile:", {
                userID: user.uid,
                intro,
                ageRange,
                hobbies,
                timezone,
                language,
                favorites,
                facts,
                sayings: sayings || [],
                // username,
                // avatarUrl
            });

            // const res = await fetch(`http://localhost:5000/api/profile`, {
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
                    avatarUrl
                }),
            });

            const data = await res.json();
            console.log("Response:", data);

            if (!res.ok) {
                setError(data.error || 'Failed to save profile.');
                setSaving(false);
                return;
            }

            await fetchProfile(user.uid);   // refresh data
            setSaving(false);
            // switch to view mode after successful save
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

        <div className="flex min-h-screen bg-gray-100">
            {
                sidebarOpen && (
                    <aside
                        className="flex flex-col justify-between transition-all duration-300"
                        style={{
                            backgroundColor: "#6492BD",
                            width: "13rem",
                        }}
                    >
                        {/* GlobeTalk & Toggle */}
                        <div className="flex flex-row items-start p-2 sm:gap-15 sm:p-5">
                            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                                <img
                                    src="/images/globe.png"
                                    alt="GlobeTalk Logo"
                                    className="w-5 h-5 sm:w-6 sm:h-6 object-cover"
                                />
                                <p className="text-xs sm:text-sm lg:text-base font-bold text-black">
                                    GlobeTalk
                                </p>
                            </div>

                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1 sm:p-1 rounded  text-black font-bold text-sm sm:text-base mb-2 sm:mb-0"
                            >
                                ☰
                            </button>
                        </div>

                        {/* Menu */}
                        <div className="flex flex-col justify-between h-full p-2 sm:p-3">
                            <nav className="space-y-1 sm:space-y-2">
                                <button
                                    onClick={() => router.push("/pages/dashboard")}
                                    className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base"
                                >
                                    <img
                                        src="/images/icons8-dashboard-48.png"
                                        alt="dashboard"
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                                    />
                                    Dashboard
                                </button>

                                <button
                                    // onClick={() => router.push("/pages/dashboard")}
                                    className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base"
                                >
                                    <img
                                        src="/images/letters.png"
                                        alt="Letters"
                                        className="w-5 h-5 sm:w-6 sm:h-7 rounded-full object-cover"
                                    />
                                    Letters
                                </button>
                            </nav>

                            <button
                                onClick={() => router.push("/")}
                                className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base mt-2 sm:mt-4"
                            >
                                <img
                                    src="/images/logout.png"
                                    alt="Logout"
                                    className="w-5 h-5 sm:w-6 sm:h-6 object-cover"
                                />
                                Logout
                            </button>
                        </div>
                    </aside>
                )
            }

            <main className=" w-screen flex flex-col items-center justify-center min-h-screen py-8 px-4">
                <button
                    className="w-48 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition mt-2 self-end-safe"
                    onClick={() => router.push('/pages/editprofile')}
                >
                    EditProfile
                </button>
                {/* Avatar */}

                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute top-2 sm:top-4 left-2 sm:left-4 p-1 sm:p-2 rounded  hover:bg-gray-300 text-black font-bold text-sm sm:text-base z-50"
                    >
                        ☰
                    </button>
                )}
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full mb-8">

                    {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No Avatar</span>
                    )}

                </div>
                {/* Username + Age + Region */}
                <h1 className="text-2xl font-bold mb-2">{username}</h1>
                {/* Age Range */}
                <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                    {readOnly ? (
                        <div className="w-full border border-gray-200 rounded px-3 py-4 mb-3 text-left">{ageRange || 'Not set'}</div>
                    ) : (
                        <select
                            className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                            value={ageRange}
                            onChange={(e) => setAgeRange(e.target.value)}
                        >
                            <option value="">Select age range</option>
                            {ageRanges.map((range, i) => (
                                <option key={i} value={range}>
                                    {range}
                                </option>
                            ))}
                        </select>
                    )}
                </section>

                {/* Timezone */}
                <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                    {readOnly ? (
                        <div className="w-full border border-gray-200 rounded px-3 py-4">{timezone || 'Not set'}</div>
                    ) : (
                        <select
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                        >
                            <option value="">Select region/timezone</option>
                            {Array.isArray(timezones) && timezones.map((tz, i) => (
                                <option key={`${tz.value}-${i}`} value={tz.value}>
                                    {tz.text}
                                </option>
                            ))}
                        </select>
                    )}

                </section>


                <div className="flex space-x-6 border-b w-full max-w-sm justify-center mb-6">
                    <button
                        onClick={() => setActiveTab("about")}
                        className={`px-3 py-1 text-sm font-medium ${activeTab === "about"
                            ? "text-black border-b-2 border-blue-400"
                            : "text-gray-600 hover:text-black"
                            }`}
                    >
                        About
                    </button>

                    <button
                        onClick={() => setActiveTab("cultural")}
                        className={`px-3 py-1 text-sm font-medium ${activeTab === "cultural"
                            ? "text-black border-b-2 border-blue-400"
                            : "text-gray-600 hover:text-black"
                            }`}
                    >
                        Cultural & Facts
                    </button>
                </div>
                {activeTab === "about" && (
                    <>
                        {/* About Me */}
                        <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                            <h2 className="text-md font-semibold mb-2">About Me</h2>
                            {readOnly ? (
                                <div className="w-full border border-gray-200 rounded-md p-4 bg-white text-left">{intro || 'No bio yet.'}</div>
                            ) : (
                                <textarea
                                    placeholder="Write something about yourself..."
                                    className="w-full border border-gray-300 rounded-md p-4 bg-gray-50"
                                    value={intro}
                                    onChange={(e) => setIntro(e.target.value)}
                                />
                            )}
                        </section>
                        {/* Interests & Hobbies */}
                        <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                            <h2 className="text-md font-semibold mb-3">Interests & Hobbies</h2>

                            {/* Selected hobbies as chips */}
                            <div className="flex flex-wrap justify-center gap-3 mb-3">
                                {hobbies.map((hobby, i) => (
                                    <span
                                        key={i}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-blue-100 shadow-sm"
                                    >
                                        {hobby}
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                onClick={() => setHobbies(hobbies.filter((h) => h !== hobby))}
                                                className="text-red-500 hover:text-red-700 font-bold"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </span>
                                ))}
                            </div>

                            {/* Dropdown of predefined hobbies */}
                            <select
                                className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                                onChange={(e) => {
                                    const hobby = e.target.value;
                                    if (hobby && !hobbies.includes(hobby)) {
                                        setHobbies([...hobbies, hobby]);
                                    }
                                    e.target.value = ""; // reset dropdown
                                }}
                            >
                                <option value="">Select a hobby</option>
                                {allHobbies.map((hobby, i) => (
                                    <option key={i} value={hobby}>
                                        {hobby}
                                    </option>
                                ))}
                            </select>

                            {/* Add custom hobby */}
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
                                        setCustomHobby(""); // clear input
                                    }
                                }}
                                placeholder="Or type your own and press Enter"
                                className="w-full border border-gray-400 rounded-md p-2 text-sm"
                            />
                        </section>



                        {/* Language Preference */}
                        <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                            <h2 className="text-md font-semibold mb-3">Language Preference</h2>

                            {/* Selected languages as chips */}
                            <div className="flex flex-wrap justify-center gap-3 mb-3">
                                {language.map((lang, i) => (
                                    <span
                                        key={i}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-green-100 shadow-sm"
                                    >
                                        {lang}
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                onClick={() => removeLanguage(lang)}
                                                className="text-red-500 hover:text-red-700 font-bold"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </span>
                                ))}
                            </div>

                            {/* Dropdown of predefined languages */}
                            <select
                                className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                                value={selectedLang}
                                onChange={handleSelectedLang}
                            >
                                <option value="">Select a language</option>
                                {filteredLangs.map((lang, i) => (
                                    <option key={i} value={lang}>
                                        {lang}
                                    </option>
                                ))}
                            </select>

                            {/* Add custom language */}
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
                                        setCustomLanguage(""); // clear input
                                    }
                                }}
                                placeholder="Or type your own and press Enter"
                                className="w-full border border-gray-400 rounded-md p-2 text-sm"
                            />
                        </section>

                    </>
                )
                }

                {
                    activeTab === "cultural" && (
                        <>
                            {/* Favorites */}

                            <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                                <h2 className="text-md font-semibold mb-2">Favorites</h2>
                                {readOnly ? (
                                    <div className="w-full border border-gray-200 rounded-md p-4 text-left">{favorites || '—'}</div>
                                ) : (
                                    <textarea
                                        placeholder="Write something about yourself..."
                                        className="w-full border border-gray-300 rounded-md p-4 bg-gray-50"
                                        value={favorites}
                                        onChange={(e) => setFavorites(e.target.value)}
                                    />
                                )}
                            </section>


                            {/* Facts */}

                            <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                                <h2 className="text-md font-semibold mb-2">Facts</h2>
                                {readOnly ? (
                                    <div className="w-full border border-gray-200 rounded-md p-4 text-left">{facts || '—'}</div>
                                ) : (
                                    <textarea
                                        placeholder="Write something about yourself..."
                                        className="w-full border border-gray-300 rounded-md p-4 bg-gray-50"
                                        value={facts}
                                        onChange={(e) => setFacts(e.target.value)}
                                    />
                                )}
                            </section>

                            {/* Common Sayings */}

                            <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                                <h2 className="text-md font-semibold mb-2">Common Sayings</h2>
                                {readOnly ? (
                                    <div className="w-full border border-gray-200 rounded-md p-4 text-left">{sayings && sayings.length ? sayings.join(', ') : '—'}</div>
                                ) : (
                                    <textarea
                                        placeholder="Write something about yourself..."
                                        className="w-full border border-gray-300 rounded-md p-4 bg-gray-50"
                                        value={sayings}
                                        onChange={(e) => setSayings(e.target.value)}
                                    />
                                )}
                            </section>

                        </>

                    )
                }

                {/* Save button */}
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={(e) => handleSubmitSave(e)}
                        className="bg-blue-500 text-white px-6 py-2 rounded"
                    >
                        Save Changes
                    </button>
                </div>
            </main >
        </div >
    );
}
