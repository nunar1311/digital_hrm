"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Settings2,
  CheckCircle2,
  Star,
  StarOff,
  ChevronDown,
  ChevronRight,
  Loader2,
  GitBranch,
  User,
  Users,
  Building2,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  getLeaveApprovalProcesses,
  createLeaveApprovalProcess,
  updateLeaveApprovalProcess,
  deleteLeaveApprovalProcess,
  type LeaveApprovalProcessData,
} from "./actions";
import type { ApprovalStep } from "../approval-process/types";
import { Textarea } from "@/components/ui/textarea";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ─── Schema ────────────────────────────────────────────────────────────────────

const stepSchema = z.object({
  stepOrder: z.number().int().min(1),
  stepType: z.literal("APPROVER"),
  approverType: z.enum([
    "DIRECT_MANAGER",
    "DEPT_HEAD",
    "CUSTOM_LIST",
    "ROLE",
    "USER",
    "SUPERVISOR",
    "MANAGER",
    "HR",
  ]),
  approvalMethod: z.enum(["FIRST_APPROVES", "ALL_MUST_APPROVE", "MAJORITY"]),
  customApproverIds: z.array(z.string()).optional(),
  skipIfNoApproverFound: z.boolean().optional(),
});

const processSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên quy trình"),
  description: z.string().optional(),
  isDefault: z.boolean(),
  skipDuplicateApprover: z.boolean(),
  skipSelfApprover: z.boolean(),
  steps: z.array(stepSchema).min(1, "Cần ít nhất một bước duyệt"),
});

type ProcessFormValues = z.infer<typeof processSchema>;

// ─── Step type icons ───────────────────────────────────────────────────────────

const APPROVER_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  DIRECT_MANAGER: {
    label: "Quản lý trực tiếp",
    icon: User,
    color: "text-blue-600",
  },
  DEPT_HEAD: {
    label: "Trưởng phòng",
    icon: Building2,
    color: "text-purple-600",
  },
  CUSTOM_LIST: {
    label: "Người duyệt chỉ định",
    icon: Users,
    color: "text-green-600",
  },
};

