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
        <div className="flex flex-col flex-1 gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8 py-6 border-b border-border last:border-b-0 last:pb-0">
            <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-sm font-medium leading-none">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </div>
            <div className="flex-2 flex shrink-0 items-start sm:pt-0.5">
                {children}
            </div>
        </div>
    );
}
