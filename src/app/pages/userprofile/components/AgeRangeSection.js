"use client";

export default function AgeRangeSection({ ageRange, setAgeRange, ageRanges }) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-2">Age Range</h2>
      <select
        value={ageRange}
        onChange={(e) => setAgeRange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2"
      >
        <option value="">Select age range</option>
        {ageRanges.map((range, i) => (
          <option key={i} value={range}>
            {range}
          </option>
        ))}
      </select>
    </section>
  );
}
