"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrowserPresetValue = "default" | "focused" | "mentions_only" | "custom";

export const BROWSER_PRESET_OPTIONS: {
    value: BrowserPresetValue;
    label: string;
    description: string;
}[] = [
    {
        value: "default",
        label: "Mặc định",
        description: "Cài đặt được đề xuất",
    },
    {
        value: "focused",
        label: "Tập trung",
        description: "Theo dõi công việc mà không bị quá tải thông báo",
    },
    {
        value: "mentions_only",
        label: "Chỉ khi được nhắc",
        description: "Chỉ nhận thông báo khi có nhắc đến bạn",
    },
    {
        value: "custom",
        label: "Tùy chỉnh",
        description: "Cấu hình theo nhu cầu của bạn",
    },
];

interface NotificationPresetOptionsProps {
    value: BrowserPresetValue;
    onChange: (value: BrowserPresetValue) => void;
    disabled?: boolean;
}

export function NotificationPresetOptions({
    value,
    onChange,
    disabled,
}: NotificationPresetOptionsProps) {
    return (
        <div className="space-y-0">
            {BROWSER_PRESET_OPTIONS.map((opt) => {
                const isSelected = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => !disabled && onChange(opt.value)}
                        disabled={disabled}
                        className={cn(
                            "flex w-full items-start justify-between gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                            "hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50",
                        )}
                    >
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground">
                                {opt.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {opt.description}
                            </p>
                        </div>
                        {isSelected && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" />
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
