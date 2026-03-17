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
    companyCode: z.string().optional(),
    companyEmail: z.string().email("Email không hợp lệ").or(z.literal("")),
    companyPhone: z.string().optional(),
    companyTaxCode: z.string().optional(),
    companyAddress: z.string().optional(),
    companyWard: z.string().optional(),
    companyDistrict: z.string().optional(),
    companyCity: z.string().optional(),
    companyCountry: z.string().min(1, "Vui lòng chọn quốc gia"),
    companyWebsite: z.string().url("URL không hợp lệ").or(z.literal("")),
    companyDescription: z.string().optional(),
    companyIndustry: z.string().optional(),
    companyFoundedDate: z.string().optional(),
    companyEmployeeCount: z.string().optional(),
    companyBusinessLicense: z.string().optional(),
    companyBankAccount: z.string().optional(),
    companyBankName: z.string().optional(),
    agreement: z.boolean().refine((val) => val === true, {
        message: "Bạn phải đồng ý với điều khoản",
    }),
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

    // Chỉ tạo organization record cơ bản (name, slug)
    // Tất cả thông tin chi tiết được lưu vào SystemSetting
    const company = await prisma.organization.create({
        data: {
            name: validated.companyName,
            slug: slug,
            agreementAccepted: validated.agreement,
            agreementDate: new Date(),
        },
    });

    // Lưu tất cả thông tin công ty vào SystemSetting
    const companySettings = [
        { key: "company.companyName", value: validated.companyName },
        { key: "company.companyCode", value: validated.companyCode || "" },
        { key: "company.companyEmail", value: validated.companyEmail || "" },
        { key: "company.companyPhone", value: validated.companyPhone || "" },
        { key: "company.companyTaxCode", value: validated.companyTaxCode || "" },
        { key: "company.companyAddress", value: validated.companyAddress || "" },
        { key: "company.companyWard", value: validated.companyWard || "" },
        { key: "company.companyDistrict", value: validated.companyDistrict || "" },
        { key: "company.companyCity", value: validated.companyCity || "" },
        { key: "company.companyCountry", value: validated.companyCountry },
        { key: "company.companyWebsite", value: validated.companyWebsite || "" },
        { key: "company.companyDescription", value: validated.companyDescription || "" },
        { key: "company.companyIndustry", value: validated.companyIndustry || "" },
        { key: "company.companyFoundedDate", value: validated.companyFoundedDate || "" },
        { key: "company.companyEmployeeCount", value: validated.companyEmployeeCount || "" },
        { key: "company.companyBusinessLicense", value: validated.companyBusinessLicense || "" },
        { key: "company.companyBankAccount", value: validated.companyBankAccount || "" },
        { key: "company.companyBankName", value: validated.companyBankName || "" },
        { key: "company.companyLogo", value: "" },
    ];

    await prisma.systemSetting.createMany({
        data: companySettings.map((s) => ({
            key: s.key,
            value: s.value,
            group: "company",
        })),
    });

    emitToAll("company:updated", { changes: validated });

    revalidatePath("/settings/company");

    return {
        id: company.id,
        name: company.name,
    };
}
