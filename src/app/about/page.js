// app/about/page.jsx
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">About Page</h1>
      <p>This is the About page of the app.</p>
      <Link href="/" className="text-blue-600 underline block mt-6">
        ← Back to Home
      </Link>
    </main>
  );
}
