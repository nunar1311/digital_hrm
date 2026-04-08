import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ForbiddenPage() {
    const t = await getTranslations("SystemPages");

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="space-y-6 text-center">
                <ShieldX className="mx-auto size-20 text-destructive" />
                <h1 className="text-4xl font-bold">403</h1>
                <p className="text-xl text-muted-foreground">
                    {t("forbiddenMessage")}
                </p>
                <p className="text-sm text-muted-foreground">
                    {t("forbiddenDescription")}
                </p>
                <Button asChild>
                    <Link href="/">{t("backToHome")}</Link>
                </Button>
            </div>
        </div>
    );
}
