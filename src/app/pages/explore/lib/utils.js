// Utility helpers for Explore page

// Parse country.csv into a code -> country name map
export function parseCountryCSV(csv) {
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

// Build REST Countries API URL
export function getCountryAPIUrl(countryName) {
  const encodedName = encodeURIComponent(countryName.trim());
  return `https://restcountries.com/v3.1/name/${encodedName}`;
}
