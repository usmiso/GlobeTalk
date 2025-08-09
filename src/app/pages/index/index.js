import Link from 'next/link';

export default function Index() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to My Site</h1>

      <div className="flex justify-center gap-6">
        <Link href="/pages/about" className="text-blue-600 underline">
          Go to About
        </Link>
        <Link href="/pages/contact" className="text-red-600 underline">
          Go to Contact&apos;s
        </Link>
        <Link href="/pages/signup" className="text-green-600 underline">
          Sign Up
        </Link>
        <Link href="/pages/signin" className="text-yellow-600 underline">
          Go to Login
        </Link>
        
      </div>

      <h1 className="text-4xl font-bold text-pink-600">Hello, Tailwind!</h1>

    </main>
  );
}