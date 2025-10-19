"use client";

export default function ReportModal({ open, msg, reportReason, setReportReason, reportOther, setReportOther, onCancel, onSubmit }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-7 min-w-80 shadow-xl max-w-[90vw]">
        <h3 className="text-lg font-semibold mb-4">Report Message</h3>
        <div className="mb-3 text-sm text-gray-700">
          <strong>Message:</strong>
          <div className="bg-gray-50 rounded-md p-2 mt-1 mb-2 text-sm">
            {msg?.text}
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="report-reason" className="block text-sm font-medium mb-1">
            Reason:
          </label>
          <select
            id="report-reason"
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option>Spam or scam</option>
            <option>Harassment or bullying</option>
            <option>Inappropriate content</option>
            <option>Hate speech or discrimination</option>
            <option>Impersonation</option>
            <option>Other</option>
          </select>
        </div>
        {reportReason === 'Other' && (
          <div className="mb-3">
            <label htmlFor="report-other" className="block text-sm font-medium mb-1">
              Describe your complaint:
            </label>
            <textarea
              id="report-other"
              value={reportOther}
              onChange={e => setReportOther(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              placeholder="Enter details..."
            />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
