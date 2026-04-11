"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Clock, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Combobox } from "@/components/ui/combobox";
import type { Shift, UserBasic, WorkCycle } from "../types";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import { WEEKDAY_SHORT } from "@/components/attendance/settings/work-cycles-constants";

/** Convert yyyy-MM-dd string to Date, or undefined */
export const strToDate = (s: string): Date | undefined => {
  if (!s) return undefined;
  return parseISO(s);
};

/** Convert Date to yyyy-MM-dd string, or empty */
export const dateToStr = (d: Date | undefined): string => {
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
};

/** Compute net working hours from time strings */
function computeWorkHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): { hours: number; minutes: number; total: number } | null {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let totalMinutes = eh * 60 + em - (sh * 60 + sm);
  if (totalMinutes < 0) totalMinutes += 24 * 60; // overnight shift
  totalMinutes -= breakMinutes;
  if (totalMinutes <= 0) return null;
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    total: totalMinutes,
  };
}

// ─── Zod Schemas ───

export const shiftFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên ca"),
  code: z.string().min(1, "Vui lòng nhập mã ca"),
  type: z.string().min(1, "Vui lòng chọn loại ca"),
  startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
  endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
  breakMinutes: z.number().min(0),
  lateThreshold: z.number().min(0),
  earlyThreshold: z.number().min(0),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export type ShiftFormValues = z.infer<typeof shiftFormSchema>;

