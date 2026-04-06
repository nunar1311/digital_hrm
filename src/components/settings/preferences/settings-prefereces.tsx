import React from "react";
import { SettingsSection } from "./settings-section";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleQuestionMark } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/contexts/settings-context";

const KEYBOARD_SHORTCUTS = [
    { key: "Ctrl + K", description: "Mở tìm kiếm" },
    { key: "Ctrl + N", description: "Tạo mới" },
    { key: "Ctrl + S", description: "Lưu thay đổi" },
    { key: "Escape", description: "Thoát/đóng dialog" },
    { key: "Ctrl + /", description: "Hiển thị phím tắt" },
    { key: "Ctrl + B", description: "Mở/đóng sidebar" },
    { key: "Ctrl + .", description: "Chuyển đổi sáng/tối" },
];

interface SettingPreferencesProps {
    flyoutToastEnabled: boolean;
    onFlyoutToastChange: (enabled: boolean) => void;
    keyboardShortcutsEnabled: boolean;
    onKeyboardShortcutsChange: (enabled: boolean) => void;
}

function SettingPreferences({
    flyoutToastEnabled,
    onFlyoutToastChange,
    keyboardShortcutsEnabled,
    onKeyboardShortcutsChange,
}: SettingPreferencesProps) {

    return (
        <>
            <SettingsSection
                title="Sở thích"
                description="Quản lý tuỳ chọn trong ứng dụng của bạn."
            >
                <div className="flex items-center gap-3">
                    <Switch
                        id="flyout-toast"
                        checked={flyoutToastEnabled}
                        onCheckedChange={onFlyoutToastChange}
                    />

                    <Label
                        htmlFor="flyout-toast"
                        className="text-sm cursor-pointer flex flex-col gap-1 items-start"
                    >
                        <div className="flex items-center gap-1">
                            Hiển thị toast khi có thông báo
                            <Tooltip>
                                <TooltipTrigger>
                                    <CircleQuestionMark className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    Khi bật, thông báo toast sẽ hiển
                                    thị ở góc dưới phải màn hình khi
                                    thực hiện các hành động như lưu,
                                    xóa, cập nhật...
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Khi thực hiện các hành động, thông báo
                            toast có thể xuất hiện ở dưới cùng bên
                            phải màn hình của bạn. Bạn có thể tắt tính
                            năng đó tại đây.
                        </p>
                    </Label>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center gap-3">
                    <Switch
                        id="keyboard-shortcuts"
                        checked={keyboardShortcutsEnabled}
                        onCheckedChange={onKeyboardShortcutsChange}
                    />

                    <Label
                        htmlFor="keyboard-shortcuts"
                        className="text-sm cursor-pointer flex flex-col gap-1 items-start"
                    >
                        <div className="flex items-center gap-1">
                            Bật phím tắt
                            <Tooltip>
                                <TooltipTrigger>
                                    <CircleQuestionMark className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    Khi bật, bạn có thể sử dụng các phím
                                    tắt để nhanh chóng điều hướng và thực
                                    hiện các hành động mà không cần sử dụng
                                    chuột.
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sử dụng phím tắt để tăng tốc độ làm việc.
                        </p>
                    </Label>
                </div>

                {keyboardShortcutsEnabled && (
                    <div className="mt-3 ml-12 space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">
                            Danh sách phím tắt
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {KEYBOARD_SHORTCUTS.map((shortcut) => (
                                <div
                                    key={shortcut.key}
                                    className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <span className="text-xs">
                                        {shortcut.description}
                                    </span>
                                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                        <span className="text-xs">⌘</span>
                                        {shortcut.key.replace("Ctrl + ", "+")}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            * Trên macOS, sử dụng Cmd thay cho Ctrl
                        </p>
                    </div>
                )}
            </SettingsSection>
        </>
    );
}

export default SettingPreferences;
