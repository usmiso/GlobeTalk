"use client";
import { Search } from "lucide-react";

export default function SearchInput({ value, onChange }) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <input
        type="text"
        placeholder="Search for traditions, countries, or customs..."
        className="pl-10 pr-3 py-2 w-full border-[0.5px] border-gray-200 rounded-md shadow-sm bg-white focus:ring-2 focus:ring-primary outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
