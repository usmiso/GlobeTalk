// "use client";
// import { useState, useEffect } from "react";
// import {
//   Search,
//   Globe,
//   Users,
//   Utensils,
//   Calendar,
//   Heart,
//   BookOpen,
// } from "lucide-react";
// import Papa from "papaparse"; // npm install papaparse
// import { useRouter } from "next/navigation";
// import { auth } from "../../firebase/auth";
// import LANGUAGES_LIST from "../../../../public/assets/languages.js";
// import geonamesTimezones from "../../../../public/assets/geonames_timezone.json";

// const categories = [
//   { name: "All", icon: Globe },
//   { name: "Traditions", icon: Users },
//   { name: "Food", icon: Utensils },
//   { name: "Holidays", icon: Calendar },
//   { name: "Customs", icon: Heart },
//   { name: "Language", icon: BookOpen },
// ];

// // ✅ Helper to parse country.csv
// function parseCountryCSV(csv) {
//   const lines = csv.trim().split("\n");
//   const map = {};
//   for (const line of lines) {
//     const [code, ...nameParts] = line.split(",");
//     if (code && nameParts.length) {
//       map[code] = nameParts.join(",").replace(/"/g, "").trim();
//     }
//   }
//   return map;
// }

// // ✅ REST Countries API URL
// function getCountryAPIUrl(countryName) {
//   const encodedName = encodeURIComponent(countryName.trim());
//   return `https://restcountries.com/v3.1/name/${encodedName}`;
// }

// export default function ExplorePage({ userID }) {
//   const [selectedTab, setSelectedTab] = useState("facts"); // facts | profiles
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [facts, setFacts] = useState([]);
//   const [countryMap, setCountryMap] = useState(null);
//   const [profiles, setProfiles] = useState([]);
//   const [selectedCountry, setSelectedCountry] = useState(null);

//   const router = useRouter();

//   // Load country.csv
//   useEffect(() => {
//     const fetchCountryCSV = async () => {
//       try {
//         const res = await fetch("/assets/country.csv");
//         if (res.ok) {
//           const text = await res.text();
//           setCountryMap(parseCountryCSV(text));
//           console.log("Country CSV loaded successfully.");
//         }
//       } catch (err) {
//         console.error("Failed to load country CSV:", err);
//         setCountryMap({});
//       }
//     };
//     fetchCountryCSV();
//   }, []);

//   // Fetch facts + country profiles
//   useEffect(() => {
//     if (!countryMap) return;

//     let interval;

//     const fetchData = async () => {
//       const user = auth.currentUser;
//       if (!user) return;

//       try {
//         // 1️⃣ Get matched users' timezones
//         const res = await fetch(`http://localhost:5000/api/matchedUsers?userID=${user.uid}`);
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL;
//         // const res = await fetch(`${apiUrl}/api/profile?userID=${user.uid}`);
//         const timezones = await res.json();

//         if (!timezones.length) {
//           setFacts([]);
//           setProfiles([]);
//           return;
//         }

//         // 2️⃣ Convert timezones → countries
//         const countries = timezones
//           .map((tzString) => {
//             const normalizedTz = tzString.split(" ")[0];
//             const tzObj = geonamesTimezones.find(
//               (e) => e.timezone_id === normalizedTz
//             );
//             if (tzObj && tzObj.country_code && countryMap[tzObj.country_code]) {
//               return countryMap[tzObj.country_code];
//             }
//             return null;
//           })
//           .filter(Boolean);

//         if (!countries.length) {
//           setFacts([]);
//           setProfiles([]);
//           return;
//         }

//         // 3️⃣ Fetch CSV file
//         const csvRes = await fetch("/assets/explorer.csv");
//         const csvText = await csvRes.text();
//         const parsed = Papa.parse(csvText, { header: true });
//         const allRows = parsed.data;

//         // 4️⃣ Filter rows by mapped countries
//         const filteredFacts = allRows
//           .filter((row) => countries.includes(row.country))
//           .map((row) => ({
//             title: row.title,
//             category: row.category,
//             location: row.location,
//             description: row.description,
//           }));
//         setFacts(filteredFacts);

