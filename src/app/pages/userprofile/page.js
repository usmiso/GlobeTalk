'use client';

import React, { useEffect, useState } from "react";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import LoadingScreen from '../../components/LoadingScreen';
import Sidebar from '../../components/Sidebar';

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
    const [sidebarOpen, setSidebarOpen] = useState(true);



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
            // const res = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile?userID=${uid}`);
            if (res.ok) {
                const data = await res.json();
                setIntro(data.intro || "");
                setAgeRange(data.ageRange || "");
                setHobbies(Array.isArray(data.hobbies) ? data.hobbies : []);
                setTimezone(data.timezone || "");
                setLanguages(Array.isArray(data.languages) ? data.languages : []);
                // setRegion(data.region || "");
                // setSayings(data.sayings || []);
                setUsername(data.username || "");
                setAvatarUrl(data.avatarUrl || "");
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }

        setLoading(false);
    };

    if (loading) { 
        return <LoadingScreen />;
    }

    return (

        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />

            <main className=" w-screen flex flex-col items-center justify-center min-h-screen py-8 px-4">
                {/* <button
                className="w-48 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition mt-2 self-end-safe"
                onClick={() => router.push('/pages/editprofile')}
            >
                EditProfile
            </button> */}
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
                {activeTab === "about" && (
                    <>
                        {/* About Me */}
                        <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">

                            <h2 className="text-md font-semibold mb-2">About Me</h2>
                            <p className="text-gray-700 text-sm">{intro}</p>
                        </section>



                        {/* Hobbies */}
                        <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">

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

                        <h2 className="text-md font-semibold mb-3">Language preference</h2>
                        {languages.length > 0 ? (
                            <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">
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
                        ) : (
                            <span className="text-gray-400 text-sm flex items-center justify-center h-full">No Languages yet</span>
                        )}
                    </>
                )
                }

                {
                    activeTab === "cultural" && (
                        <>
                            {/* Favorites */}
                            <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">

                                <h2 className="text-md font-semibold mb-2">Favorites</h2>
                                <p className="text-gray-700 text-sm">
                                    No favorite foods/music/sports yet
                                </p>
                            </section>

                            {/* Facts */}
                            <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">

                                <h2 className="text-md font-semibold mb-2">Facts!</h2>
                                <p className="text-gray-700 text-sm">
                                    No cultural facts, holidays, etc. yet
                                </p>
                            </section>

                            {/* Common Sayings */}
                            <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-center mb-8">

                                <h2 className="text-md font-semibold mb-2">Common Sayings</h2>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    No sayings yet
                                </div>
                            </section>
                        </>
                    )
                }
            </main >
        </div >
    );
}
