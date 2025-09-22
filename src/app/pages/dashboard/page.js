// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { signOutUser } from "../../firebase/auth"; // make sure this path is correct

// export default function Dashboard() {
//   const router = useRouter();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const handleLogout = async () => {
//     try {
//       await signOutUser(); // call Firebase logout
//       router.push("/"); // redirect to home after logout
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       {sidebarOpen && (
//         <aside
//           className="flex flex-col justify-between transition-all duration-300"
//           style={{
//             backgroundColor: "#6492BD",
//             width: "13rem",
//           }}
//         >
//           {/* GlobeTalk & Toggle */}
//           <div className="flex flex-row items-start p-2 sm:gap-15 sm:p-5">
//             <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
//               <img
//                 src="/images/globe.png"
//                 alt="GlobeTalk Logo"
//                 className="w-5 h-5 sm:w-6 sm:h-6 object-cover"
//               />
//               <p className="text-xs sm:text-sm lg:text-base font-bold text-black">
//                 GlobeTalk
//               </p>
//             </div>

//             <button
//               onClick={() => setSidebarOpen(false)}
//               className="p-1 sm:p-1 rounded text-black font-bold text-sm sm:text-base mb-2 sm:mb-0"
//             >
//               ☰
//             </button>
//           </div>

//           {/* Menu */}
//           <div className="flex flex-col justify-between h-full p-2 sm:p-3">
//             <nav className="space-y-1 sm:space-y-2">
//               <button
//                 onClick={() => router.push("/pages/userprofile")}
//                 className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base"
//               >
//                 <img
//                   src="/images/profilelogo.png"
//                   alt="Profile"
//                   className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
//                 />
//                 Profile
//               </button>

//               <button
//                 onClick={() => router.push("/pages/dashboard")}
//                 className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base"
//               >
//                 <img
//                   src="/images/letters.png"
//                   alt="Letters"
//                   className="w-5 h-5 sm:w-6 sm:h-7 rounded-full object-cover"
//                 />
//                 Letters
//               </button>
//             </nav>

//             <button
//               onClick={handleLogout}
//               className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base mt-2 sm:mt-4"
//             >
//               <img
//                 src="/images/logout.png"
//                 alt="Logout"
//                 className="w-5 h-5 sm:w-6 sm:h-6 object-cover"
//               />
//               Logout
//             </button>
//           </div>
//         </aside>
//       )}

//       {/* Main content */}
//       <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-auto relative">
//         {/* Show Sidebar Button */}
//         {!sidebarOpen && (
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="absolute top-2 sm:top-4 left-2 sm:left-4 p-1 sm:p-2 rounded hover:bg-gray-300 text-black font-bold text-sm sm:text-base z-50"
//           >
//             ☰
//           </button>
//         )}

//         <h2 className="text-lg sm:text-xl lg:text-3xl font-bold mb-2 sm:mb-4 lg:mb-6 text-center">
//           WELCOME TO GLOBETALK
//         </h2>

//         {/* Journey Card */}
//         <div className="bg-white shadow-md rounded-2xl p-2 sm:p-4 mb-2 sm:mb-4 lg:mb-6">
//           <h3 className="text-sm sm:text-base lg:text-xl font-semibold mb-1 sm:mb-2 lg:mb-4">
//             Your Journey
//           </h3>
//           <div className="flex items-start gap-1 sm:gap-2 flex-wrap">
//             <ul className="space-y-1 sm:space-y-2 text-gray-700 text-xs sm:text-sm lg:text-base">
//               Nothing to show yet
//             </ul>
//           </div>
//         </div>

//         {/* Letters Card */}
//         <div className="bg-white shadow-md rounded-2xl p-12 sm:p-12 mb-2 sm:mb-4 lg:mb-6">
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
//             <div className="flex items-center gap-1 sm:gap-2">
//               <img
//                 src="/images/lettersimg.png"
//                 alt="Letters"
//                 className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full"
//               />
//               <p className="text-xs sm:text-sm lg:text-base font-medium">
//                 2 New Letters
//               </p>
//             </div>

//             <button
//               onClick={() => router.push("/pages/matchmaking")}
//               className="text-blue-600 font-semibold hover:underline text-xs sm:text-sm lg:text-base mt-1 sm:mt-0"
//             >
//               Find A Pal →
//             </button>
//             <button
//               onClick={() => router.push("/pages/explorer")}
//               className="text-blue-600 font-semibold hover:underline text-xs sm:text-sm lg:text-base mt-1 sm:mt-0"
//             >
//               Cutural Explorer →
//             </button>
//           </div>
//         </div>

//         {/* Safety Reminder */}
//         <p className="text-center text-red-500 mt-85 sm:mt-85 text-xs sm:text-sm lg:text-base">
//           Safety reminder: Stay kind, no file sharing
//         </p>
//       </main>
//     </div>
//   );
// }







"use client"
import React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()

  // Mock user data
  const userProfile = {
    name: "Alex Chen",
    location: "San Francisco, USA",
    languages: ["English", "Mandarin", "Spanish"],
    interests: ["Photography", "Cooking", "Travel", "Music"],
    joinDate: "March 2024",
    avatar: "/friendly-person-avatar.png",
  }

  const stats = {
    totalLetters: 47,
    activePenPals: 8,
    countriesConnected: 12,
    averageResponseTime: "2.3 days",
    lettersThisMonth: 15,
    favoriteLetters: 23,
  }

  const recentActivity = [
    { type: "received", from: "Maria", country: "Spain", time: "2 hours ago" },
    { type: "sent", to: "Kenji", country: "Japan", time: "1 day ago" },
    { type: "matched", with: "Priya", country: "India", time: "3 days ago" },
    { type: "received", from: "Lucas", country: "Brazil", time: "5 days ago" },
  ]

  return (
<div className="bg-gray-100 min-h-screen w-full">
  <main className="flex flex-col items-center w-full min-h-screen py-2 px-4 space-y-6">
    {/* Header / Navigation */}
    <header className="w-full bg-white border-b border-gray-200 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/images/globe.png" alt="GlobeTalk Logo" className="w-6 h-6" />
        <span className="font-bold text-lg">GlobeTalk</span>
      </div>
      <nav className="flex items-center gap-10 mb-3 mt-2">
        <Link href="/pages/dashboard" className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          Dashboard
        </Link>
        <Link href="/pages/matchmaking" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
          Match
        </Link>
        <Link href="/pages/inbox" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
          Inbox
        </Link>
        <Link href="/pages/explorer" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
          Explore
        </Link>
        <Link href="/pages/settings" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
          Settings
        </Link>
      </nav>
    </header>

    {/* Welcome */}
    <div className="text-center space-y-2">
      <h1 className="text-3xl font-bold text-foreground">
        Welcome back, {userProfile.name}!
      </h1>
      <p className="text-muted-foreground">
        Your global pen pal journey continues
      </p>
    </div>

    {/* Profile Overview */}
    <div className="border-[0.5px] border-blue-200  bg-gray-50 rounded-lg shadow-sm p-4 w-full">
      <h2 className="flex items-center gap-2 font-bold mb-4">
        <img src="/images/profilelogo.png" alt="Profile Icon" className="h-5 w-5" />
        Your Profile
      </h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar + Info */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-lg">
            {userProfile.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{userProfile.name}</h3>
            <div className="text-sm text-muted-foreground">{userProfile.location}</div>
            <div className="text-sm text-muted-foreground">Joined {userProfile.joinDate}</div>
          </div>
        </div>

        {/* Languages & Interests */}
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="flex items-center font-medium mb-2">
              <img src="/images/Language.jpg" alt="Languages" className="h-5 w-5 mr-1" />
              Language
            </h4>
            <div className="flex flex-wrap gap-1">
              {userProfile.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-1 text-xs rounded bg-gray-100 border-[0.5px] border-gray-300"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="flex items-center font-medium mb-2">
              <img src="/images/hobbies.jpg" alt="Hobbies" className="h-4 w-4 mr-1" />
              Hobbies
            </h4>
            <div className="flex flex-wrap gap-1">
              {userProfile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-1 text-xs rounded bg-gray-100 border-[0.5px] border-gray-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button className="self-start px-3 py-1 border-[0.5px] border-gray-200 rounded flex items-center gap-2">
          <img src="/images/editprofile.jpg" alt="Edit" className="h-4 w-4" />
          Edit Profile
        </button>
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
        <img src="/images/mail.jpg" alt="Mail" className="h-18 w-18" />
        <div className="text-2xl font-bold">{stats.totalLetters}</div>
        <div className="text-sm text-muted-foreground">Total Letters</div>
      </div>
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
        <img src="/images/active_pals.jpg" alt="Active Pals" className="h-18 w-18" />
        <div className="text-2xl font-bold">{stats.activePenPals}</div>
        <div className="text-sm text-muted-foreground">Active Pen Pals</div>
      </div>
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
        <img src="/images/globe.png" alt="Globe" className="h-18 w-18" />
        <div className="text-2xl font-bold">{stats.countriesConnected}</div>
        <div className="text-sm text-muted-foreground">Countries</div>
      </div>
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
        <img src="/images/time.jpg" alt="Time" className="h-18 w-18" />
        <div className="text-2xl font-bold">{stats.averageResponseTime}</div>
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
              <span>{stats.lettersThisMonth}/20 goal</span>
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-blue-500 rounded"
                style={{ width: `${(stats.lettersThisMonth / 20) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.lettersThisMonth}</div>
              <div className="text-sm text-muted-foreground">Letters Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-500">{stats.favoriteLetters}</div>
              <div className="text-sm text-muted-foreground">Favorites</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg">
        <div className="p-4 font-semibold border-b-[0.5px] border-gray-200">Recent Activity</div>
        <div className="p-4 space-y-3">
          {recentActivity.map((a, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded bg-gray-50">
              <div
                className={`h-2 w-2 rounded-full ${
                  a.type === "received"
                    ? "bg-green-500"
                    : a.type === "sent"
                    ? "bg-blue-500"
                    : "bg-purple-500"
                }`}
              />
              <div className="flex-1 text-sm">
                {a.type === "received" && <>Received letter from <strong>{a.from}</strong> in {a.country}</>}
                {a.type === "sent" && <>Sent letter to <strong>{a.to}</strong> in {a.country}</>}
                {a.type === "matched" && <>New match with <strong>{a.with}</strong> from {a.country}</>}
              </div>
              <div className="text-xs text-muted-foreground">{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 w-full">
      <div className="p-4 border-b-[0.5px] border-gray-200 font-semibold">Quick Actions</div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-1">
        <Link
          href="/pages/matchmaking"
          className="h-20 border-[0.5px] border-gray-200 bg-gray-50  rounded flex flex-col justify-center items-center gap-2 hover:bg-blue-400 hover:text-white"
        >
          <img src="/images/pals.png" alt="Find Pen Pal" className="h-8 w-8" />
          Find New Pen Pal
        </Link>

        <Link
          href="/pages/write-letter"
          className="h-20 border-[0.5px] border-gray-200  bg-gray-50 rounded flex flex-col justify-center items-center gap-2 hover:bg-blue-400 hover:text-white"
        >
          <img src="/images/lettersimg.png" alt="Write Letter" className="h-8 w-8" />
          Write Letter
        </Link>

        <Link
          href="/pages/inbox"
          className="h-20 border-[0.5px] border-gray-200  bg-gray-50 rounded flex flex-col justify-center items-center gap-2 hover:bg-blue-400 hover:text-white"
        >
          <img src="/images/letters.png" alt="Check Inbox" className="h-8 w-8" />
          Check Inbox
        </Link>

        <Link
          href="/pages/userprofile"
          className="h-20 border-[0.5px] border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 hover:bg-blue-400 hover:text-white"
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