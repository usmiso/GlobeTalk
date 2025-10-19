"use client";

// Wrapper that redirects unauthenticated users away from protected pages.
import { useAuthRedirect } from "./useAuthRedirect";

export default function ProtectedLayout({ children, redirectTo = "/" }) {
  const loading = useAuthRedirect(redirectTo);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
