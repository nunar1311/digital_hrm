import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Auth" });

    return {
        title: `${t("loginMetadataTitle")} | Digital HRM`,
    };
}

export default function LoginPage() {
    return <LoginForm />;
}
