"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside
          className="flex flex-col justify-between transition-all duration-300"
          style={{
            backgroundColor: "#6492BD",
            width: "13rem", 
          }}
        >
          {/* GlobeTalk & Toggle */}
          <div className="flex flex-row items-start p-2 sm:gap-15 sm:p-5">
            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <img
                src="/images/globe.png"
                alt="GlobeTalk Logo"
                className="w-5 h-5 sm:w-6 sm:h-6 object-cover"
              />
              <p className="text-xs sm:text-sm lg:text-base font-bold text-black">
                GlobeTalk
              </p>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 sm:p-1 rounded  text-black font-bold text-sm sm:text-base mb-2 sm:mb-0"
            >
              ☰
            </button>
          </div>

          {/* Menu */}
          <div className="flex flex-col justify-between h-full p-2 sm:p-3">
            <nav className="space-y-1 sm:space-y-2">
              <button
                onClick={() => router.push("/pages/profile")}
                className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base"
              >
                <img
                  src="/images/profilelogo.png"
                  alt="Profile"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                />
                Profile
              </button>

              <button
                onClick={() => router.push("/pages/letters")}
                className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base"
              >
                <img
                  src="/images/letters.png"
                  alt="Letters"
                  className="w-5 h-5 sm:w-6 sm:h-7 rounded-full object-cover"
                />
                Letters
              </button>
            </nav>

            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base mt-2 sm:mt-4"
            >
              <img
                src="/images/logout.png"
                alt="Logout"
                className="w-5 h-5 sm:w-6 sm:h-6 object-cover"
              />
              Logout
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-auto relative">
        {/* Show Sidebar Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-2 sm:top-4 left-2 sm:left-4 p-1 sm:p-2 rounded  hover:bg-gray-300 text-black font-bold text-sm sm:text-base z-50"
          >
            ☰
          </button>
        )}

        <h2 className="text-lg sm:text-xl lg:text-3xl font-bold mb-2 sm:mb-4 lg:mb-6 text-center">
          WELCOME TO GLOBETALK
        </h2>

        {/* Journey Card */}
        <div className="bg-white shadow-md rounded-2xl p-2 sm:p-4 mb-2 sm:mb-4 lg:mb-6">
          <h3 className="text-sm sm:text-base lg:text-xl font-semibold mb-1 sm:mb-2 lg:mb-4">
            Your Journey
          </h3>
          <div className="flex items-start gap-1 sm:gap-2 flex-wrap">
            <img
              src="/images/journeys.png"
              alt="Profile"
              className="w-10 h-10 sm:w-12 sm:h-12 object-cover mt-1"
            />
            <ul className="space-y-1 sm:space-y-2 text-gray-700 text-xs sm:text-sm lg:text-base">
              <li>Countries Connected: 3</li>
              <li>Letters Sent: 12</li>
              <li>Longest Friendship: 45 days</li>
            </ul>
          </div>
        </div>

        {/* Letters Card */}
        <div className="bg-white shadow-md rounded-2xl p-12 sm:p-12  mb-2 sm:mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <img
                src="/images/lettersimg.png"
                alt="Letters"
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full"
              />
              <p className="text-xs sm:text-sm lg:text-base font-medium">
                2 New Letters
              </p>
            </div>

            <button
              onClick={() => router.push("/pages/find-pal")}
              className="text-blue-600 font-semibold hover:underline text-xs sm:text-sm lg:text-base mt-1 sm:mt-0"
            >
              Find A Pal →
            </button>
          </div>
        </div>

        {/* Safety Reminder */}
        <p className="text-center text-red-500 mt-85 sm:mt-85 text-xs sm:text-sm lg:text-base">
          Safety reminder: Stay kind, no file sharing
        </p>
      </main>
    </div>
  );
}
