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

    const company = await prisma.organization.findFirst();
    
    let metadata: Record<string, string> = {};
    if (company?.metadata) {
        try {
            metadata = JSON.parse(company.metadata);
        } catch (e) {
            console.error("Failed to parse company metadata", e);
        }
    }

    const result: Record<string, string> = { ...DEFAULT_COMPANY_INFO, ...metadata };
    
    if (company) {
        if (company.name) result.companyName = company.name;
        if (company.email !== undefined && company.email !== null) result.companyEmail = company.email;
        if (company.logo !== undefined && company.logo !== null) result.companyLogo = company.logo;
        if (company.country !== undefined && company.country !== null) result.companyCountry = company.country;
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

    const company = await prisma.organization.findFirst();
    if (!company) {
        throw new Error("Không tìm thấy thông tin công ty");
    }

    let metadata: Record<string, unknown> = {};
    if (company.metadata) {
        try {
            metadata = JSON.parse(company.metadata) as Record<string, unknown>;
        } catch (e) {
            // ignore parse error
        }
    }

    const oldData = { ...metadata, companyName: company.name, companyEmail: company.email, companyCountry: company.country, companyLogo: company.logo };

    const updates = Object.entries(data).filter(([, v]) => v !== undefined && v !== "" && v !== null);

    for (const [key, value] of updates) {
        metadata[key] = value;
    }

    const updateData: Record<string, unknown> = {
        metadata: JSON.stringify(metadata)
    };

    if (data.companyName) updateData.name = String(data.companyName);
    if (data.companyEmail !== undefined) updateData.email = String(data.companyEmail);
    if (data.companyCountry) updateData.country = String(data.companyCountry);

    await prisma.organization.update({
        where: { id: company.id },
        data: updateData
    });

    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UPDATE",
            entity: "CompanyInfo",
            oldData: JSON.parse(JSON.stringify(oldData)),
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

    const company = await prisma.organization.findFirst();
    if (!company) {
        throw new Error("Không tìm thấy thông tin công ty");
    }

    const oldLogo = company.logo || "";

    await prisma.organization.update({
        where: { id: company.id },
        data: { logo: logoUrl },
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

    const company = await prisma.organization.findFirst();

    if (!company?.logo) {
        throw new Error("Không có logo để xóa");
    }

    const oldLogo = company.logo;

    await prisma.organization.update({
        where: { id: company.id },
        data: { logo: null },
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