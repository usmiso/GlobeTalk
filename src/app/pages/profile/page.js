'use client'

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import LoadingScreen from '../../components/LoadingScreen';
import { auth } from '../../firebase/auth';
import LANGUAGES_LIST from '../../../../public/assets/languages.js';
import geonamesTimezones from '../../../../public/assets/geonames_timezone.json';
import AvatarUsernameGen from '../../components/avatar/page';

// Parse country.csv into a map { code: name }
function parseCountryCSV(csv) {
  const lines = csv.trim().split('\n');
  const map = {};
  for (const line of lines) {
    const [code, ...nameParts] = line.split(',');
    if (code && nameParts.length) {
      map[code] = nameParts.join(',').replace(/"/g, '').trim();
    }
  }
  return map;
}

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
  const [countryMap, setCountryMap] = useState();
  const [countryName, setCountryName] = useState('');
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
  // Helper to get language name from code
  const getLanguageName = (code) => {
    if (!code) return '';
    const lang = LANGUAGES_LIST[code];
    return lang ? lang.name : code;
  };
  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('avatar'); // 'avatar', 'editProfile', 'viewProfile'
  const [tzDropdownOpen, setTzDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const router = useRouter();

  // Filtered options for dropdowns
  const filteredTimezones = timezones.filter(tz => {
    const countryName = countryMap && tz.country_code ? countryMap[tz.country_code].toLowerCase() : '';
    return (
      tz.timezone_id.toLowerCase().includes(timezone.toLowerCase()) ||
      (tz.gmt_offset !== undefined && (`GMT${tz.gmt_offset >= 0 ? '+' : ''}${tz.gmt_offset}`).includes(timezone)) ||
      (countryName && countryName.includes(timezone.toLowerCase()))
    );
  });

  const filteredLanguages = languageOptions.filter(lang =>
    lang.name.toLowerCase().includes(selectedLanguage.toLowerCase()) ||
    (lang.nativeName && lang.nativeName.toLowerCase().includes(selectedLanguage.toLowerCase()))
  );

  // Country CSV
  useEffect(() => {
    const fetchCountryCSV = async () => {
      try {
        const res = await fetch('/assets/country.csv');
        if (res.ok) {
          const text = await res.text();
          setCountryMap(parseCountryCSV(text));
        }
      } catch (err) {
        setCountryMap({});
      }
    };
    fetchCountryCSV();
  }, []);

  const handleTimezoneSelect = (tzObj) => {
    setTimezone(tzObj.timezone_id);
    if (countryMap && tzObj.country_code && countryMap[tzObj.country_code]) {
      setCountryName(countryMap[tzObj.country_code]);
    }
    setTzDropdownOpen(false);
  };

  // Helper to get timezone display string with country
  const getTimezoneDisplay = (tzId) => {
    if (!tzId) return '';
    const tzObj = timezones.find(tz => tz.timezone_id === tzId);
    if (!tzObj) return tzId;
    const country = countryMap && countryMap[tzObj.country_code] ? countryMap[tzObj.country_code] : '';
    return `${tzObj.timezone_id} (GMT${tzObj.gmt_offset >= 0 ? '+' : ''}${tzObj.gmt_offset})${country ? ' - ' + country : ''}`;
  };

  const handleLanguageSelect = (code) => {
    setSelectedLanguage(code);
    setLangDropdownOpen(false);
  };

  // Fetch profile
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
            setSelectedLanguage(data.languageCode || '');
            setAvatarUrl(data.avatarUrl || '');
            setUsername(data.username || '');
            if (data.timezone && countryMap) {
              const tzObj = geonamesTimezones.find(tz => tz.timezone_id === data.timezone);
              if (tzObj && tzObj.country_code && countryMap[tzObj.country_code]) {
                setCountryName(countryMap[tzObj.country_code]);
              }
            }
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
  }, [countryMap]);

  // Load timezones
  useEffect(() => {
    const validZones = geonamesTimezones.filter(
      tz => tz.timezone_id && tz.country_code
    ).map(tz => ({
      timezone_id: tz.timezone_id,
      country_code: tz.country_code,
      gmt_offset: tz.gmt_offset
    }));
    setTimezones(validZones);
  }, []);

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
    const tzObj = timezones.find(tz => tz.timezone_id === timezone);
    let countryToSave = '';
    if (tzObj && tzObj.country_code && countryMap && countryMap[tzObj.country_code]) {
      countryToSave = countryMap[tzObj.country_code];
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/profile`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userID: user.uid,
            intro,
            ageRange,
            hobbies,
            timezone,
            // only ID
            languageCode: selectedLanguage, // store code
            language: getLanguageName(selectedLanguage), // store language name
            country: countryName,
            countryCode: tzObj?.country_code || '',
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
    return <LoadingScreen />;
  }

  if (mode === 'avatar') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <AvatarUsernameGen
          onSuccess={() => setMode('editProfile')}
        />
      </main>
    );
  }

  if (mode === 'editProfile') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl mb-6">Profile</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {/* Country */}
          <div className="mb-4 w-full max-w-md">
            <label className="block mb-1 font-medium">Country</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-2 bg-gray-100 cursor-not-allowed"
              value={countryName}
              readOnly
              tabIndex={-1}
            />
          </div>
          {/* Intro */}
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
          {/* Age */}
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
          {/* Hobbies */}
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
          {/* Timezone */}
          <div className="mb-4 w-full max-w-md relative">
            <label className="block mb-1 font-medium">Region (Timezone)</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="Type timezone..."
              value={getTimezoneDisplay(timezone) || timezone}
              onChange={e => {
                setTimezone(e.target.value);
                setTzDropdownOpen(true);
              }}
              onFocus={() => setTzDropdownOpen(true)}
              onBlur={() => setTimeout(() => setTzDropdownOpen(false), 100)}
              autoComplete="off"
              required
            />
            {tzDropdownOpen && filteredTimezones.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-48 overflow-y-auto mt-1">
                {filteredTimezones.map((tz, idx) => (
                  <li
                    key={`${tz.timezone_id}-${idx}`}
                    className={`px-3 py-2 hover:bg-blue-100 cursor-pointer ${tz.timezone_id === timezone ? 'bg-blue-50 font-bold' : ''}`}
                    onMouseDown={() => handleTimezoneSelect(tz)}
                  >
                    {tz.timezone_id} (GMT{tz.gmt_offset >= 0 ? '+' : ''}{tz.gmt_offset})
                    {countryMap && countryMap[tz.country_code] ? ` - ${countryMap[tz.country_code]}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Language */}
          <div className="mb-4 w-full max-w-md relative">
            <label className="block mb-1 font-medium">Language</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="Type language..."
              value={getLanguageName(selectedLanguage) || selectedLanguage}
              onChange={e => {
                setSelectedLanguage(e.target.value);
                setLangDropdownOpen(true);
              }}
              onFocus={() => setLangDropdownOpen(true)}
              onBlur={() => setTimeout(() => setLangDropdownOpen(false), 100)}
              autoComplete="off"
              required
            />
            {langDropdownOpen && filteredLanguages.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-48 overflow-y-auto mt-1">
                {filteredLanguages.map(lang => (
                  <li
                    key={lang.code}
                    className={`px-3 py-2 hover:bg-green-100 cursor-pointer ${lang.code === selectedLanguage ? 'bg-green-50 font-bold' : ''}`}
                    onMouseDown={() => handleLanguageSelect(lang.code)}
                  >
                    {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ''}
                  </li>
                ))}
              </ul>
            )}
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

  if (mode === 'viewProfile') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl mb-6">Profile</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
          {/* Avatar */}
          {avatarUrl && (
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-300 via-blue-200 to-pink-200 flex items-center justify-center overflow-hidden shadow-lg mb-4 border-4 border-purple-400">
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            </div>
          )}
          {/* Username */}
          {username && (
            <div className="bg-gray-100 h-10 flex items-center justify-center text-lg font-bold rounded-xl w-full border border-purple-200 mb-5">
              {username}
            </div>
          )}
          <div className="mb-4 w-full">
            <span className="block font-medium">Country:</span>
            <span className="block text-gray-700 mt-1">{countryName}</span>
          </div>
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
                const tzObj = timezones.find(tz => tz.timezone_id === timezone);
                if (tzObj) {
                  return `${tzObj.timezone_id} (GMT${tzObj.gmt_offset >= 0 ? '+' : ''}${tzObj.gmt_offset})${countryMap && countryMap[tzObj.country_code] ? ` - ${countryMap[tzObj.country_code]}` : ''}`;
                }
                return timezone;
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
