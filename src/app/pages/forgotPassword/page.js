import Link from 'next/link';
import React from 'react'
import Image from 'next/image';

export default function forgotPassword() {

    return (
        <main className='flex min-h-screen'>
            <section className='w-1/2 bg-blue-300'>
                <Image
                    src="/images/forgotPasswordImage.png"
                    alt="forgot Password Image Background"
                    width={900}
                    height={900}
                    className='mt-35 ml-10 w-900'
                ></Image>
            </section>
            <section className=" w-1/2 flex flex-col items-center justify-start mt-40 text-center">
                <h1 className='p-10 w-96 text-4xl text-gray-800 font-extrabold font-[Roboto_serif]'>Forgot Password ?</h1>
                <h2 className='p-10 text-xl font-[Roboto_serif] '>Don&apos;t worry it happens. Please enter your email</h2>
                <form className='p-4 w-[380px] h-15 bg-gray-300/20 rounded-2xl border border-neutral-400/20 mt-5'>
                    <label htmlFor="email" ></label>
                    <input id='email' type='email' >
                    </input>
                </form>
                <button className='w-[380px] h-15 rounded-[30px] bg-gray-800 mt-13 text-white text-xl font-semibold font-[Roboto-serif]'>Send OTP</button>
                {/* className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 bg-white placeholder-gray-400" */}
                {/*className='block mb-2 text-sm font-medium text-gray-700'*/}
                <h2 className='p-45 text-xl font-[Roboto_serif]'>Remember your password? <Link href="#" className='text-blue-300 underline'>Sign In</Link></h2>
            </section>

        </main>

    );
}

