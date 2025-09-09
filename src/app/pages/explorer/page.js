"use client";
import { useState } from "react";
import { Search, Globe, Users, Utensils, Calendar, Heart, BookOpen } from "lucide-react";

const categories = [
  { name: "All", icon: Globe },
  { name: "Traditions", icon: Users },
  { name: "Food", icon: Utensils },
  { name: "Holidays", icon: Calendar },
  { name: "Customs", icon: Heart },
  { name: "Language", icon: BookOpen },
];

const facts = [
  {
    title: "Tanabata Festival",
    category: "Holiday",
    location: "Tokyo, Japan",
    description:
      "In Japan, people write wishes on colorful paper strips and hang them on bamboo trees during the Star Festival, celebrating the meeting of celestial lovers.",
  },
  {
    title: "Siesta Culture",
    category: "Custom",
    location: "Barcelona, Spain",
    description:
      "In Spain, the afternoon siesta isn't just about napping - it's a cultural practice that allows families to gather for lunch and rest during the hottest part of the day.",
  },
  {
    title: "Hangi Cooking",
    category: "Food",
    location: "Auckland, New Zealand",
    description:
      "Traditional Māori cooking method in New Zealand where food is cooked underground using heated rocks, creating incredibly tender and flavorful meals.",
  },
  {
    title: "Hygge Lifestyle",
    category: "Tradition",
    location: "Copenhagen, Denmark",
    description:
      "Danish concept of cozy contentment and comfortable conviviality, emphasizing simple pleasures and quality time with loved ones.",
  },
  {
    title: "Café Culture",
    category: "Custom",
    location: "Paris, France",
    description:
      "In France, cafés are social hubs where people gather to discuss philosophy, politics, and life over expertly crafted coffee and pastries.",
  },
  {
    title: "Carnival Celebrations",
    category: "Holiday",
    location: "Rio de Janeiro, Brazil",
    description:
      "Brazil's Carnival is a spectacular fusion of African, Portuguese, and indigenous cultures, featuring elaborate costumes, samba music, and street parties.",
  },
];

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFacts = facts.filter((fact) => {
    const matchesCategory =
      selectedCategory === "All" || fact.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      fact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fact.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fact.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">GlobeTalk</h1>
          </div>
          <nav className="hidden md:flex gap-4">
            {["Dashboard", "Match", "Inbox", "Explore", "Settings"].map((item) => (
              <button
                key={item}
                className={`px-3 py-1 rounded-md text-sm ${
                  item === "Explore"
                    ? "bg-primary text-primary-foreground shadow"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Cultural Explorer</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Discover fascinating traditions, customs, and stories from around the world
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search for traditions, countries, or customs..."
            className="pl-10 pr-3 py-2 w-full border rounded-md shadow-sm bg-background focus:ring-2 focus:ring-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setSelectedCategory(name)}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition ${
                selectedCategory === name
                  ? "bg-primary text-primary-foreground shadow"
                  : "border hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {name}
            </button>
          ))}
        </div>

        {/* Cultural Facts */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFacts.map((fact, i) => (
            <div
              key={i}
              className="border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition"
            >
              <h2 className="font-semibold text-lg">{fact.title}</h2>
              <p className="text-sm text-muted-foreground">{fact.category}</p>
              <p className="mt-1 text-sm font-medium">{fact.location}</p>
              <p className="mt-3 text-sm">{fact.description}</p>
            </div>
          ))}
          {filteredFacts.length === 0 && (
            <p className="text-center text-muted-foreground col-span-full">
              No cultural facts found.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
