"use client";

import { Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface PlaySoundToggleProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function PlaySoundToggle({
    checked,
    onCheckedChange,
    disabled,
}: PlaySoundToggleProps) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5">
            <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="font-medium text-sm text-foreground">
                    Phát âm thanh
                </span>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
        </div>
    );
}
