"use client";

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
        <img src="/images/mail.jpg" alt="Mail" className="h-18 w-18" />
        <div className="text-2xl font-bold">{stats?.totalLetters ?? 0}</div>
        <div className="text-sm text-muted-foreground">Total Letters</div>
      </div>
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
        <img src="/images/active_pals.jpg" alt="Active Pals" className="h-18 w-18" />
        <div className="text-2xl font-bold">{stats?.activePenPals ?? 0}</div>
        <div className="text-sm text-muted-foreground">Active Pen Pals</div>
      </div>
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
        <img src="/images/globe.png" alt="Globe" className="h-18 w-18" />
        <div className="text-2xl font-bold">{stats?.countriesConnected ?? 0}</div>
        <div className="text-sm text-muted-foreground">Countries</div>
      </div>
      <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg p-4 text-center flex flex-col items-center gap-1">
        <img src="/images/time.jpg" alt="Time" className="h-18 w-18" />
        <div className="text-2xl font-bold">{stats?.averageResponseTime ?? "—"}</div>
        <div className="text-sm text-muted-foreground">Avg Response</div>
      </div>
    </div>
  );
}
