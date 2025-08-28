'use client';

import Link from 'next/link';
import {useAuthContext} from "@/client/modules/auth/context/AuthContext";

export default function StoresHeroSection() {
    const auth = useAuthContext()
    if (auth.user) return <span/>
    return (
        <section className="relative overflow-hidden bg-white dark:bg-gray-800 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                        Discover Amazing Stores
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                        Explore our network of stores with real-time availability, timezone-aware scheduling,
                        and seamless ordering experience.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            href="/stores"
                            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Browse All Stores
                        </Link>
                        <Link
                            href="/register"
                            className="text-sm font-semibold leading-6 text-gray-900 dark:text-white"
                        >
                            Create Account <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )

}
