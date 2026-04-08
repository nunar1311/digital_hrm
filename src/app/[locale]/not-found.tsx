import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
    const t = await getTranslations("SystemPages");

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
            <h1 className="text-6xl font-bold text-muted-foreground">
                404
            </h1>
            <p className="text-xl text-muted-foreground">
                {t("notFoundMessage")}
            </p>
            <Button asChild>
                <Link href="/">{t("backToHome")}</Link>
            </Button>
        </div>
    );
}
