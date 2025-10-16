"use client";

export default function ConfirmPasswordField({ confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword }) {
  return (
    <div className="mb-6 relative">
      <label htmlFor="confirmPassword" className="block text-white font-bold mb-2">
        Confirm Password
      </label>
      <input
        type={showConfirmPassword ? "text" : "password"}
        id="confirmPassword"
        name="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
      />
      <button
        type="button"
        className="absolute right-3 top-9 text-lg cursor-pointer"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        aria-label={showConfirmPassword ? "👁️" : "🙈"}
      >
        {showConfirmPassword ? "👁️" : "🙈"}
      </button>
    </div>
  );
}
