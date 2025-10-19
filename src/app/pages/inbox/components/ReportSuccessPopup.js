"use client";

export default function ReportSuccessPopup({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-7 min-w-80 shadow-xl max-w-[90vw] flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4 text-green-700">Report Submitted</h3>
        <p className="mb-4 text-gray-700 text-center">Message reported. Thank you for your feedback.</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
