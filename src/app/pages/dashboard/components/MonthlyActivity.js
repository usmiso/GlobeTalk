"use client";

export default function MonthlyActivity({ stats }) {
  return (
    <div className="border-[0.5px] border-gray-200  bg-gray-50 rounded-lg">
      <div className="p-4 font-semibold border-b-[0.5px] border-gray-200">This Month&apos;s Activity</div>
      <div className="p-4 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Letters Sent</span>
            <span>{stats?.lettersThisMonth ?? 0}/20 goal</span>
          </div>
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-500 rounded"
              style={{ width: `${((stats?.lettersThisMonth ?? 0) / 20) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats?.lettersThisMonth ?? 0}</div>
            <div className="text-sm text-muted-foreground">Letters Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-rose-500">{stats?.favoriteLetters ?? 0}</div>
            <div className="text-sm text-muted-foreground">Favorites</div>
          </div>
        </div>
      </div>
    </div>
  );
}
