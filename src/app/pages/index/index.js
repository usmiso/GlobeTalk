import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

export default function Index() {
  return (
    <main className="min-h-screen w-full
      bg-[url('/images/backgroundImage.jpg')]
      bg-cover bg-center bg-no-repeat pt-10">

      <nav className="flex justify-between items-center w-full">
        <section aria-label="Primary navigation"
          className='relative ml-[170px] w-[1090px] h-[52px] px-5
          grid grid-cols-[auto_1fr_auto_1fr_auto] items-center
         bg-slate-100/40 rounded-[30px] 
         border border-neutral-400 
        shadow-[0px_4px_4px_0px_rgba(0,0,0,1)] 
        overflow-hidden'>
          <a href='/'
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
          </a>
          <ul className=" col-start-3 flex items-center justify-center gap-20 mt-1 mr-40 whitespace-nowrap">
            <li>
              <Link href="/pages/home" className="text-gray-800 text-[19px] font-[roboto_slab]">
                Home
              </Link>
            </li>
            <li>
              <Link href="/pages/about" className="text-gray-800 text-[19px] font-[roboto_slab]">
                About
              </Link>
            </li>
            <li>
              <Link href="/pages/explore" className="text-gray-800 text-[19px] font-[roboto_slab]">
                Explore
              </Link>
            </li>
          </ul>

          <button type='button'
            className='absolute right-4 top-1/2 -translate-y-1/2 
            rounded-3xl h-[44px] px-6 bg-blue-950
             shadow-[0px_4px_4px_0px_rgba(0,0,0,0.50)] 
             border border-neutral-400 w-33
             font-bold text-[17px] font-[Roboto_Serif] text-white'>
            Login
          </button>

        </section>
        <section aria-label='Open chat' className='justify-self-end'>
          <button type='button'
            className='rounded-3xl mr-20 ml-6 bg-blue-300/20 
            shadow-[0px_4px_4px_0px_rgba(0,0,0,0.50)] 
            border border-neutral-400 h-12 w-35 px-6
             text-white font-bold text-[17px] font-[Roboto_Serif]'>
            Sign Up
          </button>
        </section>

      </nav>

      <section className='flex flex-col items-center mt-20'>
        <h1 className="w-[719px] h-40 px-10 py-2
          text-7xl font-normal font-['Roboto_Serif']
           text-white
           indent-13 whitespace-pre-line
           ">
          Say <em className="not-italic text-blue-300">Hello</em> to your
          <br />
          New Random Bestie!
        </h1>

        <p className='font-normal px-12 mt-6 text-xl whitespace-nowrap text-white font-[Roboto_Slab]'>One message away from your new favourite human</p>
        <button type="submit"
          className="w-[250px] h-14 mt-20 rounded-[30px] bg-gray-800
         shadow-[0px_4px_4px_0px_rgba(0,0,0,0.50)] 
         border border-neutral-400/20
           text-white font-semibold
           hover:bg-slate-800 transition 
           text-xl font-[Roboto_Serif]">Start Chatting!</button>
      </section>

      <section>
        {/* picture bubbles */}
        <Image
          src="/images/chatBubble.png"
          alt="typing bubble"
          width={50}
          height={50}
          className="absolute left-35 top-60 animate-bob motion-reduce:animate-none drop-shadow-lg"
          priority
        />
        <Image
          src="/images/chatBubble.png"
          alt="typing bubble"
          width={50}
          height={50}
          className="absolute right-35 top-80 animate-bob motion-reduce:animate-none drop-shadow-lg"
          priority
        />
        <Image
          src="/images/chatBubble.png"
          alt="typing bubble"
          width={50}
          height={50}
          className="absolute right-100 top-170 animate-bob motion-reduce:animate-none drop-shadow-lg"
          priority
        />
      </section>

      <section className="list-none">
        <li className="absolute left-20 bottom-70">
          <section className="relative inline-flex items-center gap-3
                  px-5 py-3 rounded-3xl bg-sky-500 text-white shadow-xl
                  before:content-[''] before:pointer-events-none before:absolute before:left-[-8px]
                  before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-5
                  before:bg-sky-500 before:rotate-45 before:rounded-[4px]">
            <p className="text-lg font-semibold">Random Matchmaking 🎲</p>
            <time className="text-xs/none opacity-80">01:59</time>
          </section>
        </li>

        <li className="absolute right-240 bottom-50">
          <section className="relative inline-flex items-center gap-3
                  px-5 py-3 rounded-3xl bg-sky-500 text-white shadow-xl
                  after:content-[''] after:absolute after:right-[-8px]
                  after:top-1/2 after:-translate-y-1/2 after:w-5 after:h-5
                  after:bg-sky-500 after:rotate-45 after:rounded-[4px]">
            <p className="text-lg font-semibold">Cultural Profiles🧑‍🤝‍🧑</p>
            <time className="text-xs/none opacity-80">02:05</time>
          </section>
        </li>

        <li className="absolute left-20 bottom-30">
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