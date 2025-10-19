"use client";

export default function FavoritesSection({ favorites, setFavorites }) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-2">Favorites</h2>
      <textarea
        placeholder="List your favorites..."
        value={favorites}
        onChange={(e) => setFavorites(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
      />
    </section>
  );
}
