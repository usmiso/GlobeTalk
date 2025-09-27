"use client"

import Link from "next/link"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";


const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardPage() {

  const EMPTY_STATS = {
    totalLetters: 0,
    activePenPals: 0,
    countriesConnected: 0,
    averageResponseTime: "—",
    lettersThisMonth: 0,
    favoriteLetters: 0,
    activity: [],
  };

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = API;
        const res = await fetch(`${apiUrl}/api/stats?userID=${auth.currentUser.uid}`);
        const data = await res.json();
        setStats({ ...EMPTY_STATS, ...data });
        setActivity(Array.isArray(data.activity) ? data.activity : []);
      } catch (err) {
        console.error("Error loading stats:", err);
      }
    };
    if (auth.currentUser) fetchStats();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const res = await fetch(`${API}/api/profile?userID=${user.uid}`);
          if (!res.ok) throw new Error("Profile fetch failed");
          const data = await res.json();

          if (Array.isArray(data.language)) {
            data.language = data.language;
          } else if (typeof data.language === "string" && data.language.trim() !== "") {
            data.language = [data.language];
          } else {
            data.language = [];
          }

          if (Array.isArray(data.hobbies)) {
            data.hobbies = data.hobbies;
          } else if (typeof data.hobbies === "string" && data.hobbies.trim() !== "") {
            data.hobbies = [data.hobbies];
          } else {
            data.hobbies = [];
          }

          setProfile(data);
        } catch (err) {
          console.error("Error loading profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login"); // or redirect somewhere
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return <div className="p-6">No profile data found.</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}


      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full min-h-screen py-2 px-4 space-y-6">
        <Navbar />
        {/* Welcome */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile.username || "Friend"}!
          </h1>
          <p className="text-muted-foreground">
            Your global pen pal journey continues
          </p>
        </div>

        {/* Profile Overview */}
        <div className="border-[0.5px] border-blue-200 bg-gray-50 rounded-lg shadow-sm p-6 w-full">
          <h2 className="flex items-center gap-2 font-bold mb-6">
            Your Profile
          </h2>

          <div className="flex flex-col md:flex-row gap-10">
            {/* Avatar + Info */}
            <div className="flex items-center gap-6">
              <img
                src={profile.avatarUrl || "/default-avatar.png"}
                alt="avatar"
                className="h-20 w-20 rounded-full object-cover"
              />
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{profile.username}</h3>
                {/* Made muted text darker + slightly bolder */}
                <div className="text-sm text-gray-600 font-medium">{profile.timezone}</div>
                <div className="text-sm text-gray-600 font-medium">
                  Joined {profile.joinDate || "Unknown"}
                </div>
              </div>
            </div>
            
            {/* Languages & Interests */}
            <div className="flex-1 space-y-8 pl-4">
              <div>
                <h4 className="flex items-center font-semibold mb-3 text-lg">
                  <img src="/images/Language.jpg" alt="Languages" className="h-6 w-6 mr-2" />
                  Languages
                </h4>
                <div className="flex flex-wrap gap-3">
                  {profile.language?.map((lang, i) => (
                    <span
                      key={i}
                      className="px-4 text-base rounded-md bg-gray-100 border border-gray-300 font-medium 
                      duration-200 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 cursor-pointer
                     py-2 
             transition-transform transform hover:scale-105 hover:shadow-md"
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
                      className="px-4 text-base rounded-md bg-gray-100 border border-gray-300 font-medium 
                      duration-200 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 cursor-pointer
                     py-2 
             transition-transform transform hover:scale-105 hover:shadow-md"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            </div>


            {/* Edit Button */}
            <button
              onClick={() => router.push("/pages/userprofile")}
              className="self-start px-3 py-2  flex items-center gap-2
              text-base rounded-md bg-gray-100 border border-gray-300 font-medium 
                      duration-200  hover:text-blue-700 cursor-pointer
             transition-transform transform hover:scale-105 hover:shadow-md"
            >
              <img src="/images/editprofile.jpg" alt="Edit" className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
            <img src="/images/mail.jpg" alt="Mail" className="h-18 w-18" />
            <div className="text-2xl font-bold">{stats?.totalLetters ?? 0}</div>
            <div className="text-sm text-muted-foreground">Total Letters</div>
          </div>
          <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
            <img src="/images/active_pals.jpg" alt="Active Pals" className="h-18 w-18" />
            <div className="text-2xl font-bold">{stats?.activePenPals ?? 0}</div>
            <div className="text-sm text-muted-foreground">Active Pen Pals</div>
          </div>
          <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
            <img src="/images/globe.png" alt="Globe" className="h-18 w-18" />
            <div className="text-2xl font-bold">{stats?.countriesConnected ?? 0}</div>
            <div className="text-sm text-muted-foreground">Countries</div>
          </div>
          <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
            <img src="/images/time.jpg" alt="Time" className="h-18 w-18" />
            <div className="text-2xl font-bold">{stats?.averageResponseTime ?? "—"}</div>
            <div className="text-sm text-muted-foreground">Avg Response</div>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="grid md:grid-cols-2 gap-6 w-full">
          {/* Monthly Progress */}
          <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg">
            <div className="p-4 font-semibold border-b-[0.5px] border-gray-200">This Month's Activity</div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Letters Sent</span>
                  <span>{stats?.lettersThisMonth ?? 0}/20 goal</span>
                </div>
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${((stats?.lettersThisMonth ?? 0) / 20) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats?.lettersThisMonth ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Letters Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-500">{stats?.favoriteLetters ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Favorites</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border-[0.5px] border-gray-200 bg-gray-50 rounded-lg">
            <div className="p-4 font-semibold border-b-[0.5px] border-gray-200">
              Recent Activity
            </div>
            <div className="p-4 space-y-3">
              {Array.isArray(activity) && activity.length > 0 ? (
                activity.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded bg-gray-50">
                    {/* Colored dot */}
                    <div
                      className={`h-2 w-2 rounded-full ${a.type === "received"
                          ? "bg-green-500"
                          : a.type === "sent"
                            ? "bg-blue-500"
                            : "bg-purple-500"
                        }`}
                    />

                    {/* Activity message */}
                    <div className="flex-1 text-sm">
                      {a.type === "received" && (
                        <>Received a letter: <strong>{a.text}</strong></>
                      )}
                      {a.type === "sent" && (
                        <>Sent a letter: <strong>{a.text}</strong></>
                      )}
                      {a.type === "match" && (
                        <>New match with <strong>{a.otherUsername}</strong></>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">No recent activity yet</div>
              )}
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 w-full">
          <div className="p-4 border-b-[0.5px] border-gray-200 font-semibold">Quick Actions</div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-1">
            <Link
              href="/pages/matchmaking"
              className="h-20 border border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 
              hover:shadow-lg transform hover:scale-105 transition-all duration-200"            >
              <img src="/images/pals.png" alt="Find Pen Pal" className="h-8 w-8" />
              Find New Pen Pal
            </Link>

            <Link
              href="/pages/inbox"
              className="h-20 border border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 
            hover:shadow-lg transform hover:scale-105 transition-all duration-200"            >
              <img src="/images/lettersimg.png" alt="Write Letter" className="h-8 w-8" />
              Write Letter
            </Link>

            <Link
              href="/pages/inbox"
              className="h-20 border border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 
              hover:shadow-lg transform hover:scale-105 transition-all duration-200"            >
              <img src="/images/letters.png" alt="Check Inbox" className="h-8 w-8" />
              Check Inbox
            </Link>

            <Link
              href="/pages/userprofile"
              className="h-20 border border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 
             hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <img src="/images/profilelogo.png" alt="Edit Profile" className="h-8 w-8" />
              Edit Profile
            </Link>

          </div>
        </div>
      </main>
    </div>
  )
}