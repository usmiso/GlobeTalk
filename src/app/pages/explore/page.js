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

const categories = [
  { name: "All", icon: Globe },
  { name: "Traditions", icon: Users },
  { name: "Food", icon: Utensils },
  { name: "Holidays", icon: Calendar },
  { name: "Customs", icon: Heart },
  { name: "Language", icon: BookOpen },
];

// ✅ Helper to parse country.csv
function parseCountryCSV(csv) {
  const lines = csv.trim().split("\n");
  const map = {};
  for (const line of lines) {
    const [code, ...nameParts] = line.split(",");
    if (code && nameParts.length) {
      map[code] = nameParts.join(",").replace(/"/g, "").trim();
    }
  }
  return map;
}

// ✅ REST Countries API URL
function getCountryAPIUrl(countryName) {
  const encodedName = encodeURIComponent(countryName.trim());
  return `https://restcountries.com/v3.1/name/${encodedName}`;
}

export default function ExplorePage({ userID }) {
  const [selectedTab, setSelectedTab] = useState("facts");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [facts, setFacts] = useState([]);
  const [countryMap, setCountryMap] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Quiz states
  const [quizStarted, setQuizStarted] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState({
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });
  const [currentQuestions, setCurrentQuestions] = useState([]);

  const router = useRouter();

  // Start quiz with 5 random questions
  const startQuiz = () => {
    const shuffled = [...quiz.questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    setCurrentQuestions(selected);
    setQuizStarted(true);
    setShowResult(false);
    setActiveQuestion(0);
    setResult({ score: 0, correctAnswers: 0, wrongAnswers: 0 });
  };

  // Quiz answer selection
  const onAnswerSelected = (answer, idx) => {
    setChecked(true);
    setSelectedAnswerIndex(idx);
    setSelectedAnswer(answer === currentQuestions[activeQuestion].correctAnswer);
  };

  // Calculate score and increment to next question
  const nextQuestion = () => {
    setSelectedAnswerIndex(null);
    setResult((prev) =>
      selectedAnswer
        ? {
            ...prev,
            score: prev.score + 5,
            correctAnswers: prev.correctAnswers + 1,
          }
        : {
            ...prev,
            wrongAnswers: prev.wrongAnswers + 1,
          }
    );
    if (activeQuestion !== currentQuestions.length - 1) {
      setActiveQuestion((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
    setChecked(false);
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestions([]);
  };

  const closeQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestions([]);
    setShowResult(false);
  };

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

  // Quiz Modal Component
  const QuizModal = () => (
    <div className="fixed left-0 right-0 top-0 h-[120vh] bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Country Quiz</h2>
          <button
            onClick={closeQuiz}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!showResult ? (
          <div className="quiz-container">
            <div className="flex justify-between items-center mb-6">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                Question: {activeQuestion + 1}
                <span>/{currentQuestions.length}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {currentQuestions[activeQuestion]?.question}
              </h3>
              <div className="space-y-3">
                {currentQuestions[activeQuestion]?.answers.map((answer, idx) => (
                  <button
                    key={idx}
                    onClick={() => !checked && onAnswerSelected(answer, idx)}
                    disabled={checked}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ${
                      selectedAnswerIndex === idx
                        ? checked
                          ? answer === currentQuestions[activeQuestion].correctAnswer
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-red-500 text-white border-red-500'
                          : 'bg-blue-600 text-white border-blue-600'
                        : checked && answer === currentQuestions[activeQuestion].correctAnswer
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                    } ${!checked ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </div>

            {checked ? (
              <button
                onClick={nextQuestion}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                {activeQuestion === currentQuestions.length - 1 ? '🏁 Finish Quiz' : '➡️ Next Question'}
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-xl text-lg cursor-not-allowed"
              >
                {activeQuestion === currentQuestions.length - 1 ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        ) : (
          <div className="quiz-container text-center">
            <h2 className="text-3xl font-bold text-blue-800 mb-6">🎉 Quiz Completed!</h2>
            
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="text-4xl font-bold text-blue-700 mb-2">
                {((result.score / (currentQuestions.length * 5)) * 100).toFixed(1)}%
              </h3>
              <p className="text-gray-600">Overall Score</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-green-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
                <p className="text-gray-600">Correct</p>
              </div>
              <div className="bg-white border border-red-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
                <p className="text-gray-600">Wrong</p>
              </div>
            </div>

            <div className="space-y-3 text-left bg-blue-50 rounded-xl p-4 mb-6">
              <p className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-semibold">{currentQuestions.length}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Total Score:</span>
                <span className="font-semibold">{result.score}/{currentQuestions.length * 5}</span>
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={restartQuiz}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                🔄 Try Again
              </button>
              <button
                onClick={closeQuiz}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen  py-2 px-4 space-y-6 relative overflow-hidden">
      {/* Quiz Modal */}
      {quizStarted && <QuizModal />}

      {/* Faint background image */}
      <div className="relative z-10">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Search className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Cultural Explorer</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Discover fascinating traditions, customs, and stories from around the world:
            </p>
            {/* Tabs */}
            <div
              role="tablist"
              className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-2 mt-4"
            >
              <button
                type="button"
                role="tab"
                onClick={() => setSelectedTab("facts")}
                className={`bg-white ml-5 mr-5 shadow-sm px-2 py-1 rounded-md text-sm font-medium border-2 transition-all duration-150
                  ${selectedTab === "facts" ? "border-blue-500 text-blue-700 font-bold" : "border-transparent text-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                Cultural Facts
              </button>
              <button
                type="button"
                role="tab"
                onClick={() => setSelectedTab("profiles")}
                className={`bg-white ml-5 mr-5 shadow-sm px-2 py-1 rounded-md text-sm font-medium border-2 transition-all duration-150
                  ${selectedTab === "profiles" ? "border-blue-500 text-blue-700 font-bold" : "border-transparent text-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                Country Profiles
              </button>
            </div>
          </div>

          {/* Quiz Button - Always visible in Cultural Facts tab */}
          {selectedTab === "facts" && (
            <div className="text-center mb-6">
              <button
                onClick={startQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🎯 Take the Country Quiz!
              </button>
            </div>
          )}

          {/* Search + Categories */}
          {selectedTab === "facts" && (
            <div className="space-y-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search for traditions, countries, or customs..."
                  className="pl-10 pr-3 py-2 w-full border-[0.5px] border-gray-200 rounded-md shadow-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    onClick={() => setSelectedCategory(name)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition ${
                      selectedCategory === name
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-white border-[0.5px] border-gray-200 hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {name}
                  </button>
                ))}
              </div>
              {/* Facts Grid */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredFacts.length > 0 ? (
                  filteredFacts.map((fact, i) => (
                    <div
                      key={i}
                      className="border-[0.5px] border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition"
                    >
                      <h2 className="font-semibold text-lg">{fact.title}</h2>
                      <p className="text-sm text-muted-foreground">{fact.category}</p>
                      <p className="mt-1 text-sm font-medium">{fact.location}</p>
                      <p className="mt-3 text-sm">{fact.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground text-lg mb-6">
                      No cultural facts found. Start matching with people to discover cultural facts!
                    </p>
                    <button
                      onClick={startQuiz}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      🚀 Start Quiz Challenge Instead!
                    </button>
                  </div>
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
                  <div
                    key={i}
                    onClick={() => setSelectedCountry(c)}
                    className={`p-3 border-[0.5px] border-gray-300 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedCountry?.name === c.name ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={c.countryFlag} alt={`${c.name} flag`} className="w-6 h-4 object-cover" />
                      <div>
                        <h4 className="font-medium text-sm">{c.name}</h4>
                        <p className="text-xs text-muted-foreground">{c.region}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Selected Country */}
              {selectedCountry && (
                <div className="bg-white text-card-foreground flex flex-col gap-2 rounded-xl border-[0.5px] border-gray-200 py-4 shadow-sm">
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={selectedCountry.countryFlag}
                      alt={`${selectedCountry.name} flag`}
                      className="w-20 h-12 object-cover"
                    />
                    {selectedCountry.coatOfArms && (
                      <img
                        src={selectedCountry.coatOfArms}
                        alt={`${selectedCountry.name} coat of arms`}
                        className="w-20 h-20 object-contain"
                      />
                    )}
                    <h2 className="text-xl font-semibold">{selectedCountry.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedCountry.region}</p>
                  </div>
                  <div className="px-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Population:</span>
                      <span>{selectedCountry.population}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Zone:</span>
                      <span>{selectedCountry.timezone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Currency:</span>
                      <span>{selectedCountry.currency}</span>
                    </div>
                    <div>
                      <span>Languages:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedCountry.languages.map((lang, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center justify-center rounded-md border-[0.5px] border-gray-200 px-2 py-0.5 font-medium bg-secondary text-secondary-foreground text-xs"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}