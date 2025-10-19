"use client";

import React, { useEffect, useState } from "react";
import ProtectedLayout from "@/app/components/ProtectedLayout";
import { useRouter } from "next/navigation";
import { auth, onAuthStateChanged } from "@/app/firebase/auth";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [failCount, setFailCount] = useState(0);
  const router = useRouter();

  const ALLOWED_EMAIL = "gamersboysa@gmail.com";
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

  // Auth / authorization gate
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
        setAuthChecked(true);
        return;
      }
      if (user.email === ALLOWED_EMAIL) {
        setAuthorized(true);
      } else {
        router.push("/");
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  // Initial fetch after authorization
  useEffect(() => {
    if (authorized) fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  // Polling for updates
  useEffect(() => {
    if (!authorized || failCount >= 3) return;
    const interval = setInterval(() => {
      if (failCount < 3) fetchReports();
    }, 5000);
    return () => clearInterval(interval);
  }, [authorized, failCount]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const userIds = new Set();
        result.data.forEach((r) => {
          if (r.reporter) userIds.add(r.reporter);
          if (r.message?.sender) userIds.add(r.message.sender);
          if (r.reportedUserId) userIds.add(r.reportedUserId);
        });

        const idToProfile = {};
        await Promise.all(
          Array.from(userIds).map(async (uid) => {
            if (!uid || uid === "N/A") return;
            try {
              const profileRes = await fetch(`${API_BASE}/api/profile?userID=${uid}`);
              if (profileRes.ok) {
                const data = await profileRes.json();
                idToProfile[uid] = {
                  username: data.username || "Unknown",
                  violationCount: data.violationCount || 0,
                  blocked: !!data.blocked,
                };
              } else {
                idToProfile[uid] = { username: "Unknown", violationCount: 0, blocked: false };
              }
            } catch {
              idToProfile[uid] = { username: "Unknown", violationCount: 0, blocked: false };
            }
          })
        );

        const formatted = result.data.map((report) => {
          const rawId = report.id ?? report.chatId ?? report._id ?? report.chat_id ?? "unknown";
          const reporterUid = report.reporter || "N/A";
          const reportedUid = report.message?.sender || report.reportedUserId || "N/A";
          const uniqueKey =
            String(rawId) !== "unknown"
              ? String(rawId)
              : `unknown-${report.reportedAt || report.createdAt || Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 8)}`;
          return {
            rawId: String(rawId),
            id: uniqueKey,
            reportId: `RPT-${String(rawId).substring(0, 3).toUpperCase()}`,
            offenseType: report.reason || "Unknown",
            reporterUsername: idToProfile[reporterUid]?.username || "Unknown",
            reportedUsername: idToProfile[reportedUid]?.username || "Unknown",
            messageText: report.message?.text || report.messageText || "No message text available",
            date: report.reportedAt
              ? new Date(Number(report.reportedAt)).toISOString().split("T")[0]
              : report.createdAt
              ? new Date(Number(report.createdAt)).toISOString().split("T")[0]
              : "N/A",
            status: report.status || "pending",
            severity: getSeverityFromReason(report.reason),
            reportedUserId: reportedUid,
            reportedUserViolationCount: idToProfile[reportedUid]?.violationCount || 0,
            reportedUserBlocked: idToProfile[reportedUid]?.blocked || false,
          };
        });
        setReports(sortReports(formatted));
        setFailCount(0);
        setErrorMsg("");
      } else console.error("Unexpected API data:", result);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setFailCount((c) => c + 1);
      setErrorMsg(err.message.includes("Failed to fetch") ? `Cannot reach backend (${API_BASE})` : err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortReports = (list) => {
    const score = (status) => (String(status).toLowerCase() === "resolved" ? 1 : 0);
    return [...list].sort((a, b) => {
      const s = score(a.status) - score(b.status);
      if (s !== 0) return s;
      return (Date.parse(b.date || 0) || 0) - (Date.parse(a.date || 0) || 0);
    });
  };

  const getSeverityFromReason = (reason) => {
    if (!reason) return "low";
    const r = reason.toLowerCase();
    if (r.includes("harassment") || r.includes("hate") || r.includes("threat")) return "high";
    if (r.includes("inappropriate") || r.includes("offensive")) return "medium";
    return "low";
  };

  const markReportValid = async (report) => {
    try {
      if (!report.rawId || report.rawId === "unknown") return;
      await fetch(`${API_BASE}/api/reports/${encodeURIComponent(report.rawId)}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setReports((prev) =>
        sortReports(prev.map((r) => (r.rawId === report.rawId ? { ...r, status: "resolved" } : r)))
      );
      fetchReports();
    } catch (err) {
      console.error(err);
    } finally {
      setSelectedReport(null);
    }
  };

  const markReportInvalid = async (report) => {
    try {
      if (!report.rawId || report.rawId === "unknown") return;
      await fetch(`${API_BASE}/api/reports/${encodeURIComponent(report.rawId)}/invalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setReports((prev) =>
        sortReports(prev.map((r) => (r.rawId === report.rawId ? { ...r, status: "resolved" } : r)))
      );
      fetchReports();
    } catch (err) {
      console.error(err);
    } finally {
      setSelectedReport(null);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/api/blockUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: userId }),
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  if (!authChecked) {
    return (
      <ProtectedLayout redirectTo="/">
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-gray-600">Checking access...</div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!authorized) return null;

  return (
    <ProtectedLayout redirectTo="/">
      <div className="min-h-screen p-8" style={{ backgroundColor: "#cae0f1ff" }}>
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Reports 👨‍💻</h1>

        {loading ? (
          <p className="text-gray-500">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">No reports found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reports Overview ({reports.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Report ID", "Offense", "Reporter", "Reported User", "Message", "Date", "Status", "Severity", "Actions"].map((col) => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-2 text-sm text-gray-900">{report.reportId}</td>
                      <td className="px-6 py-2 text-sm">{report.offenseType}</td>
                      <td className="px-6 py-2 text-sm text-gray-900">{report.reporterUsername}</td>
                      <td className="px-6 py-2 text-sm text-gray-900">{report.reportedUsername}</td>
                      <td className="px-6 py-2 text-sm">{report.messageText}</td>
                      <td className="px-6 py-2 text-sm">{report.date}</td>
                      <td className="px-6 py-2 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === "resolved" ? "bg-green-100 text-green-800" : report.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.severity === "high" ? "bg-red-100 text-red-800" : report.severity === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                        }`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-sm">
                        {report.status === "pending" ? (
                          <div className="space-x-2">
                            <button onClick={() => markReportValid(report)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Validate</button>
                            <button onClick={() => markReportInvalid(report)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Invalidate</button>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <div className="text-xs text-gray-600">
                              Violations: {report.reportedUserViolationCount} {report.reportedUserBlocked && "(Blocked)"}
                            </div>
                            {report.reportedUserViolationCount >= 3 && !report.reportedUserBlocked && (
                              <button onClick={() => handleBlockUser(report.reportedUserId)} className="px-2 py-1 bg-black text-white rounded hover:bg-gray-800 text-xs">
                                Block User
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded bg-red-100 text-red-700 border border-red-300 text-sm">
            {errorMsg}{failCount >= 3 && " (Polling paused after multiple failures)"}
          </div>
        )}
      </div>
      </div>
    </ProtectedLayout>
  );
}
