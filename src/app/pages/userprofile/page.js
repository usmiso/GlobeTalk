'use client';

import React, { useEffect, useState, useRef } from "react";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";


import LANGUAGES_LIST from '../../../../public/assets/languages.js';
import AvatarUsernameGen from '../../components/avatar/page';

export default function UserProfile() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("about");
    const [intro, setIntro] = useState("");
    const [ageRange, setAgeRange] = useState("");
    const [hobbies, setHobbies] = useState([]);
    const [timezone, setTimezone] = useState("");
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [editMode, setEditMode] = useState({
        avatar: false,
        intro: false,
        ageRange: false,
        hobbies: false,
        language: false,
        favorites: false,
        facts: false,
        sayings: false
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [favorites, setFavorites] = useState("");
    const [facts, setFacts] = useState("");
    const [sayings, setSayings] = useState([]);
    const [customSayings, setCustomSayings] = useState("");
    const [languageInput, setLanguageInput] = useState("");
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const languageRef = useRef(null);
    const ageRanges = [
        'Under 18',
        '18 - 24',
        '25 - 34',
        '35 - 44',
        '45 - 54',
        '55 - 64',
        '65+',
    ];
    const languageOptions = Object.entries(LANGUAGES_LIST).map(([code, lang]) => ({
        code,
        name: lang.name,
        nativeName: lang.nativeName,
    }));


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchProfile(user.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchProfile = async (uid) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
            if (res.ok) {
                const data = await res.json();
                setIntro(data.intro || "");
                setAgeRange(data.ageRange || "");
                setHobbies(Array.isArray(data.hobbies) ? data.hobbies : []);
                setTimezone(data.timezone || "");
                setLanguages(Array.isArray(data.languages) ? data.languages : []);
                setUsername(data.username || "");
                setAvatarUrl(data.avatarUrl || "");
                setFavorites(data.favorites || "");
                setFacts(data.facts || "");
                setSayings(Array.isArray(data.sayings) ? data.sayings : []);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
        setLoading(false);
    };

    // Save handler for individual fields
    const handleSaveField = async (field) => {
        setSaving(true);
        setError("");
        const user = auth.currentUser;
        if (!user) {
            setError("User not authenticated.");
            setSaving(false);
            return;
        }
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            let body = { userID: user.uid };
            if (field === 'intro') body.intro = intro;
            if (field === 'ageRange') body.ageRange = ageRange;
            if (field === 'hobbies') body.hobbies = hobbies;
            if (field === 'language') body.languages = languages;
            if (field === 'favorites') body.favorites = favorites;
            if (field === 'facts') body.facts = facts;
            if (field === 'sayings') body.sayings = Array.isArray(sayings) ? sayings : [];
            if (field === 'avatar') { body.avatarUrl = avatarUrl; body.username = username; }
            // Always include timezone for now (or fetch from state if needed)
            body.timezone = timezone;
            const res = await fetch(`${apiUrl}/api/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to save profile.");
                setSaving(false);
                return;
            }
            await fetchProfile(user.uid);
            setEditMode((prev) => ({ ...prev, [field]: false }));
        } catch (err) {
            setError("Failed to connect to server.");
        }
        setSaving(false);
    };

    // Avatar edit handler
    const handleAvatarEdit = () => setEditMode((prev) => ({ ...prev, avatar: true }));
    const handleAvatarSave = (newAvatarUrl, newUsername) => {
        setAvatarUrl(newAvatarUrl);
        setUsername(newUsername);
        setEditMode((prev) => ({ ...prev, avatar: false }));
        // Optionally, save avatar/username to backend here
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    return (
        <main className="w-screen flex flex-col items-center justify-center min-h-screen py-8 px-4">
            {/* Avatar + Username */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full mb-4 relative flex items-center justify-center">
                {editMode.avatar ? (
                    <div className="absolute inset-0 z-10 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-full">
                        <AvatarUsernameGen onSuccess={(url, name) => handleAvatarSave(url, name)} />
                        <button className="mt-2 text-sm text-gray-500 underline" onClick={() => setEditMode((prev) => ({ ...prev, avatar: false }))}>Cancel</button>
                    </div>
                ) : (
                    <>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-400 text-sm flex items-center justify-center h-full">No Avatar</span>
                        )}
                        <button className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full px-3 py-1 text-xs" onClick={handleAvatarEdit}>Edit</button>
                    </>
                )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{username}</h1>
            <p className="text-gray-700 text-base">{ageRange}</p>
            <p className="text-gray-500 text-sm mb-4">{timezone}</p>
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
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {/* About Tab */}
            {activeTab === "about" && (
                <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                    {/* Intro */}
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-md font-semibold">About Me</h2>
                        <button className="text-blue-500 text-xs underline" onClick={() => setEditMode((prev) => ({ ...prev, intro: !prev.intro }))}>{editMode.intro ? 'Cancel' : 'Edit'}</button>
                    </div>
                    {editMode.intro ? (
                        <>
                            <textarea className="w-full border rounded px-3 py-2 mb-2" value={intro} onChange={e => setIntro(e.target.value)} rows={2} />
                            <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={() => handleSaveField('intro')} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        </>
                    ) : (
                        <p className="text-gray-700 text-sm mb-2">{intro}</p>
                    )}
                    {/* Age Range */}
                    <div className="flex justify-between items-center mb-2 mt-4">
                        <h2 className="text-md font-semibold">Age Range</h2>
                        <button className="text-blue-500 text-xs underline" onClick={() => setEditMode((prev) => ({ ...prev, ageRange: !prev.ageRange }))}>{editMode.ageRange ? 'Cancel' : 'Edit'}</button>
                    </div>
                    {editMode.ageRange ? (
                        <>
                            <select className="w-full border rounded px-3 py-2 mb-2" value={ageRange} onChange={e => setAgeRange(e.target.value)}>
                                <option value="">Select age range</option>
                                {ageRanges.map(range => (
                                    <option key={range} value={range}>{range}</option>
                                ))}
                            </select>
                            <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={() => handleSaveField('ageRange')} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        </>
                    ) : (
                        <p className="text-gray-700 text-sm mb-2">{ageRange}</p>
                    )}
                    {/* Hobbies */}
                    <div className="flex justify-between items-center mb-2 mt-4">
                        <h2 className="text-md font-semibold">Hobbies</h2>
                        <button className="text-blue-500 text-xs underline" onClick={() => setEditMode((prev) => ({ ...prev, hobbies: !prev.hobbies }))}>{editMode.hobbies ? 'Cancel' : 'Edit'}</button>
                    </div>
                    {editMode.hobbies ? (
                        <>
                            <input className="w-full border rounded px-3 py-2 mb-2" type="text" value={hobbies.join(', ')} onChange={e => setHobbies(e.target.value.split(',').map(h => h.trim()).filter(Boolean))} placeholder="Comma separated hobbies" />
                            <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={() => handleSaveField('hobbies')} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        </>
                    ) : (
                        <div className="flex flex-wrap gap-3 justify-center mb-2">
                            {hobbies.length > 0 ? (
                                hobbies.map((hobby, i) => (
                                    <span key={i} className="px-4 py-1.5 text-sm border rounded-lg bg-gray-50 shadow-sm">{hobby}</span>
                                ))
                            ) : (
                                <span className="text-gray-400 text-sm">No hobbies added yet.</span>
                            )}
                        </div>
                    )}
                    {/* Language */}
                    <div className="flex justify-between items-center mb-2 mt-4">
                        <h2 className="text-md font-semibold">Language preference</h2>
                        <button className="text-blue-500 text-xs underline" onClick={() => setEditMode((prev) => ({ ...prev, language: !prev.language }))}>{editMode.language ? 'Cancel' : 'Edit'}</button>
                    </div>
                    {editMode.language ? (
                        <div className="relative" ref={languageRef}>
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2"
                                placeholder="Select or type language"
                                value={languageInput}
                                onChange={e => {
                                    setLanguageInput(e.target.value);
                                    setShowLanguageDropdown(true);
                                }}
                                onFocus={() => setShowLanguageDropdown(true)}
                            />
                            {showLanguageDropdown && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow max-h-40 overflow-y-auto">
                                    {languageOptions.filter(lang =>
                                        lang.name.toLowerCase().includes((languageInput || '').toLowerCase()) ||
                                        (lang.nativeName && lang.nativeName.toLowerCase().includes((languageInput || '').toLowerCase()))
                                    ).length === 0 && (
                                        <li className="px-4 py-2 text-gray-400">No languages found</li>
                                    )}
                                    {languageOptions.filter(lang =>
                                        lang.name.toLowerCase().includes((languageInput || '').toLowerCase()) ||
                                        (lang.nativeName && lang.nativeName.toLowerCase().includes((languageInput || '').toLowerCase()))
                                    ).map(lang => (
                                        <li
                                            key={lang.code}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onMouseDown={() => {
                                                setLanguages([lang.name]);
                                                setLanguageInput(lang.name);
                                                setShowLanguageDropdown(false);
                                            }}
                                        >
                                            {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ''}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button className="bg-blue-500 text-white px-4 py-1 rounded mt-2" onClick={() => handleSaveField('language')} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3 justify-center mb-2">
                            {languages.length > 0 ? (
                                languages.map((lang, i) => (
                                    <span key={i} className="px-4 py-1.5 text-sm border rounded-lg bg-gray-50 shadow-sm">{lang}</span>
                                ))
                            ) : (
                                <span className="text-gray-400 text-sm">No Languages yet</span>
                            )}
                        </div>
                    )}
                </section>
            )}
            {/* Cultural & Facts Tab */}
            {activeTab === "cultural" && (
                <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
                    {/* Favorites */}
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-md font-semibold">Favorites</h2>
                        <button className="text-blue-500 text-xs underline" onClick={() => setEditMode((prev) => ({ ...prev, favorites: !prev.favorites }))}>{editMode.favorites ? 'Cancel' : 'Edit'}</button>
                    </div>
                    {editMode.favorites ? (
                        <>
                            <textarea className="w-full border rounded px-3 py-2 mb-2" value={favorites} onChange={e => setFavorites(e.target.value)} rows={2} />
                            <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={() => handleSaveField('favorites')} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        </>
                    ) : (
                        <p className="text-gray-700 text-sm mb-2">{favorites || 'No favorite foods/music/sports yet'}</p>
                    )}
                    {/* Facts */}
                    <div className="flex justify-between items-center mb-2 mt-4">
                        <h2 className="text-md font-semibold">Facts!</h2>
                        <button className="text-blue-500 text-xs underline" onClick={() => setEditMode((prev) => ({ ...prev, facts: !prev.facts }))}>{editMode.facts ? 'Cancel' : 'Edit'}</button>
                    </div>
                    {editMode.facts ? (
                        <>
                            <textarea className="w-full border rounded px-3 py-2 mb-2" value={facts} onChange={e => setFacts(e.target.value)} rows={2} />
                            <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={() => handleSaveField('facts')} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        </>
                    ) : (
                        <p className="text-gray-700 text-sm mb-2">{facts || 'No cultural facts, holidays, etc. yet'}</p>
                    )}
                </section>
            )}
        </main>
    );
}
