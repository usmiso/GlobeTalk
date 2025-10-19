"use client";

export default function SaveButton({ saving, saveSuccess, onClick }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md h-12 border border-gray-200 flex flex-col justify-center items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200 relative ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
        disabled={saving}
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Saving...
          </span>
        ) : saveSuccess ? (
          <span className="flex items-center gap-2 text-green-200">
            <svg className="h-5 w-5 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved!
          </span>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  );
}
