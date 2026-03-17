"use client";

import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
    canEdit: boolean;
    hasChanges: boolean;
    isSaving: boolean;
    onSave: () => void;
}

export function SettingsHeader({
    canEdit,
    hasChanges,
    isSaving,
    onSave,
}: SettingsHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Cài đặt hệ thống
                </h1>
                <p className="text-sm text-muted-foreground">
                    Cấu hình thông tin công ty và hệ thống
                </p>
            </div>
            {canEdit && (
                <Button
                    onClick={onSave}
                    size={"sm"}
                    disabled={isSaving || !hasChanges}
                >
                    {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Lưu thay đổi
                </Button>
            )}
        </div>
    );
}
