"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Shift, UserBasic } from "../types";
import {
  assignFormSchema,
  AssignFormValues,
  dateToStr,
  strToDate,
} from "./shift-dialogs";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";

import { Clock } from "lucide-react";

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserBasic[];
  shifts: Shift[];
  onSubmit: (values: AssignFormValues) => void;
  isPending: boolean;
}

export function AssignDialog({
  open,
  onOpenChange,
  users,
  shifts,
  onSubmit,
  isPending,
}: AssignDialogProps) {
  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignFormSchema),
    defaultValues: {
      userId: "",
      shiftId: "",
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        userId: "",
        shiftId: "",
        startDate: new Date(),
        endDate: new Date(),
      });
    }
  }, [open, form]);

  const userId = form.watch("userId");
  const shiftId = form.watch("shiftId");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const selectedShift = shifts.find((s) => s.id === shiftId);
  const selectedUser = users.find((u) => u.id === userId);

  const dayCount = useMemo(() => {
    if (!startDate) return 0;
    if (!endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, diff + 1);
  }, [startDate, endDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phân ca cho nhân viên</DialogTitle>
          <DialogDescription>
            Gán ca làm việc cho nhân viên theo khoảng thời gian
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nhân viên <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn nhân viên" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} {u.username ? `(${u.username})` : ""}
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
              name="shiftId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Ca làm việc <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn ca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shifts
                        .filter((s) => s.isActive)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.startTime} - {s.endTime})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected shift preview */}
            {selectedShift && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>{selectedShift.name}</strong> ({selectedShift.code})
                  &mdash; {selectedShift.startTime} đến {selectedShift.endTime},
                  nghỉ {selectedShift.breakMinutes}p
                </span>
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

            {/* Assignment preview summary */}
            {startDate && selectedUser && selectedShift && (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Phân ca{" "}
                <strong className="text-foreground">
                  {selectedShift.name}
                </strong>{" "}
                cho{" "}
                <strong className="text-foreground">{selectedUser.name}</strong>{" "}
                trong{" "}
                <strong className="text-foreground">{dayCount} ngày</strong>
                {endDate ? ` (${startDate} → ${endDate})` : ` (${startDate})`}
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
                {isPending ? "Đang lưu..." : "Phân ca"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
