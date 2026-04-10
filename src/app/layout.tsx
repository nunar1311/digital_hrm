import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Providers from "@/providers";

import "./globals.css";
import { getSettingsFromCookie } from "@/utils/server-helpers";
import { getTimezoneFromDB } from "@/app/(protected)/settings/get-timezone";
import { cn } from "@/lib/utils";
import { SettingsProvider } from "@/contexts/settings-context";
import { TimezoneProvider } from "@/contexts/timezone-context";
import { ToastProvider } from "@/providers/toast-provider";
import { KeyboardShortcutsProvider } from "@/components/providers/keyboard-shortcuts-provider";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: false,
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
        className={`${roboto.className} antialiased [--header-height:calc(var(--spacing)*10)] scroll-smooth overscroll-none overflow-hidden`}
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
