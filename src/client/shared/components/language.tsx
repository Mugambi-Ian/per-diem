'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, ChangeEventHandler } from 'react';
import { ChevronDown } from 'lucide-react';

const locales = ['en', 'fr', 'sw'];

export const AppLanguage = ({ locale }: { locale: string }) => {
    const router = useRouter();
    const [currentLocale, setCurrentLocale] = useState(locale);

    useEffect(() => {
        const pathLocale = window.location.pathname.split('/')[1];
        if (locales.includes(pathLocale)) {
            setCurrentLocale(pathLocale);
        }
    }, []);

    const changeLanguage: ChangeEventHandler<HTMLSelectElement> = (e) => {
        const newLocale = e.target.value;
        setCurrentLocale(newLocale);
        router.push('/' + newLocale);
    };

    return (
        <div className="relative inline-block text-sm">
            <select
                value={currentLocale}
                onChange={changeLanguage}
                aria-label="Select language"
                className="appearance-none bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-800 dark:text-white shadow-inner ring-1 ring-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300"
            >
                {locales.map((loc) => (
                    <option key={loc} value={loc} className="bg-white dark:bg-zinc-800 text-black dark:text-white">
                        {loc.toUpperCase()}
                    </option>
                ))}
            </select>

            {/* Custom dropdown icon */}
            <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300">
                <ChevronDown className="h-4 w-4" />
            </div>
        </div>
    );
};
