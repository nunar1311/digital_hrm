"use client";

import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
    title: string;
    description: string;
    canEdit: boolean;
    hasChanges: boolean;
    isSaving: boolean;
    onSave: () => void;
}

export function SettingsHeader({
    title,
    description,
    canEdit,
    hasChanges,
    isSaving,
    onSave,
}: SettingsHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {title}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            {canEdit && (
                <Button
                    onClick={onSave}
                    size={"sm"}
                    disabled={isSaving || !hasChanges}
                >
                    {isSaving && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Lưu thay đổi
                </Button>
            )}
        </div>
    );
}