//         // 5️⃣ Fetch profiles from REST Countries API
//         const countryData = await Promise.all(
//           countries.map(async (countryName) => {
//             try {
//               const url = getCountryAPIUrl(countryName);
//               const response = await fetch(url);
//               const data = await response.json();

//               if (!Array.isArray(data) || !data.length) return null;
//               const c = data[0];

//               return {
//                 cca2: c.cca2,
//                 name: c.name?.common || countryName,
//                 region: c.region || "Unknown",
//                 population: c.population?.toLocaleString() || "N/A",
//                 timezone: c.timezones ? c.timezones.join(", ") : "N/A",
//                 currency: c.currencies
//                   ? Object.values(c.currencies)[0]?.name
//                   : "N/A",
//                 languages: c.languages ? Object.values(c.languages) : [],
//                 coatOfArms: c.coatOfArms?.svg || "",
//                 countryFlag: c.flags?.svg || "",
//               };
//             } catch {
//               return null;
//             }
//           })
//         );

//         const validProfiles = countryData.filter(Boolean);
//         setProfiles(validProfiles);

//         if (validProfiles.length && !selectedCountry) {
//           setSelectedCountry(validProfiles[0]);
//         }
//       } catch (err) {
//         console.error("Error fetching explorer data:", err);
//         setFacts([]);
//         setProfiles([]);
//       }
//     };

//     fetchData();
//     interval = setInterval(fetchData, 10000);

//     return () => clearInterval(interval);
//   }, [countryMap]);

//   // ✅ Filter facts
//   const filteredFacts = facts.filter((fact) => {
//     const matchesCategory =
//       selectedCategory === "All" ||
//       fact.category.toLowerCase() === selectedCategory.toLowerCase();
//     const matchesSearch =
//       fact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       fact.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       fact.description.toLowerCase().includes(searchTerm.toLowerCase());
//     return matchesCategory && matchesSearch;
//   });

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
//         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Globe className="h-6 w-6 text-primary" />
//             <h1 className="text-xl font-bold text-foreground">GlobeTalk</h1>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8 max-w-7xl">
//         {/* Tabs */}
//         <div className="text-center mb-8">
//           <div className="flex justify-center items-center gap-2 mb-4">
//             <Search className="h-8 w-8 text-primary" />
//             <h1 className="text-4xl font-bold">Cultural Explorer</h1>
//           </div>
//           <p className="text-lg text-muted-foreground">
//             Discover fascinating traditions, customs, and stories from around
//             the world:
//           </p>

//           {/* Tablist */}
//           <div
//             role="tablist"
//             className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-2 mt-4"
//           >
//             <button
//               type="button"
//               role="tab"
//               onClick={() => setSelectedTab("facts")}
//               className={`${
//                 selectedTab === "facts"
//                   ? "bg-background text-foreground shadow-sm"
//                   : "hover:bg-accent hover:text-accent-foreground"
//               } px-2 py-1 rounded-md text-sm font-medium`}
//             >
//               Cultural Facts
//             </button>
//             <button
//               type="button"
//               role="tab"
//               onClick={() => setSelectedTab("profiles")}
//               className={`${
//                 selectedTab === "profiles"
//                   ? "bg-background text-foreground shadow-sm"
//                   : "hover:bg-accent hover:text-accent-foreground"
//               } px-2 py-1 rounded-md text-sm font-medium`}
//             >
//               Country Profiles
//             </button>
//           </div>
//         </div>

//         {/* ✅ Tab Content */}
//         {selectedTab === "facts" && (
//           <>
//             {/* Search */}
//             <div className="relative mb-4">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
//               <input
//                 type="text"
//                 placeholder="Search for traditions, countries, or customs..."
//                 className="pl-10 pr-3 py-2 w-full border-[0.5px] border-gray-200  rounded-md shadow-sm bg-background focus:ring-2 focus:ring-primary outline-none"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>

//             {/* Categories */}
//             <div className="flex flex-wrap gap-2 mb-6">
//               {categories.map(({ name, icon: Icon }) => (
//                 <button
//                   key={name}
//                   onClick={() => setSelectedCategory(name)}
//                   className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition ${
//                     selectedCategory === name
//                       ? "bg-primary text-primary-foreground shadow"
//                       : "border-[0.5px] border-gray-200  hover:bg-accent hover:text-accent-foreground"
//                   }`}
//                 >
//                   <Icon className="h-4 w-4" />
//                   {name}
//                 </button>
//               ))}
//             </div>

