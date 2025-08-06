// app/contact/page.jsx
import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Contact Page</h1>
      <p>This is the Contact page of the app.</p>
      <Link href="/" className="text-blue-600 underline block mt-6">
        ← Back to Home
      </Link>
    </main>
  );
}
