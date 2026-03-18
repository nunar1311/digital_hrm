import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/providers";

import "./globals.css";
import { getSettingsFromCookie } from "@/utils/server-helpers";
import { getTimezoneFromDB } from "@/app/(protected)/settings/get-timezone";
import { cn } from "@/lib/utils";
import { SettingsProvider } from "@/contexts/settings-context";
import { TimezoneProvider } from "@/contexts/timezone-context";
import { ToastProvider } from "@/providers/toast-provider";
import { KeyboardShortcutsProvider } from "@/components/providers/keyboard-shortcuts-provider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Digital HRM",
        template: "%s | Digital HRM",
    },
    description: "Hệ thống quản lý nhân sự thông minh",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const settingsCookie = await getSettingsFromCookie();
    const timezone = await getTimezoneFromDB();

    return (
        <html
            lang="en"
            className={cn(settingsCookie.mode)}
            style={{ colorScheme: settingsCookie.mode }}
            suppressHydrationWarning
        >
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased [--header-height:calc(var(--spacing)*10)] scroll-smooth overscroll-none overflow-hidden`}
            >
                <SettingsProvider settingsCookies={settingsCookie}>
                    <KeyboardShortcutsProvider>
                        <ToastProvider>
                            <TimezoneProvider initialTimezone={timezone}>
                                <Providers>{children}</Providers>
                            </TimezoneProvider>
                        </ToastProvider>
                    </KeyboardShortcutsProvider>
                </SettingsProvider>
            </body>
        </html>
    );
}
