"use client";

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase/auth';
import { fetchAllLanguages, fetchTimezones, fetchUserProfile, saveUserProfile } from '../lib/api';
import { extractLanguagesFromCountries, normalizeLanguage, pickCountryFromTimezone, validateTimezoneList } from '../lib/utils';

// Fixed lists preserved from page
const ageRanges = [
  'Under 18',
  '18 - 24',
  '25 - 34',
  '35 - 44',
  '45 - 54',
  '55 - 64',
  '65+',
];

const allHobbiesMaster = [
  'Cooking', 'Hiking', 'Afrobeats', 'Reading', 'Traveling', 'Gardening', 'Photography', 'Cycling', 'Painting', 'Gaming', 'Dancing', 'Writing', 'Fishing', 'Yoga', 'Running', 'Swimming', 'Knitting', 'Singing', 'Volunteering', 'Crafting'
];

export function useUserProfileData() {
  const [activeTab, setActiveTab] = useState('about');
  const [intro, setIntro] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [hobbies, setHobbies] = useState([]);
  const [timezones, setTimezones] = useState([]);
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [customHobby, setCustomHobby] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [allLanguages, setAllLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [langQuery, setQueryLang] = useState('');
  const [favorites, setFavorites] = useState('');
  const [facts, setFacts] = useState('');
  const [country, setCountry] = useState('');
  const [sayings, setSayings] = useState('');

  // Auth + profile fetch with same 500ms delay
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setTimeout(async () => {
          try {
            const data = await fetchUserProfile(user.uid);
            if (data) {
              setIntro(data.intro || '');
              setAgeRange(data.ageRange || '');
              setHobbies(Array.isArray(data.hobbies) ? data.hobbies : []);
              setTimezone(data.timezone || '');
              setLanguage(normalizeLanguage(data.language));
              setSayings(data.sayings || []);
              setUsername(data.username || '');
              setAvatarUrl(data.avatarUrl || '');
              setFavorites(data.favorites || '');
              setFacts(data.facts || '');
              setCountry(data.country || '');
            }
          } catch (e) {
            // safe fail
          } finally {
            setLoading(false);
          }
        }, 500);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Languages
  useEffect(() => {
    (async () => {
      try {
        const countries = await fetchAllLanguages();
        setAllLanguages(extractLanguagesFromCountries(countries));
      } catch {
        // keep empty
      }
    })();
  }, []);

  // Timezones
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTimezones();
        setTimezones(validateTimezoneList(data));
      } catch {
        setTimezones([]);
      }
    })();
  }, []);

  const filteredLangs = useMemo(() => {
    return langQuery === ''
      ? allLanguages
      : allLanguages.filter((lang) => lang.toLowerCase().includes(langQuery.toLowerCase()));
  }, [allLanguages, langQuery]);

  const handleSelectedLang = (e) => {
    const lang = e.target.value;
    if (lang && !language.includes(lang)) {
      setLanguage([...language, lang]);
    }
    setSelectedLang('');
  };

  const removeLanguage = (lang) => setLanguage(language.filter((l) => l !== lang));

  const generateUsername = async () => {
    try {
      const res = await fetch('https://randomuser.me/api/');
      if (!res.ok) return;
      const data = await res.json();
      const candidate = data?.results?.[0]?.login?.username;
      if (candidate) setUsername(candidate);
    } catch {
      // ignore
    }
  };

  const generateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    setAvatarUrl(`https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}`);
  };

  const handleSubmitSave = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSaving(true);
    setSaveSuccess(false);

    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated.');
      setSaving(false);
      return;
    }

    try {
      // countryMap may be a global in some contexts; guard safely
      // eslint-disable-next-line no-undef
      const safeCountryMap = (typeof countryMap !== 'undefined' && countryMap) ? countryMap : undefined;
      const countryToSave = pickCountryFromTimezone({ timezones, timezone, country, countryMap: safeCountryMap });
      const tzObj = Array.isArray(timezones) ? timezones.find((tz) => tz && (tz.timezone_id === timezone || tz.value === timezone)) : undefined;

      const payload = {
        userID: user.uid,
        intro,
        ageRange,
        hobbies,
        timezone,
        language,
        favorites: favorites || '',
        facts,
        sayings: sayings || [],
        username,
        avatarUrl,
        country: countryToSave,
        countryCode: tzObj?.country_code || '',
      };

      const { ok, data } = await saveUserProfile(payload);
      if (!ok) {
        setError(data?.error || 'Failed to save profile.');
        setSaving(false);
        return;
      }

      // refetch to sync state
      const refreshed = await fetchUserProfile(user.uid);
      if (refreshed) {
        setIntro(refreshed.intro || '');
        setAgeRange(refreshed.ageRange || '');
        setHobbies(Array.isArray(refreshed.hobbies) ? refreshed.hobbies : []);
        setTimezone(refreshed.timezone || '');
        setLanguage(normalizeLanguage(refreshed.language));
        setSayings(refreshed.sayings || []);
        setUsername(refreshed.username || '');
        setAvatarUrl(refreshed.avatarUrl || '');
        setFavorites(refreshed.favorites || '');
        setFacts(refreshed.facts || '');
        setCountry(refreshed.country || '');
      }

      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
      setReadOnly(true);
    } catch (err) {
      setError('Failed to connect to server.');
      setSaving(false);
    }
  };

  return {
    // state
    activeTab, setActiveTab,
    intro, setIntro,
    ageRange, setAgeRange,
    hobbies, setHobbies,
    timezones, setTimezones,
    timezone, setTimezone,
    language, setLanguage,
    loading, setLoading,
    username, setUsername,
    avatarUrl, setAvatarUrl,
    error, setError,
    saving, setSaving,
    saveSuccess, setSaveSuccess,
    readOnly, setReadOnly,
    customHobby, setCustomHobby,
    customLanguage, setCustomLanguage,
    allLanguages, setAllLanguages,
    selectedLang, setSelectedLang,
    langQuery, setQueryLang,
    favorites, setFavorites,
    facts, setFacts,
    country, setCountry,
    sayings, setSayings,
    ageRanges,
    allHobbies: allHobbiesMaster,

    // derived
    filteredLangs,

    // actions
    handleSelectedLang,
    removeLanguage,
    generateUsername,
    generateAvatar,
    handleSubmitSave,
  };
}
