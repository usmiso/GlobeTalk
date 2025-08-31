"use client";
import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "../../firebase/auth";
import { useRouter } from "next/navigation";



function EditProfile() {
    const router = useRouter();
    const [custom, setCustom] = useState("");
    const [allLanguages, setAllLanguages] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [selectedLang, setSelectedLang] = useState("");
    const [selectedHobby, setSelectedHobby] = useState(null);
    const [hobbiesQuery, setQueryHobby] = useState("");
    const [langQuery, setQueryLang] = useState("");
    const [sayings, setSayings] = useState([]);
    const [customSayings, setCustomSayings] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [hobbies, setHobbies] = useState([]);
    const [customHobby, setCustomHobby] = useState("");
    const [ageRange, setAgeRange] = useState('');
    const [intro, setIntro] = useState("");
    const [region, setRegion] = useState("");


    const ageRanges = [
        'Under 18',
        '18 - 24',
        '25 - 34',
        '35 - 44',
        '45 - 54',
        '55 - 64',
        '65+',
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

    const regions = [
        "Southern Africa",
        "East Africa",
        "West Africa",
        "North Africa",
        "Central Africa",
        "Europe",
        "Asia",
        "North America",
        "South America",
        "Oceania",
        "Middle East",
        "Caribbean",
        "Central America",
    ];


    // Filter list
    const filteredHobbies =
        hobbiesQuery === ""
            ? allHobbies
            : allHobbies.filter((hobby) =>
                hobby.toLowerCase().includes(hobbiesQuery.toLowerCase())
            );

    // Add hobby
    const handleSelectHobby = (hobby) => {
        if (hobby && !hobbies.includes(hobby)) {
            setHobbies([...hobbies, hobby]);
        }
        setSelectedHobby(null);
        setQueryHobby("");
    };

    const handleRemove = (hobby) => {
        setHobbies(hobbies.filter((h) => h !== hobby));
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

    // Handle dropdown change
    const handleSelectedLang = (e) => {
        const lang = e.target.value;
        if (lang && !languages.includes(lang)) {
            setLanguages([...languages, lang]);
        }
        setSelectedLang("");
    };

    // Remove a chip
    const removeLanguage = (lang) => {
        setLanguages(languages.filter((l) => l !== lang));
    };

    const filteredLangs =
        langQuery === ""
            ? allLanguages
            : allLanguages.filter((lang) =>
                lang.toLowerCase().includes(langQuery.toLowerCase())
            );

    const handleAdd = (e) => {
        e.preventDefault();
        if (customSayings.trim() && !sayings.includes(customSayings)) {
            setSayings([...sayings, customSayings.trim()]);
            setCustomSayings("");
        }
    };

    const handleSubmitSave = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        const user = auth.currentUser;
        if (!user) {
            setError('User not authenticated.');
            setSaving(false);
            return;

        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/api/profile?userID=${user.uid}`);
            // const res = await fetch(`http://localhost:5000/api/profile?userID=${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.intro) {
                    setIntro(data.intro);
                    setAgeRange(data.ageRange);
                    setHobbies(data.hobbies || []);
                    setTimezone(data.timezone);
                    setProfileLoaded(true);
                    setLanguages(data.languages || []);
                }
            };

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to save profile.');
                setSaving(false);
                return;
            }
            setSaving(false);
            router.push('/userprofile');

        } catch (err) {
            setError('Failed to connect to server.');
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-white flex flex-col items-center py-10 px-4 max-w-4xl mx-auto">
            <header className=" w-5/4 mb-6 flex items-start">
                <Link href="/pages/userprofile" className="text-gray-600 hover:text-gray-900 text-3xl">
                    &larr;
                </Link>
            </header>

            {/* ✅ One form wrapping all fields */}
            <form onSubmit={handleSubmitSave} className="bg-white rounded-lg shadow-lg p-8 max-auto w-screen space-y-10">

                {/* Profile Info */}
                <section className="flex flex-col items-center text-center mb-8 max-w-2xl mx-auto">
                    <div className="w-28 h-28 rounded-full bg-red-400 mb-4"></div>
                    <h1 className="text-2xl font-bold text-center text-gray-800">username123</h1>
                    <select className="p-0.5 mt-4 text-sm"
                        value={ageRange}
                        onChange={e => setAgeRange(e.target.value)}
                        required
                    >
                        {ageRanges.map(range => (
                            <option key={range} value={range}>{range}</option>
                        ))}
                    </select>


                    <select
                        className="mt-2 p-2 text-sm"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                    >
                        <option value="">Select Region</option>
                        {regions.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </section>

                {/* About Me */}
                <section>
                    <h2 className="text-lg font-semibold text-center mb-3">About Me</h2>
                    <textarea
                        placeholder="Write something about yourself..."
                        className="w-full border border-gray-300 rounded-md p-4 bg-gray-50"
                    />
                </section>

                <fieldset className="text-center">
                    <legend className="text-lg font-semibold mb-4">Interests & hobbies</legend>

                    {/* Selected hobbies as chips */}
                    <div className="flex flex-wrap justify-center gap-3 mb-3">
                        {hobbies.map((hobby, i) => (
                            <span
                                key={i}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm"
                            >
                                {hobby}
                                <button
                                    type="button"
                                    onClick={() => handleRemove(hobby)}
                                    className="text-red-500 hover:text-red-700 font-bold"
                                >
                                    ✕
                                </button>
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
                </fieldset>


                {/* Language Preference */}
                <fieldset className="text-center">
                    <legend className="text-lg font-semibold mb-4">Language preference</legend>
                    <div className="flex flex-wrap justify-center gap-3 mb-3">
                        {languages.map((lang, i) => (
                            <span key={i} className="px-4 py-2 border border-gray-400 rounded-lg bg-white shadow-sm flex items-center gap-2">
                                {lang}
                                <button type="button" onClick={() => removeLanguage(lang)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
                            </span>
                        ))}
                    </div>
                    <select className="w-full border border-gray-400 rounded px-3 py-2" value={selectedLang} onChange={handleSelectedLang}>
                        <option value="">Select language</option>
                        {allLanguages.map((lang, i) => (
                            <option key={i} value={lang}>{lang}</option>
                        ))}
                    </select>
                </fieldset>

                {/* Favorites */}
                <fieldset>
                    <legend className="text-lg font-semibold mb-2 text-center">Favorites</legend>
                    <textarea className="w-full border border-gray-400 rounded-md p-4 bg-gray-50" rows={3}></textarea>
                </fieldset>

                {/* Facts */}
                <fieldset>
                    <legend className="text-lg font-semibold mb-2 text-center">Facts!</legend>
                    <textarea className="w-full border border-gray-400 rounded-md p-4 bg-gray-50" rows={3}></textarea>
                </fieldset>

                {/* Common Sayings */}
                <fieldset className="text-center mx-auto">
                    <legend className="text-lg font-semibold mb-4">
                        “Common sayings” <span className="text-sm text-gray-500">(short phrases + meanings)</span>
                    </legend>

                    {/* Existing sayings as chips */}
                    <div className="flex flex-wrap justify-center mb-4 gap-3">
                        {sayings.map((saying, i) => (
                            <span key={i} className="px-4 py-2 border rounded-lg bg-white shadow-sm">
                                “{saying}”
                            </span>
                        ))}
                    </div>

                    {/* Input field — press Enter to add */}
                    <input
                        type="text"
                        value={customSayings}
                        onChange={(e) => setCustomSayings(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || (e.metaKey && e.key === "Enter")) {
                                e.preventDefault(); // stop form submission
                                if (customSayings.trim() !== "") {
                                    setSayings([...sayings, customSayings.trim()]);
                                    setCustomSayings(""); // clear input
                                }
                            }
                        }}
                        placeholder="Add your own saying..."
                        className="border border-gray-400 rounded-md p-2 text-sm w-full"
                    />
                </fieldset>


                {/* Save Button */}
                <button
                    type="submit"
                    disabled={saving}
                    className={`w-full py-2 rounded transition ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                >

                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </main>

    );
}

export default EditProfile;
