"use client";

export default function ComposerModal({
  open,
  friendProfile,
  messageText,
  setMessageText,
  deliveryDelay,
  setDeliveryDelay,
  onSend,
  onClose,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 border-gray-300 overflow-y-auto bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col border-b border-gray-300 pb-3">
          <h2 className="text-xl font-semibold">Reply to Letter</h2>
          {friendProfile && (
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              To: {friendProfile.username || "Anonymous Friend"}
              {friendProfile.country && ` in ${friendProfile.country}`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-700">
            <span>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span>
              Will arrive: {new Date(Date.now() + deliveryDelay * 1000).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-1">Delivery Delay</label>
          <div className="relative">
            <select
              value={deliveryDelay}
              onChange={(e) => setDeliveryDelay(Number(e.target.value))}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-700 shadow-sm"
            >
              <option value={60}>1 min</option>
              <option value={3600}>1 hour (Express)</option>
              <option value={43200}>12 hours (Standard)</option>
              <option value={86400}>1 day</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Longer delays create a more authentic pen pal experience
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Your Letter</label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Dear pen pal..."
            className="w-full border border-gray-300 rounded p-3 h-40 resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 text-right">
            {1000 - messageText.length} characters left
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-300">
          <button
            onClick={onSend}
            disabled={!messageText.trim()}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold shadow-sm"
          >
            Send Letter
          </button>
          <button
            onClick={onClose}
            className="h-10 px-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
