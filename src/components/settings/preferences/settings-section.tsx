"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 md:gap-8 py-6 border-b last:border-b-0",
        className,
      )}
    >
      <header className="min-w-0 flex flex-col gap-1 md:sticky md:top-0 md:self-start md:pt-1">
        <h3 className="text-sm font-semibold leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </header>
      <article className="block min-w-0">{children}</article>
    </section>
  );
}
