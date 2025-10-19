"use client";

export default function SayingsSection({ sayings, setSayings }) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-2">Common Sayings</h2>
      <textarea
        placeholder="Any favourite catchphrases?"
        value={sayings}
        onChange={(e) => setSayings(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
      />
    </section>
  );
}
