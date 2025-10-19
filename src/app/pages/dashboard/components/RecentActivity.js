"use client";

export default function RecentActivity({ activity }) {
  return (
    <div className="border-[0.5px] border-gray-200 bg-gray-50 rounded-lg p-4 flex-1 min-w-[320px] flex flex-col justify-center">
      <div className="p-4 font-semibold border-b-[0.5px] border-gray-200">Recent Activity</div>
      <div className="p-4 space-y-3">
        {Array.isArray(activity) && activity.length > 0 ? (
          activity.map((a, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded bg-gray-50">
              <div
                className={`h-2 w-2 rounded-full ${a.type === "received"
                  ? "bg-green-500"
                  : a.type === "sent"
                    ? "bg-blue-500"
                    : "bg-purple-500"
                  }`}
              />
              <div className="flex-1 text-sm">
                {a.type === "received" && (
                  <>Received a letter: <strong>{a.text}</strong></>
                )}
                {a.type === "sent" && (
                  <>Sent a letter: <strong>{a.text}</strong></>
                )}
                {a.type === "match" && (
                  <>New match with <strong>{a.otherUsername}</strong></>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(a.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500 italic">No recent activity yet</div>
        )}
      </div>
    </div>
  );
}
