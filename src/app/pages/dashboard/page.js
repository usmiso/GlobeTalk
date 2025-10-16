"use client";

import React from "react";
import Navbar from "../../components/Navbar";
import ProfileOverview from "./components/ProfileOverview";
import RecentActivity from "./components/RecentActivity";
import StatsGrid from "./components/StatsGrid";
import MonthlyActivity from "./components/MonthlyActivity";
import QuickActions from "./components/QuickActions";
import { useDashboardData } from "./hooks/useDashboardData";

export default function DashboardPage() {
  const { loading, profile, stats, activity } = useDashboardData();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return <div className="p-6">No profile data found.</div>;
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 flex flex-col ">
        <Navbar />

        <div className="flex-1 flex flex-col items-center w-full min-h-screen px-8 space-y-8 mb-4">
          <div className="text-center space-y-2 mt-8">
            <h1 className="text-4xl font-extrabold text-blue-700 drop-shadow-sm">
              Welcome back, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{profile.username || "Friend"}</span>!
            </h1>
            <p className="text-lg text-white italic">Your global pen pal journey continues 🌍✉️</p>
          </div>

          <div className="w-32 h-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mb-4"></div>

          <div className="w-full flex flex-col md:flex-row gap-6">
            <ProfileOverview profile={profile} />
            <RecentActivity activity={activity} />
          </div>

          <StatsGrid stats={stats} />

          <div className="grid md:grid-cols-2 gap-6 w-full">
            <MonthlyActivity stats={stats} />
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  );
}
