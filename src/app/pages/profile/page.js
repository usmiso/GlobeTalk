'use client'


import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase/auth';


const timezones = [
    { label: 'GMT-12:00', value: 'GMT-12:00', key: 'GMT-12:00' },
    { label: 'GMT-11:00', value: 'GMT-11:00', key: 'GMT-11:00' },
    { label: 'GMT-10:00 (Hawaii)', value: 'GMT-10:00 (Hawaii)', key: 'GMT-10:00-Hawaii' },
    { label: 'GMT-09:00 (Alaska)', value: 'GMT-09:00 (Alaska)', key: 'GMT-09:00-Alaska' },
    { label: 'GMT-08:00 (Pacific)', value: 'GMT-08:00 (Pacific)', key: 'GMT-08:00-Pacific' },
    { label: 'GMT-07:00 (Mountain)', value: 'GMT-07:00 (Mountain)', key: 'GMT-07:00-Mountain' },
    { label: 'GMT-06:00 (Central)', value: 'GMT-06:00 (Central)', key: 'GMT-06:00-Central' },
    { label: 'GMT-05:00 (Eastern)', value: 'GMT-05:00 (Eastern)', key: 'GMT-05:00-Eastern' },
    { label: 'GMT-03:00 (Brazil, Argentina)', value: 'GMT-03:00 (Brazil, Argentina)', key: 'GMT-03:00-Brazil-Argentina' },
    { label: 'GMT+00:00 (London)', value: 'GMT+00:00 (London)', key: 'GMT+00:00-London' },
    { label: 'GMT+01:00 (Central Europe)', value: 'GMT+01:00 (Central Europe)', key: 'GMT+01:00-CentralEurope' },
    { label: 'GMT+02:00 (Eastern Europe)', value: 'GMT+02:00 (Eastern Europe)', key: 'GMT+02:00-EasternEurope' },
    { label: 'GMT+02:00 (Cairo, Egypt)', value: 'GMT+02:00 (Cairo, Egypt)', key: 'GMT+02:00-Cairo' },
    { label: 'GMT+02:00 (Johannesburg, South Africa)', value: 'GMT+02:00 (Johannesburg, South Africa)', key: 'GMT+02:00-Johannesburg' },
    { label: 'GMT+01:00 (Lagos, Nigeria)', value: 'GMT+01:00 (Lagos, Nigeria)', key: 'GMT+01:00-Lagos' },
    { label: 'GMT+03:00 (Nairobi, Kenya)', value: 'GMT+03:00 (Nairobi, Kenya)', key: 'GMT+03:00-Nairobi' },
    { label: 'GMT+01:00 (Algiers, Algeria)', value: 'GMT+01:00 (Algiers, Algeria)', key: 'GMT+01:00-Algiers' },
    { label: 'GMT+00:00 (Casablanca, Morocco)', value: 'GMT+00:00 (Casablanca, Morocco)', key: 'GMT+00:00-Casablanca' },
    { label: 'GMT+03:00 (Moscow)', value: 'GMT+03:00 (Moscow)', key: 'GMT+03:00-Moscow' },
    { label: 'GMT+05:30 (India)', value: 'GMT+05:30 (India)', key: 'GMT+05:30-India' },
    { label: 'GMT+08:00 (China, Singapore)', value: 'GMT+08:00 (China, Singapore)', key: 'GMT+08:00-China-Singapore' },
    { label: 'GMT+09:00 (Japan, Korea)', value: 'GMT+09:00 (Japan, Korea)', key: 'GMT+09:00-Japan-Korea' },
    { label: 'GMT+10:00 (Sydney)', value: 'GMT+10:00 (Sydney)', key: 'GMT+10:00-Sydney' },
    { label: 'GMT+12:00 (Auckland)', value: 'GMT+12:00 (Auckland)', key: 'GMT+12:00-Auckland' },
];

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
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [profileLoaded, setProfileLoaded] = useState(false);
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
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.intro) {
                        setIntro(data.intro);
                        setAgeRange(data.ageRange);
                        setHobbies(data.hobbies || []);
                        setTimezone(data.timezone);
                        setProfileLoaded(true);
                    }
                }
            } catch (err) {}
            setLoading(false);
        };
        fetchProfile();
    }, []);

    // Add hobby as tag
    const handleHobbyKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && hobbyInput.trim()) {
            e.preventDefault();
            const trimmed = hobbyInput.trim();
            // Only allow one word (no spaces)
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const user = auth.currentUser;
        if (!user) {
            setError('User not authenticated.');
            return;
        }
        if (!intro || !ageRange || !timezone || hobbies.length === 0) {
            setError('Please fill in all fields.');
            return;
        }
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
                    timezone,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to save profile.');
                return;
            }
            setIsEditing(false);
            setProfileLoaded(true);
        } catch (err) {
            setError('Failed to connect to server.');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl mb-6">Profile</h1>
            {(!profileLoaded || isEditing) ? (
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
                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Region (Timezone)</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={timezone}
                            onChange={e => setTimezone(e.target.value)}
                            required
                        >
                            <option value="">Select region/timezone</option>
                            {timezones.map(tz => (
                                <option key={tz.key} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                    >
                        Save
                    </button>
                </form>
            ) : (
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                    <div className="mb-4">
                        <span className="block font-medium">Short Intro:</span>
                        <span className="block text-gray-700 mt-1">{intro}</span>
                    </div>
                    <div className="mb-4">
                        <span className="block font-medium">Age Range:</span>
                        <span className="block text-gray-700 mt-1">{ageRange}</span>
                    </div>
                    <div className="mb-4">
                        <span className="block font-medium">Hobbies:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {hobbies.map(hobby => (
                                <span key={hobby} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                                    {hobby}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <span className="block font-medium">Region (Timezone):</span>
                        <span className="block text-gray-700 mt-1">{timezone}</span>
                    </div>
                    <button
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                        onClick={() => setIsEditing(true)}
                    >
                        Edit
                    </button>
                </div>
            )}
        </main>
    );
};

export default Profile;
