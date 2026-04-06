"use client";

import { Check, Volume2, BellOff } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface BrowserNotificationDropdownProps {
    profile: string;
    playSoundEnabled: boolean;
    onPresetChange: (
        profile: "default" | "focused" | "custom",
    ) => Promise<void>;
    onCustomClick: () => void;
    onPlaySoundChange: (enabled: boolean) => Promise<void>;
    onDisable: () => Promise<void>;
    isSaving?: boolean;
    children: React.ReactNode;
}

export function BrowserNotificationDropdown({
    profile,
    playSoundEnabled,
    onPresetChange,
    onCustomClick,
    onPlaySoundChange,
    onDisable,
    isSaving = false,
    children,
}: BrowserNotificationDropdownProps) {
    const presetOptions = [
        {
            value: "default",
            label: "Mặc định",
            description: "Cài đặt được đề xuất",
        },
        {
            value: "focused",
            label: "Tập trung",
            description: "Chỉ thông báo quan trọng",
        },
        {
            value: "custom",
            label: "Tùy chỉnh",
            description: "Cấu hình theo nhu cầu",
        },
    ] as const;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isSaving}>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-72 p-1"
                align="end"
                sideOffset={4}
            >
                <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground px-1 mb-1.5">
                        Chế độ thông báo
                    </p>
                    <div className="space-y-0.5">
                        {presetOptions.map((opt) => {
                            const isSelected = profile === opt.value;
                            const isCustom = opt.value === "custom";

                            return (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => {
                                        if (isCustom) {
                                            onCustomClick();
                                        } else {
                                            onPresetChange(
                                                opt.value as
                                                    | "default"
                                                    | "focused"
                                                    | "custom",
                                            );
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="flex items-center justify-between gap-2 cursor-pointer"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                            {opt.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {opt.description}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                </div>

                <DropdownMenuSeparator />

                {/* Sound toggle */}
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Phát âm thanh</span>
                    </div>
                    <Switch
                        checked={playSoundEnabled}
                        onCheckedChange={(v) => onPlaySoundChange(v)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isSaving}
                        size="sm"
                    />
                </div>

                <DropdownMenuSeparator />

                {/* Disable notifications */}
                <DropdownMenuItem
                    onClick={() => onDisable()}
                    disabled={isSaving}
                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                    <BellOff className="h-4 w-4" />
                    <span className="text-sm">Tắt thông báo</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
