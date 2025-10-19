"use client";

export default function PasswordField({ password, setPassword, showPassword, setShowPassword }) {
  return (
    <div className="mb-4 relative">
      <label htmlFor="password" className="block text-white font-bold mb-2">
        Password
      </label>
      <input
        type={showPassword ? "text" : "password"}
        id="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
      />
      <button
        type="button"
        className="absolute right-3 top-9 text-lg cursor-pointer"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "👁️" : "🙈"}
      >
        {showPassword ? "👁️" : "🙈"}
      </button>
    </div>
  );
}
