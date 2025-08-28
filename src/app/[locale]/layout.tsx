import type {Metadata} from "next";
import "./globals.css";
import {StoreProvider} from "@/client/modules/stores/context/StoreContext";
import {NextIntlClientProvider, useMessages} from "next-intl";
import {AppHeader} from "@/client/shared/components/header";
import {AppFooter} from "@/client/shared/components/footer";
import {ReactNode} from "react";
import {Plus_Jakarta_Sans} from "next/font/google";
import {AuthProvider} from "@/client/modules/auth/context/AuthContext";
import {cookies, headers} from "next/headers";
import {server_verify_access_token} from "@/lib/modules/auth/utils/jwt";
import {AuthService} from "@/lib/modules/auth/service/auth.service";


const jakartaSans = Plus_Jakarta_Sans({
    variable: "--font-plus-jarkata-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700"],
});


export const metadata: Metadata = {
    title: "Per Diem - Store Management System",
    description: "A secure, timezone-aware store management system with comprehensive authentication, product availability tracking, and real-time store status.",
};

export default function RootLayout({children, params}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const messages = useMessages();
    return (
        <html suppressHydrationWarning>
        <body
            className={`font-sans antialiased relative inset-0 overflow-y-auto overflow-x-clip ${jakartaSans.variable} bg-white dark:bg-black`}>
        <NextIntlClientProvider locale={params.locale} messages={messages}>

            <AuthContextProvider>
                <StoreProvider>
                    <AppHeader locale={params.locale}/>
                    <main
                        className="min-h-screen -mt-20 pt-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
                        {children}

                    </main>
                    <AppFooter/>

                </StoreProvider>
            </AuthContextProvider>
        </NextIntlClientProvider>
        </body>
        </html>
    );

}

async function loadUser() {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) return undefined;
    const jwt = await server_verify_access_token(token)
    return await AuthService.userByID(jwt.sub ?? '');
}

async function AuthContextProvider(props: { children: ReactNode }) {
    const user = await loadUser();
    return <AuthProvider currentUser={user}>
        {props.children}
    </AuthProvider>
}