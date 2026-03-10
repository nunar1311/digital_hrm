"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ROLE_LABELS,
    ROLE_COLORS,
    PERMISSION_GROUPS,
    groupPermissions,
} from "./constants";

interface PermissionMatrixProps {
    rolePermissionsMap: Record<string, string[]>;
    permissions: string[];
}

export function PermissionMatrix({
    rolePermissionsMap,
    permissions,
}: PermissionMatrixProps) {
    const [viewRole, setViewRole] = useState<string | null>(null);
    const permGroups = groupPermissions(permissions);

    return (
        <div className="flex-1 min-h-0 h-full overflow-y-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Ma trận phân quyền</CardTitle>
                    <CardDescription>
                        Xem chi tiết quyền hạn của từng vai trò trong
                        hệ thống
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(ROLE_LABELS).map(
                            ([role, label]) => {
                                const permsCount =
                                    rolePermissionsMap[role]
                                        ?.length ?? 0;
                                return (
                                    <Card
                                        key={role}
                                        className="cursor-pointer transition-colors hover:bg-accent/50"
                                        onClick={() =>
                                            setViewRole(role)
                                        }
                                    >
                                        <CardContent className="flex items-center justify-between">
                                            <div>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        ROLE_COLORS[
                                                            role
                                                        ] ?? ""
                                                    }
                                                >
                                                    {label}
                                                </Badge>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {permsCount} quyền
                                                </p>
                                            </div>
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        </CardContent>
                                    </Card>
                                );
                            },
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* All permissions overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Tổng quan quyền hạn</CardTitle>
                    <CardDescription>
                        Tất cả nhóm quyền trong hệ thống
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(permGroups).map(
                            ([group, perms]) => (
                                <Collapsible key={group}>
                                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-accent/50">
                                        <span className="font-medium">
                                            {PERMISSION_GROUPS[
                                                group
                                            ] ?? group}
                                        </span>
                                        <Badge variant="outline">
                                            {perms.length}
                                        </Badge>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-3 pb-3 pt-1">
                                        <div className="flex flex-wrap gap-1">
                                            {perms.map((p) => (
                                                <Badge
                                                    key={p}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {p}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ),
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ─── View Role Permissions Dialog ─── */}
            <Dialog
                open={!!viewRole}
                onOpenChange={(v) => !v && setViewRole(null)}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Quyền hạn -{" "}
                            {ROLE_LABELS[viewRole ?? ""] ?? viewRole}
                        </DialogTitle>
                        <DialogDescription>
                            Chi tiết{" "}
                            {rolePermissionsMap[viewRole ?? ""]
                                ?.length ?? 0}{" "}
                            quyền cho vai trò này
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <div className="space-y-3 pr-4">
                            {viewRole &&
                                Object.entries(permGroups).map(
                                    ([group, allPerms]) => {
                                        const rolePerms =
                                            rolePermissionsMap[
                                                viewRole
                                            ] ?? [];
                                        const active =
                                            allPerms.filter((p) =>
                                                rolePerms.includes(p),
                                            );
                                        if (active.length === 0)
                                            return null;
                                        return (
                                            <div key={group}>
                                                <p className="mb-1 text-sm font-medium">
                                                    {PERMISSION_GROUPS[
                                                        group
                                                    ] ?? group}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {allPerms.map(
                                                        (p) => {
                                                            const has =
                                                                rolePerms.includes(
                                                                    p,
                                                                );
                                                            return (
                                                                <Badge
                                                                    key={
                                                                        p
                                                                    }
                                                                    variant={
                                                                        has
                                                                            ? "default"
                                                                            : "outline"
                                                                    }
                                                                    className={
                                                                        has
                                                                            ? ""
                                                                            : "opacity-30"
                                                                    }
                                                                >
                                                                    {
                                                                        p.split(
                                                                            ":",
                                                                        )[1]
                                                                    }
                                                                </Badge>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
