"use client";

import { useRouter } from "next/navigation";

export default function ProfileOverview({ profile }) {
  const router = useRouter();
  return (
    <div className="border-[0.5px] border-blue-200 bg-gray-50 rounded-lg shadow-sm p-6 flex-1 min-w-[320px]">
      <h2 className="flex items-center gap-2 font-bold mb-6">Your Profile</h2>
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-6">
          <img
            src={profile.avatarUrl || "/default-avatar.png"}
            alt="avatar"
            className="h-20 w-20 rounded-full object-cover"
          />
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{profile.username}</h3>
            <div className="text-sm text-gray-600 font-medium">{profile.timezone}</div>
            <div className="text-sm text-gray-600 font-medium">Joined {profile.joinDate || "Unknown"}</div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="flex items-center font-semibold mb-3 text-lg">
              <img src="/images/Language.jpg" alt="Languages" className="h-6 w-6 mr-2" />
              Languages
            </h4>
            <div className="flex flex-wrap gap-3">
              {profile.language?.map((lang, i) => (
                <span
                  key={i}
                  className="px-4 text-base rounded-md bg-gray-100 border border-gray-300 font-medium duration-200 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 cursor-pointer py-2 transition-transform transform hover:scale-105 hover:shadow-md"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="flex items-center font-semibold mb-3 text-lg">
              <img src="/images/hobbies.jpg" alt="Hobbies" className="h-5 w-5 mr-2" />
              Hobbies
            </h4>
            <div className="flex flex-wrap gap-3">
              {profile.hobbies?.map((hobby, i) => (
                <span
                  key={i}
                  className="px-4 text-base rounded-md bg-gray-100 border border-gray-300 font-medium duration-200 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 cursor-pointer py-2 transition-transform transform hover:scale-105 hover:shadow-md"
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/pages/userprofile")}
          className="self-start px-3 py-2 flex items-center gap-2 text-base rounded-md bg-gray-100 border border-gray-300 font-medium duration-200 hover:text-blue-700 cursor-pointer transition-transform transform hover:scale-105 hover:shadow-md"
        >
          <img src="/images/editprofile.jpg" alt="Edit" className="h-4 w-4" />
          Edit Profile
        </button>
      </div>
    </div>
  );
}
