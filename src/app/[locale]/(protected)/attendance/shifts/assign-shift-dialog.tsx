"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("ProtectedPages");

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
          <DialogTitle>{t("attendanceShiftsAssignDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("attendanceShiftsAssignDialogDescription")}
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
                    {t("attendanceShiftsAssignEmployee")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("attendanceShiftsAssignEmployeePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} {u.employeeCode ? `(${u.employeeCode})` : ""}
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
                    {t("attendanceShiftsAssignShift")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("attendanceShiftsAssignShiftPlaceholder")} />
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
                  &mdash; {t("attendanceShiftsAssignShiftSummary", {
                    start: selectedShift.startTime,
                    end: selectedShift.endTime,
                    breakMinutes: selectedShift.breakMinutes,
                  })}
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
                      {t("attendanceShiftsAssignFromDate")} <span className="text-destructive">*</span>
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
                    <FormLabel>{t("attendanceShiftsAssignToDate")}</FormLabel>
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
                {t("attendanceShiftsAssignPreviewPrefix")} {" "}
                <strong className="text-foreground">
                  {selectedShift.name}
                </strong>{" "}
                {t("attendanceShiftsAssignPreviewFor")} {" "}
                <strong className="text-foreground">{selectedUser.name}</strong>{" "}
                {t("attendanceShiftsAssignPreviewIn")} {" "}
                <strong className="text-foreground">
                  {t("attendanceShiftsAssignDays", { dayCount })}
                </strong>
                {endDate ? ` (${startDate} → ${endDate})` : ` (${startDate})`}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("attendanceShiftsAssignCancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("attendanceShiftsAssignSaving")
                  : t("attendanceShiftsAssignSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
