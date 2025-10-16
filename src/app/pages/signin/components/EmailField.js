"use client";

export default function EmailField({ email, setEmail }) {
  return (
    <div className="mb-4">
      <label htmlFor="email" className="block text-white font-bold mb-2">
        Email
      </label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
      />
    </div>
  );
}
