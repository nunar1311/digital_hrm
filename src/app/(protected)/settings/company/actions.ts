"use server";

import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { emitToAll } from "@/lib/socket/server";

export type CompanyInfo = {
    companyName: string;
    companyCode: string;
    companyEmail: string;
    companyPhone: string;
    companyFax: string;
    companyTaxCode: string;
    companyAddress: string;
    companyWard: string;
    companyDistrict: string;
    companyCity: string;
    companyCountry: string;
    companyWebsite: string;
    companyDescription: string;
    companyLogo: string;
    companyIndustry: string;
    companyFoundedDate: string;
    companyEmployeeCount: string;
    companyBusinessLicense: string;
    companyBankAccount: string;
    companyBankName: string;
};

export async function getCompanyInfo() {
    await requirePermission(Permission.SETTINGS_VIEW);

    const DEFAULT_COMPANY_INFO: Record<string, string> = {
        companyName: "",
        companyCode: "",
        companyEmail: "",
        companyPhone: "",
        companyFax: "",
        companyTaxCode: "",
        companyAddress: "",
        companyWard: "",
        companyDistrict: "",
        companyCity: "",
        companyCountry: "Vietnam",
        companyWebsite: "",
        companyDescription: "",
        companyLogo: "",
        companyIndustry: "",
        companyFoundedDate: "",
        companyEmployeeCount: "",
        companyBusinessLicense: "",
        companyBankAccount: "",
        companyBankName: "",
    };

    const settings = await prisma.systemSetting.findMany({
        where: {
            key: {
                startsWith: "company.",
            },
        },
    });

    const result: Record<string, string> = { ...DEFAULT_COMPANY_INFO };
    for (const setting of settings) {
        const key = setting.key.replace("company.", "");
        result[key] = setting.value;
    }

    return result;
}

export async function getCompanyInfoForClient() {
    const canEdit = await checkCanEdit();
    const data = await getCompanyInfo();
    return { data, canEdit };
}

async function checkCanEdit(): Promise<boolean> {
    try {
        await requirePermission(Permission.SETTINGS_SYSTEM);
        return true;
    } catch {
        return false;
    }
}

export async function updateCompanyInfo(data: Record<string, unknown>) {
    const session = await requirePermission(Permission.SETTINGS_SYSTEM);

    const oldSettings = await prisma.systemSetting.findMany({
        where: {
            key: { startsWith: "company." },
        },
    });

    const oldMap: Record<string, string> = {};
    for (const s of oldSettings) {
        oldMap[s.key.replace("company.", "")] = s.value;
    }

    const updates = Object.entries(data).filter(([, v]) => v !== undefined && v !== "" && v !== null);

    for (const [key, value] of updates) {
        await prisma.systemSetting.upsert({
            where: { key: `company.${key}` },
            create: {
                key: `company.${key}`,
                value: String(value),
                group: "company",
            },
            update: {
                value: String(value),
            },
        });
    }

    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UPDATE",
            entity: "CompanyInfo",
            oldData: JSON.parse(JSON.stringify(oldMap)),
            newData: JSON.parse(JSON.stringify(data)),
        },
    });

    emitToAll("company:updated", {
        changes: data,
    });

    revalidatePath("/settings/company");
    return { success: true };
}

export async function uploadCompanyLogo(formData: FormData) {
    const session = await requirePermission(Permission.SETTINGS_SYSTEM);

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
        throw new Error("Không có file được chọn");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
        throw new Error("Chỉ chấp nhận file hình ảnh (JPEG, PNG, WebP, SVG)");
    }

    if (file.size > 2 * 1024 * 1024) {
        throw new Error("Kích thước file không được vượt quá 2MB");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fileName = `company-logo-${uniqueSuffix}.${file.name.split(".").pop()}`;

    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const uploadDir = path.join(process.cwd(), "public", "uploads", "company");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const logoUrl = `/uploads/company/${fileName}`;

    const oldLogoSetting = await prisma.systemSetting.findUnique({
        where: { key: "company.companyLogo" },
    });
    const oldLogo = oldLogoSetting?.value ?? "";

    await prisma.systemSetting.upsert({
        where: { key: "company.companyLogo" },
        create: {
            key: "company.companyLogo",
            value: logoUrl,
            group: "company",
        },
        update: {
            value: logoUrl,
        },
    });

    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UPDATE",
            entity: "CompanyLogo",
            oldData: { logo: oldLogo },
            newData: { logo: logoUrl },
        },
    });

    emitToAll("company:logo-updated", { logo: logoUrl });

    revalidatePath("/settings/company");
    return { success: true, logoUrl };
}

export async function deleteCompanyLogo() {
    const session = await requirePermission(Permission.SETTINGS_SYSTEM);

    const logoSetting = await prisma.systemSetting.findUnique({
        where: { key: "company.companyLogo" },
    });

    if (!logoSetting?.value) {
        throw new Error("Không có logo để xóa");
    }

    const oldLogo = logoSetting.value;

    await prisma.systemSetting.update({
        where: { key: "company.companyLogo" },
        data: { value: "" },
    });

    const { unlink } = await import("fs/promises");
    const path = await import("path");

    const filePath = path.join(process.cwd(), "public", oldLogo);
    try {
        await unlink(filePath);
    } catch {
        // File might not exist, continue
    }

    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "DELETE",
            entity: "CompanyLogo",
            oldData: { logo: oldLogo },
        },
    });

    emitToAll("company:logo-updated", { logo: "" });

    revalidatePath("/settings/company");
    return { success: true };
}