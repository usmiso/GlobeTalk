"use client";

export default function HobbiesSection({ hobbies, setHobbies, allHobbies, customHobby, setCustomHobby }) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-2">Interests & Hobbies</h2>

      <div className="flex flex-wrap gap-2 mb-3">
        {hobbies.map((hobby, i) => (
          <span
            key={i}
            className="flex items-center gap-2 rounded-md bg-blue-100 border
                                    px-3 text-sm  border-gray-300 font-medium 
                      duration-200 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 cursor-pointer
                     py-2 
             transition-transform transform hover:scale-105 hover:shadow-md"
          >
            {hobby}
            <button
              type="button"
              onClick={() => setHobbies(hobbies.filter((h) => h !== hobby))}
              className="text-gray-500 hover:text-red-600"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <select
        onChange={(e) => {
          const hobby = e.target.value;
          if (hobby && !hobbies.includes(hobby)) {
            setHobbies([...hobbies, hobby]);
          }
          e.target.value = '';
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
      >
        <option value="">Select a hobby</option>
        {allHobbies.map((hobby, i) => (
          <option key={i} value={hobby}>
            {hobby}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={customHobby}
        onChange={(e) => setCustomHobby(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const hobby = customHobby.trim();
            if (hobby && !hobbies.includes(hobby)) {
              setHobbies([...hobbies, hobby]);
            }
            setCustomHobby('');
          }
        }}
        placeholder="Or type your own and press Enter"
        className="w-full border border-gray-300 rounded-md px-3 py-2"
      />
    </section>
  );
}
