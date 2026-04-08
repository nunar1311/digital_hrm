
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Auth" });

    return {
        title: `${t("forgotPasswordMetadataTitle")} | Digital HRM`,
    };
}

export default async function ForgotPasswordPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Auth" });

    return (
        <div className="flex min-h-[100vh] w-full items-center justify-center bg-white p-4">
            <div className="w-full max-w-[400px]">
                <div className="mb-6 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#111111] text-xl font-bold text-white">
                        HR
                    </div>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-2xl font-bold text-black">
                        {t("forgotPasswordTitle")}
                    </h1>
                    <p className="text-sm leading-relaxed text-gray-500">
                        {t("forgotPasswordDescription")}
                    </p>
                </div>

                <form className="space-y-5">
                    <div className="text-left">
                        <label className="mb-1.5 block text-sm font-semibold text-black">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="admin@company.vn"
                            className="w-full rounded-lg border-transparent bg-[#f0f4f8] px-4 py-3 outline-none transition focus:bg-white focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-2 w-full rounded-lg bg-[#111111] py-3 font-semibold text-white transition duration-200 hover:bg-black"
                    >
                        {t("sendRecoveryLink")}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link
                        href="/login"
                        locale={locale}
                        className="text-sm font-medium text-gray-500 transition hover:text-black"
                    >
                        {t("backToLogin")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