// ─── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  onRemove,
  onChange,
}: {
  step: ApprovalStep;
  index: number;
  onRemove: () => void;
  onChange: (updated: ApprovalStep) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = step.approverType
    ? APPROVER_TYPE_CONFIG[step.approverType]
    : null;
  const Icon = config?.icon ?? User;

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {index + 1}
        </div>
        <Icon
          className={cn(
            "size-4 shrink-0",
            config?.color ?? "text-muted-foreground",
          )}
        />
        <span className="text-sm font-medium flex-1">
          {config?.label ?? "Bước duyệt"}
        </span>
        <Badge variant="outline" className="text-[10px]">
          {step.approvalMethod === "ALL_MUST_APPROVE"
            ? "Tất cả phê duyệt"
            : "Người đầu tiên"}
        </Badge>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-destructive hover:text-destructive shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
        {expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 py-3 space-y-3 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Loại người duyệt
              </Label>
              <Select
                value={step.approverType ?? "DIRECT_MANAGER"}
                onValueChange={(v) =>
                  onChange({
                    ...step,
                    approverType: v as ApprovalStep["approverType"],
                    customApproverIds: [],
                  })
                }
              >
                <SelectTrigger className="text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT_MANAGER">
                    Quản lý trực tiếp
                  </SelectItem>
                  <SelectItem value="DEPT_HEAD">Trưởng phòng ban</SelectItem>
                  <SelectItem value="CUSTOM_LIST">
                    Người duyệt chỉ định
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Phương thức duyệt
              </Label>
              <Select
                value={step.approvalMethod ?? "FIRST_APPROVES"}
                onValueChange={(v) =>
                  onChange({
                    ...step,
                    approvalMethod: v as ApprovalStep["approvalMethod"],
                  })
                }
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST_APPROVES">
                    Chỉ cần 1 người duyệt
                  </SelectItem>
                  <SelectItem value="ALL_MUST_APPROVE">
                    Tất cả phải duyệt
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={step.skipIfNoApproverFound ?? true}
              onCheckedChange={(v) =>
                onChange({ ...step, skipIfNoApproverFound: v })
              }
              className="scale-75"
            />
            <span>Bỏ qua nếu không tìm thấy người duyệt</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Process Form Dialog ───────────────────────────────────────────────────────

function ProcessDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: LeaveApprovalProcessData | null;
  onSaved: () => void;
}) {
  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(processSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      skipDuplicateApprover: true,
      skipSelfApprover: true,
      steps: [
        {
          stepOrder: 1,
          stepType: "APPROVER",
          approverType: "DIRECT_MANAGER",
          approvalMethod: "FIRST_APPROVES",
          skipIfNoApproverFound: true,
        },
      ],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const addStep = () => {
    append({
      stepOrder: fields.length + 1,
      stepType: "APPROVER",
      approverType: "DEPT_HEAD",
      approvalMethod: "FIRST_APPROVES",
      skipIfNoApproverFound: true,
    });
  };

  const { mutate: save, isPending } = useMutation<
    void,
    Error,
    ProcessFormValues
  >({
    mutationFn: async (data) => {
      // Reassign sequential step orders just to be safe
      const payload = {
        ...data,
        steps: data.steps.map((s, i) => ({ ...s, stepOrder: i + 1 })),
      };
      if (editing) {
        await updateLeaveApprovalProcess(editing.id, payload as any);
      } else {
        await createLeaveApprovalProcess(payload as any);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Đã cập nhật quy trình" : "Đã tạo quy trình mới");
      form.reset();
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (data: ProcessFormValues) => {
    save(data);
  };

  const handleOpen = (v: boolean) => {
    if (v) {
      form.reset({
        name: editing?.name ?? "",
        description: editing?.description ?? "",
        isDefault: editing?.isDefault ?? false,
        skipDuplicateApprover: editing?.skipDuplicateApprover ?? true,
        skipSelfApprover: editing?.skipSelfApprover ?? true,
        steps:
          editing?.steps && editing.steps.length > 0
            ? (editing.steps as unknown as ProcessFormValues["steps"])
            : [
                {
                  stepOrder: 1,
                  stepType: "APPROVER",
                  approverType: "DIRECT_MANAGER",
                  approvalMethod: "FIRST_APPROVES",
                  skipIfNoApproverFound: true,
                },
              ],
      });
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-5xl gap-0 p-0 h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-4 border-b">
          <DialogTitle>
            {editing ? "Chỉnh sửa quy trình" : "Tạo quy trình duyệt mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-hidden flex flex-col w-full"
          >
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* CỘT TRÁI: Thông tin & Cài đặt */}
              <div className="w-full md:w-[420px] lg:w-[460px] shrink-0 p-5 space-y-6 overflow-y-auto border-b md:border-b-0 md:border-r">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Tên quy trình{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vd: Quy trình duyệt 2 cấp"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-muted-foreground">
                          Mô tả
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Mô tả ngắn gọn..."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Settings */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Cài đặt luồng duyệt
                  </Label>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg transition-colors cursor-pointer border p-3 bg-card hover:bg-muted/50">
                          <div className="space-y-1 mr-4">
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              Quy trình mặc định
                            </FormLabel>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Tự động áp dụng cho đơn không có quy trình
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="skipDuplicateApprover"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg transition-colors cursor-pointer border p-3 bg-card hover:bg-muted/50">
                          <div className="space-y-1 mr-4">
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              Bỏ qua trùng lặp
                            </FormLabel>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Chỉ duyệt một lần nếu các bước trùng người
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="skipSelfApprover"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg transition-colors cursor-pointer border p-3 bg-card hover:bg-muted/50">
                          <div className="space-y-1 mr-4">
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              Bỏ qua tự duyệt
                            </FormLabel>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Người gửi đơn không thể tự duyệt đơn của mình
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: Các bước duyệt */}
              <div className="flex-1 w-full bg-muted/10">
                <div className="p-5 space-y-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between sticky top-0 bg-muted/10 pb-2 z-10 w-full">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">
                        Các bước duyệt ({fields.length})
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Thiết lập thứ tự cấp duyệt cho luồng này
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={addStep}
                      className="h-8"
                    >
                      <Plus className="size-4 mr-1.5" />
                      Thêm bước
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                      <GitBranch className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm font-medium">
                        Chưa có bước duyệt nào
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nhấn "Thêm bước" để thiết lập luồng duyệt
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full pb-4">
                      {fields.map((field, idx) => (
                        <StepCard
                          key={field.id}
                          step={field as unknown as ApprovalStep}
                          index={idx}
                          onRemove={() => remove(idx)}
                          onChange={(updated) => update(idx, updated as any)}
                        />
                      ))}
                      {form.formState.errors.steps && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          {form.formState.errors.steps.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t bg-card mt-auto max-h-min shrink-0 z-20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button size="sm" type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin " />}
                {editing ? "Lưu thay đổi" : "Tạo quy trình"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Process Card ──────────────────────────────────────────────────────────────

function ProcessCard({
  process,
  onEdit,
  onDelete,
  onToggleDefault,
}: {
  process: LeaveApprovalProcessData;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDefault: () => void;
}) {
  const steps = process.steps ?? [];
  const approverSteps = steps.filter(
    (s: ApprovalStep) => s.stepType === "APPROVER",
  );

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        process.isDefault && "border-primary ring-1 ring-primary/20",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GitBranch className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CardTitle className="text-sm">{process.name}</CardTitle>
                {process.isDefault && (
                  <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                    <Star className="size-2.5 mr-0.5" />
                    Mặc định
                  </Badge>
                )}
                {!process.isActive && (
                  <Badge variant="secondary" className="text-[9px]">
                    Đã tắt
                  </Badge>
                )}
              </div>
              {process.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {process.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              title={process.isDefault ? "Bỏ mặc định" : "Đặt làm mặc định"}
              onClick={onToggleDefault}
              className={cn(process.isDefault && "text-primary")}
            >
              {process.isDefault ? (
                <Star className="size-3.5 fill-primary" />
              ) : (
                <StarOff className="size-3.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onEdit}>
              <Settings2 />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="mb-3" />
        {/* Steps preview */}
        {approverSteps.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có bước duyệt</p>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {approverSteps.map((step: ApprovalStep, idx: number) => {
              const cfg = step.approverType
                ? APPROVER_TYPE_CONFIG[step.approverType]
                : null;
              const Icon = cfg?.icon ?? User;
              return (
                <div key={idx} className="flex items-center gap-1">
                  <div className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                    <Icon className={cn("size-3", cfg?.color)} />
                    <span>{cfg?.label ?? "Bước"}</span>
                  </div>
                  {idx < approverSteps.length - 1 && (
                    <ChevronRight className="size-3 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
          <span
            className={cn(
              process.skipSelfApprover
                ? "text-green-600"
                : "text-muted-foreground",
            )}
          >
            {process.skipSelfApprover ? "✓" : "✗"} Bỏ qua tự duyệt
          </span>
          <span
            className={cn(
              process.skipDuplicateApprover
                ? "text-green-600"
                : "text-muted-foreground",
            )}
          >
            {process.skipDuplicateApprover ? "✓" : "✗"} Bỏ qua trùng
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LeaveApprovalSetupClient() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] =
    useState<LeaveApprovalProcessData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["leave-approval-processes"],
    queryFn: getLeaveApprovalProcesses,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["leave-approval-processes"] });

  const deleteMutation = useMutation({
    mutationFn: deleteLeaveApprovalProcess,
    onSuccess: () => {
      toast.success("Đã xóa quy trình");
      invalidate();
      setDeletingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: ({ id, isDefault }: { id: string; isDefault: boolean }) =>
      updateLeaveApprovalProcess(id, { isDefault: !isDefault }),
    onSuccess: () => {
      toast.success("Đã cập nhật quy trình mặc định");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* ─── Header ─── */}
      <section className="border-b">
        <header className="p-2 flex items-center h-10">
          <h1 className="font-bold">Quy trình duyệt nghỉ phép</h1>
        </header>
      </section>

      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-end gap-1.5 px-2 py-2 shrink-0 border-b">
        <Button
          size="xs"
          onClick={() => {
            setEditingProcess(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          Tạo quy trình mới
        </Button>

        <Separator orientation="vertical" className="h-4!" />

        <Button size="xs" variant="outline" onClick={() => invalidate()}>
          <RefreshCw />
        </Button>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-4 p-4">
          {/* Info box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs">
                  Cách hoạt động
                </p>
                <ul className="text-[11px] text-blue-700 dark:text-blue-400 space-y-0.5 list-disc ml-3">
                  <li>
                    Đơn nghỉ phép sẽ qua từng bước duyệt theo thứ tự đã cấu hình
                  </li>
                  <li>
                    Quy trình <strong>Mặc định</strong> sẽ được tự động áp dụng
                    khi nhân viên gửi đơn
                  </li>
                  <li>
                    Chỉ khi bước cuối cùng được duyệt, đơn mới chuyển sang trạng
                    thái &quot;Đã duyệt&quot;
                  </li>
                  <li>
                    Người duyệt ở bước hiện tại có thể từ chối và đơn sẽ bị từ
                    chối ngay lập tức
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Process list */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="size-4 animate-spin" />
              Đang tải...
            </div>
          ) : processes.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
              <GitBranch className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chưa có quy trình duyệt nào</p>
              <p className="text-xs mt-1">
                Tạo quy trình đầu tiên để bật tính năng duyệt đa cấp
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {processes.map((process) => (
                <ProcessCard
                  key={process.id}
                  process={process}
                  onEdit={() => {
                    setEditingProcess(process);
                    setDialogOpen(true);
                  }}
                  onDelete={() => setDeletingId(process.id)}
                  onToggleDefault={() =>
                    toggleDefaultMutation.mutate({
                      id: process.id,
                      isDefault: process.isDefault,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}
      <ProcessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingProcess}
        onSaved={invalidate}
      />

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa quy trình duyệt?</AlertDialogTitle>
            <AlertDialogDescription>
              Các đơn nghỉ phép đang dùng quy trình này sẽ không còn liên kết.
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : null}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
