"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Globe,
  Users,
  Utensils,
  Calendar,
  Heart,
  BookOpen,
  X,
} from "lucide-react";
import Papa from "papaparse";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import LANGUAGES_LIST from "../../../../public/assets/languages.js";
import geonamesTimezones from "../../../../public/assets/geonames_timezone.json";
import Navbar from "@/app/components/Navbar";
import LoadingScreen from "@/app/components/LoadingScreen";
import { quiz } from './data.js';
import { parseCountryCSV, getCountryAPIUrl } from "./lib/utils";
import { useQuiz } from "./hooks/useQuiz";
import QuizModal from "./components/QuizModal";
import CountryListItem from "./components/CountryListItem";
import SelectedCountryPanel from "./components/SelectedCountryPanel";
import FactsCard from "./components/FactsCard";
import SearchInput from "./components/SearchInput";
import CategoriesBar from "./components/CategoriesBar";
import ExploreHeader from "./components/ExploreHeader";
import QuizCTA from "./components/QuizCTA";
import FactsEmpty from "./components/FactsEmpty";

const categories = [
  { name: "All", icon: Globe },
  { name: "Traditions", icon: Users },
  { name: "Food", icon: Utensils },
  { name: "Holidays", icon: Calendar },
  { name: "Customs", icon: Heart },
  { name: "Language", icon: BookOpen },
];

// moved helpers to ./lib/utils

export default function ExplorePage({ userID }) {
  const [selectedTab, setSelectedTab] = useState("facts");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [facts, setFacts] = useState([]);
  const [countryMap, setCountryMap] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Quiz state & actions via hook
  const {
    quizStarted,
    activeQuestion,
    selectedAnswer,
    checked,
    selectedAnswerIndex,
    showResult,
    result,
    currentQuestions,
    startQuiz,
    onAnswerSelected,
    nextQuestion,
    restartQuiz,
    closeQuiz,
  } = useQuiz(quiz);

  const router = useRouter();

  // quiz handlers moved to useQuiz

  // Load country.csv
  useEffect(() => {
    const fetchCountryCSV = async () => {
      try {
        const res = await fetch("/assets/country.csv");
        if (res.ok) {
          const text = await res.text();
          setCountryMap(parseCountryCSV(text));
          console.log("Country CSV loaded successfully.");
        }
      } catch (err) {
        console.error("Failed to load country CSV:", err);
        setCountryMap({});
      }
    };
    fetchCountryCSV();
  }, []);

  // Fetch facts + country profiles
  useEffect(() => {
    if (!countryMap) return;

    let interval;

    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (isInitialLoading) setIsInitialLoading(false);
        return;
      }

      try {
        // 1️⃣ Get matched users' timezones (from backend)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/api/matchedUsers?userID=${user.uid}`);
        const timezones = await res.json();

        // Ensure we received a list of timezone strings
        if (!Array.isArray(timezones)) {
          setFacts([]);
          setProfiles([]);
          return;
        }

        if (!timezones.length) {
          setFacts([]);
          setProfiles([]);
          return;
        }

        // 2️⃣ Convert timezones → countries
        const countries = timezones
          .map((tzString) => {
            const normalizedTz = tzString.split(" ")[0];
            const tzObj = geonamesTimezones.find(
              (e) => e.timezone_id === normalizedTz
            );
            if (tzObj && tzObj.country_code && countryMap[tzObj.country_code]) {
              return countryMap[tzObj.country_code];
            }
            return null;
          })
          .filter(Boolean);

        if (!countries.length) {
          setFacts([]);
          setProfiles([]);
          return;
        }

        // 3️⃣ Fetch CSV file
        const csvRes = await fetch("/assets/explorer.csv");
        const csvText = await csvRes.text();
        const parsed = Papa.parse(csvText, { header: true });
        const allRows = parsed.data;

        // 4️⃣ Filter rows by mapped countries
        const filteredFacts = allRows
          .filter((row) => countries.includes(row.country))
          .map((row) => ({
            title: row.title,
            category: row.category,
            location: row.location,
            description: row.description,
          }));
        setFacts(filteredFacts);

        // 5️⃣ Fetch profiles from REST Countries API
        const countryData = await Promise.all(
          countries.map(async (countryName) => {
            try {
              const url = getCountryAPIUrl(countryName);
              const response = await fetch(url);
              const data = await response.json();

              if (!Array.isArray(data) || !data.length) return null;
              const c = data[0];

              return {
                cca2: c.cca2,
                name: c.name?.common || countryName,
                region: c.region || "Unknown",
                population: c.population?.toLocaleString() || "N/A",
                timezone: c.timezones ? c.timezones.join(", ") : "N/A",
                currency: c.currencies
                  ? Object.values(c.currencies)[0]?.name
                  : "N/A",
                languages: c.languages ? Object.values(c.languages) : [],
                coatOfArms: c.coatOfArms?.svg || "",
                countryFlag: c.flags?.svg || "",
              };
            } catch {
              return null;
            }
          })
        );

        const validProfiles = countryData.filter(Boolean);
        setProfiles(validProfiles);

        if (validProfiles.length && !selectedCountry) {
          setSelectedCountry(validProfiles[0]);
        }
      } catch (err) {
        console.error("Error fetching explorer data:", err);
        setFacts([]);
        setProfiles([]);
      } finally {
        if (isInitialLoading) setIsInitialLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, [countryMap, isInitialLoading]);

  // ✅ Filter facts
  const filteredFacts = facts.filter((fact) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (fact.category && fact.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch =
      (fact.title && fact.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fact.location && fact.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fact.description && fact.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  // Quiz modal moved to component

  return (
    <div className="min-h-screen  space-y-6 relative overflow-hidden">
      {/* Quiz Modal */}
      <QuizModal
        open={quizStarted}
        activeQuestion={activeQuestion}
        checked={checked}
        selectedAnswerIndex={selectedAnswerIndex}
        selectedAnswer={selectedAnswer}
        showResult={showResult}
        result={result}
        currentQuestions={currentQuestions}
        onAnswerSelected={onAnswerSelected}
        nextQuestion={nextQuestion}
        restartQuiz={restartQuiz}
        closeQuiz={closeQuiz}
      />

      {/* Faint background image */}
      <div className="relative z-10">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
          {/* Header */}
          <ExploreHeader selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

          {/* Quiz Button - Always visible in Cultural Facts tab */}
          {selectedTab === "facts" && <QuizCTA onClick={startQuiz} />}

          {/* Search + Categories */}
          {selectedTab === "facts" && (
            <div className="space-y-4">
              <SearchInput value={searchTerm} onChange={setSearchTerm} />
              <CategoriesBar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
              />
              {/* Facts Grid */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredFacts.length > 0 ? (
                  filteredFacts.map((fact, i) => <FactsCard key={i} fact={fact} />)
                ) : (
                  <FactsEmpty onStartQuiz={startQuiz} />
                )}
              </div>
            </div>
          )}
          {/* Profiles */}
          {selectedTab === "profiles" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country List */}
              <div className="bg-white text-card-foreground flex flex-col gap-2 rounded-xl border-[0.5px] border-gray-200 py-4 shadow-sm overflow-y-auto max-h-[500px]">
                {profiles.map((c, i) => (
                  <CountryListItem
                    key={i}
                    country={c}
                    isSelected={selectedCountry?.name === c.name}
                    onClick={() => setSelectedCountry(c)}
                  />
                ))}
              </div>
              {/* Selected Country */}
              {selectedCountry && (
                <SelectedCountryPanel country={selectedCountry} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}