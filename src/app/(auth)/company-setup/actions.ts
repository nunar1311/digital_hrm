"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { emitToAll } from "@/lib/socket/server";

const setupSchema = z.object({
    companyName: z
        .string()
        .min(2, "Tên công ty phải có ít nhất 2 ký tự"),
    companyEmail: z
        .string()
        .email("Email không hợp lệ")
        .or(z.literal("")),
    companyCountry: z.string().min(1, "Vui lòng chọn quốc gia"),
});

export type SetupFormData = z.infer<typeof setupSchema>;

export async function checkCompanySetup(force = false) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    if (force) {
        return {
            isSetup: false,
            company: null,
            devMode: true,
        };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { hrmRole: true },
    });

    const company = await prisma.organization.findFirst();

    if (company) {
        redirect("/");
    }

    if (user?.hrmRole && user.hrmRole !== "PENDING") {
        redirect("/");
    }

    return {
        isSetup: false,
        company: null,
    };
}

export async function createCompanyProfile(data: SetupFormData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    const validated = setupSchema.parse(data);

    const slug = validated.companyName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const existing = await prisma.organization.findFirst();
    if (existing) {
        throw new Error("Company already exists");
    }

    const company = await prisma.organization.create({
        data: {
            name: validated.companyName,
            slug: slug,
        },
    });

    await prisma.$transaction([
        prisma.systemSetting.upsert({
            where: { key: "company.companyName" },
            update: { value: validated.companyName, group: "company" },
            create: {
                key: "company.companyName",
                value: validated.companyName,
                group: "company",
            },
        }),
        prisma.systemSetting.upsert({
            where: { key: "company.companyEmail" },
            update: { value: validated.companyEmail || "", group: "company" },
            create: {
                key: "company.companyEmail",
                value: validated.companyEmail || "",
                group: "company",
            },
        }),
        prisma.systemSetting.upsert({
            where: { key: "company.companyCountry" },
            update: { value: validated.companyCountry, group: "company" },
            create: {
                key: "company.companyCountry",
                value: validated.companyCountry,
                group: "company",
            },
        }),
    ]);

    emitToAll("company:updated", { changes: validated });
    revalidatePath("/settings/company");

    return {
        id: company.id,
        name: company.name,
    };
}
