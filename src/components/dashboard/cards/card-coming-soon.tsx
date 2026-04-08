"use client";

import { useTranslations } from "next-intl";
import CardToolbar from "./card-toolbar";
import { Wrench } from "lucide-react";

interface CardComingSoonProps {
    title?: string;
}

const CardComingSoon = ({ title }: CardComingSoonProps) => {
    const t = useTranslations("Dashboard");

    return (
        <CardToolbar title={title ?? t("comingSoon")}>
            <div className="flex w-full h-[calc(100%-16px)] items-center justify-center flex-col text-muted-foreground p-4 text-center bg-card rounded-md border-dashed border-2 m-2">
                <Wrench className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-medium text-foreground">{t("featureInProgress")}</span>
                <span className="text-xs mt-1">{t("waitForUpdates")}</span>
            </div>
        </CardToolbar>
    );
};

export default CardComingSoon;
