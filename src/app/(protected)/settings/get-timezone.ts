"use server";

import { prisma } from "@/lib/prisma";

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

export async function getTimezoneFromDB(): Promise<string> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: "system.timezone" },
        });
        return setting?.value ?? DEFAULT_TIMEZONE;
    } catch (error) {
        console.error("[Settings] Failed to load timezone from DB:", error);
        return DEFAULT_TIMEZONE;
    }
}
