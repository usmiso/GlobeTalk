'use client'

import { useState, useEffect } from "react";
import { auth } from "../../firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
      if (!data.results?.[0]?.login?.username) {
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


  const theme = {
    primary: '#476C8A',
    primaryDark: '#3A5A72',
    primaryLight: '#cae0f1ff',     // ← Full page background
    primaryLighter: '#F0F5F9',   // ← Input/card backgrounds+
    textDark: '#2D3748',
    textLight: '#718096',
    cardBg: '#FFFFFF',
    borderLight: 'rgba(71, 108, 138, 0.2)',
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-hidden"
    >
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
      {/* Main Card */}
      <div
        className="ml-4 mr-4 shadow-xl rounded-2xl p-6 w-full max-w-3xl flex flex-col items-center space-y-5 transition-all"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.borderLight}`,
          boxShadow: '0 10px 30px rgba(71, 108, 138, 0.1)',
        }}
      >
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
            Create Your Avatar
          </h1>
          <p className="text-sm" style={{ color: theme.textLight }}>
            Personalize your profile with a unique look and name.
          </p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center space-y-4 w-full">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden shadow-md border-2"
            style={{
              backgroundColor: theme.primaryLighter,
              borderColor: theme.primary,
            }}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400 text-sm">Tap to generate</div>
            )}
          </div>

          {/* Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{ color: theme.textDark }}>
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-1 transition"
                style={{
                  backgroundColor: theme.primaryLighter,
                  borderColor: theme.borderLight,
                  color: theme.textDark,
                }}
                onFocus={(e) => (e.target.style.borderColor = theme.primary)}
                onBlur={(e) => (e.target.style.borderColor = theme.borderLight)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{ color: theme.textDark }}>
                Hair Style
              </label>
              <select
                value={hair}
                onChange={(e) => setHair(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-1 transition"
                style={{
                  backgroundColor: theme.primaryLighter,
                  borderColor: theme.borderLight,
                  color: theme.textDark,
                }}
                onFocus={(e) => (e.target.style.borderColor = theme.primary)}
                onBlur={(e) => (e.target.style.borderColor = theme.borderLight)}
              >
                {(gender === "female" ? femaleHairOptions : maleHairOptions).map(option => (
                  <option key={option} value={option}>
                    {option.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Avatar Button */}
          <button
            onClick={generateAvatar}
            className="w-full py-2 px-4 rounded-lg font-medium text-white shadow-sm transition hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: theme.primary,
              border: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.primaryDark)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.primary)}
          >
            Generate New Avatar
          </button>
        </div>

        {/* Username */}
        <div className="flex flex-col items-center w-full space-y-3">
          <div
            className="w-full h-12 flex items-center justify-center text-sm font-bold rounded-lg"
            style={{
              backgroundColor: theme.primaryLighter,
              color: theme.textDark,
              border: `1px solid ${theme.borderLight}`,
            }}
          >
            {username || "Click to generate a username"}
          </div>
          <button
            onClick={generateUsername}
            className="w-full py-2 px-4 rounded-lg font-medium transition hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: 'transparent',
              color: theme.primary,
              border: `1.5px solid ${theme.primary}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.primaryLighter)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Generate Name
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3 px-6 rounded-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-95"
          style={{
            backgroundColor: theme.primary,
            border: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.primaryDark)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.primary)}
        >
          Save New Avatar
        </button>
      </div>
    </div>
  );
}