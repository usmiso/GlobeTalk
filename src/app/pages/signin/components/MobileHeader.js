"use client";
import Image from 'next/image';

export default function MobileHeader() {
  return (
    <div className="md:hidden flex flex-col items-center mt-8 mb-2 z-10">
      <Image
        src="/images/globe.png"
        alt="Globe"
        width={80}
        height={80}
        priority
      />
      <span className="text-[#002D72] font-bold text-xl tracking-wider mt-2">
        GlobeTalk
      </span>
    </div>
  );
}
