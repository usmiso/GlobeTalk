'use client'

import { useState, useEffect } from "react";

export default function ProfileSetup() {
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("male");
  const [hair, setHair] = useState("");

  const femaleHairOptions = ['straight02', 'bun', 'curly'];
  const maleHairOptions = ['shaggy', 'dreads02', 'theCaesarAndSidePart'];

  const generateUsername = async () => {
    const res = await fetch("https://randomuser.me/api/");
    const data = await res.json();
    setUsername(data.results[0].login.username);
  };

  const generateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 10);

    let selectedHair;
    if (gender === 'female') {
      selectedHair = femaleHairOptions.includes(hair)
        ? hair
        : femaleHairOptions[Math.floor(Math.random() * femaleHairOptions.length)];
    } else {
      selectedHair = maleHairOptions.includes(hair)
        ? hair
        : maleHairOptions[Math.floor(Math.random() * maleHairOptions.length)];
    }
    setHair(selectedHair);

    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}&top=${selectedHair}`;
    setAvatar(avatarUrl);
  };

  useEffect(() => {
    generateUsername();
    generateAvatar();
  }, []);

  const handleConfirm = async () => {
    await fetch("/api/users/setup", {
      method: "POST",
      body: JSON.stringify({ username, avatar }),
      headers: { "Content-Type": "application/json" },
    });
  };

  return (
    <div className="p-8">
      {/* Heading */}
      <h1 className="text-4xl font-roboto serif mb-8 font-semibold">Avatar Generator</h1>

      {/* Row: left section + right section */}
      <div className="flex items-start gap-12">
        {/* Left side: username block */}
        <div className="flex flex-col w-1/3 space-y-4  mt-26">
          <div className="bg-gray-300 h-26 flex items-center justify-center text-xl font-semibold rounded-lg">
            {username || "Generated Username"}
          </div>
          <button
            onClick={generateUsername}
            className="bg-[#6492BD] text-white py-3 rounded-lg font-roboto serif hover:bg-[#6492BD]"
          >
            Generate Name
          </button>
        </div>

        {/* Right side: move these to the right, aligned together */}
        <div className="flex flex-col items-center justify-center mt-10 transform -translate-y-10 ml-auto">
          {/* Avatar Circle */}
          <div className="w-64 h-63 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-6">
            {avatar && <img src={avatar} alt="avatar" className="w-full h-full object-cover" />}
          </div>

          {/* Button: Generate New Avatar */}
          <button
            onClick={generateAvatar}
            className="bg-[#6492BD] text-white px-6 py-3 rounded-lg font-Roboto Serif hover:bg-[#6492BD] mb-6"
          >
            Generate New Avatar
          </button>

          {/* Dropdowns */}
          <div className="flex space-x-4 mb-6">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-40 bg-gray-200 p-2 rounded"
            >
              <option value="male">Gender: Male</option>
              <option value="female">Gender: Female</option>
            </select>

            <select
              value={hair}
              onChange={(e) => setHair(e.target.value)}
              className="w-40 bg-gray-300 p-2 rounded font-medium"
            >
              {gender === 'female'
                ? femaleHairOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                : maleHairOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save Button (left as-is, not moved to the right) */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleConfirm}
          className="bg-[#6492BD] text-white px-8 py-4 rounded-lg font-robot serif bols hover:bg-[#6492BD]"
        >
          Save New Avatar
        </button>
      </div>
    </div>
  );
}
