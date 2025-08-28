'use client';

import Link from "next/link";
import { Menu, X} from "lucide-react";
import {useCallback, useState} from "react";
import {useTranslations} from "next-intl";
import {usePathname} from "next/navigation";
import clsx from "clsx";
import NextTopLoader from 'nextjs-toploader';
import React from "react";
import {AppLanguage} from "@/client/shared/components/language";
import {useAuthContext} from "@/client/modules/auth/context/AuthContext";
import AppTheme from "@/client/shared/components/theme";

export const AppHeader = React.memo(function AppHeader({locale}: { locale: string }) {
    const {user} = useAuthContext();
    const t = useTranslations();
    const [menuOpen, setMenuOpen] = useState(false);
    const openMenu = useCallback(() => setMenuOpen(true), []);
    const closeMenu = useCallback(() => {
        setMenuOpen(false)
    }, []);


    return (
        <>
            <header className="sticky top-0 inset-x-0 z-40 backdrop-blur-xl bg-transparent transition-all duration-300">
                <NextTopLoader color="rgb(234 88 12)" showSpinner={false}/>

                <section
                    className="flex items-center  max-w-7xl mx-auto w-full px-4 py-4 bg-gradient-to-r from-white/70 via-orange-100/60 to-white/70 dark:from-black/50 dark:via-purple-900/30 dark:to-black/50 rounded-b-xl shadow-md transition-all duration-300">
                    <Link href="/" className="flex flex-1 items-center gap-3 hover:opacity-90 transition-opacity duration-200">
                        <h1 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">PerDiem 🥑</h1>
                    </Link>

                    <nav className="hidden md:flex gap-6 mr-4 pr-4 border-r border-r-black/50 pt-1">

                        <HeaderPath close={closeMenu} locale={locale} path="/stores" title={"Stores"}/>
                        {!user ?
                            <HeaderPath close={closeMenu} locale={locale} path="/login" title={"Login"}/> :
                            <HeaderPath close={closeMenu} locale={locale} path="/account" title={"My Account"}/>}
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <AppTheme/>
                        <AppLanguage locale={locale}/>
                    </div>

                    <button className="md:hidden text-gray-800 dark:text-gray-100" onClick={openMenu}
                            aria-label="Open menu">
                        <Menu size={26}/>
                    </button>
                </section>
            </header>

            <MobileMenu
                open={menuOpen}
                onClose={closeMenu}
                locale={locale}
                t={t}
            />
        </>
    );
});

const MobileMenu = React.memo(function MobileMenu({
                                                      open,
                                                      onClose,
                                                      locale,

                                                  }: {
    open: boolean,
    onClose: () => void,
    locale: string,
    t: ReturnType<typeof useTranslations>,
}) {
    const {user} = useAuthContext();
    if (!open) return null;
    return (
        <div className="fixed inset-0 h-full md:hidden bg-black/40 backdrop-blur-sm z-50 transition-opacity">
            <div
                className="fixed top-0 right-0 w-3/4 max-w-xs h-full bg-gradient-to-br from-white/80 to-gray-100/60 dark:from-zinc-900/90 dark:to-black/60 backdrop-blur-md shadow-2xl rounded-l-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Menu</h2>
                    <button onClick={onClose} aria-label="Close menu" className="text-black dark:text-white">
                        <X size={26}/>
                    </button>
                </div>
                <nav className="flex flex-col space-y-4">
                    <HeaderPath close={onClose} locale={locale} path="/stores" title={"Stores"}/>
                    {!user ?
                        <HeaderPath close={onClose} locale={locale} path="/login" title={"Login"}/> :
                        <HeaderPath close={onClose} locale={locale} path="/account" title={"My Account"}/>}
                </nav>
                <div className="mt-6 flex gap-4 items-center">
                    <AppTheme/>
                    <AppLanguage locale={locale}/>
                </div>
            </div>
        </div>
    );
});

function HeaderPath({path, title, locale, close}: { path: string; title: string; locale: string; close?: () => void }) {
    const pathname = usePathname();
    const activeTab = `/${pathname.split(`${locale}/`)[1]?.split("/")[0] || ''}`;

    return (
        <Link
            href={path}
            onClick={close}
            className={clsx(
                "relative pb-1 font-medium text-sm tracking-tight transition-all duration-200 hover:text-orange-500 dark:hover:text-orange-400",
                activeTab === path
                    ? "text-orange-600 dark:text-orange-300 border-b-2 border-orange-500"
                    : "text-gray-700 dark:text-gray-200 border-b-2 border-transparent"
            )}
        >
            {title}
        </Link>
    );
}

