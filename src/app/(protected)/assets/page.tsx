import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { AssetsClient } from "./assets-client";


import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý tài sản",
};

export default async function AssetsPage() {
    await requirePermission(
        Permission.ASSET_VIEW_SELF,
        Permission.ASSET_VIEW_ALL,
    );

    return <AssetsClient />;
}
