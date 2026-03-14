"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { returnAsset } from "@/app/(protected)/assets/actions";
import { CONDITION_OPTIONS } from "@/app/(protected)/assets/constants";

const formSchema = z.object({
    assignmentId: z.string().min(1),
    condition: z.enum(["GOOD", "DAMAGED", "LOST"]).optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssetReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignmentId: string;
}

export function AssetReturnDialog({
    open,
    onOpenChange,
    assignmentId,
}: AssetReturnDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assignmentId,
            condition: "GOOD",
            notes: "",
        },
    });

    const mutation = useMutation({
        mutationFn: returnAsset,
        onSuccess: () => {
            toast.success("Đã thu hồi tài sản thành công");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            onOpenChange(false);
            form.reset();
        },
        onError: (err: Error) => {
            toast.error(err.message || "Không thể thu hồi tài sản");
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Thu hồi tài sản</DialogTitle>
                    <DialogDescription>
                        Kiểm tra tình trạng tài sản và xác nhận thu hồi
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((v) =>
                            mutation.mutate(v),
                        )}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="condition"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tình trạng tài sản</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Chọn tình trạng" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {CONDITION_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
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
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ghi chú về tình trạng khi thu hồi..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Xác nhận thu hồi
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
