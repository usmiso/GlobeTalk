"use client";

export default function CountryListItem({ country, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 border-[0.5px] border-gray-300 cursor-pointer hover:bg-muted/50 transition-colors ${
        isSelected ? "bg-muted" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <img src={country.countryFlag} alt={`${country.name} flag`} className="w-6 h-4 object-cover" />
        <div>
          <h4 className="font-medium text-sm">{country.name}</h4>
          <p className="text-xs text-muted-foreground">{country.region}</p>
        </div>
      </div>
    </div>
  );
}
