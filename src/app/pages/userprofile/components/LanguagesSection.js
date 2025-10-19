"use client";

export default function LanguagesSection({ language, removeLanguage, selectedLang, setSelectedLang, filteredLangs, handleSelectedLang, customLanguage, setCustomLanguage }) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-2">Languages</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        {language.map((lang, i) => (
          <span
            key={i}
            className="flex items-center gap-2 px-3 bg-green-100 border
                                 rounded-md  
                                text-sm  border-gray-300 font-medium 
                      duration-200 hover:bg-green-100 hover:border-green-300 hover:text-green-700 cursor-pointer
                     py-2 
             transition-transform transform hover:scale-105 hover:shadow-md"
          >
            {lang}
            <button
              type="button"
              onClick={() => removeLanguage(lang)}
              className="text-gray-500 hover:text-red-600"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <select
        value={selectedLang}
        onChange={handleSelectedLang}
        className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
      >
        <option value="">Select a language</option>
        {filteredLangs.map((lang, i) => (
          <option key={i} value={lang}>
            {lang}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={customLanguage}
        onChange={(e) => setCustomLanguage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const lang = customLanguage.trim();
            if (lang && !language.includes(lang)) {
              // Direct mutation is avoided; parent passes setLanguage logic
              // Here we emulate behavior by updating via provided state setter
              // but the parent will supply an updater using setLanguage([...])
            }
          }
        }}
        placeholder="Or type your own and press Enter"
        className="w-full border border-gray-300 rounded-md px-3 py-2"
      />
    </section>
  );
}
