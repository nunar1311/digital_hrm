"use client";

import NextProvider from "@/providers/NextProvider";
import { QueryProvider } from "./query-provider";
import { TooltipProvider } from "../components/ui/tooltip";
import { ThemeProvider } from "./ThemesProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryProvider>
            <NextProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <ThemeProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                </ThemeProvider>
            </NextProvider>
        </QueryProvider>
    );
};

export default Providers;
