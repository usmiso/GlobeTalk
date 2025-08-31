'use client'

import { useState, useEffect } from "react";
import { auth } from "../../firebase/auth"; // ✅ grab current user

export default function AvatarUsernameGen() {
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

  // ✅ Save avatar + username to backend
  const handleConfirm = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("User not logged in");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: user.uid,
          username,
          avatarUrl: avatar,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to save avatar");
        return;
      }

      alert("Avatar saved successfully!");
    } catch (err) {
      alert("Error saving avatar: " + err.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Avatar Generator</h1>

      {/* Username */}
      <div className="flex flex-col w-1/3 space-y-4">
        <div className="bg-gray-300 h-40 flex items-center justify-center text-xl font-semibold rounded-lg">
          {username || "Generated Username"}
        </div>
        <button
          onClick={generateUsername}
          className="bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600"
        >
          Generate Name
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center justify-center mt-10 transform -translate-y-10">
        <div className="w-64 h-64 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-6">
          {avatar && <img src={avatar} alt="avatar" className="w-full h-full object-cover" />}
        </div>

        <button
          onClick={generateAvatar}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-600 mb-6"
        >
          Generate New Avatar
        </button>

        {/* Dropdowns */}
        <div className="flex space-x-4 mb-6">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="bg-gray-300 px-4 py-3 rounded-lg font-medium"
          >
            <option value="male">Gender: Male</option>
            <option value="female">Gender: Female</option>
          </select>

          <select
            value={hair}
            onChange={(e) => setHair(e.target.value)}
            className="bg-gray-300 px-4 py-3 rounded-lg font-medium"
          >
            {(gender === "female" ? femaleHairOptions : maleHairOptions).map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleConfirm}
          className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-green-700"
        >
          Save New Avatar
        </button>
      </div>
    </div>
  );
}






