"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import {
    createOffboarding,
    getOffboardingTemplates,
    getUsers,
} from "./actions";
import type { OffboardingTemplate } from "./types";
import { REASON_OPTIONS } from "./types";

// Form schema
const createOffboardingSchema = z.object({
    userId: z.string().min(1, "Vui lòng chọn nhân viên"),
    templateId: z.string().optional(),
    resignDate: z.date({ message: "Vui lòng chọn ngày nghỉ" }),
    lastWorkDate: z.date({ message: "Vui lòng chọn ngày làm cuối" }),
    reason: z.string().min(1, "Vui lòng chọn lý do nghỉ"),
    reasonDetail: z.string().optional(),
});

type CreateOffboardingFormData = z.infer<
    typeof createOffboardingSchema
>;

interface CreateOffboardingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: OffboardingTemplate[];
    onSuccess: () => void;
}

interface UserItem {
    id: string;
    name: string | null;
    email: string;
    employeeCode: string | null;
    departmentId: string | null;
    position: string | null;
}

export function CreateOffboardingDialog({
    open,
    onOpenChange,
    templates,
    onSuccess,
}: CreateOffboardingDialogProps) {
    const queryClient = useQueryClient();
    const [searchUser, setSearchUser] = useState("");

    // Fetch users for selection
    const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserItem[]>({
        queryKey: ["users", "all"],
        queryFn: () => getUsers() as Promise<UserItem[]>,
        enabled: open,
    });

    // Filtered users based on search
    const filteredUsers = users?.filter(
        (user) =>
            user.name
                ?.toLowerCase()
                .includes(searchUser.toLowerCase()) ||
            user.email
                .toLowerCase()
                .includes(searchUser.toLowerCase()) ||
            (user.employeeCode
                ?.toLowerCase()
                .includes(searchUser.toLowerCase()) ??
                false),
    );

    const form = useForm<CreateOffboardingFormData>({
        resolver: zodResolver(createOffboardingSchema),
        defaultValues: {
            userId: "",
            templateId: undefined,
            reason: "",
            reasonDetail: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: createOffboarding,
        onSuccess: () => {
            toast.success("Đã tạo quy trình offboarding");
            queryClient.invalidateQueries({
                queryKey: ["offboardings"],
            });
            queryClient.invalidateQueries({
                queryKey: ["offboarding-stats"],
            });
            form.reset();
            onSuccess();
        },
        onError: (error) => {
            toast.error("Lỗi khi tạo quy trình");
            console.error(error);
        },
    });

    const onSubmit = (data: CreateOffboardingFormData) => {
        createMutation.mutate({
            userId: data.userId,
            templateId: data.templateId || undefined,
            resignDate: data.resignDate,
            lastWorkDate: data.lastWorkDate,
            reason: data.reason,
            reasonDetail: data.reasonDetail,
        });
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            form.reset();
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tạo quy trình nghỉ việc</DialogTitle>
                    <DialogDescription>
                        Tạo quy trình offboarding cho nhân viên nghỉ
                        việc
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {/* User Selection */}
                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nhân viên *</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Tìm kiếm nhân viên..."
                                                value={searchUser}
                                                onChange={(e) =>
                                                    setSearchUser(
                                                        e.target
                                                            .value,
                                                    )
                                                }
                                                className="mb-2"
                                            />
                                            <Select
                                                value={field.value}
                                                onValueChange={
                                                    field.onChange
                                                }
                                                disabled={
                                                    isLoadingUsers
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Chọn nhân viên" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {filteredUsers.map(
                                                        (user) => (
                                                            <SelectItem
                                                                key={
                                                                    user.id
                                                                }
                                                                value={
                                                                    user.id
                                                                }
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span>
                                                                        {
                                                                            user.name
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {user.employeeCode ||
                                                                            user.email}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Template Selection */}
                        <FormField
                            control={form.control}
                            name="templateId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Mẫu quy trình
                                    </FormLabel>
                                    <Select
                                        value={field.value || ""}
                                        onValueChange={(value) =>
                                            field.onChange(
                                                value === "none"
                                                    ? undefined
                                                    : value,
                                            )
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Chọn mẫu (không bắt buộc)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Mặc định
                                            </SelectItem>
                                            {templates.map(
                                                (template) => (
                                                    <SelectItem
                                                        key={
                                                            template.id
                                                        }
                                                        value={
                                                            template.id
                                                        }
                                                    >
                                                        {
                                                            template.name
                                                        }
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Resign Date */}
                        <FormField
                            control={form.control}
                            name="resignDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Ngày nghỉ *</FormLabel>
                                    <DatePicker
                                        date={field.value}
                                        setDate={(date) =>
                                            field.onChange(date)
                                        }
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Last Work Date */}
                        <FormField
                            control={form.control}
                            name="lastWorkDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>
                                        Ngày làm cuối *
                                    </FormLabel>
                                    <DatePicker
                                        date={field.value}
                                        setDate={(date) =>
                                            field.onChange(date)
                                        }
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Reason */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Lý do nghỉ *
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn lý do" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {REASON_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={
                                                            option.value
                                                        }
                                                        value={
                                                            option.value
                                                        }
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Reason Detail */}
                        <FormField
                            control={form.control}
                            name="reasonDetail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Chi tiết lý do
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mô tả chi tiết lý do nghỉ việc..."
                                            rows={3}
                                            {...field}
                                            value={field.value || ""}
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
                                onClick={() =>
                                    handleOpenChange(false)
                                }
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Tạo quy trình
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
