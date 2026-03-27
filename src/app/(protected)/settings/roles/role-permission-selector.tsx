"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    PERMISSION_DESCRIPTIONS,
    PERMISSION_GROUPS_DB,
    groupPermissionsDB,
    getAllPermissionKeys,
} from "@/lib/rbac/db-permissions";

interface RolePermissionSelectorProps {
    selectedPermissions: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
}

export function RolePermissionSelector({
    selectedPermissions,
    onChange,
    disabled = false,
}: RolePermissionSelectorProps) {
    const allPerms = getAllPermissionKeys();
    const grouped = groupPermissionsDB(allPerms);

    // Track which groups are expanded
    const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
        // Mở tất cả nhóm mặc định
        return new Set(Object.keys(grouped));
    });

    const toggleGroup = (group: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(group)) {
                next.delete(group);
            } else {
                next.add(group);
            }
            return next;
        });
    };

    const togglePermission = (perm: string) => {
        if (disabled) return;
        if (selectedPermissions.includes(perm)) {
            onChange(selectedPermissions.filter((p) => p !== perm));
        } else {
            onChange([...selectedPermissions, perm]);
        }
    };

    const toggleGroupAll = (group: string, perms: string[]) => {
        if (disabled) return;
        const groupSelected = perms.filter((p) => selectedPermissions.includes(p));
        if (groupSelected.length === perms.length) {
            // Bỏ chọn tất cả trong nhóm
            onChange(selectedPermissions.filter((p) => !perms.includes(p)));
        } else {
            // Chọn tất cả trong nhóm
            const newPerms = new Set([...selectedPermissions, ...perms]);
            onChange(Array.from(newPerms));
        }
    };

    const selectAll = () => {
        if (disabled) return;
        onChange([...allPerms]);
    };

    const deselectAll = () => {
        if (disabled) return;
        onChange([]);
    };

    const totalPerms = allPerms.length;
    const selectedCount = selectedPermissions.length;

    return (
        <div className="space-y-3">
            {/* Header: count + quick actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        Đã chọn:{" "}
                        <span className="text-primary">
                            {selectedCount} / {totalPerms}
                        </span>{" "}
                        quyền
                    </span>
                    {selectedCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                            {Math.round((selectedCount / totalPerms) * 100)}%
                        </Badge>
                    )}
                </div>
                {!disabled && (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={selectAll}
                        >
                            Chọn tất cả
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={deselectAll}
                        >
                            Bỏ chọn tất cả
                        </Button>
                    </div>
                )}
            </div>

            {/* Permission groups */}
            <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                    {Object.entries(grouped).map(([group, perms]) => {
                        const groupSelected = perms.filter((p) =>
                            selectedPermissions.includes(p),
                        );
                        const isAllSelected =
                            groupSelected.length === perms.length;
                        const isPartial =
                            groupSelected.length > 0 && !isAllSelected;

                        return (
                            <Collapsible
                                key={group}
                                open={openGroups.has(group)}
                                onOpenChange={() => toggleGroup(group)}
                            >
                                {/* Group header */}
                                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                                    <Checkbox
                                        id={`group-${group}`}
                                        checked={isAllSelected}
                                        ref={(el) => {
                                            if (el)
                                                (el as unknown as { indeterminate: boolean }).indeterminate = isPartial;
                                        }}
                                        onCheckedChange={() =>
                                            toggleGroupAll(group, perms)
                                        }
                                        disabled={disabled}
                                    />
                                    <CollapsibleTrigger
                                        asChild
                                        className="flex-1 cursor-pointer"
                                    >
                                        <label
                                            htmlFor={`group-${group}`}
                                            className="flex-1 text-sm font-medium cursor-pointer"
                                        >
                                            {PERMISSION_GROUPS_DB[group] ?? group}
                                        </label>
                                    </CollapsibleTrigger>
                                    <Badge
                                        variant="outline"
                                        className="text-xs h-5"
                                    >
                                        {groupSelected.length}/{perms.length}
                                    </Badge>
                                </div>

                                {/* Group content */}
                                <CollapsibleContent className="px-1 pt-1">
                                    <div className="ml-6 space-y-1">
                                        {perms.map((perm) => {
                                            const isChecked =
                                                selectedPermissions.includes(
                                                    perm,
                                                );
                                            return (
                                                <div
                                                    key={perm}
                                                    className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-accent/50"
                                                >
                                                    <Checkbox
                                                        id={perm}
                                                        checked={isChecked}
                                                        onCheckedChange={() =>
                                                            togglePermission(
                                                                perm,
                                                            )
                                                        }
                                                        disabled={disabled}
                                                        className="mt-0.5"
                                                    />
                                                    <label
                                                        htmlFor={perm}
                                                        className="flex-1 cursor-pointer text-sm leading-tight"
                                                    >
                                                        <span className="font-medium">
                                                            {PERMISSION_DESCRIPTIONS[
                                                                perm
                                                            ] ?? perm}
                                                        </span>
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            {perm}
                                                        </span>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
