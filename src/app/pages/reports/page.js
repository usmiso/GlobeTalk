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
    <ProtectedLayout redirectTo="/">
      <div className="min-h-screen bg-gray-50">
        {/* ...existing code... */}
      </div>
    </ProtectedLayout>
  );
}
