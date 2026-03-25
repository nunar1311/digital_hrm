"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Shift } from "@/app/(protected)/attendance/types";
import { updateShift, createShift } from "@/app/(protected)/attendance/actions";

export const shiftFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên ca"),
  code: z.string().min(1, "Vui lòng nhập mã ca"),
  startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
  endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
  breakMinutes: z.number().min(0),
  lateThreshold: z.number().min(0),
  earlyThreshold: z.number().min(0),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export type ShiftFormValues = z.infer<typeof shiftFormSchema>;

function computeWorkHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): { hours: number; minutes: number } | null {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let totalMinutes = eh * 60 + em - (sh * 60 + sm);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  totalMinutes -= breakMinutes;
  if (totalMinutes <= 0) return null;
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingShift: Shift | null;
  onSuccess?: () => void;
}

export function ShiftFormDialog({
  open,
  onOpenChange,
  editingShift,
  onSuccess,
}: ShiftFormDialogProps) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      name: "",
      code: "",
      startTime: "08:00",
      endTime: "17:00",
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
        });
      } else {
        form.reset({
          name: "",
          code: "",
          startTime: "08:00",
          endTime: "17:00",
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

  const handleSubmit = async (values: ShiftFormValues) => {
    setIsPending(true);
    try {
      if (editingShift) {
        await updateShift(editingShift.id, values);
        toast.success("Cập nhật ca thành công");
      } else {
        await createShift(values);
        toast.success("Tạo ca mới thành công");
      }
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shifts-sidebar"],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shifts"],
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Tên ca <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 text-xs" />
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
                    <FormLabel className="text-xs">
                      Mã ca <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        disabled={!!form.watch("name")}
                        readOnly
                        maxLength={10}
                        className="h-8 text-xs font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Giờ bắt đầu <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="h-8 text-xs" />
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
                    <FormLabel className="text-xs">
                      Giờ kết thúc <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="h-8 text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {startTime && endTime && (
              <div className="rounded-md border bg-muted/50 px-2.5 py-1.5">
                <p className="text-[10px] text-muted-foreground">
                  {workHours ? (
                    <>
                      Tổng giờ làm:{" "}
                      <strong>
                        {workHours.hours}h
                        {workHours.minutes > 0 ? ` ${workHours.minutes}p` : ""}
                      </strong>
                      <span className="ml-1">
                        (đã trừ {breakMinutes}p nghỉ)
                      </span>
                    </>
                  ) : (
                    <span className="text-destructive">
                      Thời gian không hợp lệ
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="breakMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Nghỉ (p)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Math.max(0, Number(e.target.value)))
                        }
                        className="h-8 text-xs"
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
                    <FormLabel className="text-xs">Muộn (p)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Math.max(0, Number(e.target.value)))
                        }
                        className="h-8 text-xs"
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
                    <FormLabel className="text-xs">Sớm (p)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Math.max(0, Number(e.target.value)))
                        }
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1.5">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mt-0! text-xs cursor-pointer">
                      Mặc định
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1.5">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mt-0! text-xs cursor-pointer">
                      Hoạt động
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Đang lưu...
                  </>
                ) : editingShift ? (
                  "Cập nhật"
                ) : (
                  "Tạo mới"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
