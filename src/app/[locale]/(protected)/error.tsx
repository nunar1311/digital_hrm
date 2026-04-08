"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations("SystemPages");

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">{t("errorOccurred")}</h1>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={reset}>{t("retry")}</Button>
        </div>
    );
}
