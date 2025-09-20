"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

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
            {/* <img
              src="/images/journeys.png"
              alt="Profile"
              className="w-10 h-10 sm:w-12 sm:h-12 object-cover mt-1"
            /> */}
            <ul className="space-y-1 sm:space-y-2 text-gray-700 text-xs sm:text-sm lg:text-base">
              Nothing to show yet
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
              onClick={() => router.push("/pages/matchmaking")}
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
