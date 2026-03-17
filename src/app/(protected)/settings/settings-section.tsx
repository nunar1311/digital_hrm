"use client";

import type { ReactNode } from "react";

interface SettingsSectionProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function SettingsSection({
    title,
    description,
    children,
}: SettingsSectionProps) {
    return (
        <section className="grid grid-cols-[290px_repeat(auto-fit,minmax(290px,1fr))] gap-4 sm:gap-8 py-6 border-b border-border last:border-b-0 last:pb-0">
            <header className="min-w-0 flex flex-col gap-1">
                <h3 className="text-sm font-semibold leading-none">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </header>
            <article className="block">{children}</article>
        </section>
    );
}
