"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createLeaveRequest } from "../actions";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveBalance {
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  available: number;
}

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  isPaidLeave: boolean;
  defaultDays: number;
  balance: LeaveBalance | null;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  position?: { name: string } | null;
}

export interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveTypes: LeaveType[];
  manager: Manager | null | undefined;
  onSuccess?: () => void;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const formSchema = (t: ReturnType<typeof useTranslations>) =>
  z
    .object({
      leaveTypeId: z.string().min(1, t("essLeaveDialogValidationLeaveTypeRequired")),
      startDate: z.date({ message: t("essLeaveDialogValidationStartDateRequired") }),
      endDate: z.date({ message: t("essLeaveDialogValidationEndDateRequired") }),
      reason: z.string().optional(),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: t("essLeaveDialogValidationEndDateAfterStartDate"),
      path: ["endDate"],
    });

type FormData = z.infer<ReturnType<typeof formSchema>>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcDays(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LeaveTypeOption({ type, t }: { type: LeaveType; t: ReturnType<typeof useTranslations> }) {
  const available = type.balance?.available ?? type.defaultDays;
  const isDisabled = available <= 0;

  return (
    <SelectItem
      key={type.id}
      value={type.id}
      disabled={isDisabled}
      className={cn(isDisabled && "text-muted-foreground")}
    >
      <div className="flex items-center gap-3 w-full pr-4">
        <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-blue-400" />
        <div className="flex-1 flex items-center gap-2">
          <span className={cn(isDisabled && "line-through")}>{type.name}</span>
          <Badge
            variant={type.isPaidLeave ? "secondary" : "outline"}
            className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 shrink-0"
          >
            {type.isPaidLeave ? t("essLeavePaid") : t("essLeaveUnpaid")}
          </Badge>
        </div>
        <div className="text-right shrink-0">
          <span
            className={cn(
              "font-medium text-sm",
              isDisabled && "text-destructive",
            )}
          >
            {available}
          </span>
          <span className="text-xs text-muted-foreground ml-1">{t("essLeaveDayUnit")}</span>
        </div>
      </div>
    </SelectItem>
  );
}

function LeaveTypeInfoCard({ type, t }: { type: LeaveType; t: ReturnType<typeof useTranslations> }) {
  const usagePercent = type.balance
    ? 100 -
      ((type.balance.usedDays + type.balance.pendingDays) /
        type.balance.totalDays) *
        100
    : 0;

  return (
    <Card className="bg-muted/30 border-dashed p-2">
      <CardContent className="px-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="font-medium text-sm">{type.name}</span>
            {type.description && (
              <span className="text-xs text-muted-foreground">
                — {type.description}
              </span>
            )}
          </div>

          {type.balance && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t("essLeaveDialogUsedDaysOfTotal", {
                  used: type.balance.usedDays,
                  total: type.balance.totalDays,
                })}
              </span>
              <div className="w-12">
                <Progress value={usagePercent} className="h-1.5" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DaysPreview({
  days,
  balance,
  isEnough,
  t,
}: {
  days: number;
  balance: LeaveBalance | null;
  isEnough: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const remaining = balance ? balance.available - days : null;

  return (
    <Card
      className={cn(
        "bg-muted/30 py-2",
        !isEnough && "border-destructive/50 bg-destructive/5",
      )}
    >
      <CardContent className="px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("essLeaveDialogRequestedDays")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-lg font-bold",
                !isEnough && "text-destructive",
              )}
            >
              {t("essLeaveDialogDaysValue", { days })}
            </span>
            {balance && (
              <Badge variant={isEnough ? "secondary" : "destructive"}>
                {isEnough ? (
                  <>{t("essLeaveDialogRemainingDays", { remaining })}</>
                ) : (
                  <>{t("essLeaveDialogMissingDays", { missing: days - balance.available })}</>
                )}
              </Badge>
            )}
          </div>
        </div>
        {!isEnough && (
          <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{t("essLeaveDialogExceedAvailableDays")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentUpload({ note, t }: { note: string | null; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="border-2 border-dashed rounded-lg p-4 text-center">
      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">
        {t("essLeaveDialogUploadHint")}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {note || t("essLeaveDialogUploadSupport")}
      </p>
    </div>
  );
}

function RequestSummary({
  leaveType,
  days,
  approverName,
  t,
}: {
  leaveType: string;
  days: number;
  approverName: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card className="bg-blue-50/50 border-blue-100 py-2">
      <CardContent className="px-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">{t("essLeaveDialogSummaryTitle")}</p>
            <ul className="mt-2 space-y-1 text-blue-800">
              <li>
                • {t("essLeaveDialogSummaryLeaveType")} <strong>{leaveType}</strong>
              </li>
              <li>
                • {t("essLeaveDialogSummaryDays")} <strong>{t("essLeaveDialogDaysValue", { days })}</strong>
              </li>
              <li>
                • {t("essLeaveDialogSummaryApprover")} <strong>{approverName}</strong>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function LeaveRequestDialog({
  open,
  onOpenChange,
  leaveTypes,
  manager,
  onSuccess,
}: LeaveRequestDialogProps) {
  const t = useTranslations("ProtectedPages");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: { leaveTypeId: "", reason: "" },
  });

  const { watch, setValue } = form;
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const leaveTypeId = watch("leaveTypeId");

  const selectedLeaveType = useMemo(
    () => leaveTypes.find((t) => t.id === leaveTypeId) ?? null,
    [leaveTypes, leaveTypeId],
  );

  const calculatedDays = useMemo(
    () => (startDate && endDate ? calcDays(startDate, endDate) : 0),
    [startDate, endDate],
  );

  const isBalanceEnough = useMemo(
    () =>
      selectedLeaveType?.balance
        ? calculatedDays <= selectedLeaveType.balance.available
        : calculatedDays <= (selectedLeaveType?.defaultDays ?? 0),
    [selectedLeaveType, calculatedDays],
  );

  const canSubmit = useMemo(
    () =>
      selectedLeaveType &&
      calculatedDays > 0 &&
      isBalanceEnough,
    [selectedLeaveType, calculatedDays, isBalanceEnough],
  );

  const handleLeaveTypeChange = useCallback(
    (typeId: string) => {
      setValue("leaveTypeId", typeId);
    },
    [setValue],
  );

  const submitMutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      toast.success(t("essLeaveDialogSubmitSuccess"), {
        description: t("essLeaveDialogSubmitPendingApproval"),
      });
      form.reset();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(t("essLeaveDialogSubmitError"), {
        description: error.message,
      });
    },
  });

  const handleSubmit = useCallback(
    (data: FormData) => {
      submitMutation.mutate({
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      });
    },
    [submitMutation],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("essLeaveDialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("essLeaveDialogDescription")}
            {manager && (
              <span className="block mt-1">
                {t("essLeaveDialogApprover")}: <strong>{manager.name}</strong>
                {manager.position && ` - ${manager.position.name}`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/* Leave Type Selection */}
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("essLeaveDialogLeaveTypeLabel")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      handleLeaveTypeChange(v);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("essLeaveDialogLeaveTypePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <LeaveTypeOption key={type.id} type={type} t={t} />
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("essLeaveDialogLeaveTypeDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Leave Type Info Card */}
            {selectedLeaveType && (
              <LeaveTypeInfoCard type={selectedLeaveType} t={t} />
            )}

            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("essLeaveDialogStartDateLabel")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>{t("essLeaveDialogPickDate")}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("essLeaveDialogEndDateLabel")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>{t("essLeaveDialogPickDate")}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < (startDate || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Days Preview */}
            {calculatedDays > 0 && selectedLeaveType && (
              <DaysPreview
                days={calculatedDays}
                balance={selectedLeaveType.balance}
                isEnough={isBalanceEnough}
                t={t}
              />
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("essLeaveDialogReasonLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("essLeaveDialogReasonPlaceholder")}
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("essLeaveDialogReasonDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />



            {/* Summary */}
            {selectedLeaveType && calculatedDays > 0 && isBalanceEnough && (
              <RequestSummary
                leaveType={selectedLeaveType.name}
                days={calculatedDays}
                approverName={manager?.name || t("essLeaveDialogDirectManager")}
                t={t}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("essLeaveCancel")}
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("essLeaveDialogSubmitting")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t("essLeaveDialogSubmit")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
