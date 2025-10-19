"use client";
import Image from 'next/image';

export default function LeftPanel() {
  return (
    <div className="hidden md:block md:w-1/2 relative" style={{ backgroundColor: '#476C8A' }}>
      <div className="absolute top-8 left-8 flex flex-col items-center space-y-2">
        <Image src="/images/globe.png" alt="Globe Illustration" width={100} height={100} priority />
        <span className="text-[#002D72] font-bold text-[22px] tracking-wider mt-2">GlobeTalk App</span>
      </div>
      <div className="h-full flex items-center justify-center">
        <Image src="/images/girlsignup.png" alt="Girl Sign Up" width={400} height={500} className="object-contain mx-auto" priority />
      </div>
    </div>
  );
}
