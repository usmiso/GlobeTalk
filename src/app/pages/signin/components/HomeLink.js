"use client";
import Link from "next/link";

export default function HomeLink() {
  return (
    <Link
      href="/"
      className="mt-4 bg-white hover:bg-black text-blue-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
    >
      Go to Homepage
    </Link>
  );
}
