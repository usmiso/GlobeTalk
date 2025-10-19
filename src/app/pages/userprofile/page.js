"use client";

import React from 'react';
import Navbar from '@/app/components/Navbar';
import { useUserProfileData } from './hooks/useUserProfileData';
import AvatarHeader from './components/AvatarHeader';
import BioSection from './components/BioSection';
import AgeRangeSection from './components/AgeRangeSection';
import LanguagesSection from './components/LanguagesSection';
import HobbiesSection from './components/HobbiesSection';
import FavoritesSection from './components/FavoritesSection';
import FactsSection from './components/FactsSection';
import SayingsSection from './components/SayingsSection';
import SaveButton from './components/SaveButton';

export default function UserProfile() {
  const data = useUserProfileData();

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex flex-col items-center w-full min-h-screen px-">
        <Navbar />
        <div className="bg-white w-full flex flex-col gap-4 rounded-xl border border-gray-100
                max-w-3xl mx-auto p-10 shadow-2xl mt-8 transition-all duration-300 hover:shadow-blue-200 z-10 relative">
          <AvatarHeader avatarUrl={data.avatarUrl} username={data.username} timezone={data.timezone} />

          <BioSection intro={data.intro} setIntro={data.setIntro} />

          <AgeRangeSection ageRange={data.ageRange} setAgeRange={data.setAgeRange} ageRanges={data.ageRanges} />

          <LanguagesSection
            language={data.language}
            removeLanguage={data.removeLanguage}
            selectedLang={data.selectedLang}
            setSelectedLang={data.setSelectedLang}
            filteredLangs={data.filteredLangs}
            handleSelectedLang={data.handleSelectedLang}
            customLanguage={data.customLanguage}
            setCustomLanguage={(val) => {
              data.setCustomLanguage(val);
            }}
          />

          <HobbiesSection
            hobbies={data.hobbies}
            setHobbies={data.setHobbies}
            allHobbies={data.allHobbies}
            customHobby={data.customHobby}
            setCustomHobby={data.setCustomHobby}
          />

          <FavoritesSection favorites={data.favorites} setFavorites={data.setFavorites} />
          <FactsSection facts={data.facts} setFacts={data.setFacts} />
          <SayingsSection sayings={data.sayings} setSayings={data.setSayings} />

          <SaveButton saving={data.saving} saveSuccess={data.saveSuccess} onClick={data.handleSubmitSave} />
        </div>
      </main>
    </div>
  );
}