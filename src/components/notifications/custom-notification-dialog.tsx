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
import { useTranslations } from "next-intl";

export const NOTIFICATION_TRIGGERS = [
    {
        value: "ATTENDANCE",
        labelKey: "customNotificationTriggerAttendanceLabel",
        descriptionKey: "customNotificationTriggerAttendanceDescription",
    },
    {
        value: "LEAVE",
        labelKey: "customNotificationTriggerLeaveLabel",
        descriptionKey: "customNotificationTriggerLeaveDescription",
    },
    {
        value: "PAYROLL",
        labelKey: "customNotificationTriggerPayrollLabel",
        descriptionKey: "customNotificationTriggerPayrollDescription",
    },
    {
        value: "OVERTIME",
        labelKey: "customNotificationTriggerOvertimeLabel",
        descriptionKey: "customNotificationTriggerOvertimeDescription",
    },
    {
        value: "CONTRACT",
        labelKey: "customNotificationTriggerContractLabel",
        descriptionKey: "customNotificationTriggerContractDescription",
    },
    {
        value: "ASSET",
        labelKey: "customNotificationTriggerAssetLabel",
        descriptionKey: "customNotificationTriggerAssetDescription",
    },
    {
        value: "RECRUITMENT",
        labelKey: "customNotificationTriggerRecruitmentLabel",
        descriptionKey: "customNotificationTriggerRecruitmentDescription",
    },
    {
        value: "TRAINING",
        labelKey: "customNotificationTriggerTrainingLabel",
        descriptionKey: "customNotificationTriggerTrainingDescription",
    },
    {
        value: "PERFORMANCE",
        labelKey: "customNotificationTriggerPerformanceLabel",
        descriptionKey: "customNotificationTriggerPerformanceDescription",
    },
    {
        value: "SYSTEM",
        labelKey: "customNotificationTriggerSystemLabel",
        descriptionKey: "customNotificationTriggerSystemDescription",
    },
    {
        value: "APPROVAL",
        labelKey: "customNotificationTriggerApprovalLabel",
        descriptionKey: "customNotificationTriggerApprovalDescription",
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
    inbox: "customNotificationChannelInbox",
    email: "customNotificationChannelEmail",
    browser: "customNotificationChannelBrowser",
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
    const t = useTranslations("ProtectedPages");

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

    const channelLabel = t(
        CHANNEL_LABELS[channel] as
            | "customNotificationChannelInbox"
            | "customNotificationChannelEmail"
            | "customNotificationChannelBrowser",
    );

    return (
        <DialogContent className="sm:max-h-[80vh] sm:max-w-xl overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle>{t("customNotificationDialogTitle", { channel: channelLabel })}</DialogTitle>
                <DialogDescription>
                    {t("customNotificationDialogDescription", { channel: channelLabel })}
                </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto -mx-6 px-6">
                <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1">
                        {t("customNotificationDialogTypeLabel")}
                        <span className="text-destructive">*</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                        {t("customNotificationDialogTypeHint", { channel: channelLabel })}
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
                                        {t(
                                            trigger.labelKey as
                                                | "customNotificationTriggerAttendanceLabel"
                                                | "customNotificationTriggerLeaveLabel"
                                                | "customNotificationTriggerPayrollLabel"
                                                | "customNotificationTriggerOvertimeLabel"
                                                | "customNotificationTriggerContractLabel"
                                                | "customNotificationTriggerAssetLabel"
                                                | "customNotificationTriggerRecruitmentLabel"
                                                | "customNotificationTriggerTrainingLabel"
                                                | "customNotificationTriggerPerformanceLabel"
                                                | "customNotificationTriggerSystemLabel"
                                                | "customNotificationTriggerApprovalLabel",
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t(
                                            trigger.descriptionKey as
                                                | "customNotificationTriggerAttendanceDescription"
                                                | "customNotificationTriggerLeaveDescription"
                                                | "customNotificationTriggerPayrollDescription"
                                                | "customNotificationTriggerOvertimeDescription"
                                                | "customNotificationTriggerContractDescription"
                                                | "customNotificationTriggerAssetDescription"
                                                | "customNotificationTriggerRecruitmentDescription"
                                                | "customNotificationTriggerTrainingDescription"
                                                | "customNotificationTriggerPerformanceDescription"
                                                | "customNotificationTriggerSystemDescription"
                                                | "customNotificationTriggerApprovalDescription",
                                        )}
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
                    {t("customNotificationDialogCancel")}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving
                        ? t("customNotificationDialogSaving")
                        : t("customNotificationDialogSave")}
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
