'use client'

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase/auth';
import LANGUAGES_LIST from '../../../../public/assets/languages.js';
import AvatarUsernameGen from '../../components/avatar/page';

const languageOptions = Object.entries(LANGUAGES_LIST).map(([code, lang]) => ({
    code,
    name: lang.name,
    nativeName: lang.nativeName,
}));

const ageRanges = [
    'Under 18',
    '18-24',
    '25-34',
    '35-44',
    '45-54',
    '55-64',
    '65+',
];

const Profile = () => {
    const [intro, setIntro] = useState('');
    const [ageRange, setAgeRange] = useState('');
    const [hobbyInput, setHobbyInput] = useState('');
    const [hobbies, setHobbies] = useState([]);
    const [timezone, setTimezone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [timezones, setTimezones] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [timezoneSearch, setTimezoneSearch] = useState('');
    const [languageSearch, setLanguageSearch] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [username, setUsername] = useState('');
    const [mode, setMode] = useState('avatar'); // 'avatar', 'editProfile', 'viewProfile'
    const router = useRouter();

    // Fetch profile on mount
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
                // const res = await fetch(`http://localhost:5000/api/profile?userID=${user.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.intro) {
                        setIntro(data.intro);
                        setAgeRange(data.ageRange);
                        setHobbies(data.hobbies || []);
                        setTimezone(data.timezone);
                        setSelectedLanguage(data.language || '');
                        setAvatarUrl(data.avatarUrl || '');
                        setUsername(data.username || '');
                        setProfileLoaded(true);
                        setMode('viewProfile');
                    } else {
                        setMode('avatar');
                    }
                } else {
                    setMode('avatar');
                }
            } catch (err) {
                setMode('avatar');
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    // Fetch timezones
    useEffect(() => {
        const fetchTimezones = async () => {
            try {
                const res = await fetch('/Assets/timezones.json');
                if (res.ok) {
                    const data = await res.json();
                    const validZones = data.filter(tz => tz && tz.value && tz.text);
                    setTimezones(validZones);
                }
            } catch (err) {
                setTimezones([]);
            }
        };
        fetchTimezones();
    }, []);

    // Add hobby
    const handleHobbyKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && hobbyInput.trim()) {
            e.preventDefault();
            const trimmed = hobbyInput.trim();
            if (trimmed.includes(' ')) {
                setError('Hobby tags must be one word (no spaces).');
                return;
            }
            if (!hobbies.includes(trimmed)) {
                setHobbies([...hobbies, trimmed]);
            }
            setHobbyInput('');
        }
    };

    const removeHobby = (hobby) => {
        setHobbies(hobbies.filter(h => h !== hobby));
    };

    const handleLanguageChange = (e) => {
        setSelectedLanguage(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const user = auth.currentUser;
        if (!user) {
            setError('User not authenticated.');
            return;
        }
        if (!intro || !ageRange || !timezone || hobbies.length === 0 || !selectedLanguage) {
            setError('Please fill in all fields.');
            return;
        }
        const languageName = LANGUAGES_LIST[selectedLanguage]?.name || selectedLanguage;
        const tzObj = timezones.find(tz => tz.value === timezone);
        const timezoneText = tzObj ? tzObj.text : timezone;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/api/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userID: user.uid,
                    intro,
                    ageRange,
                    hobbies,
                    timezone: timezoneText,
                    language: languageName,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to save profile.');
                return;
            }
            setProfileLoaded(true);
            setMode('viewProfile');
        } catch (err) {
            setError('Failed to connect to server.');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // Avatar generator mode
    if (mode === 'avatar') {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen">
                <AvatarUsernameGen
                    onSuccess={() => setMode('editProfile')}
                />
            </main>
        );
    }

    // Profile edit mode
    if (mode === 'editProfile') {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl mb-6">Profile</h1>
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                    {error && <div className="text-red-500 mb-2">{error}</div>}
                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Short Intro</label>
                        <textarea
                            className="w-full border rounded px-3 py-2"
                            value={intro}
                            onChange={e => setIntro(e.target.value)}
                            rows={2}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Age Range</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={ageRange}
                            onChange={e => setAgeRange(e.target.value)}
                            required
                        >
                            <option value="">Select age range</option>
                            {ageRanges.map(range => (
                                <option key={range} value={range}>{range}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Hobbies (press Enter or comma to add)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {hobbies.map(hobby => (
                                <span key={hobby} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                                    {hobby}
                                    <button type="button" className="ml-1 text-xs" onClick={() => removeHobby(hobby)}>&times;</button>
                                </span>
                            ))}
                        </div>
                        <input
                            className="w-full border rounded px-3 py-2"
                            type="text"
                            value={hobbyInput}
                            onChange={e => setHobbyInput(e.target.value)}
                            onKeyDown={handleHobbyKeyDown}
                            placeholder="Type a hobby and press Enter or comma"
                        />
                    </div>
                    <div className="mb-4 w-full max-w-md">
                        <label className="block mb-1 font-medium">Region (Timezone)</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2 mb-2"
                            placeholder="Search timezone..."
                            value={timezoneSearch}
                            onChange={e => setTimezoneSearch(e.target.value)}
                        />
                        <select
                            className="w-full border rounded px-3 py-2 cursor-pointer"
                            value={timezone}
                            onChange={e => setTimezone(e.target.value)}
                            required
                        >
                            <option value="">Select region/timezone</option>
                            {timezones
                                .filter(tz => tz.text.toLowerCase().includes(timezoneSearch.toLowerCase()))
                                .map((tz, idx) => (
                                    <option key={`${tz.value}-${idx}`} value={tz.value}>
                                        {tz.text}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="mb-4 w-full max-w-md">
                        <label className="block mb-1 font-medium">Language</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2 mb-2"
                            placeholder="Search language..."
                            value={languageSearch}
                            onChange={e => setLanguageSearch(e.target.value)}
                        />
                        <select
                            className="w-full border rounded px-3 py-2 cursor-pointer"
                            value={selectedLanguage}
                            onChange={handleLanguageChange}
                            required
                        >
                            <option value="">Select a language</option>
                            {languageOptions
                                .filter(lang =>
                                    lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                                    (lang.nativeName && lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase()))
                                )
                                .map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ''}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                    >
                        Save Profile
                    </button>
                </form>
            </main>
        );
    }

    // Profile view mode
    if (mode === 'viewProfile') {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl mb-6">Profile</h1>
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
                    {/* Avatar Display */}
                    {avatarUrl && (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-300 via-blue-200 to-pink-200 flex items-center justify-center overflow-hidden shadow-lg mb-4 border-4 border-purple-400">
                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                    )}
                    {/* Username Display */}
                    {username && (
                        <div className="bg-gray-100 h-10 flex items-center justify-center text-lg font-bold rounded-xl w-full border border-purple-200 mb-5">
                            {username}
                        </div>
                    )}
                    <div className="mb-4 w-full">
                        <span className="block font-medium">Short Intro:</span>
                        <span className="block text-gray-700 mt-1">{intro}</span>
                    </div>
                    <div className="mb-4 w-full">
                        <span className="block font-medium">Age Range:</span>
                        <span className="block text-gray-700 mt-1">{ageRange}</span>
                    </div>
                    <div className="mb-4 w-full">
                        <span className="block font-medium">Hobbies:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {hobbies.map(hobby => (
                                <span key={hobby} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                                    {hobby}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4 w-full">
                        <span className="block font-medium">Region (Timezone):</span>
                        <span className="block text-gray-700 mt-1">
                            {(() => {
                                const tzObj = timezones.find(tz => tz.value === timezone);
                                return tzObj ? tzObj.text : timezone;
                            })()}
                        </span>
                    </div>
                    <div className="mb-4 w-full">
                        <span className="block font-medium">Language:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {selectedLanguage && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                                    {LANGUAGES_LIST[selectedLanguage]?.name}
                                    {LANGUAGES_LIST[selectedLanguage]?.nativeName ? ` (${LANGUAGES_LIST[selectedLanguage].nativeName})` : ''}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition mb-2"
                        onClick={() => setMode('avatar')}
                    >
                        Edit Avatar
                    </button>
                    <button
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition mb-2"
                        onClick={() => setMode('editProfile')}
                    >
                        Edit Profile
                    </button>
                    <button
                        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
                        onClick={() => router.push('/pages/dashboard')}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </main>
        );
    }

    return null;
};

export default Profile;