"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info, ChevronRight, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  createAttendanceAdjustmentRequest,
  getAttendanceApprovalProcess,
} from "../actions";
import { DatePicker } from "@/components/ui/date-picker";

const createAdjustmentRequestSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    attendanceId: z.string().min(1, t("attendanceApprovalAdjustmentFormAttendanceRequired")),
    date: z.date({ message: t("attendanceApprovalAdjustmentFormDateRequired") }),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    reason: z
      .string()
      .min(5, t("attendanceApprovalAdjustmentFormReasonMin"))
      .max(500, t("attendanceApprovalAdjustmentFormReasonMax")),
  });

type AdjustmentRequestValues = z.infer<
  ReturnType<typeof createAdjustmentRequestSchema>
>;

interface AdjustmentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId?: string;
  initialDate?: Date;
  onSuccess?: () => void;
}

function ApprovalFlowPreview() {
  const t = useTranslations("ProtectedPages");

  const { data: process } = useQuery({
    queryKey: ["attendance", "approval", "process"],
    queryFn: getAttendanceApprovalProcess,
  });

  if (!process || process.steps.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
        <div className="text-xs text-green-700 dark:text-green-400">
          <strong>{t("attendanceApprovalAdjustmentFlowAutoApproveTitle")}</strong>{" "}
          {t("attendanceApprovalAdjustmentFlowAutoApproveDescription")}
        </div>
      </div>
    );
  }

  const stepLabels: Record<string, string> = {
    DIRECT_MANAGER: t("attendanceApprovalApproverTypeDirectManager"),
    MANAGER_LEVEL: t("attendanceApprovalApproverTypeManagerLevel"),
    DEPT_HEAD: t("attendanceApprovalApproverTypeDeptHead"),
    CUSTOM_LIST: t("attendanceApprovalApproverTypeCustomList"),
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="h-4 w-4 text-blue-600 shrink-0" />
        <div className="text-xs text-blue-700 dark:text-blue-400">
          <strong>{t("attendanceApprovalAdjustmentFlowTitle")}</strong>{" "}
          {t("attendanceApprovalAdjustmentFlowDescription")}
        </div>
      </div>

      <div className="space-y-2 pl-2">
        {process.steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {index + 1}
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-xs">
                {stepLabels[step.approverType || "DIRECT_MANAGER"] || step.approverType}
              </Badge>
              {step.approvalMethod === "ALL_MUST_APPROVE" ? (
                <span className="text-muted-foreground">
                  {t("attendanceApprovalMethodAllMustApprove")}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {t("attendanceApprovalMethodFirstApproves")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground pl-6">
        <Clock className="h-3 w-3 inline mr-1" />
        {t("attendanceApprovalAdjustmentFlowProcessingTime")}
      </p>
    </div>
  );
}

export function AdjustmentRequestDialog({
  open,
  onOpenChange,
  attendanceId,
  initialDate,
  onSuccess,
}: AdjustmentRequestDialogProps) {
  const t = useTranslations("ProtectedPages");
  const queryClient = useQueryClient();
  const [attachment, setAttachment] = useState<File | null>(null);

  const form = useForm<AdjustmentRequestValues>({
    resolver: zodResolver(createAdjustmentRequestSchema(t)),
    defaultValues: {
      attendanceId: attendanceId || "",
      date: initialDate || new Date(),
      checkInTime: "",
      checkOutTime: "",
      reason: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: AdjustmentRequestValues) => {
      return createAttendanceAdjustmentRequest({
        attendanceId: values.attendanceId,
        date: values.date,
        checkInTime: values.checkInTime || undefined,
        checkOutTime: values.checkOutTime || undefined,
        reason: values.reason,
        attachment: undefined,
      });
    },
    onSuccess: () => {
      toast.success(t("attendanceApprovalAdjustmentFormSubmitSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["attendance", "adjustments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "records"],
      });
      onSuccess?.();
      onOpenChange(false);
      form.reset();
      setAttachment(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || t("attendanceApprovalProcessToastError"));
    },
  });

  const handleSubmit = (values: AdjustmentRequestValues) => {
    createMutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setAttachment(null);
    }
    onOpenChange(newOpen);
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("attendanceApprovalAdjustmentFormTitle")}</DialogTitle>
          <DialogDescription>
            {t("attendanceApprovalAdjustmentFormDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Attendance ID */}
            {attendanceId && (
              <FormField
                control={form.control}
                name="attendanceId"
                render={({ field }) => (
                  <FormItem hidden>
                    <FormControl>
                      <input
                        type="hidden"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("attendanceApprovalAdjustmentFormDate")}</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Check-in Time */}
            <FormField
              control={form.control}
              name="checkInTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("attendanceApprovalAdjustmentFormCheckIn")}</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t("attendanceApprovalAdjustmentFormOptionalHint")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Check-out Time */}
            <FormField
              control={form.control}
              name="checkOutTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("attendanceApprovalAdjustmentFormCheckOut")}</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t("attendanceApprovalAdjustmentFormOptionalHint")}
                  </p>
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
                    {t("attendanceApprovalAdjustmentFormReason")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("attendanceApprovalAdjustmentFormReasonPlaceholder")}
                      rows={3}
                      maxLength={500}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {t("attendanceApprovalAdjustmentFormReasonMinHint")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {field.value?.length || 0}/500
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachment */}
            <div className="space-y-2">
              <Label>{t("attendanceApprovalAdjustmentFormAttachment")}</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setAttachment(file || null);
                }}
                className="cursor-pointer"
              />
              {attachment && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <span className="text-xs truncate flex-1">{attachment.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setAttachment(null)}
                  >
                    {t("attendanceApprovalAdjustmentFormRemoveAttachment")}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("attendanceApprovalAdjustmentFormAttachmentHint")}
              </p>
            </div>

            {/* Approval Flow Preview */}
            <div className="border-t pt-4">
              <ApprovalFlowPreview />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("attendanceApprovalAdjustmentFormCancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("attendanceApprovalAdjustmentFormSubmitting")}
                  </>
                ) : (
                  t("attendanceApprovalAdjustmentFormSubmit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