//             {/* Facts */}
//             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//               {filteredFacts.map((fact, i) => (
//                 <div
//                   key={i}
//                   className="border-[0.5px] border-gray-200 rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition"
//                 >
//                   <h2 className="font-semibold text-lg">{fact.title}</h2>
//                   <p className="text-sm text-muted-foreground">
//                     {fact.category}
//                   </p>
//                   <p className="mt-1 text-sm font-medium">{fact.location}</p>
//                   <p className="mt-3 text-sm">{fact.description}</p>
//                 </div>
//               ))}
//               {filteredFacts.length === 0 && (
//                 <p className="text-center text-muted-foreground col-span-full">
//                   No cultural facts found.
//                 </p>
//               )}
//             </div>
//           </>
//         )}

//         {selectedTab === "profiles" && (
//           <div className="grid gap-6 md:grid-cols-2">
//             {/* Country List */}
//             <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border-[0.5px] border-gray-200  py-6 shadow-sm">
//               <div className="px-6">
//                 <div className="leading-none font-semibold">
//                   Country Profiles
//                 </div>
//                 <div className="text-muted-foreground text-sm">
//                   Learn about countries where your pen pals live
//                 </div>
//               </div>
//               <div className="relative h-[500px] overflow-y-scroll">
//                 {profiles.map((c, i) => (
//                   <div
//                     key={i}
//                     onClick={() => setSelectedCountry(c)}
//                     className={`p-4 border-[0.5px] border-gray-200 cursor-pointer hover:bg-muted/50 transition-colors ${
//                       selectedCountry?.name === c.name ? "bg-muted" : ""
//                     }`}
//                   >
//                     <div className="flex items-center gap-3">
//                       <img
//                         src={c.countryFlag}
//                         alt={`${c.name} flag`}
//                         className="w-8 h-5 object-cover"
//                       />
//                       <div>
//                         <h4 className="font-medium">{c.name}</h4>
//                         <p className="text-sm text-muted-foreground">
//                           {c.region}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Selected Country */}
//             {selectedCountry && (
//               <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border-[0.5px] border-gray-200 py-6 shadow-sm">
//                 <div className="px-6 flex flex-col items-center gap-2">
//                   <img
//                     src={selectedCountry.countryFlag}
//                     alt={`${selectedCountry.name} flag`}
//                     className="w-24 h-16 object-cover"
//                   />
//                   {selectedCountry.coatOfArms && (
//                     <img
//                       src={selectedCountry.coatOfArms}
//                       alt={`${selectedCountry.name} coat of arms`}
//                       className="w-24 h-24 object-contain"
//                     />
//                   )}
//                   <h2 className="text-2xl font-semibold">
//                     {selectedCountry.name}
//                   </h2>
//                   <p className="text-sm text-muted-foreground">
//                     {selectedCountry.region}
//                   </p>
//                 </div>
//                 <div className="px-6 space-y-4">
//                   <div className="grid gap-3">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm font-medium">Population:</span>
//                       <span className="text-sm text-muted-foreground">
//                         {selectedCountry.population}
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm font-medium">Time Zone:</span>
//                       <span className="text-sm text-muted-foreground">
//                         {selectedCountry.timezone}
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm font-medium">Currency:</span>
//                       <span className="text-sm text-muted-foreground">
//                         {selectedCountry.currency}
//                       </span>
//                     </div>
//                     <div className="flex items-start justify-between">
//                       <span className="text-sm font-medium">Languages:</span>
//                       <div className="flex flex-wrap gap-1 justify-end">
//                         {selectedCountry.languages.map((lang, i) => (
//                           <span
//                             key={i}
//                             className="inline-flex items-center justify-center rounded-md border-[0.5px] border-gray-200 px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 bg-secondary text-secondary-foreground text-xs"
//                           >
//                             {lang}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }






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
        const res = await fetch(`http://localhost:5000/api/matchedUsers?userID=${user.uid}`);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        // const res = await fetch(`${apiUrl}/api/profile?userID=${user.uid}`);
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
    <div className="min-h-screen bg-background">
      {/* New Header / Navigation (added) */}
      <header className="w-full bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/images/globe.png" alt="GlobeTalk Logo" className="w-6 h-6" />
          <span className="font-bold text-lg">GlobeTalk</span>
        </div>
        <nav className="flex items-center gap-10 mb-3 mt-2">
          <Link href="/pages/dashboard" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
            Dashboard
          </Link>
          <Link href="/pages/matchmaking" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
            Match
          </Link>
          <Link href="/pages/inbox" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
            Inbox
          </Link>
          <Link href="/pages/explorer" className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Explore
          </Link>
          <Link href="/pages/settings" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
            Settings
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tabs */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Cultural Explorer</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Discover fascinating traditions, customs, and stories from around
            the world:
          </p>

          {/* Tablist */}
          <div
            role="tablist"
            className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-2 mt-4"
          >
            <button
              type="button"
              role="tab"
              onClick={() => setSelectedTab("facts")}
              className={`${
                selectedTab === "facts"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-accent hover:text-accent-foreground"
              } px-2 py-1 rounded-md text-sm font-medium`}
            >
              Cultural Facts
            </button>
            <button
              type="button"
              role="tab"
              onClick={() => setSelectedTab("profiles")}
              className={`${
                selectedTab === "profiles"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-accent hover:text-accent-foreground"
              } px-2 py-1 rounded-md text-sm font-medium`}
            >
              Country Profiles
            </button>
          </div>
        </div>

        {/* ✅ Tab Content */}
        {selectedTab === "facts" && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search for traditions, countries, or customs..."
                className="pl-10 pr-3 py-2 w-full border-[0.5px] border-gray-200  rounded-md shadow-sm bg-background focus:ring-2 focus:ring-primary outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition ${
                    selectedCategory === name
                      ? "bg-primary text-primary-foreground shadow"
                      : "border-[0.5px] border-gray-200  hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {name}
                </button>
              ))}
            </div>

            {/* Facts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredFacts.map((fact, i) => (
                <div
                  key={i}
                  className="border-[0.5px] border-gray-200 rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition"
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
          </>
        )}

        {selectedTab === "profiles" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Country List */}
            <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border-[0.5px] border-gray-200  py-6 shadow-sm">
              <div className="px-6">
                <div className="leading-none font-semibold">Country Profiles</div>
                <div className="text-muted-foreground text-sm">Learn about countries where your pen pals live</div>
              </div>
              <div className="relative h-[500px] overflow-y-scroll">
                {profiles.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedCountry(c)}
                    className={`p-4 border-[0.5px] border-gray-300 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedCountry?.name === c.name ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.countryFlag}
                        alt={`${c.name} flag`}
                        className="w-8 h-5 object-cover"
                      />
                      <div>
                        <h4 className="font-medium">{c.name}</h4>
                        <p className="text-sm text-muted-foreground">{c.region}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Country */}
            {selectedCountry && (
              <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border-[0.5px] border-gray-200 py-6 shadow-sm">
                <div className="px-6 flex flex-col items-center gap-2">
                  <img
                    src={selectedCountry.countryFlag}
                    alt={`${selectedCountry.name} flag`}
                    className="w-24 h-16 object-cover"
                  />
                  {selectedCountry.coatOfArms && (
                    <img
                      src={selectedCountry.coatOfArms}
                      alt={`${selectedCountry.name} coat of arms`}
                      className="w-24 h-24 object-contain"
                    />
                  )}
                  <h2 className="text-2xl font-semibold">{selectedCountry.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedCountry.region}</p>
                </div>
                <div className="px-6 space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Population:</span>
                      <span className="text-sm text-muted-foreground">{selectedCountry.population}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Time Zone:</span>
                      <span className="text-sm text-muted-foreground">{selectedCountry.timezone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Currency:</span>
                      <span className="text-sm text-muted-foreground">{selectedCountry.currency}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">Languages:</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {selectedCountry.languages.map((lang, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center justify-center rounded-md border-[0.5px] border-gray-200 px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 bg-secondary text-secondary-foreground text-xs"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}















