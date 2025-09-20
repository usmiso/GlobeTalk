import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Sidebar({ }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    // Show only the toggle button when sidebar is closed
    if (!sidebarOpen) {
        return (
            <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-4 left-4 p-2 rounded hover:bg-gray-300 text-black font-bold text-base z-50 bg-white shadow-md"
                title="Open sidebar"
            >
                ☰
            </button>
        );
    }

    return (
        <aside
            className="flex flex-col justify-between transition-all duration-300"
            style={{ backgroundColor: "#6492BD", width: "13rem" }}
        >
            {/* GlobeTalk & Toggle */}
            <div className="flex flex-row items-center justify-between p-2 sm:p-5">
                <div className="flex items-center gap-1 sm:gap-2">
                    <img
                        src="/images/globe.png"
                        alt="GlobeTalk Logo"
                        className="w-5 h-5 sm:w-6 sm:h-6 object-cover"
                    />
                    <p className="text-xs sm:text-sm lg:text-base font-bold text-black">
                        GlobeTalk
                    </p>
                </div>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded text-black font-bold text-sm sm:text-base hover:bg-gray-200 flex-shrink-0"
                    title="Close sidebar"
                >
                    ☰
                </button>
            </div>
            {/* Menu */}
            <div className="flex flex-col justify-between h-full p-2 sm:p-3">
                <nav className="space-y-1 sm:space-y-2">
                    <button
                        onClick={() => router.push("/pages/dashboard")}
                        className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base cursor-pointer"
                    >
                        <img
                            src="/images/home.svg"
                            alt="Dashboard"
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                        />
                        Dashboard
                    </button>
                    <button
                        onClick={() => router.push("/pages/userprofile")}
                        className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base cursor-pointer"
                    >
                        <img
                            src="/images/profilelogo.png"
                            alt="Profile"
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                        />
                        Profile
                    </button>

                    <button
                        onClick={() => router.push("/pages/explorer")}
                        className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base cursor-pointer"
                    >
                        <img
                            src="/images/earth.svg"
                            alt="Profile"
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                        />
                        Cultural Explorer
                    </button>
                    <button
                        onClick={() => router.push("/pages/inbox")}
                        className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base cursor-pointer"
                    >
                        <img
                            src="/images/envelope.svg"
                            alt="Letters"
                            className="w-5 h-5 sm:w-6 sm:h-7 rounded-full object-cover"
                        />
                        Inbox
                    </button>
                    <button
                        onClick={() => router.push("/pages/matchmaking")}
                        className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base cursor-pointer"
                    >
                        <img
                            src="/images/users.svg"
                            alt="Letters"
                            className="w-5 h-5 sm:w-6 sm:h-7 rounded-full object-cover"
                        />
                        Find new Pal
                    </button>
                </nav>
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded w-full text-left text-xs sm:text-sm lg:text-base mt-2 sm:mt-4"
                >
                    <img
                        src="/images/logout.png"
                        alt="Logout"
                        className="w-5 h-5 sm:w-6 sm:h-6 object-cover"
                    />
                    Logout
                </button>
            </div>
        </aside>
    );
}
