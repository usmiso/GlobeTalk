"use client";
import Image from 'next/image';

export default function BackgroundImage() {
  return (
    <div className="absolute inset-0 w-full h-full -z-10">
      <Image
        src="/images/nations.png"
        alt="Nations background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-white/60 md:bg-white/40"></div>
    </div>
  );
}
