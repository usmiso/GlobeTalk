"use client";

import Link from "next/link";

export default function QuickActions() {
  return (
    <div className="border-[0.5px] border-gray-200 bg-gray-50 rounded-lg p-4 flex-1 min-w-[320px] flex flex-col justify-center">
      <div className="p-4 border-b-[0.5px] border-gray-200 font-semibold">Quick Actions</div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-2 gap-4">
        <Link
          href="/pages/matchmaking"
          className="h-20 border border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <img src="/images/pals.png" alt="Find Pen Pal" className="h-8 w-8" />
          Find New Pen Pal
        </Link>
        <Link
          href="/pages/inbox"
          className="h-20 border border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <img src="/images/lettersimg.png" alt="Write Letter" className="h-8 w-8" />
          Write Letter
        </Link>
        <Link
          href="/pages/inbox"
          className="h-20 border border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <img src="/images/letters.png" alt="Check Inbox" className="h-8 w-8" />
          Check Inbox
        </Link>
        <Link
          href="/pages/userprofile"
          className="h-20 border border-gray-200 bg-gray-50 rounded flex flex-col justify-center items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <img src="/images/profilelogo.png" alt="Edit Profile" className="h-8 w-8" />
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
