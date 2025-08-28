'use client'

import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export default function AppTheme() {
    const [isDark, setIsDark] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme')
        if (storedTheme === 'dark') {
            setIsDark(true)
            document.documentElement.classList.add('dark')
        } else if (storedTheme === 'light') {
            setIsDark(false)
            document.documentElement.classList.remove('dark')
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            setIsDark(prefersDark)
            document.documentElement.classList.toggle('dark', prefersDark)
        }
        setMounted(true)
    }, [])

    const toggleTheme = () => {
        const newIsDark = !isDark
        setIsDark(newIsDark)
        document.documentElement.classList.toggle('dark', newIsDark)
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    }

    if (!mounted) return null

    return (
        <div className="flex items-center gap-2 px-2">
            <SunIcon className="h-5 w-5 text-yellow-400 dark:text-gray-400 transition-transform duration-300 scale-105" />
            <div
                onClick={toggleTheme}
                className="relative w-12 h-6 bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-600 dark:from-purple-700 dark:via-indigo-800 dark:to-black rounded-full cursor-pointer shadow-inner hover:scale-105 transition-transform duration-300"
            >
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-100 shadow-md transform transition-transform duration-300 ${
                        isDark ? 'translate-x-6' : ''
                    }`}
                />
            </div>
            <MoonIcon className="h-5 w-5 text-gray-800 dark:text-white transition-transform duration-300 scale-105" />
        </div>
    )
}
