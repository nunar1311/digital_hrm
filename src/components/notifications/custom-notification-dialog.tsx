"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const NOTIFICATION_TRIGGERS = [
    {
        value: "ATTENDANCE",
        label: "Chấm công",
        description:
            "Điểm danh vào/ra • Giải trình chấm công • Xin nghỉ bù • Cảnh báo quên chấm công",
    },
    {
        value: "LEAVE",
        label: "Nghỉ phép",
        description:
            "Đơn xin nghỉ • Duyệt/từ chối đơn nghỉ • Nhắc nhở nộp đơn",
    },
    {
        value: "PAYROLL",
        label: "Lương",
        description:
            "Phiếu lương mới • Thay đổi lương • Ngày phát lương",
    },
    {
        value: "OVERTIME",
        label: "Tăng ca",
        description: "Đăng ký tăng ca • Duyệt/từ chối tăng ca",
    },
    {
        value: "CONTRACT",
        label: "Hợp đồng",
        description:
            "Hợp đồng sắp hết hạn • Gia hạn hợp đồng • Ký hợp đồng mới",
    },
    {
        value: "ASSET",
        label: "Tài sản",
        description:
            "Cấp phát tài sản • Thu hồi tài sản • Bảo trì tài sản",
    },
    {
        value: "RECRUITMENT",
        label: "Tuyển dụng",
        description:
            "Ứng viên mới • Lịch phỏng vấn • Kết quả tuyển dụng • Offer",
    },
    {
        value: "TRAINING",
        label: "Đào tạo",
        description: "Lịch đào tạo • Kết quả đào tạo • Tài liệu mới",
    },
    {
        value: "PERFORMANCE",
        label: "Đánh giá",
        description: "Kỳ đánh giá • Kết quả đánh giá • Mục tiêu mới",
    },
    {
        value: "SYSTEM",
        label: "Hệ thống",
        description:
            "Thông báo hệ thống • Bảo trì • Cập nhật chính sách",
    },
    {
        value: "APPROVAL",
        label: "Phê duyệt",
        description: "Yêu cầu cần phê duyệt • Kết quả phê duyệt",
    },
] as const;

type ChannelType = "inbox" | "email" | "browser";

interface CustomNotificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel: ChannelType;
    selectedTypes: string[];
    onSave: (types: string[]) => Promise<void>;
    isSaving?: boolean;
}

const CHANNEL_LABELS: Record<ChannelType, string> = {
    inbox: "Hộp thư đến",
    email: "Email",
    browser: "Trình duyệt",
};

function CustomNotificationDialogContent({
    channel,
    selectedTypes,
    onSave,
    isSaving,
    onClose,
}: {
    channel: ChannelType;
    selectedTypes: string[];
    onSave: (types: string[]) => Promise<void>;
    isSaving?: boolean;
    onClose: () => void;
}) {
    // Nếu selectedTypes rỗng → mặc định bật tất cả (all ON)
    // Nếu selectedTypes có giá trị → chỉ bật những loại đó
    const defaultTypes =
        (selectedTypes ?? []).length > 0
            ? (selectedTypes ?? [])
            : NOTIFICATION_TRIGGERS.map((t) => t.value);

    const [toggledTypes, setToggledTypes] =
        useState<string[]>(defaultTypes);

    const handleToggle = (value: string, checked: boolean) => {
        setToggledTypes((prev) =>
            checked
                ? [...prev, value]
                : prev.filter((t) => t !== value),
        );
    };

    const handleSave = async () => {
        // Nếu tất cả đều bật → lưu empty array (mặc định)
        // Nếu có một số bị tắt → chỉ lưu những cái đang bật
        const allTypes = NOTIFICATION_TRIGGERS.map((t) => t.value);
        const savedTypes =
            toggledTypes.length === allTypes.length
                ? []
                : toggledTypes;
        await onSave(savedTypes);
        onClose();
    };

    const channelLabel = CHANNEL_LABELS[channel];

    return (
        <DialogContent className="sm:max-h-[80vh] sm:max-w-xl overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle>Thông báo {channelLabel}</DialogTitle>
                <DialogDescription>
                    Cấu hình loại thông báo nhận cho {channelLabel}.
                    Bạn có thể bật/tắt từng nhóm theo nhu cầu.
                </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto -mx-6 px-6">
                <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1">
                        Loại thông báo
                        <span className="text-destructive">*</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                        Bật các nhóm thông báo bạn muốn nhận qua{" "}
                        {channelLabel}.
                    </p>
                </div>

                <div className="space-y-0 border rounded-lg divide-y">
                    {NOTIFICATION_TRIGGERS.map((trigger) => {
                        const isOn = toggledTypes.includes(
                            trigger.value,
                        );
                        return (
                            <div
                                key={trigger.value}
                                className="flex items-start gap-3 px-4 py-3"
                            >
                                <Switch
                                    checked={isOn}
                                    onClick={() =>
                                        handleToggle(
                                            trigger.value,
                                            !isOn,
                                        )
                                    }
                                    disabled={isSaving}
                                    className="shrink-0 mt-0.5 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">
                                        {trigger.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {trigger.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                >
                    Hủy
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Đang lưu…" : "Lưu"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export function CustomNotificationDialog({
    open,
    onOpenChange,
    channel,
    selectedTypes,
    onSave,
    isSaving = false,
}: CustomNotificationDialogProps) {
    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open ? (
                <CustomNotificationDialogContent
                    key={`${channel}-${open}`}
                    channel={channel}
                    selectedTypes={selectedTypes}
                    onSave={onSave}
                    isSaving={isSaving}
                    onClose={handleClose}
                />
            ) : null}
        </Dialog>
    );
}
