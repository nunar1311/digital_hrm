"use client";

import { BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisableNotificationsRowProps {
    onClick: () => void;
    disabled?: boolean;
}

export function DisableNotificationsRow({
    onClick,
    disabled,
}: DisableNotificationsRowProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                "hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50",
            )}
        >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <BellOff className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="font-medium text-sm text-foreground">
                Tắt thông báo
            </span>
        </button>
    );
}
