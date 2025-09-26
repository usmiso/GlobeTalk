
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/pages/dashboard", label: "Dashboard" },
  { href: "/pages/matchmaking", label: "Match" },
  { href: "/pages/inbox", label: "Inbox" },
  { href: "/pages/explore", label: "Explore" },
  { href: "/pages/userprofile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="w-full h-20 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/images/globe.png" alt="GlobeTalk Logo" className="w-6 h-6" />
        <span className="font-bold text-lg">GlobeTalk</span>
      </div>
      <nav className="flex items-center gap-10 mb-3 mt-2">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-m font-medium " +
                (isActive
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-700 hover:text-black")
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
