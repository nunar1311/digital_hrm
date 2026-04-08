import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import Providers from "@/providers";

import "../globals.css";
import { getSettingsFromCookie } from "@/utils/server-helpers";
import { getTimezoneFromDB } from "./(protected)/settings/get-timezone";
import { cn } from "@/lib/utils";
import { SettingsProvider } from "@/contexts/settings-context";
import { TimezoneProvider } from "@/contexts/timezone-context";
import { ToastProvider } from "@/providers/toast-provider";
import { KeyboardShortcutsProvider } from "@/components/providers/keyboard-shortcuts-provider";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        return {
            title: {
                default: "Digital HRM",
                template: "%s | Digital HRM",
            },
        };
    }

    const t = await getTranslations({ locale, namespace: "SystemPages" });

    return {
        title: {
            default: "Digital HRM",
            template: "%s | Digital HRM",
        },
        description: t("appDescription"),
    };
}

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);

    const settingsCookie = await getSettingsFromCookie();
    const timezone = await getTimezoneFromDB();
    const messages = await getMessages({ locale });

    return (
        <html
            lang={locale}
            className={cn(settingsCookie.mode)}
            style={{ colorScheme: settingsCookie.mode }}
            suppressHydrationWarning
        >
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased [--header-height:calc(var(--spacing)*10)] scroll-smooth overscroll-none overflow-hidden`}
            >
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <SettingsProvider settingsCookies={settingsCookie}>
                        <KeyboardShortcutsProvider>
                            <ToastProvider>
                                <TimezoneProvider initialTimezone={timezone}>
                                    <Providers>{children}</Providers>
                                </TimezoneProvider>
                            </ToastProvider>
                        </KeyboardShortcutsProvider>
                    </SettingsProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
