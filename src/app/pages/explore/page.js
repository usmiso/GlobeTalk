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
} from "lucide-react";
import Papa from "papaparse"; // npm install papaparse
import Link from "next/link"; // required for the new header
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import LANGUAGES_LIST from "../../../../public/assets/languages.js";
import geonamesTimezones from "../../../../public/assets/geonames_timezone.json";
import Navbar from "@/app/components/Navbar";
import ProtectedLayout from "@/app/components/ProtectedLayout";

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
  const [selectedTab, setSelectedTab] = useState("facts"); // facts | profiles
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [facts, setFacts] = useState([]);
  const [countryMap, setCountryMap] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const router = useRouter();

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
      if (!user) return;

      try {
        // 1️⃣ Get matched users' timezones
        //const res = await fetch(`http://localhost:5000/api/matchedUsers?userID=${user.uid}`);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/api/profile?userID=${user.uid}`);
        const timezones = await res.json();

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
      }
    };

    fetchData();
    interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, [countryMap]);

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

  return (
    <ProtectedLayout redirectTo="/">
      <div className="min-h-screen bg-gray-100 py-2 px-4 space-y-6">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
          {/* ...existing code... */}
        </main>
      </div>
    </ProtectedLayout>
  );
}
