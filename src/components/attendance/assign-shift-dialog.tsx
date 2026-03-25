"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import type { Shift } from "@/app/(protected)/attendance/types";
import type { UserBasic } from "@/app/(protected)/attendance/types";
import { assignShift } from "@/app/(protected)/attendance/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const assignSchema = z.object({
  userId: z.string().min(1, "Vui lòng chọn nhân viên"),
  shiftId: z.string().min(1, "Vui lòng chọn ca"),
  startDate: z.date().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.date().optional(),
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface AssignShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserBasic[];
  shifts: Shift[];
}

export function AssignShiftDialog({
  open,
  onOpenChange,
  users,
  shifts,
}: AssignShiftDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      userId: "",
      shiftId: "",
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: AssignFormValues) => {
      return assignShift(
        values.userId,
        values.shiftId,
        values.startDate,
        values.endDate || undefined,
      );
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({
        queryKey: ["attendance", "shiftAssignments"],
      });

      const optimisticAssignment = {
        id: `optimistic-${Date.now()}`,
        userId: values.userId,
        shiftId: values.shiftId,
        startDate: values.startDate,
        endDate: values.endDate || null,
        workCycleId: null,
        cycleStartDate: null,
        shift: shifts.find((s) => s.id === values.shiftId),
        user: users.find((u) => u.id === values.userId) || {
          id: values.userId,
          name: "...",
          employeeCode: "...",
        },
      };

      queryClient.setQueriesData(
        { queryKey: ["attendance", "shiftAssignments"] },
        (old: any) => {
          if (!old) return [optimisticAssignment];
          return [...old, optimisticAssignment];
        },
      );

      return {};
    },
    onSuccess: () => {
      toast.success("Phân ca thành công");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shiftAssignments"],
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shiftAssignments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shifts"],
      });
    },
  });

  const shiftId = form.watch("shiftId");
  const selectedShift = shifts.find((s) => s.id === shiftId);

  const activeShifts = shifts.filter((s) => s.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Phân ca cho nhân viên</DialogTitle>
          <DialogDescription>
            Gán ca làm việc cho nhân viên theo khoảng thời gian
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Nhân viên <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Chọn nhân viên..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                            {u.employeeCode ? ` (${u.employeeCode})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shiftId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Ca làm việc <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Chọn ca..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeShifts.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.startTime}–{s.endTime})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {selectedShift && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5">
                <Clock className="size-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">
                  <strong>{selectedShift.name}</strong> ({selectedShift.code}) ·{" "}
                  {selectedShift.startTime}–{selectedShift.endTime} · nghỉ{" "}
                  {selectedShift.breakMinutes}p
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Từ ngày <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        setDate={(d) =>
                          field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                        }
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Đến ngày</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        setDate={(d) =>
                          field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                        }
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
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
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                Phân ca
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
