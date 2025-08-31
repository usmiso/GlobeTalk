import Link from 'next/link';

export default function ExplorePage() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Explore Page</h1>
      <p>This is the Explore page of the app.</p>
      <Link href="/" className="text-blue-600 underline block mt-6">
        ← Back to Home Page
      </Link>
      <Link href="/pages/avatar">
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Avatar Page
        </button>
      </Link>
    </main>
  );
}
