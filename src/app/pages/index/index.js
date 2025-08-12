import Link from 'next/link';

export default function Index() {
  return (
    <main className="p-8 text-center bg-amber-300">
      <h1 className="text-3xl font-bold mb-6">Welcome to My Site</h1>

      <div className="flex justify-center gap-6">
        <Link href="/pages/signup" className="text-green-600 underline">
          Sign Up
        </Link>
        <Link href="/pages/signin" className="text-yellow-600 underline">
          Go to Login
        </Link>
        <Link href="/pages/forgetpassword" className="text-green-900 underline">
          Go to forgotPasswordPage
        </Link>
        
      </div>

      <h1 className="text-4xl font-bold text-green-600">Hello, Tailwind!</h1>

    </main>
  );
}