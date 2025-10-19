"use client";

export default function ErrorText({ error }) {
  if (!error) return null;
  return <p className="text-red-500 mb-4">{error}</p>;
}
