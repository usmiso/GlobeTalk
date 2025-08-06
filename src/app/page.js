// app/page.jsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to My Site</h1>

      <div className="flex justify-center gap-6">
        <Link href="/pages/about" className="text-blue-600 underline">
          Go to About
        </Link>
        <Link href="/pages/contact" className="text-blue-600 underline">
          Go to Contact&apos;s
        </Link>
      </div>
    </main>
  );
}