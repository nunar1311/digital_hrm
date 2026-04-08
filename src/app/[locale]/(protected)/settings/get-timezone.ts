"use server";

import { prisma } from "@/lib/prisma";

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

export async function getTimezoneFromDB(): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: "system.timezone" },
    });
    return setting?.value ?? DEFAULT_TIMEZONE;
}
