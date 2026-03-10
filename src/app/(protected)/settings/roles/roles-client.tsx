"use client";

import { Shield, Users } from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { TAB_TRIGGER_CLASS } from "../../attendance/settings/settings-client";
import { UsersRoleTable } from "./users-role-table";
import { PermissionMatrix } from "./permission-matrix";
import type { RolesData, UsersPage } from "./constants";

// ─── Component ───

interface RolesClientProps {
    initialRolesData: RolesData;
    initialUsersData: UsersPage;
    canManage: boolean;
    currentUserId: string;
}

export function RolesClient({
    initialRolesData,
    initialUsersData,
    canManage,
    currentUserId,
}: RolesClientProps) {
    const { rolePermissionsMap, permissions } = initialRolesData;

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Phân quyền vai trò
                </h1>
                <p className="text-muted-foreground">
                    Quản lý vai trò và phân quyền trong hệ thống
                </p>
            </div>

            <Tabs
                defaultValue="users"
                orientation="vertical"
                className="w-full gap-2 flex flex-1 min-h-0"
            >
                <TabsList variant={"line"} className="w-60">
                    <TabsTrigger
                        value="users"
                        className={TAB_TRIGGER_CLASS}
                    >
                        <Users className="h-4 w-4" />
                        Quản lý vai trò
                    </TabsTrigger>
                    <TabsTrigger
                        value="matrix"
                        className={TAB_TRIGGER_CLASS}
                    >
                        <Shield className="h-4 w-4" />
                        Ma trận quyền
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="users"
                    className="space-y-4 flex-1 min-h-0 overflow-y-auto"
                >
                    <UsersRoleTable
                        initialData={initialUsersData}
                        canManage={canManage}
                        currentUserId={currentUserId}
                        rolePermissionsMap={rolePermissionsMap}
                    />
                </TabsContent>

                <TabsContent
                    value="matrix"
                    className="space-y-4 h-[calc(100vh-10rem)]"
                >
                    <PermissionMatrix
                        rolePermissionsMap={rolePermissionsMap}
                        permissions={permissions}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
