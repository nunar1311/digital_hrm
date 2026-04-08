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
    getUsers,
} from "./actions";
import type { OffboardingTemplate } from "./types";
import { REASON_OPTIONS } from "./types";
import { useTranslations } from "next-intl";

// Form schema
const createOffboardingSchema = (t: ReturnType<typeof useTranslations>) =>
    z.object({
        userId: z.string().min(1, t("offboardingCreateValidationUserRequired")),
        templateId: z.string().optional(),
        resignDate: z.date({
            message: t("offboardingCreateValidationResignDateRequired"),
        }),
        lastWorkDate: z.date({
            message: t("offboardingCreateValidationLastWorkDateRequired"),
        }),
        reason: z.string().min(1, t("offboardingCreateValidationReasonRequired")),
        reasonDetail: z.string().optional(),
    });

type CreateOffboardingFormData = z.infer<ReturnType<typeof createOffboardingSchema>>;

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
    const t = useTranslations("ProtectedPages");

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

    const formSchema = createOffboardingSchema(t);

    const form = useForm<CreateOffboardingFormData>({
        resolver: zodResolver(formSchema),
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
            toast.success(t("offboardingCreateToastSuccess"));
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
            toast.error(t("offboardingCreateToastError"));
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
                    <DialogTitle>{t("offboardingCreateDialogTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("offboardingCreateDialogDescription")}
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
                                    <FormLabel>{t("offboardingCreateEmployeeLabel")}</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Input
                                                placeholder={t("offboardingCreateEmployeeSearchPlaceholder")}
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
                                                        <SelectValue placeholder={t("offboardingCreateEmployeeSelectPlaceholder")} />
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
                                        {t("offboardingCreateTemplateLabel")}
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
                                                <SelectValue placeholder={t("offboardingCreateTemplatePlaceholder")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                {t("offboardingCreateTemplateDefault")}
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
                                    <FormLabel>{t("offboardingCreateResignDateLabel")}</FormLabel>
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
                                        {t("offboardingCreateLastWorkDateLabel")}
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
                                        {t("offboardingCreateReasonLabel")}
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("offboardingCreateReasonPlaceholder")} />
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
                                        {t("offboardingCreateReasonDetailLabel")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("offboardingCreateReasonDetailPlaceholder")}
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
                                {t("offboardingCreateCancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t("offboardingCreateSubmit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
