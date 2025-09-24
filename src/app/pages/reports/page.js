"use client";

import React, { useEffect, useState } from "react";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports");
      if (!response.ok) throw new Error("Failed to fetch reports");
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const formattedReports = result.data.map((report) => {
          const rawId = report.id ?? report.chatId ?? report._id ?? report.chat_id ?? "unknown";
          return {
            id: rawId.toString(),
            rawId,
            reportId: `RPT-${rawId.toString().substring(0, 3).toUpperCase()}`,
            offenseType: report.reason || "Unknown",
            reporterId: report.reporter || "N/A",
            reportedUserId: report.message?.sender || report.reportedUserId || "N/A",
            messageText: report.message?.text || report.messageText || "No message text available",
            date: report.reportedAt
              ? new Date(Number(report.reportedAt)).toISOString().split("T")[0]
              : report.createdAt
              ? new Date(Number(report.createdAt)).toISOString().split("T")[0]
              : "N/A",
            status: report.status || "pending",
            severity: getSeverityFromReason(report.reason),
          };
        });
        setReports(formattedReports);
      } else {
        console.error("Unexpected API data:", result);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityFromReason = (reason) => {
    if (!reason) return "low";
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes("harassment") || reasonLower.includes("hate") || reasonLower.includes("threat")) {
      return "high";
    } else if (reasonLower.includes("inappropriate") || reasonLower.includes("offensive")) {
      return "medium";
    } else {
      return "low";
    }
  };

  const markReportValid = async (report) => {
    try {
      if (report.rawId && report.rawId !== "unknown") {
        await fetch(`/api/reports/${encodeURIComponent(report.rawId)}/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        setReports((prev) =>
          prev.map((r) => (r.rawId === report.rawId ? { ...r, status: "resolved" } : r))
        );
      }
    } catch (err) {
      console.error("Error validating report:", err);
    } finally {
      setSelectedReport(null);
    }
  };

  const markReportInvalid = async (report) => {
    try {
      if (report.rawId && report.rawId !== "unknown") {
        await fetch(`/api/reports/${encodeURIComponent(report.rawId)}/invalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        setReports((prev) =>
          prev.map((r) => (r.rawId === report.rawId ? { ...r, status: "rejected" } : r))
        );
      }
    } catch (err) {
      console.error("Error invalidating report:", err);
    } finally {
      setSelectedReport(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.266-.768 1.408-.768 1.675 0l.748 2.107a1 1 0 01-.052 1.018l-2.834 1.417a1 1 0 01-1.053 0l-2.834-1.417a1 1 0 01-.052-1.018l.748-2.107z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M11.04 4.04a1 1 0 010 1.414l-1.286 1.286a1 1 0 01-1.414 0L7.35 5.454a1 1 0 010-1.414l1.286-1.286a1 1 0 011.414 0l1.286 1.286z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Globetalk Reports</h1>
              <p className="text-sm text-gray-600">Moderation Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <p className="text-gray-500">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">No reports found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Reports Overview ({reports.length} reports)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offense Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.reportId}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{report.offenseType}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.reporterId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.reportedUserId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.status === 'resolved' ? 'bg-green-100 text-green-800' : report.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{report.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.severity === 'high' ? 'bg-red-100 text-red-800' : report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{report.severity}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => setSelectedReport(report)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedReport(null)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6 z-10" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Reviewing {selectedReport.reportId}</h3>
                  <p className="text-sm text-gray-600 mt-1">Offense: {selectedReport.offenseType}</p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2"><strong>Reporter:</strong> {selectedReport.reporterId}</p>
                <p className="text-sm text-gray-700 mb-4"><strong>Reported user:</strong> {selectedReport.reportedUserId}</p>
                <p className="text-sm text-gray-700 mb-4"><strong>Message:</strong></p>
                <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-100 text-sm text-gray-800">{selectedReport.messageText}</div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => markReportInvalid(selectedReport)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Not Valid</button>
                <button onClick={() => markReportValid(selectedReport)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Valid</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