export const assignFormSchema = z
  .object({
    userId: z.string().min(1, "Vui lòng chọn nhân viên"),
    shiftId: z.string().min(1, "Vui lòng chọn ca"),
    startDate: z.date().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.date(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  });

export type AssignFormValues = z.infer<typeof assignFormSchema>;

export const assignCycleFormSchema = z
  .object({
    userId: z.string().min(1, "Vui lòng chọn nhân viên"),
    workCycleId: z.string().min(1, "Vui lòng chọn chu kỳ"),
    startDate: z.date().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.date(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  });

export type AssignCycleFormValues = z.infer<typeof assignCycleFormSchema>;

export const assignCycleDeptFormSchema = z
  .object({
    departmentId: z.string().min(1, "Vui lòng chọn phòng ban"),
    workCycleId: z.string().min(1, "Vui lòng chọn chu kỳ"),
    startDate: z.date().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.date(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  });

export type AssignCycleDeptFormValues = z.infer<
  typeof assignCycleDeptFormSchema
>;

// ─── Create / Edit Shift Dialog ───

interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingShift: Shift | null;
  onSubmit: (values: ShiftFormValues) => void;
  isPending: boolean;
}

export function ShiftFormDialog({
  open,
  onOpenChange,
  editingShift,
  onSubmit,
  isPending,
}: ShiftFormDialogProps) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "fixed",
      startTime: new Date().toISOString().split("T")[0],
      endTime: new Date().toISOString().split("T")[0],
      breakMinutes: 60,
      lateThreshold: 15,
      earlyThreshold: 15,
      isDefault: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (editingShift) {
        form.reset({
          name: editingShift.name,
          code: editingShift.code,
          startTime: editingShift.startTime,
          endTime: editingShift.endTime,
          breakMinutes: editingShift.breakMinutes,
          lateThreshold: editingShift.lateThreshold,
          earlyThreshold: editingShift.earlyThreshold,
          isDefault: editingShift.isDefault,
          isActive: editingShift.isActive,
          type: "fixed",
        });
      } else {
        form.reset({
          name: "",
          code: "",
          type: "fixed",
          startTime: new Date().toISOString().split("T")[0],
          endTime: new Date().toISOString().split("T")[0],
          breakMinutes: 60,
          lateThreshold: 15,
          earlyThreshold: 15,
          isDefault: false,
          isActive: true,
        });
      }
    }
  }, [open, editingShift, form]);

  const nameValue = form.watch("name");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const breakMinutes = form.watch("breakMinutes");

  // Auto-generate code from first letter of each word when creating
  useEffect(() => {
    if (!editingShift && nameValue) {
      const code = nameValue
        .trim()
        .split(/\s+/)
        .map((w: string) => w.charAt(0).toUpperCase())
        .join("");
      form.setValue("code", code);
    }
  }, [nameValue, editingShift, form]);

  const workHours = useMemo(
    () => computeWorkHours(startTime, endTime, breakMinutes),
    [startTime, endTime, breakMinutes],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingShift ? "Sửa ca làm việc" : "Tạo ca mới"}
          </DialogTitle>
          <DialogDescription>
            {editingShift
              ? "Chỉnh sửa thông tin ca làm việc"
              : "Thêm ca làm việc mới vào hệ thống"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tên ca <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="w-80" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mã ca <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        readOnly
                        maxLength={10}
                        className="w-31"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Giờ bắt đầu <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Giờ kết thúc <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Work hours preview */}
            {startTime && endTime && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {workHours ? (
                  <span className="text-sm">
                    Tổng giờ làm:{" "}
                    <strong>
                      {workHours.hours}h
                      {workHours.minutes > 0 ? ` ${workHours.minutes}p` : ""}
                    </strong>
                    <span className="text-muted-foreground">
                      {" "}
                      (đã trừ {breakMinutes}p nghỉ)
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Thời gian không hợp lệ
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="breakMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nghỉ (p)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Math.max(0, Number(e.target.value)))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lateThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muộn cho phép (p)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Math.max(0, Number(e.target.value)))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="earlyThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sớm cho phép (p)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Math.max(0, Number(e.target.value)))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mt-0!">Ca mặc định</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mt-0!">Đang hoạt động</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Đang lưu..."
                  : editingShift
                    ? "Cập nhật"
                    : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shift Manage Dialog ───

interface ShiftManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shifts: Shift[];
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
}

// ─── Delete Shift Confirmation ───

interface DeleteShiftDialogProps {
  deleteTarget: Shift | null;
  onClose: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteShiftDialog({
  deleteTarget,
  onClose,
  onConfirm,
  isPending,
}: DeleteShiftDialogProps) {
  return (
    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => onClose(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa ca làm việc?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa ca &quot;
            {deleteTarget?.name}
            &quot;? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Delete Assignment Confirmation ───

interface DeleteAssignmentDialogProps {
  deleteAssignmentId: string | null;
  onClose: (open: boolean) => void;
  onConfirm: (id: string) => void;
  isPending: boolean;
}

export function DeleteAssignmentDialog({
  deleteAssignmentId,
  onClose,
  onConfirm,
  isPending,
}: DeleteAssignmentDialogProps) {
  return (
    <AlertDialog
      open={!!deleteAssignmentId}
      onOpenChange={(open) => onClose(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa phân ca?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa phân ca này? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteAssignmentId && onConfirm(deleteAssignmentId)}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Assign Work Cycle Dialog ───

interface AssignCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserBasic[];
  workCycles: WorkCycle[];
  onSubmit: (values: AssignCycleFormValues) => void;
  isPending: boolean;
  defaultUserId?: string;
  defaultStartDate?: Date;
}

export function AssignCycleDialog({
  open,
  onOpenChange,
  users,
  workCycles,
  onSubmit,
  isPending,
  defaultUserId,
  defaultStartDate,
}: AssignCycleDialogProps) {
  const form = useForm<AssignCycleFormValues>({
    resolver: zodResolver(assignCycleFormSchema),
    defaultValues: {
      userId: defaultUserId || "",
      workCycleId: "",
      startDate: defaultStartDate,
      endDate: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        userId: defaultUserId || "",
        workCycleId: "",
        startDate: defaultStartDate,
        endDate: new Date(),
      });
    }
  }, [open, form, defaultUserId, defaultStartDate]);

  const userId = form.watch("userId");
  const workCycleId = form.watch("workCycleId");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const selectedCycle = workCycles.find((c) => c.id === workCycleId);
  const selectedUser = users.find((u) => u.id === userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gán chu kỳ làm việc</DialogTitle>
          <DialogDescription>
            Gán chu kỳ làm việc xoay vòng cho nhân viên
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nhân viên <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={users.map((u) => ({
                        value: u.id,
                        label: u.username
                          ? `${u.name} (${u.username})`
                          : u.name,
                      }))}
                      value={field.value ? [field.value] : []}
                      onChange={(vals) => field.onChange(vals[0] || "")}
                      placeholder="Chọn nhân viên..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workCycleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Chu kỳ làm việc <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn chu kỳ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workCycles
                        .filter((c) => c.isActive)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.totalDays} ngày)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cycle preview */}
            {selectedCycle && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-2 text-sm font-medium">
                  Mẫu chu kỳ ({selectedCycle.totalDays} ngày):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCycle.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        entry.isDayOff
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {WEEKDAY_SHORT[entry.dayIndex % 7]} -{" "}
                      {entry.isDayOff ? "Nghỉ" : (entry.shift?.name ?? "N/A")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Từ ngày <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(d) => field.onChange(d)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đến ngày</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(d) => field.onChange(d)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Summary */}
            {startDate && selectedUser && selectedCycle && (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Gán chu kỳ{" "}
                <strong className="text-foreground">
                  {selectedCycle.name}
                </strong>{" "}
                cho{" "}
                <strong className="text-foreground">{selectedUser.name}</strong>{" "}
                từ{" "}
                <strong className="text-foreground">
                  {format(startDate, "dd/MM/yyyy")}
                </strong>
                {endDate ? (
                  <>
                    {" "}
                    đến{" "}
                    <strong className="text-foreground">
                      {format(endDate, "dd/MM/yyyy")}
                    </strong>
                  </>
                ) : (
                  " (không có ngày kết thúc)"
                )}
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang lưu..." : "Gán chu kỳ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
