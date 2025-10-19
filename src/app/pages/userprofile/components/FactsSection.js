"use client";

export default function FactsSection({ facts, setFacts }) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-2">Facts</h2>
      <textarea
        placeholder="Fun facts about your country or region..."
        value={facts}
        onChange={(e) => setFacts(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
      />
    </section>
  );
}
