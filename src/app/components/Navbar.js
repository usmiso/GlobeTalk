"use client";

// App navigation bar: highlights active section and supports mobile menu.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from '../firebase/auth';
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "/pages/dashboard", label: "Dashboard" },
  { href: "/pages/matchmaking", label: "Match" },
  { href: "/pages/inbox", label: "Inbox" },
  { href: "/pages/explore", label: "Explore" },
  { href: "/pages/userprofile", label: "Profile" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="w-full h-20 bg-white border-b border-gray-200 px-4 flex items-center justify-between relative">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src="/images/globe.png" alt="GlobeTalk Logo" className="w-6 h-6" />
        <span className="font-bold text-lg">GlobeTalk</span>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-700 hover:text-blue-700")
              }
            >
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-0 px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-red-600"
        >
          Logout
        </button>
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden flex items-center p-2 rounded hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Nav Dropdown (closes after navigation) */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white shadow-md border-t border-gray-200 md:hidden z-50">
          <nav className="flex flex-col p-4 space-y-2">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors " +
                    (isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-700 hover:text-blue-700")
                  }
                  onClick={() => setIsOpen(false)} // close menu after click
                >
                  {label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 text-left"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
