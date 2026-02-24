"use client";

import NextProvider from "@/providers/NextProvider";
import { TooltipProvider } from "../components/ui/tooltip";
import { ThemeProvider } from "./ThemesProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
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
    );
};

export default Providers;
