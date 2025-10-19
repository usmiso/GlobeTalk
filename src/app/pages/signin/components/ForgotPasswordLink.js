"use client";
import Link from "next/link";

export default function ForgotPasswordLink() {
  return (
    <p className="text-sm text-white mt-2">
      <Link href="/pages/forgetpassword" className="text-black hover:underline">
        Forgot password?
      </Link>
    </p>
  );
}
