'use client';

import React, { useEffect, useState } from "react";
import { auth } from "../../firebase/auth";

export default function UserProfile() {
    const [intro, setIntro] = useState("");
    const [ageRange, setAgeRange] = useState("");
    const [hobbies, setHobbies] = useState([]);
    const [timezone, setTimezone] = useState("");
    const [languages, setLanguages] = useState([]); // optional if you add later
    const [avatarUrl, setAvatarUrl] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);


    const ageRanges = [
        'Under 18',
        '18 - 24',
        '25 - 34',
        '35 - 44',
        '45 - 54',
        '55 - 64',
        '65+',
    ];
    useEffect(() => {
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                const res = await fetch(`${apiUrl}/api/profile?userID=${user.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log("Fetched profile:", data);

                    setIntro(data.intro || "");
                    setAgeRange(data.ageRange || "");
                    setHobbies(Array.isArray(data.hobbies) ? data.hobbies : []);
                    setTimezone(data.timezone || "");
                    setLanguages(Array.isArray(data.languages) ? data.languages : []); // safe fallback
                    setAvatarUrl(data.avatarUrl || "");
                    setUsername(data.username || "Username");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            }

            setLoading(false);
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen py-10 px-4 max-w-4xl mx-auto">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-gray-200 mb-4 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-400 text-sm">No Avatar</span>
                )}
            </div>

            {/* Username + Age + Region */}
            <h1 className="text-2xl font-bold mb-2">{username}</h1>
            <p className="text-gray-700 text-base">{ageRange}</p>
            <p className="text-gray-500 text-sm mb-4">{timezone}</p>

            {/* Tabs */}
            <div className="flex space-x-6 border-b w-full max-w-sm justify-center mb-6">
                <button className="px-3 py-1 text-sm font-medium text-black border-b-2 border-blue-400">
                    About
                </button>
                <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-black">
                    Cultural & Facts
                </button>
            </div>

            {/* About Me */}
            <section className="w-full max-w-sm text-center mb-8">
                <h2 className="text-md font-semibold mb-2">About Me</h2>
                <p className="text-gray-700 text-sm">{intro}</p>
            </section>

            {/* Hobbies */}
            <section className="w-full max-w-sm text-center mb-8">
                <h2 className="text-md font-semibold mb-3">Interests & hobbies</h2>
                <div className="flex flex-wrap gap-3 justify-center">
                    {hobbies.length > 0 ? (
                        hobbies.map((hobby, i) => (
                            <span
                                key={i}
                                className="px-4 py-1.5 text-sm border rounded-lg bg-gray-50 shadow-sm"
                            >
                                {hobby}
                            </span>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm">No hobbies added yet.</p>
                    )}
                </div>
            </section>

            {/* Languages (optional for later) */}
            {languages.length > 0 && (
                <section className="w-full max-w-sm text-center">
                    <h2 className="text-md font-semibold mb-3">Language preference</h2>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {languages.map((lang, i) => (
                            <span
                                key={i}
                                className="px-4 py-1.5 text-sm border rounded-lg bg-gray-50 shadow-sm"
                            >
                                {lang}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
