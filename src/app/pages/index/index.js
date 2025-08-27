"use client";
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Index() {

  const router = useRouter();


  return (
<main className="relative min-h-screen w-full pt-10 overflow-hidden">
  <Image
    src="/images/backgroundImage.avif"
    alt="background image"
    fill
    priority
    sizes="100vw"
    className="object-cover object-center -z-10"
  />

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-4 py-4 text-white">

        <details className="md:hidden text-white">

          <summary className="flex items-center justify-between px-4 py-4 cursor-pointer list-none">

            <section className="p-2 -ml-2">
              <span className="block w-6 h-[2px] mb-1 bg-white"></span>
              <span className="block w-6 h-[2px] mb-1 bg-white"></span>
              <span className="block w-6 h-[2px] bg-white"></span>
            </section>
          </summary>

          <nav className="px-4 pb-4">
            <ul className="flex flex-col gap-3">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/pages/about">About</Link></li>
              <li><Link href="/pages/explore">Explore</Link></li>
              <li><Link href="/pages/signin">LogIninn</Link></li>
              <li><Link href="/pages/signup">SIgnUp</Link></li>
            </ul>
          </nav>
        </details>



        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/images/LogoVPP-1.png" alt="GlobeTalk" width={28} height={28} className="rounded-full" />
          <p className="text-lg font-semibold">GlobeTalk</p>
        </Link>
      </header>

      <nav className="hidden md:flex justify-between items-center w-full">
        <section aria-label="Primary navigation"
          className='relative ml-[170px] w-[1090px] h-[52px] px-5
          grid grid-cols-[auto_1fr_auto_1fr_auto] items-center
         bg-slate-100/40 rounded-[30px] 
         border border-neutral-400 
        shadow-[0px_4px_4px_0px_rgba(0,0,0,1)] 
        overflow-hidden'>
          <Link href='/'
            aria-label='GlobeTalk home'
            className='flex items-center gap-2'>
            <Image
              src="/images/LogoVPP-1.png"
              alt="GlobeTalk"
              width={28}
              height={28}
              className="rounded-full ml-4"
              priority />
            <p className="text-base font-semibold text-slate-800 px-2">GlobeTalk</p>
          </Link>
          <ul className=" col-start-3 flex items-center justify-center gap-20 mt-1 mr-40 whitespace-nowrap">
            <li>
              <Link href="/" className={`text-[19px] font-[roboto_slab] ${router === "/" ? "text-blue-900" : "hover:text-blue-800 "}`}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/pages/about" className={`text-gray-800 text-[19px] font-[roboto_slab] ${router === "/pages/about" ? "text-blue-900" : "hover:text-blue-800"}`}>
                About
              </Link>
            </li>
            <li>
              <Link href="/pages/explore" className={`text-gray-800 text-[19px] font-[roboto_slab]  ${router === "/pages/about" ? "text-blue-900" : "hover:text-blue-800"}`}>
                Explore
              </Link>
            </li>
          </ul>

          <button type='button'
            onClick={() => router.push("/pages/signin")}
            className='absolute right-4 top-1/2 -translate-y-1/2 
            rounded-3xl h-[44px] px-6 bg-gray-800
             shadow-[0px_4px_4px_0px_rgba(0,0,0,0.50)] 
             border border-neutral-400 w-33 cursor-pointer
             font-bold text-[17px] font-[Roboto_Serif] text-white'>
            Login
          </button>

        </section>
        <section aria-label='Open chat' className='justify-self-end'>
          <button type='button'
            onClick={() => router.push("/pages/signin")}
            className='rounded-3xl mr-20 ml-6 bg-blue-300/20 
            shadow-[0px_4px_4px_0px_rgba(0,0,0,0.50)] 
            border border-neutral-400 h-12 w-35 px-6 cursor-pointer
             text-white font-bold text-[17px] font-[Roboto_Serif]'>
            Sign Up
          </button>
        </section>

      </nav>

      <section className='flex flex-col items-center mt-20'>
        <h1 className="max-w-[22rem] sm:max-w-[36rem]
                 text-[28px] sm:text-[40px] md:text-6xl
                 leading-snug font-['Roboto_Serif'] text-white
                 indent-13 whitespace-pre-line
           ">
          Say <em className="not-italic text-blue-300">Hello</em> to your
          <br className="hidden sm:block md:text-6xl" />
          New Random Bestie!
        </h1>

        <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl
                text-white font-[Roboto_Slab]">One message away from your new favourite human</p>
        <button type="button"
          onClick={() => router.push("/pages/signin")}
          className="mx-auto mt-6 sm:mt-8
               w-[240px] md:w-[250px] h-12 md:h-14
               rounded-[30px] bg-gray-800
               shadow-[0px_4px_4px_0px_rgba(0,0,0,0.50)]
               border border-neutral-400/20
               text-white font-semibold cursor-pointer
               text-base sm:text-lg md:text-xl font-[Roboto_Serif]">Start Chatting!</button>
      </section>

      <section>
        {/* picture bubbles */}
        <Image
          src="/images/chatBubble.png"
          alt="typing bubble"
          width={50}
          height={50}
          className="absolute left-2/13 -translate-x-1/2 top-32 sm:top-33
             drop-shadow-lg animate-bob"
          priority
        />
        <Image
          src="/images/chatBubble.png"
          alt="typing bubble"
          width={50}
          height={50}
          className="absolute left-4 sm:left-15 top-[500px]
             drop-shadow-lg animate-bob"
          priority
        />
        <Image
          src="/images/chatBubble.png"
          alt="typing bubble"
          width={50}
          height={50}
          className="absolute right-12 bottom-28
             drop-shadow-lg animate-bob"
          priority
        />
      </section>

      <section className="hidden md:block relative list-none"
        aria-hidden="true">
        <li className="absolute left-20 bottom-[-160]">
          <section className="relative inline-flex items-center gap-3
                  px-5 py-3 rounded-3xl bg-sky-500 text-white shadow-xl
                  before:content-[''] before:pointer-events-none before:absolute before:left-[-8px]
                  before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-5
                  before:bg-sky-500 before:rotate-45 before:rounded-[4px]">
            <p className="text-lg font-semibold">Random Matchmaking 🎲</p>
            <time className="text-xs/none opacity-80">01:59</time>
          </section>
        </li>

        <li className="absolute right-240 bottom-[-240]">
          <section className="relative inline-flex items-center gap-3
                  px-5 py-3 rounded-3xl bg-sky-500 text-white shadow-xl
                  after:content-[''] after:absolute after:right-[-8px]
                  after:top-1/2 after:-translate-y-1/2 after:w-5 after:h-5
                  after:bg-sky-500 after:rotate-45 after:rounded-[4px]">
            <p className="text-lg font-semibold">Cultural Profiles </p>
            <time className="text-xs/none opacity-80">02:05</time>
          </section>
        </li>

        <li className="absolute left-20 bottom-[-320]">
          <section className="relative inline-flex items-center gap-3
                  px-5 py-3 rounded-3xl bg-sky-500 text-white shadow-xl
                  before:content-[''] before:pointer-events-none before:absolute before:left-[-8px]
                  before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-5
                  before:bg-sky-500 before:rotate-45 before:rounded-[4px]">
            <p className="text-lg font-semibold"> Asynchronous Messaging ⌛</p>
            <time className="text-xs/none opacity-80">01:59</time>
          </section>
        </li>

      </section>
    </main>
  );
} 