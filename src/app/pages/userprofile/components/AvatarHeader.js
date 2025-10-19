"use client";

export default function AvatarHeader({ avatarUrl, username, timezone }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden mb-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="flex items-center justify-center h-full text-gray-400 text-sm">
            No Avatar
          </span>
        )}
      </div>
      <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent inline-block">{username}</h1>
      <p className="text-sm text-gray-500">{timezone || 'No location set'}</p>
    </div>
  );
}
