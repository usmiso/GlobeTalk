"use client";

export default function MatchedCard({ match, chatType, setChatType, handleProceedToChat, proceeding, proceeded, ChatIcon, UserIcon }) {
  return (
    <div className="mt-6 p-6 border-2 border-blue-200 rounded-2xl bg-white shadow-xl animate-fade-in">
      <h2 className="font-bold mb-3 text-xl text-blue-700 flex items-center gap-2"><UserIcon />Matched User</h2>
      {match.username || match.avatar || match.name || match.email || match.language || match.timezone ? (
        <div className="space-y-2">
          {(match.avatarURL || match.avatar) && (
            <div className="flex flex-col items-center">
              <span className="font-medium">Avatar:</span><br />
              <img src={match.avatarURL ? match.avatarURL : match.avatar} alt="avatar" className="w-20 h-20 rounded-full border-4 border-blue-200 shadow-lg" />
            </div>
          )}
          {match.username && (
            <div><span className="font-medium">Username:</span> <span className="text-blue-700">{match.username}</span></div>
          )}
          {match.name && (
            <div><span className="font-medium">Name:</span> {match.name}</div>
          )}
          {match.email && (
            <div><span className="font-medium">Email:</span> {match.email}</div>
          )}
          {match.language && (
            <div><span className="font-medium">Language:</span> <span className="text-green-700">{match.language}</span></div>
          )}
          {match.timezone && (
            <div><span className="font-medium">Timezone:</span> <span className="text-purple-700">{match.timezone}</span></div>
          )}
          {match.intro && (
            <div><span className="font-medium">borderLight:</span> {match.intro}</div>
          )}
          {(match.ageMin || match.ageMax) && (
            <div>
              <span className="font-medium">Age Range:</span> {match.ageMin ? match.ageMin : "?"} - {match.ageMax ? match.ageMax : "?"}
            </div>
          )}
          {match.hobbies && Array.isArray(match.hobbies) && match.hobbies.length > 0 && (
            <div>
              <span className="font-medium">Hobbies:</span> {match.hobbies.join(", ")}
            </div>
          )}
        </div>
      ) : (
        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(match, null, 2)}</pre>
      )}

      {!chatType && (
        <div className="mt-6 flex gap-4 justify-center">
          <button
            className="px-6 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 hover:scale-105 transition-all font-semibold shadow border border-blue-200"
            onClick={() => setChatType("one-time")}
          >
            <ChatIcon /> One Time Chat
          </button>
          <button
            className="px-6 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 hover:scale-105 transition-all font-semibold shadow border border-blue-200"
            onClick={() => setChatType("long-term")}
          >
            <ChatIcon /> Long Term Chat
          </button>
        </div>
      )}

      {chatType && (
        <div className="mt-6 text-center">
          <div className="mb-2 text-blue-700 font-medium animate-fade-in">Selected: {chatType === "one-time" ? "One Time Chat" : "Long Term Chat"}</div>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 hover:bg-blue-700 transition-all duration-200 font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleProceedToChat}
            disabled={proceeding || proceeded}
          >
            {proceeded ? (
              <>
                <svg className="w-5 h-5 text-white mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                Match Created!
              </>
            ) : proceeding ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                Processing...
              </>
            ) : (
              <>
                <ChatIcon /> Proceed to chat
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
