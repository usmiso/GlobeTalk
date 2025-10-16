"use client";
import { Search } from "lucide-react";

export default function ExploreHeader({ selectedTab, setSelectedTab }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Cultural Explorer</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Discover fascinating traditions, customs, and stories from around the world:
        </p>

      </div>
      {/* Tabs */}
      <div
        role="tablist"
        className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-2 mt-4"
      >
        <button
          type="button"
          role="tab"
          onClick={() => setSelectedTab("facts")}
          className={`bg-white ml-5 mr-5 shadow-sm px-2 py-1 rounded-md text-sm font-medium border-2 transition-all duration-150 ${
            selectedTab === "facts"
              ? "border-blue-500 text-blue-700 font-bold"
              : "border-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          Cultural Facts
        </button>
        <button
          type="button"
          role="tab"
          onClick={() => setSelectedTab("profiles")}
          className={`bg-white ml-5 mr-5 shadow-sm px-2 py-1 rounded-md text-sm font-medium border-2 transition-all duration-150 ${
            selectedTab === "profiles"
              ? "border-blue-500 text-blue-700 font-bold"
              : "border-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          Country Profiles
        </button>
      </div>
    </div>
  );
}
