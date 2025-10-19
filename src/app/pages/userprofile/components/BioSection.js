"use client";

export default function BioSection({ intro, setIntro }) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-2">Bio</h2>
      <textarea
        placeholder="Write something about yourself..."
        value={intro}
        onChange={(e) => setIntro(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
      />
    </section>
  );
}
