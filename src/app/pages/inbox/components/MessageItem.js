"use client";

import { EnvelopeIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { formatDelay } from "../lib/utils";

export default function MessageItem({ msg, index, currentUserID, openChat, onDownloadPDF, onReport }) {
  if (!msg) return null;
  const isSender = currentUserID && msg.sender === currentUserID;
  const now = Date.now();
  const isUnlocked = msg.deliveryTime <= now;
  const secs = msg.delaySeconds ?? (
    msg.sentAt && msg.deliveryTime
      ? Math.max(0, Math.round((msg.deliveryTime - msg.sentAt) / 1000))
      : null
  );
  const recipientName = openChat?.userProfiles?.find((u) => u.uid !== currentUserID)?.username;
  const senderName = openChat?.userProfiles?.find((u) => u.uid === msg.sender)?.username || "Unknown";

  return (
    <div
      key={index}
      className={`w-full max-w-2xl my-4 ${
        isSender ? "ml-auto mr-4" : "mr-auto ml-4"
      }`}
    >
      {/* Letter Paper Background */}
      <div className="relative letter-paper rounded-lg overflow-hidden">
        {/* Decorative border */}
        <div className="letter-border"></div>
        
        {/* Letter Header with decorative elements */}
        <div className="relative letter-header px-8 py-6">
          {/* Decorative corner elements */}
          <div className="letter-corner top-left"></div>
          <div className="letter-corner top-right"></div>
          <div className="letter-corner bottom-left"></div>
          <div className="letter-corner bottom-right"></div>
          
          {/* Ornamental divider */}
          <div className="letter-ornament"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <EnvelopeIcon className="w-6 h-6 text-blue-700" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="letter-title">
                  {isSender ? "To my dear pen pal" : "From your pen pal"}
                </h3>
                <p className="letter-subtitle">
                  {isSender ? recipientName : senderName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-blue-800">
                <CalendarIcon className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Letter Content */}
        <div className="px-8 py-8 letter-content relative">
          {isUnlocked ? (
            <div className="space-y-6">
              {/* Greeting */}
              <div className="text-gray-800">
                <p className="letter-greeting">
                  Dear {isSender ? recipientName : "friend"},
                </p>
                
                {/* Letter body with proper formatting */}
                <div className="letter-body whitespace-pre-wrap">
                  {msg.text}
                </div>
                
                {/* Closing */}
                <div className="mt-8 space-y-3">
                  <p className="letter-closing">With warm regards,</p>
                  <p className="letter-signature">{isSender ? "Your pen pal" : senderName}</p>
                </div>
              </div>
              
              {/* Wax seal */}
              <div className="letter-wax-seal"></div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative">
                <div className="inline-flex items-center gap-3 text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 rounded-full border-2 border-blue-300 shadow-lg">
                  <div className="relative">
                    <ClockIcon className="w-6 h-6 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="font-medium text-lg">This letter will unlock in {formatDelay(secs)}</span>
                </div>
                
                {/* Decorative elements around locked letter */}
                <div className="absolute -top-2 -left-2 w-4 h-4 border-2 border-blue-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-2 border-blue-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
              </div>
            </div>
          )}
        </div>

        {/* Letter Footer */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-t-2 border-blue-200 px-8 py-4 relative">
          {/* Decorative line */}
          <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
          
          <div className="flex justify-between items-center text-sm text-blue-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full border border-blue-200">
                <ClockIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Delivered after {formatDelay(secs)} delay</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isUnlocked && (
                <button
                  onClick={() => onDownloadPDF(msg, isSender, recipientName)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-800 rounded-full transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                  title="Download letter as PDF"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v12m0 0l-3-3m3 3l3-3M4.5 19.5h15" />
                  </svg>
                  Download Letter
                </button>
              )}
              
              {!isSender && isUnlocked && (
                <button
                  onClick={() => onReport(msg)}
                  className="px-4 py-2 text-red-700 hover:text-red-900 text-sm border-2 border-red-300 rounded-full hover:bg-red-50 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                  title="Report this message"
                >
                  Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
