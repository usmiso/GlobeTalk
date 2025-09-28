'use client'

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import LoadingScreen from '../../components/LoadingScreen';
import { auth } from '../../firebase/auth';
import LANGUAGES_LIST from '../../../../public/assets/languages.js';
import geonamesTimezones from '../../../../public/assets/geonames_timezone.json';
import AvatarUsernameGen from '../../components/avatar/page';
import ProtectedLayout from "@/app/components/ProtectedLayout";

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


  return (
    <ProtectedLayout redirectTo="/">
      {loading ? (
        <LoadingScreen />
      ) : mode === 'avatar' ? (
        <main className="flex flex-col items-center justify-center min-h-screen">
          <AvatarUsernameGen onSuccess={() => setMode('editProfile')} />
        </main>
      ) : mode === 'editProfile' ? (
        <main className="flex flex-col items-center justify-center min-h-screen">
          {/* ...existing code... */}
        </main>
      ) : mode === 'viewProfile' ? (
        <main className="flex flex-col items-center justify-center min-h-screen">
          {/* ...existing code... */}
        </main>
      ) : null}
    </ProtectedLayout>
  );
}

export default Profile;
