"use client";

export default function FiltersPanel(props) {
  const {
    timezoneOptionsRef,
    timezoneSearch,
    setTimezoneSearch,
    showTimezoneOptions,
    setShowTimezoneOptions,
    timezoneOptions,
    timezone,
    setTimezone,

    languageOptionsRef,
    languageSearch,
    setLanguageSearch,
    showLanguageOptions,
    setShowLanguageOptions,
    languageOptions,
    selectedLanguage,
    setSelectedLanguage,

    SearchIcon,
    TimezoneIcon,
    LanguageIcon,
  } = props;

  return (
    <>
      {/* Timezone filter */}
      <div className="mb-3 relative" ref={timezoneOptionsRef}>
        <label htmlFor="timezone-search" className="mb-1 font-medium flex items-center gap-1">
          <TimezoneIcon /> Timezone
        </label>
        <div className="flex gap-2 mb-2 relative">
          <span className="absolute left-3 top-2.5"><SearchIcon /></span>
          <input
            id="timezone-search"
            type="text"
            placeholder="Search timezone..."
            className="border border-blue-200 rounded-lg px-9 py-2 w-full focus:ring-2 focus:ring-blue-400 transition-all"
            value={timezoneSearch}
            onChange={(e) => setTimezoneSearch(e.target.value)}
            onFocus={() => setShowTimezoneOptions(true)}
          />
          {(timezone || timezoneSearch) && (
            <button
              type="button"
              className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-blue-100 shadow border border-blue-200"
              onClick={() => {
                setTimezone("");
                setTimezoneSearch("");
              }}
            >
              Clear
            </button>
          )}
        </div>
        {showTimezoneOptions && (
          <div className="max-h-40 overflow-y-auto border border-blue-200 rounded-lg bg-white w-full mt-0.5 shadow-xl animate-fade-in">
            {timezoneOptions.map((tz, idx) => {
              const label = (tz.name || tz.text || tz.value);
              return (
                <div
                  key={tz.id || tz.value || tz.name || idx}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 transition-all ${timezone === label ? 'bg-blue-200 font-semibold' : ''}`}
                  onClick={() => {
                    setTimezone(label);
                    setShowTimezoneOptions(false);
                  }}
                >
                  {label}
                </div>
              );
            })}
            {timezoneOptions.length === 0 && (
              <div className="px-3 py-2 text-gray-400">No results</div>
            )}
          </div>
        )}
        {timezone && (
          <div className="mt-1 text-sm text-blue-700 flex items-center gap-1"><TimezoneIcon /> Selected: {timezone}</div>
        )}
      </div>

      {/* Language filter */}
      <div className="mb-3 relative" ref={languageOptionsRef}>
        <label htmlFor="language-search" className="mb-1 font-medium flex items-center gap-1">
          <LanguageIcon /> Language
        </label>
        <div className="flex gap-2 mb-2 relative">
          <span className="absolute left-3 top-2.5"><SearchIcon /></span>
          <input
            id="language-search"
            type="text"
            placeholder="Search language..."
            className="border border-blue-200 rounded-lg px-9 py-2 w-full focus:ring-2 focus:ring-blue-400 transition-all"
            value={languageSearch}
            onChange={(e) => setLanguageSearch(e.target.value)}
            onFocus={() => setShowLanguageOptions(true)}
          />
          {(selectedLanguage || languageSearch) && (
            <button
              type="button"
              className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-blue-100 shadow border border-blue-200"
              onClick={() => {
                setSelectedLanguage("");
                setLanguageSearch("");
              }}
            >
              Clear
            </button>
          )}
        </div>
        {showLanguageOptions && (
          <div className="max-h-40 overflow-y-auto border border-blue-200 rounded-lg bg-white w-full mt-0.5 shadow-xl animate-fade-in">
            {languageOptions.map((lang, idx) => {
              const label = (lang.name || lang.value);
              return (
                <div
                  key={lang.id || lang.value || lang.name || idx}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 transition-all ${selectedLanguage === label ? 'bg-blue-200 font-semibold' : ''}`}
                  onClick={() => {
                    setSelectedLanguage(label);
                    setShowLanguageOptions(false);
                  }}
                >
                  {label}
                </div>
              );
            })}
            {languageOptions.length === 0 && (
              <div className="px-3 py-2 text-gray-400">No results</div>
            )}
          </div>
        )}
        {selectedLanguage && (
          <div className="mt-1 text-sm text-blue-700 flex items-center gap-1"><LanguageIcon /> Selected: {selectedLanguage}</div>
        )}
      </div>
    </>
  );
}
