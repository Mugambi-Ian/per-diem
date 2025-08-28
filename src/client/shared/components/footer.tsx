'use client';
import Link from 'next/link';
import React, {memo, useMemo} from 'react';
import {OurSocials} from "@/client/shared/components/socials";

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {

    const footerLinks = useMemo(
        () => ({
            ["Useful Links"]: [
                {title: "Home", href: '/'},
                {title: "Login", href: '/login'},
                {title: "Register", href: '/register'},
                {title: "View Stores", href: '/stores'},
                {title: "API Docs", href: '/api/documentation'},
            ],
        }),
        []
    );

    return (
        <footer
            className="bg-gray-100 dark:bg-white/[0.075] text-gray-800 dark:text-gray-200 pt-20 pb-10 px-6 md:px-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-y-10">
                    <div>
                        <div className="flex items-center gap-4 mb-10">
                            <p>
                                Built with ❤️ and security in mind
                            </p>
                        </div>
                        <OurSocials/>
                        <div className="mt-10 text-xs text-gray-500 dark:text-gray-400">
                            &copy;
                            <time>{CURRENT_YEAR}</time>
                            Per Diem Co. All rights reserved.
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="grid grid-cols-2 gap-10 mb-14 max-w-xl md:ml-auto">
                        {Object.entries(footerLinks).map(([title, links]) => (
                            <div key={title}>
                                <h4 className="text-lg font-semibold mb-4">{title}</h4>
                                <ul className="space-y-2 text-sm">
                                    {links.map((link) => (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                className="hover:underline hover:text-orange-600 dark:hover:text-orange-400 transition"
                                            >
                                                {link.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

export const AppFooter = memo(Footer);
