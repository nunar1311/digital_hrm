"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function isSupportedLocale(
    value: string | undefined,
): value is (typeof routing.locales)[number] {
    return Boolean(
        value &&
            routing.locales.includes(value as (typeof routing.locales)[number]),
    );
}

export default function LanguageSwitcher() {
    const t = useTranslations("LanguageSwitcher");
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    const currentLocale = isSupportedLocale(locale)
        ? locale
        : routing.defaultLocale;

    const handleChange = (nextLocale: string) => {
        if (!isSupportedLocale(nextLocale) || nextLocale === currentLocale) {
            return;
        }

        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <Select
            value={currentLocale}
            onValueChange={handleChange}
            disabled={isPending}
        >
            <SelectTrigger
                className="h-8 w-[130px] transition-opacity disabled:opacity-60"
                aria-label={t("ariaLabel")}
                disabled={isPending}
            >
                <div className="flex items-center gap-2">
                    <Languages className="size-4" />
                    <SelectValue />
                </div>
            </SelectTrigger>
            <SelectContent align="end">
                <SelectItem value="vi">{t("vietnamese")}</SelectItem>
                <SelectItem value="en">{t("english")}</SelectItem>
            </SelectContent>
        </Select>
    );
}
