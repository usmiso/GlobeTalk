
'use client'

import { useState, useEffect } from "react";
import { auth } from "../../firebase/auth";
import { useRouter } from "next/navigation";

export default function AvatarUsernameGen({ onSuccess }) {
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("male");
  const [hair, setHair] = useState("");
  const router = useRouter();

  const femaleHairOptions = ['straight02', 'bun', 'curly'];
  const maleHairOptions = ['shaggy', 'dreads02', 'theCaesarAndSidePart'];

  const generateUsername = async () => {
    try {
      const res = await fetch("https://randomuser.me/api/");
      if (!res.ok) {
        alert("Failed to fetch username");
        return;
      }
      const data = await res.json();
      if (!data.results || !data.results[0] || !data.results[0].login || !data.results[0].login.username) {
        alert("Malformed response from username API");
        return;
      }
      setUsername(data.results[0].login.username);
    } catch (err) {
      alert("Error generating username: " + err.message);
    }
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

  // Save avatar + username to backend
  const handleConfirm = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("User not logged in");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // const res = await fetch(`${apiUrl}/api/profile/avatar`, 
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/avatar`,
        {
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

      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Error saving avatar: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-xl flex flex-col items-center space-y-8">
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-purple-700 mb-2">Create Your Avatar</h1>
        <p className="text-gray-500 mb-6 text-center">Personalize your profile with a unique avatar and username.</p>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-purple-300 via-blue-200 to-pink-200 flex items-center justify-center overflow-hidden shadow-lg mb-4 border-4 border-purple-400">
            {avatar && <img src={avatar} alt="avatar" className="w-full h-full object-cover" />}
          </div>

          {/* Dropdowns */}
          <div className="flex space-x-4 w-full justify-center mt-4">
            <div className="flex flex-col items-start mb-5">
              <label className="text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="bg-gray-200 px-4 py-2 rounded-lg font-medium border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="flex flex-col items-start">
              <label className="text-sm font-medium text-gray-700 mb-1">Hair Style</label>
              <select
                value={hair}
                onChange={(e) => setHair(e.target.value)}
                className="bg-gray-200 px-4 py-2 rounded-lg font-medium border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {(gender === "female" ? femaleHairOptions : maleHairOptions).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={generateAvatar}
            className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-purple-700 transition mb-0"
          >
            Generate New Avatar
          </button>
        </div>

        {/* Username */}
        <div className="flex flex-col items-center w-full">
          <div className="bg-gray-100 h-12 flex items-center justify-center text-lg font-bold rounded-xl w-full border border-purple-200 mb-5">
            {username || "Generated Username"}
          </div>
          <button
            onClick={generateUsername}
            className="bg-blue-500 text-white py-2 px-5 rounded-full font-semibold shadow hover:bg-blue-600 transition"
          >
            Generate Name
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleConfirm}
          className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow hover:bg-green-700 transition mt-2 w-full"
        >
          Save New Avatar
        </button>
      </div>
    </div>
  );
}






