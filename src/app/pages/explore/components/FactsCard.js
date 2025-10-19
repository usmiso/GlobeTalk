"use client";

export default function FactsCard({ fact }) {
  return (
    <div className="border-[0.5px] border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
      <h2 className="font-semibold text-lg">{fact.title}</h2>
      <p className="text-sm text-muted-foreground">{fact.category}</p>
      <p className="mt-1 text-sm font-medium">{fact.location}</p>
      <p className="mt-3 text-sm">{fact.description}</p>
    </div>
  );
}
