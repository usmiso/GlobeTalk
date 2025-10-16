"use client";

export default function EmptyState({ onFind }) {
  return (
    <div className="flex flex-1 items-center justify-center text-center px-6">
      <div className="max-w-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          You don&apos;t have any pen pals yet
        </h2>
        <p className="text-gray-500 mb-6">
          Once you connect with a pen pal, your chats will appear here.
        </p>
        <button
          onClick={onFind}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Find a Pen Pal
        </button>
      </div>
    </div>
  );
}
