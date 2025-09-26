// app/page.js
import React from 'react';

export default function Home() {
  return (
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
        
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414-1.414l-5-5zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1z" />
                </svg>
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                  <path d="M10 4a6 6 0 00-6 6v2a6 6 0 006 6h2a6 6 0 006-6v-2a6 6 0 00-6-6H10z" />
                </svg>
                Reports
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM17 11H3.83a1.5 1.5 0 01-.53-.28c-.54-.43-.77-1.05-.77-1.72 0-.67.23-1.29.77-1.72A1.5 1.5 0 013.83 6H3a1 1 0 00-1 1v4a1 1 0 001 1h14a1 1 0 001-1v-4a1 1 0 00-1-1z" />
                </svg>
                User Management
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2.123a1 1 0 001-1V7a1 1 0 00-1-1h-2.123a1 1 0 00-.938.233L9.828 7H7a1 1 0 00-1 1v2a1 1 0 001 1h2.123a1 1 0 00.938-.233L11 9.828V7a1 1 0 00-1-1h-2.123a1 1 0 00-.938.233L7 7H5a1 1 0 00-1 1v2a1 1 0 001 1h2.123a1 1 0 00.938-.233L9.828 10H15a1 1 0 001-1V7a1 1 0 00-1-1z" />
                </svg>
                Chat Logs
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex border-b border-gray-200">
              <button className="px-6 py-3 text-gray-700 font-medium border-b-2 border-blue-500 bg-blue-50 rounded-t-lg">Overview</button>
              <button className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium border-b-2 border-transparent hover:border-gray-300">Reports Management</button>
              <button className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium border-b-2 border-transparent hover:border-gray-300">User Management</button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-gray-700">Total Reports</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.266-.768 1.408-.768 1.675 0l.748 2.107a1 1 0 01-.052 1.018l-2.834 1.417a1 1 0 01-1.053 0l-2.834-1.417a1 1 0 01-.052-1.018l.748-2.107z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M11.04 4.04a1 1 0 010 1.414l-1.286 1.286a1 1 0 01-1.414 0L7.35 5.454a1 1 0 010-1.414l1.286-1.286a1 1 0 011.414 0l1.286 1.286z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-900">47</span>
              </div>
              <p className="text-sm text-gray-600">+12% from last month</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700">Pending Reports</h3>
                <p className="text-sm text-gray-600 mt-1">Requires attention</p>
              </div>
              <div className="text-3xl font-bold text-gray-900">12</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600 mt-1">Latest reports and moderation actions</p>
            </div>

            <div className="space-y-4">
              {/* Activity Item 1 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.266-.768 1.408-.768 1.675 0l.748 2.107a1 1 0 01-.052 1.018l-2.834 1.417a1 1 0 01-1.053 0l-2.834-1.417a1 1 0 01-.052-1.018l.748-2.107z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M11.04 4.04a1 1 0 010 1.414l-1.286 1.286a1 1 0 01-1.414 0L7.35 5.454a1 1 0 010-1.414l1.286-1.286a1 1 0 011.414 0l1.286 1.286z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Inappropriate language</p>
                    <p className="text-sm text-gray-600">Reported by user456 • 2024-01-15 14:30</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">high</span>
              </div>

              {/* Activity Item 2 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.266-.768 1.408-.768 1.675 0l.748 2.107a1 1 0 01-.052 1.018l-2.834 1.417a1 1 0 01-1.053 0l-2.834-1.417a1 1 0 01-.052-1.018l.748-2.107z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M11.04 4.04a1 1 0 010 1.414l-1.286 1.286a1 1 0 01-1.414 0L7.35 5.454a1 1 0 010-1.414l1.286-1.286a1 1 0 011.414 0l1.286 1.286z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Harassment</p>
                    <p className="text-sm text-gray-600">Reported by user321 • 2024-01-15 12:15</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">critical</span>
              </div>

              {/* Activity Item 3 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.266-.768 1.408-.768 1.675 0l.748 2.107a1 1 0 01-.052 1.018l-2.834 1.417a1 1 0 01-1.053 0l-2.834-1.417a1 1 0 01-.052-1.018l.748-2.107z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M11.04 4.04a1 1 0 010 1.414l-1.286 1.286a1 1 0 01-1.414 0L7.35 5.454a1 1 0 010-1.414l1.286-1.286a1 1 0 011.414 0l1.286 1.286z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Spam</p>
                    <p className="text-sm text-gray-600">Reported by user777 • 2024-01-14 16:45</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">medium</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}