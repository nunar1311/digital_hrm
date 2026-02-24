import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/providers";

import "./globals.css";
import { getSettingsFromCookie } from "@/utils/server-helpers";
import { cn } from "@/lib/utils";
import { SettingsProvider } from "@/contexts/settings-context";

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
    return (
        <html
            lang="en"
            className={cn(settingsCookie.mode)}
            style={{ colorScheme: settingsCookie.mode }}
            suppressHydrationWarning
        >
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <SettingsProvider settingsCookies={settingsCookie}>
                    <Providers>{children}</Providers>
                </SettingsProvider>
            </body>
        </html>
    );
}
