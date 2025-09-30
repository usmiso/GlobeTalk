"use client";

import React, { useEffect, useState } from "react";
import ProtectedLayout from "@/app/components/ProtectedLayout";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  // Lightweight real-time updates via polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReports();
    }, 5000); // update every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/reports");
      if (!response.ok) throw new Error("Failed to fetch reports");
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Collect all unique user IDs to fetch usernames
        const userIds = new Set();
        result.data.forEach((report) => {
          if (report.reporter) userIds.add(report.reporter);
          if (report.message?.sender) userIds.add(report.message.sender);
          if (report.reportedUserId) userIds.add(report.reportedUserId);
        });

        // Fetch usernames for all user IDs
        const idToUsername = {};
        await Promise.all(
          Array.from(userIds).map(async (uid) => {
            if (!uid || uid === "N/A") return;
            try {
              const res = await fetch(`http://localhost:5000/api/profile?userID=${uid}`);
              if (res.ok) {
                const data = await res.json();
                idToUsername[uid] = data.username || "Unknown";
              } else {
                idToUsername[uid] = "Unknown";
              }
            } catch {
              idToUsername[uid] = "Unknown";
            }
          })
        );

        const formattedReports = result.data.map((report) => {
          const rawId = report.id ?? report.chatId ?? report._id ?? report.chat_id ?? "unknown";
          const reporterUid = report.reporter || "N/A";
          const reportedUid = report.message?.sender || report.reportedUserId || "N/A";
          // Build a stable, unique key: prefer rawId; if unknown, add timestamp fallback
          const uniqueKey = String(rawId) !== "unknown"
            ? String(rawId)
            : `unknown-${report.reportedAt || report.createdAt || Date.now()}-${Math.random().toString(36).slice(2,8)}`;
          return {
            rawId: String(rawId),
            id: uniqueKey,
            reportId: `RPT-${String(rawId).substring(0, 3).toUpperCase()}`,
            offenseType: report.reason || "Unknown",
            reporterUsername: idToUsername[reporterUid] || "Unknown",
            reportedUsername: idToUsername[reportedUid] || "Unknown",
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
  setReports(sortReports(formattedReports));
      } else {
        console.error("Unexpected API data:", result);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sort pending (or non-resolved) first, then resolved at bottom. Stable ordering by date within groups.
  const sortReports = (list) => {
    const score = (status) => (String(status).toLowerCase() === "resolved" ? 1 : 0);
    return [...list].sort((a, b) => {
      const s = score(a.status) - score(b.status);
      if (s !== 0) return s;
      // Newest first within the same status
      const da = a.date === "N/A" ? 0 : Date.parse(a.date);
      const db = b.date === "N/A" ? 0 : Date.parse(b.date);
      return db - da;
    });
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
        await fetch(`http://localhost:5000/api/reports/${encodeURIComponent(report.rawId)}/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        setReports((prev) => sortReports(prev.map((r) => (r.rawId === report.rawId ? { ...r, status: "resolved" } : r))));
        // Reconcile with server state
        fetchReports();
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
        await fetch(`http://localhost:5000/api/reports/${encodeURIComponent(report.rawId)}/invalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        setReports((prev) => sortReports(prev.map((r) => (r.rawId === report.rawId ? { ...r, status: "resolved" } : r))));
        // Reconcile with server state
        fetchReports();
      }
    } catch (err) {
      console.error("Error invalidating report:", err);
    } finally {
      setSelectedReport(null);
    }
  };

  return (
    <ProtectedLayout redirectTo="/">
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>
        {loading ? (
          <div className="text-center text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center text-gray-500">No reports found.</div>
        ) : (
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Report ID</th>
                <th className="px-4 py-2 border">Offense</th>
                <th className="px-4 py-2 border">Reporter</th>
                <th className="px-4 py-2 border">Reported User</th>
                <th className="px-4 py-2 border">Message</th>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Severity</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.rawId || report.id} className="border-b">
                  <td className="px-4 py-2 border">{report.reportId}</td>
                  <td className="px-4 py-2 border">{report.offenseType}</td>
                  <td className="px-4 py-2 border">{report.reporterUsername}</td>
                  <td className="px-4 py-2 border">{report.reportedUsername}</td>
                  <td className="px-4 py-2 border">{report.messageText}</td>
                  <td className="px-4 py-2 border">{report.date}</td>
                  <td className="px-4 py-2 border">{report.status}</td>
                  <td className="px-4 py-2 border">{report.severity}</td>
                  <td className="px-4 py-2 border">
                    {report.status === "pending" && (
                      <>
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                          onClick={() => markReportValid(report)}
                        >
                          Validate
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded"
                          onClick={() => markReportInvalid(report)}
                        >
                          Invalidate
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedLayout>
  );
}
