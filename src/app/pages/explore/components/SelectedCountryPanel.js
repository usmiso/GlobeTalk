"use client";

export default function SelectedCountryPanel({ country }) {
  if (!country) return null;
  return (
    <div className="bg-white text-card-foreground flex flex-col gap-2 rounded-xl border-[0.5px] border-gray-200 py-4 shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <img src={country.countryFlag} alt={`${country.name} flag`} className="w-20 h-12 object-cover" />
        {country.coatOfArms && (
          <img src={country.coatOfArms} alt={`${country.name} coat of arms`} className="w-20 h-20 object-contain" />
        )}
        <h2 className="text-xl font-semibold">{country.name}</h2>
        <p className="text-sm text-muted-foreground">{country.region}</p>
      </div>
      <div className="px-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Population:</span>
          <span>{country.population}</span>
        </div>
        <div className="flex justify-between">
          <span>Time Zone:</span>
          <span>{country.timezone}</span>
        </div>
        <div className="flex justify-between">
          <span>Currency:</span>
          <span>{country.currency}</span>
        </div>
        <div>
          <span>Languages:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {country.languages.map((lang, i) => (
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
  );
}
