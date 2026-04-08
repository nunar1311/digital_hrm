"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
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
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import type { WorkCycle } from "../types";
import { WEEKDAY_SHORT } from "@/components/attendance/settings/work-cycles-constants";
import { assignWorkCycle } from "../actions";

const createAssignCycleInlineFormSchema = (
  t: ReturnType<typeof useTranslations>,
) =>
  z.object({
    workCycleId: z.string().min(1, t("attendanceAssignCycleInlineValidationWorkCycleRequired")),
    startDate: z.date(),
    endDate: z.date().optional(),
  });

type AssignCycleInlineFormValues = z.infer<
  ReturnType<typeof createAssignCycleInlineFormSchema>
>;

// ─── Component Props ───

interface AssignCycleInlineFormProps {
  userId: string;
  userName: string;
  workCycles: WorkCycle[];
  defaultStartDate: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Component ───

export function AssignCycleInlineForm({
  userId,
  userName,
  workCycles,
  defaultStartDate,
  onSuccess,
  onCancel,
}: AssignCycleInlineFormProps) {
  const t = useTranslations("ProtectedPages");
  const queryClient = useQueryClient();

  const form = useForm<AssignCycleInlineFormValues>({
    resolver: zodResolver(createAssignCycleInlineFormSchema(t)),
    defaultValues: {
      workCycleId: "",
      startDate: defaultStartDate,
      endDate: new Date(),
    },
  });

  const assignCycleMutation = useMutation({
    mutationFn: async (values: AssignCycleInlineFormValues) => {
      return assignWorkCycle(
        userId,
        values.workCycleId,
        values.startDate,
        values.endDate,
      );
    },
    onSuccess: () => {
      toast.success(t("attendanceAssignCycleInlineAssignSuccess", { userName }));
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shiftAssignments"],
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("attendanceAssignCycleInlineGenericError"));
    },
  });

  const onSubmit = (values: AssignCycleInlineFormValues) => {
    assignCycleMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="workCycleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                {t("attendanceAssignCycleInlineWorkCycleLabel")} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("attendanceAssignCycleInlineWorkCyclePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {workCycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {t("attendanceAssignCycleInlineCycleOption", { name: cycle.name, totalDays: cycle.totalDays })}
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
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                {t("attendanceAssignCycleInlineStartDateLabel")} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value ? new Date(field.value) : undefined}
                  setDate={(date) =>
                    field.onChange(date)
                  }
                  className="h-8 text-sm"
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
              <FormLabel className="text-xs">{t("attendanceAssignCycleInlineEndDateLabel")}</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  setDate={(date) => field.onChange(date)}
                  className="h-8 text-sm"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onCancel}
            >
              {t("attendanceAssignCycleInlineCancel")}
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="flex-1"
            disabled={assignCycleMutation.isPending}
          >
            {assignCycleMutation.isPending
              ? t("attendanceAssignCycleInlineProcessing")
              : t("attendanceAssignCycleInlineConfirm")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Cycle Preview Component ───

// ─── Reusable Cycle Select Component ───

interface CycleSelectProps {
  value: string;
  onChange: (value: string) => void;
  workCycles: WorkCycle[];
  placeholder?: string;
  disabled?: boolean;
}

export function CycleSelect({
  value,
  onChange,
  workCycles,
  placeholder,
  disabled = false,
}: CycleSelectProps) {
  const t = useTranslations("ProtectedPages");

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full h-8">
        <SelectValue
          placeholder={
            placeholder ?? t("attendanceAssignCycleInlineCycleSelectPlaceholder")
          }
        />
      </SelectTrigger>
      <SelectContent>
        {workCycles.map((cycle) => (
          <SelectItem key={cycle.id} value={cycle.id}>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {t("attendanceAssignCycleInlineCycleOption", {
                  name: cycle.name,
                  totalDays: cycle.totalDays,
                })}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
