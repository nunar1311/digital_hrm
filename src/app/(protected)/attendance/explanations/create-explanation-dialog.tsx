"use client";

import { useState, useRef } from "react";
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
import { TYPE_LABELS, STATUS_LABELS } from "./explanations-constants";
import type {
    ExplanationType,
    ExplainableAttendance,
} from "../types";
import { useTimezone } from "@/hooks/use-timezone";

const createExplanationSchema = z.object({
    attendanceId: z
        .string()
        .min(1, "Vui lòng chọn bản ghi chấm công cần giải trình"),
    type: z.enum([
        "LATE",
        "EARLY_LEAVE",
        "ABSENT",
        "FORGOT_CHECKOUT",
        "OTHER",
    ]),
    reason: z.string().min(5, "Lý do phải có ít nhất 5 ký tự"),
    attachment: z.string().optional(),
});

type CreateExplanationFormValues = z.infer<
    typeof createExplanationSchema
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
    const { timezone } = useTimezone();

    const form = useForm<CreateExplanationFormValues>({
        resolver: zodResolver(createExplanationSchema),
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

    // Tự động chọn type dựa trên attendance status
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
            toast.error("Chỉ chấp nhận file ảnh");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File không được vượt quá 5MB");
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
                throw new Error(err.error || "Lỗi khi upload file");
            }

            const { url } = await res.json();
            form.setValue("attachment", url);
            setPreview(url);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Lỗi khi upload file",
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
                    <DialogTitle>Tạo giải trình</DialogTitle>
                    <DialogDescription>
                        Chọn bản chấm công bất thường để giải trình lý
                        do.
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
                                        Bản chấm công
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={
                                            handleAttendanceChange
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Chọn bản chấm công..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {explainableAttendances.length ===
                                            0 ? (
                                                <SelectItem
                                                    value="_empty"
                                                    disabled
                                                >
                                                    Không có bản ghi
                                                    cần giải trình
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
                                                                "vi-VN",
                                                                { timeZone: timezone }
                                                            )}{" "}
                                                            —{" "}
                                                            {att.shift
                                                                ?.name ||
                                                                "N/A"}{" "}
                                                            —{" "}
                                                            {STATUS_LABELS[
                                                                att
                                                                    .status
                                                            ] ||
                                                                att.status}
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
                                        Loại giải trình
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Chọn loại giải trình" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(
                                                TYPE_LABELS,
                                            ).map(([key, label]) => (
                                                <SelectItem
                                                    key={key}
                                                    value={key}
                                                >
                                                    {label}
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
                                        Lý do giải trình
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Mô tả chi tiết lý do (tối thiểu 5 ký tự)..."
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Hình ảnh minh chứng</FormLabel>
                            <div className="space-y-2">
                                {preview ? (
                                    <div className="relative inline-block">
                                        <Image
                                            src={preview}
                                            alt="Minh chứng"
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
                                            ? "Đang tải..."
                                            : "Chọn ảnh"}
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
                                    Chấp nhận JPEG, PNG, WebP, GIF.
                                    Tối đa 5MB.
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
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending || uploading}
                            >
                                {isPending
                                    ? "Đang gửi..."
                                    : "Gửi giải trình"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
