'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const Profile = () => {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const router = useRouter();

    const handleSubmit = async () => {
        console.log("Submitted")
        setIsSubmitted(true)
        router.push('/pages/explore') // Redirect to explore page after submission
    }

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isSubmitted) {
                e.preventDefault()
                e.returnValue = '' // Required for Chrome
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isSubmitted])

    // Prevent clicking any links on the page (optional)
    useEffect(() => {
        const handleClick = (e) => {
            if (!isSubmitted) {
                const target = e.target.closest('a')
                if (target) {
                    e.preventDefault()
                    alert("You must complete your profile before leaving this page!")
                }
            }
        }
        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [isSubmitted])

    return (
        <main className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl mb-6">Complete Your Profile</h1>
            <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
            >
                Submit
            </button>
        </main>
    )
}

export default Profile
