// app/page.js
import React from 'react';
import ProtectedLayout from "@/app/components/ProtectedLayout";

export default function Home() {
  return (
    <ProtectedLayout redirectTo="/">
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GlobeTalk Admin</h1>
                <p className="text-sm text-gray-600">Content Moderation Dashboard</p>
              </div>
            </div>
          </div>
          {/* ...existing sidebar code... */}
        </aside>
        {/* ...existing main content code... */}
      </div>
    </ProtectedLayout>
  );
}