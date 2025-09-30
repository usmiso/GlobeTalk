'use client'

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import LoadingScreen from '../../components/LoadingScreen';
import { auth } from '../../firebase/auth';
import LANGUAGES_LIST from '../../../../public/assets/languages.js';
import geonamesTimezones from '../../../../public/assets/geonames_timezone.json';
import AvatarUsernameGen from '../../components/avatar/page';
import ProtectedLayout from "@/app/components/ProtectedLayout";
import Image from 'next/image';

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

  const theme = {
    primary: '#476C8A',
    primaryDark: '#3A5A72',
    primaryLight: '#cae0f1ff',
    primaryLighter: '#F0F5F9',
    textDark: '#2D3748',
    textLight: '#718096',
    cardBg: '#FFFFFF',
    borderLight: 'rgba(71, 108, 138, 0.2)',
  };

  // Filtered options for dropdowns
  const filteredTimezones = timezones.filter(tz => {
    const countryName = (countryMap && tz.country_code && countryMap[tz.country_code])
      ? countryMap[tz.country_code].toLowerCase()
      : '';
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

  // Add hobby when comma is typed (mobile) or Enter is pressed (desktop)
  const handleHobbyInputChange = (e) => {
    const value = e.target.value;
    // If comma is present, split and add all new hobbies
    if (value.includes(',')) {
      const parts = value.split(',');
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed && !trimmed.includes(' ') && !hobbies.includes(trimmed)) {
          setHobbies(prev => [...prev, trimmed]);
        }
      });
      setHobbyInput('');
    } else {
      setHobbyInput(value);
    }
  };

  // Add hobby on Enter (desktop)
  const handleHobbyKeyDown = (e) => {
    if (e.key === 'Enter' && hobbyInput.trim()) {
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


  return (
    <ProtectedLayout redirectTo="/">

      <div className="fixed inset-0 w-full h-screen -z-10">
        <Image
          src="/images/nations.png"
          alt="Nations background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/40 md:bg-white/40"></div>
      </div>
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          {mode === 'avatar' && (
            <main className="relative min-h-screen flex flex-col justify-center items-center">
              <AvatarUsernameGen onSuccess={() => setMode('editProfile')} />
            </main>
          )}

          {mode === 'editProfile' && (
            <main className="flex flex-col items-center justify-center min-h-screen m-4">

              <form
                onSubmit={handleSubmit}
                noValidate
                className="ml-4 mr-4 shadow-xl rounded-2xl p-6 w-full max-w-3xl transition-all"
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.borderLight}`,
                  boxShadow: '0 10px 30px rgba(71, 108, 138, 0.1)',
                }}
              >
                {error && <div className="text-red-500 mb-4">{error}</div>}

                <h1 className="text-center text-2xl font-bold mb-6" style={{ color: theme.primary }}>Profile</h1>

                {/* Country */}
                <div className="mb-4 w-full">
                  <label className="block mb-1 font-medium" htmlFor="country" style={{ color: theme.textDark }}>Country</label>
                  <input
                    id="country"
                    type="text"
                    className="w-full rounded px-3 py-2"
                    value={countryName}
                    readOnly
                    tabIndex={-1}
                    style={{
                      backgroundColor: theme.primaryLighter,
                      border: `1px solid ${theme.borderLight}`,
                      color: theme.textDark,
                      cursor: 'not-allowed',
                    }}
                  />
                </div>

                {/* Intro */}
                <div className="mb-4 w-full">
                  <label className="block mb-1 font-medium" htmlFor="intro" style={{ color: theme.textDark }}>Short Intro</label>
                  <textarea
                    id="intro"
                    className="w-full rounded px-3 py-2"
                    value={intro}
                    onChange={e => setIntro(e.target.value)}
                    rows={2}
                    required
                    style={{
                      backgroundColor: theme.primaryLighter,
                      border: `1px solid ${theme.borderLight}`,
                      color: theme.textDark,
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = theme.primary)}
                    onBlur={e => (e.currentTarget.style.borderColor = theme.borderLight)}
                  />
                </div>

                {/* Age */}
                <div className="mb-4 w-full">
                  <label className="block mb-1 font-medium" htmlFor="ageRange" style={{ color: theme.textDark }}>Age Range</label>
                  <select
                    id="ageRange"
                    className="w-full rounded px-3 py-2"
                    value={ageRange}
                    onChange={e => setAgeRange(e.target.value)}
                    required
                    style={{
                      backgroundColor: theme.primaryLighter,
                      border: `1px solid ${theme.borderLight}`,
                      color: theme.textDark,
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = theme.primary)}
                    onBlur={e => (e.currentTarget.style.borderColor = theme.borderLight)}
                  >
                    <option value="">Select age range</option>
                    {ageRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                {/* Hobbies */}
                <div className="mb-4 w-full">
                  <label className="block mb-1 font-medium" htmlFor="hobbyInput" style={{ color: theme.textDark }}>
                    Hobbies (press Enter or comma to add)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {hobbies.map(hobby => (
                      <span key={hobby} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                        {hobby}
                        <button type="button" className="ml-1 text-xs" onClick={() => removeHobby(hobby)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  <input
                    id="hobbyInput"
                    className="w-full rounded px-3 py-2"
                    type="text"
                    value={hobbyInput}
                    onChange={handleHobbyInputChange}
                    onKeyDown={handleHobbyKeyDown}
                    placeholder="Type a hobby and press Enter or comma"
                    style={{
                      backgroundColor: theme.primaryLighter,
                      border: `1px solid ${theme.borderLight}`,
                      color: theme.textDark,
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = theme.primary)}
                    onBlur={e => (e.currentTarget.style.borderColor = theme.borderLight)}
                  />
                </div>

                {/* Timezone */}
                <div className="mb-4 w-full relative">
                  <label className="block mb-1 font-medium" htmlFor="timezone" style={{ color: theme.textDark }}>Region (Timezone)</label>
                  <input
                    id="timezone"
                    type="text"
                    className="w-full rounded px-3 py-2 mb-2"
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
                    style={{
                      backgroundColor: theme.primaryLighter,
                      border: `1px solid ${theme.borderLight}`,
                      color: theme.textDark,
                    }}
                    onFocusCapture={e => (e.currentTarget.style.borderColor = theme.primary)}
                    onBlurCapture={e => (e.currentTarget.style.borderColor = theme.borderLight)}
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
                <div className="mb-6 w-full relative">
                  <label className="block mb-1 font-medium" htmlFor="language" style={{ color: theme.textDark }}>Language</label>
                  <input
                    id="language"
                    type="text"
                    className="w-full rounded px-3 py-2 mb-2"
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
                    style={{
                      backgroundColor: theme.primaryLighter,
                      border: `1px solid ${theme.borderLight}`,
                      color: theme.textDark,
                    }}
                    onFocusCapture={e => (e.currentTarget.style.borderColor = theme.primary)}
                    onBlurCapture={e => (e.currentTarget.style.borderColor = theme.borderLight)}
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
                  className="w-full py-3 rounded-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: theme.primary, border: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.primaryDark)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = theme.primary)}
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  className="w-full mt-3 py-3 rounded-lg font-bold transition hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: 'transparent', color: theme.primary, border: `1.5px solid ${theme.primary}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.primaryLighter)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => setMode('avatar')}
                >
                  Edit Avatar
                </button>
              </form>
            </main>
          )}

          {mode === 'viewProfile' && (
            <main className="flex flex-col items-center justify-center min-h-screen m-4">
              <div
                className="ml-4 mr-4 shadow-xl rounded-2xl p-6 w-full max-w-3xl flex flex-col items-center space-y-5 transition-all"
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.borderLight}`,
                  boxShadow: '0 10px 30px rgba(71, 108, 138, 0.1)',
                }}
              >

                <h1 className="text-center text-2xl font-bold mb-6" style={{ color: theme.primary }}>Profile</h1>
                {/* Avatar */}
                {avatarUrl && (
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden shadow-md border-2 mb-2"
                    style={{
                      backgroundColor: theme.primaryLighter,
                      borderColor: theme.primary,
                    }}
                  >
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Username */}
                {username && (
                  <div
                    className="w-full h-12 flex items-center justify-center text-sm font-bold rounded-lg"
                    style={{
                      backgroundColor: theme.primaryLighter,
                      color: theme.textDark,
                      border: `1px solid ${theme.borderLight}`,
                    }}
                  >
                    {username}
                  </div>
                )}

                {/* Country */}
                <div className="mb-1 w-full">
                  <span className="block text-sm font-medium" style={{ color: theme.textDark }}>Country:</span>
                  <span className="block mt-1" style={{ color: theme.textLight }}>{countryName}</span>
                </div>

                {/* Intro */}
                <div className="mb-1 w-full">
                  <span className="block text-sm font-medium" style={{ color: theme.textDark }}>Short Intro:</span>
                  <span className="block mt-1" style={{ color: theme.textLight }}>{intro}</span>
                </div>

                {/* Age Range */}
                <div className="mb-1 w-full">
                  <span className="block text-sm font-medium" style={{ color: theme.textDark }}>Age Range:</span>
                  <span className="block mt-1" style={{ color: theme.textLight }}>{ageRange}</span>
                </div>

                {/* Hobbies */}
                <div className="mb-1 w-full">
                  <span className="block text-sm font-medium" style={{ color: theme.textDark }}>Hobbies:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {hobbies.map(hobby => (
                      <span key={hobby} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Region (Timezone) */}
                <div className="mb-1 w-full">
                  <span className="block text-sm font-medium" style={{ color: theme.textDark }}>Region (Timezone):</span>
                  <span className="block mt-1" style={{ color: theme.textLight }}>
                    {(() => {
                      const tzObj = timezones.find(tz => tz.timezone_id === timezone);
                      if (tzObj) {
                        return `${tzObj.timezone_id} (GMT${tzObj.gmt_offset >= 0 ? '+' : ''}${tzObj.gmt_offset})${countryMap && countryMap[tzObj.country_code] ? ` - ${countryMap[tzObj.country_code]}` : ''}`;
                      }
                      return timezone;
                    })()}
                  </span>
                </div>

                {/* Language */}
                <div className="mb-2 w-full">
                  <span className="block text-sm font-medium" style={{ color: theme.textDark }}>Language:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLanguage && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                        {LANGUAGES_LIST[selectedLanguage]?.name}
                        {LANGUAGES_LIST[selectedLanguage]?.nativeName ? ` (${LANGUAGES_LIST[selectedLanguage].nativeName})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <button
                  className="w-full py-3 px-6 rounded-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 mb-2"
                  style={{ backgroundColor: theme.primary, border: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.primaryDark)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = theme.primary)}
                  onClick={() => setMode('avatar')}
                >
                  Edit Avatar
                </button>
                <button
                  className="w-full py-3 px-6 rounded-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 mb-2"
                  style={{ backgroundColor: theme.primary, border: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.primaryDark)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = theme.primary)}
                  onClick={() => setMode('editProfile')}
                >
                  Edit Profile
                </button>
                <button
                  className="w-full py-3 px-6 rounded-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: '#38A169', border: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2F855A')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#38A169')}
                  onClick={() => router.push('/pages/dashboard')}
                >
                  Go to Dashboard
                </button>
              </div>
            </main>
          )}
        </>
      )}
    </ProtectedLayout>
  );
}

export default Profile;
