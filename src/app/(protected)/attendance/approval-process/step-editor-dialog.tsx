"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import {
    STEP_TYPE_OPTIONS,
    APPROVER_TYPE_OPTIONS,
    APPROVAL_METHOD_OPTIONS,
    CONDITION_TYPE_OPTIONS,
    MANAGER_LEVEL_OPTIONS,
} from "./approval-constants";
import type { ApprovalStep } from "../types";
import { getDepartmentOptions } from "../actions";

const stepEditorSchema = z.object({
    stepType: z.enum(["APPROVER", "CONDITION"]),
    approverType: z.string().optional(),
    managerLevel: z.number().optional(),
    approvalMethod: z.string().optional(),
    customApproverIds: z.array(z.string()).optional(),
    conditionType: z.string().optional(),
    conditionValues: z.array(z.string()).optional(),
    priority: z.number().optional(),
    skipIfNoApproverFound: z.boolean().optional(),
});

type StepEditorValues = z.infer<typeof stepEditorSchema>;

interface StepEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    step: ApprovalStep | null;
    isNew: boolean;
    onSave: (step: ApprovalStep) => void;
}

export function StepEditorDialog({
    open,
    onOpenChange,
    step,
    isNew,
    onSave,
}: StepEditorDialogProps) {
    const [customApproverIds, setCustomApproverIds] = useState<string[]>([]);
    const [conditionValues, setConditionValues] = useState<string[]>([]);
    const [deptOptions, setDeptOptions] = useState<ComboboxOption[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(false);

    const form = useForm<StepEditorValues>({
        resolver: zodResolver(stepEditorSchema),
        defaultValues: {
            stepType: "APPROVER",
            approverType: "DIRECT_MANAGER",
            managerLevel: 1,
            approvalMethod: "FIRST_APPROVES",
            customApproverIds: [],
            conditionType: "DEPARTMENT",
            conditionValues: [],
            priority: undefined,
            skipIfNoApproverFound: false,
        },
    });

    const stepType = form.watch("stepType");
    const approverType = form.watch("approverType");
    const conditionType = form.watch("conditionType");

    // Fetch departments when dialog opens
    useEffect(() => {
        if (open && deptOptions.length === 0) {
            setLoadingDepts(true);
            getDepartmentOptions()
                .then((depts) => {
                    setDeptOptions(depts);
                })
                .finally(() => setLoadingDepts(false));
        }
    }, [open, deptOptions.length]);

    useEffect(() => {
        if (step && open) {
            form.reset({
                stepType: step.stepType,
                approverType: step.approverType,
                managerLevel: step.managerLevel,
                approvalMethod: step.approvalMethod,
                customApproverIds: step.customApproverIds || [],
                conditionType: step.conditionType,
                conditionValues: step.conditionValues || [],
                priority: step.priority,
                skipIfNoApproverFound: step.skipIfNoApproverFound,
            });
            setCustomApproverIds(step.customApproverIds || []);
            setConditionValues(step.conditionValues || []);
        } else if (open) {
            form.reset({
                stepType: "APPROVER",
                approverType: "DIRECT_MANAGER",
                managerLevel: 1,
                approvalMethod: "FIRST_APPROVES",
                customApproverIds: [],
                conditionType: "DEPARTMENT",
                conditionValues: [],
                priority: undefined,
                skipIfNoApproverFound: false,
            });
            setCustomApproverIds([]);
            setConditionValues([]);
        }
    }, [step, open, form]);

    const handleSubmit = (values: StepEditorValues) => {
        const savedStep: ApprovalStep = {
            id: step?.id,
            stepOrder: step?.stepOrder ?? 1,
            stepType: values.stepType,
            approverType:
                values.stepType === "APPROVER"
                    ? (values.approverType as ApprovalStep["approverType"])
                    : undefined,
            managerLevel:
                values.stepType === "APPROVER" &&
                values.approverType === "MANAGER_LEVEL"
                    ? values.managerLevel
                    : undefined,
            approvalMethod:
                values.stepType === "APPROVER" &&
                values.approverType !== "MANAGER_LEVEL"
                    ? (values.approvalMethod as ApprovalStep["approvalMethod"])
                    : undefined,
            customApproverIds:
                values.stepType === "APPROVER" &&
                values.approverType === "CUSTOM_LIST"
                    ? customApproverIds
                    : undefined,
            conditionType:
                values.stepType === "CONDITION"
                    ? (values.conditionType as ApprovalStep["conditionType"])
                    : undefined,
            conditionValues:
                values.stepType === "CONDITION" ? conditionValues : undefined,
            priority:
                values.stepType === "CONDITION" ? values.priority : undefined,
            skipIfNoApproverFound: values.skipIfNoApproverFound,
        };

        onSave(savedStep);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isNew ? "Thêm bước mới" : "Chỉnh sửa bước"}
                    </DialogTitle>
                    <DialogDescription>
                        Thiết lập thông tin cho bước trong quy trình duyệt
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        {/* Step Type */}
                        <FormField
                            control={form.control}
                            name="stepType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loại bước</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className="flex flex-col space-y-2"
                                        >
                                            {STEP_TYPE_OPTIONS.map((opt) => (
                                                <div
                                                    key={opt.value}
                                                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                                >
                                                    <RadioGroupItem
                                                        value={opt.value}
                                                        className="mt-0.5"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {opt.label}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {opt.value === "APPROVER"
                                                                ? "Chỉ định người duyệt yêu cầu ở bước này"
                                                                : "Lọc yêu cầu dựa trên thông tin người gửi"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* APPROVER Configuration */}
                        {stepType === "APPROVER" && (
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="approverType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Người duyệt</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value || "DIRECT_MANAGER"}
                                                    className="flex flex-col space-y-2"
                                                >
                                                    {APPROVER_TYPE_OPTIONS.map(
                                                        (opt) => (
                                                            <div
                                                                key={opt.value}
                                                                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                                            >
                                                                <RadioGroupItem
                                                                    value={opt.value}
                                                                    className="mt-0.5"
                                                                />
                                                                <div>
                                                                    <p className="font-medium text-sm">
                                                                        {
                                                                            opt.label
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {
                                                                            opt.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Manager Level Selector */}
                                {approverType === "MANAGER_LEVEL" && (
                                    <FormField
                                        control={form.control}
                                        name="managerLevel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cấp duyệt</FormLabel>
                                                <Select
                                                    onValueChange={(v) =>
                                                        field.onChange(
                                                            parseInt(v),
                                                        )
                                                    }
                                                    value={String(field.value || 1)}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn cấp duyệt" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {MANAGER_LEVEL_OPTIONS.map(
                                                            (opt) => (
                                                                <SelectItem
                                                                    key={opt.value}
                                                                    value={String(
                                                                        opt.value,
                                                                    )}
                                                                >
                                                                    {opt.label} —{" "}
                                                                    {opt.description}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Approval Method */}
                                {approverType &&
                                    approverType !== "MANAGER_LEVEL" && (
                                        <FormField
                                            control={form.control}
                                            name="approvalMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Phương thức duyệt
                                                    </FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={
                                                                field.value ||
                                                                "FIRST_APPROVES"
                                                            }
                                                            className="flex flex-col space-y-2"
                                                        >
                                                            {APPROVAL_METHOD_OPTIONS.map(
                                                                (opt) => (
                                                                    <div
                                                                        key={
                                                                            opt.value
                                                                        }
                                                                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                                                    >
                                                                        <RadioGroupItem
                                                                            value={
                                                                                opt.value
                                                                            }
                                                                            className="mt-0.5"
                                                                        />
                                                                        <div>
                                                                            <p className="font-medium text-sm">
                                                                                {
                                                                                    opt.label
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {
                                                                                    opt.description
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                {/* Custom Approver List */}
                                {approverType === "CUSTOM_LIST" && (
                                    <div className="space-y-2">
                                        <Label>Danh sách người duyệt</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Tính năng chọn nhân viên sẽ được cập
                                            nhật trong phiên bản tiếp theo. Hiện
                                            tại, vui lòng sử dụng các loại người
                                            duyệt khác.
                                        </p>
                                        <div className="p-3 border rounded-lg bg-muted/50 text-sm text-muted-foreground">
                                            Danh sách:{" "}
                                            {customApproverIds.length > 0
                                                ? `${customApproverIds.length} nhân viên đã chọn`
                                                : "Chưa chọn nhân viên nào"}
                                        </div>
                                    </div>
                                )}

                                {/* Skip if no approver found */}
                                <FormField
                                    control={form.control}
                                    name="skipIfNoApproverFound"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={
                                                        field.value ?? false
                                                    }
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="cursor-pointer">
                                                    Bỏ qua bước này nếu không
                                                    tìm thấy người duyệt
                                                </FormLabel>
                                                <p className="text-xs text-muted-foreground">
                                                    Yêu cầu sẽ tự động chuyển
                                                    sang bước tiếp theo
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* CONDITION Configuration */}
                        {stepType === "CONDITION" && (
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="conditionType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loại điều kiện</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || "DEPARTMENT"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn loại điều kiện" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {CONDITION_TYPE_OPTIONS.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={opt.value}
                                                                value={opt.value}
                                                            >
                                                                {opt.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Condition values - chỉ hiện khi KHÔNG phải OTHER */}
                                {conditionType && conditionType !== "OTHER" && (
                                    <FormField
                                        control={form.control}
                                        name="conditionValues"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Danh sách áp dụng</FormLabel>
                                                <FormControl>
                                                    {loadingDepts ? (
                                                        <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Đang tải...
                                                        </div>
                                                    ) : (
                                                        <Combobox
                                                            options={deptOptions}
                                                            value={field.value || []}
                                                            onChange={(ids) => {
                                                                field.onChange(ids);
                                                                setConditionValues(ids);
                                                            }}
                                                            placeholder={
                                                                conditionType === "DEPARTMENT"
                                                                    ? "Chọn phòng ban..."
                                                                    : "Chọn..."
                                                            }
                                                            multiple
                                                        />
                                                    )}
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">
                                                    Chọn các {conditionType === "DEPARTMENT" ? "phòng ban" : "giá trị"} mà điều kiện này áp dụng
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={
                                                        field.value !== undefined
                                                    }
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(
                                                            checked ? 1 : undefined,
                                                        );
                                                    }}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="cursor-pointer">
                                                    Điều kiện khác (Fallback)
                                                </FormLabel>
                                                <p className="text-xs text-muted-foreground">
                                                    Áp dụng cho tất cả các yêu
                                                    cầu còn lại khi không thỏa
                                                    mãn điều kiện trước đó
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit">
                                {isNew ? "Thêm bước" : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
