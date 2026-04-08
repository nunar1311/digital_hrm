"use client";

import { useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
    TYPE_TRANSLATION_KEYS,
    ATTENDANCE_STATUS_TRANSLATION_KEYS,
} from "./explanations-constants";
import type {
    ExplanationType,
    ExplainableAttendance,
} from "../types";
import { useTimezone } from "@/hooks/use-timezone";

const createExplanationSchema = (t: ReturnType<typeof useTranslations>) =>
    z.object({
        attendanceId: z
            .string()
            .min(1, t("attendanceExplanationsCreateValidationAttendanceRequired")),
        type: z.enum([
            "LATE",
            "EARLY_LEAVE",
            "ABSENT",
            "FORGOT_CHECKOUT",
            "OTHER",
        ]),
        reason: z
            .string()
            .min(5, t("attendanceExplanationsCreateValidationReasonMin")),
        attachment: z.string().optional(),
    });

type CreateExplanationFormValues = z.infer<
    ReturnType<typeof createExplanationSchema>
>;

interface CreateExplanationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    explainableAttendances: ExplainableAttendance[];
    isPending: boolean;
    onSubmit: (form: {
        attendanceId: string;
        type: ExplanationType;
        reason: string;
        attachment?: string;
    }) => void;
}

export function CreateExplanationDialog({
    open,
    onOpenChange,
    explainableAttendances,
    isPending,
    onSubmit,
}: CreateExplanationDialogProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations("ProtectedPages");
    const locale = useLocale();
    const { timezone } = useTimezone();

    const formSchema = createExplanationSchema(t);

    const form = useForm<CreateExplanationFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            attendanceId: "",
            type: "LATE",
            reason: "",
            attachment: undefined,
        },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            form.reset();
            setPreview(null);
        }
        onOpenChange(nextOpen);
    };

    // Auto-select type based on attendance status
    const handleAttendanceChange = (attendanceId: string) => {
        const att = explainableAttendances.find(
            (a) => a.id === attendanceId,
        );
        let autoType: ExplanationType = "OTHER";
        if (att) {
            switch (att.status) {
                case "LATE":
                case "LATE_AND_EARLY":
                    autoType = "LATE";
                    break;
                case "EARLY_LEAVE":
                    autoType = "EARLY_LEAVE";
                    break;
                case "ABSENT":
                    autoType = "ABSENT";
                    break;
                default:
                    autoType = "OTHER";
            }
        }
        form.setValue("attendanceId", attendanceId);
        form.setValue("type", autoType);
        form.clearErrors("attendanceId");
    };

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(t("attendanceExplanationsCreateUploadImageOnly"));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t("attendanceExplanationsCreateUploadMaxSize"));
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(
                    err.error ||
                        t("attendanceExplanationsCreateUploadErrorFallback"),
                );
            }

            const { url } = await res.json();
            form.setValue("attachment", url);
            setPreview(url);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : t("attendanceExplanationsCreateUploadErrorFallback"),
            );
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = () => {
        form.setValue("attachment", undefined);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {t("attendanceExplanationsCreateDialogTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("attendanceExplanationsCreateDialogDescription")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((values) =>
                            onSubmit(values),
                        )}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="attendanceId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("attendanceExplanationsCreateAttendanceLabel")}
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={
                                            handleAttendanceChange
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={t(
                                                        "attendanceExplanationsCreateAttendancePlaceholder",
                                                    )}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {explainableAttendances.length ===
                                            0 ? (
                                                <SelectItem
                                                    value="_empty"
                                                    disabled
                                                >
                                                    {t(
                                                        "attendanceExplanationsCreateAttendanceEmpty",
                                                    )}
                                                </SelectItem>
                                            ) : (
                                                explainableAttendances.map(
                                                    (att) => (
                                                        <SelectItem
                                                            key={
                                                                att.id
                                                            }
                                                            value={
                                                                att.id
                                                            }
                                                        >
                                                            {new Date(
                                                                att.date,
                                                            ).toLocaleDateString(
                                                                locale,
                                                                { timeZone: timezone }
                                                            )}{" "}
                                                            —{" "}
                                                            {att.shift
                                                                ?.name ||
                                                                t(
                                                                    "attendanceExplanationsCreateShiftNA",
                                                                )}{" "}
                                                            —{" "}
                                                            {ATTENDANCE_STATUS_TRANSLATION_KEYS[
                                                                att.status
                                                            ]
                                                                ? t(
                                                                      ATTENDANCE_STATUS_TRANSLATION_KEYS[
                                                                          att
                                                                              .status
                                                                      ],
                                                                  )
                                                                : att.status}
                                                        </SelectItem>
                                                    ),
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("attendanceExplanationsCreateTypeLabel")}
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={t(
                                                        "attendanceExplanationsCreateTypePlaceholder",
                                                    )}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(
                                                TYPE_TRANSLATION_KEYS,
                                            ).map(([key, labelKey]) => (
                                                <SelectItem
                                                    key={key}
                                                    value={key}
                                                >
                                                    {t(labelKey)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("attendanceExplanationsCreateReasonLabel")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder={t(
                                                "attendanceExplanationsCreateReasonPlaceholder",
                                            )}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>
                                {t("attendanceExplanationsCreateAttachmentLabel")}
                            </FormLabel>
                            <div className="space-y-2">
                                {preview ? (
                                    <div className="relative inline-block">
                                        <Image
                                            src={preview}
                                            alt={t("attendanceExplanationsEvidenceAlt")}
                                            width={128}
                                            height={128}
                                            className="h-32 w-auto rounded-md border object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={
                                                handleRemoveImage
                                            }
                                            className="bg-destructive text-destructive-foreground absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full"
                                        >
                                            <X className="h-3 w-3 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploading}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        {uploading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ImagePlus className="mr-2 h-4 w-4" />
                                        )}
                                        {uploading
                                            ? t("attendanceExplanationsCreateUploading")
                                            : t("attendanceExplanationsCreateSelectImage")}
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <p className="text-muted-foreground text-xs">
                                    {t("attendanceExplanationsCreateUploadHint")}
                                </p>
                            </div>
                        </FormItem>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    handleOpenChange(false)
                                }
                            >
                                {t("attendanceExplanationsDialogCancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending || uploading}
                            >
                                {isPending
                                    ? t("attendanceExplanationsCreateSubmitting")
                                    : t("attendanceExplanationsCreateSubmit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
