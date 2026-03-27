"use client";

import { useState } from "react";
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

const adjustmentRequestSchema = z.object({
  attendanceId: z.string().min(1, "Vui lòng chọn bản ghi chấm công"),
  date: z.date({ message: "Vui lòng chọn ngày hợp lệ" }),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  reason: z
    .string()
    .min(5, "Lý do phải có ít nhất 5 ký tự")
    .max(500, "Lý do không được quá 500 ký tự"),
});

type AdjustmentRequestValues = z.infer<typeof adjustmentRequestSchema>;

interface AdjustmentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId?: string;
  initialDate?: Date;
  onSuccess?: () => void;
}

function ApprovalFlowPreview() {
  const { data: process } = useQuery({
    queryKey: ["attendance", "approval", "process"],
    queryFn: getAttendanceApprovalProcess,
  });

  if (!process || process.steps.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
        <div className="text-xs text-green-700 dark:text-green-400">
          <strong>Tự động duyệt:</strong> Không có quy trình duyệt được thiết lập. Yêu cầu sẽ được duyệt tự động.
        </div>
      </div>
    );
  }

  const stepLabels: Record<string, string> = {
    DIRECT_MANAGER: "Quản lý trực tiếp",
    MANAGER_LEVEL: "Quản lý theo cấp",
    DEPT_HEAD: "Trưởng phòng",
    CUSTOM_LIST: "Người được chỉ định",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="h-4 w-4 text-blue-600 shrink-0" />
        <div className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Quy trình duyệt:</strong> Yêu cầu của bạn sẽ được gửi lần lượt đến các người duyệt sau:
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
                <span className="text-muted-foreground">Tất cả phải duyệt</span>
              ) : (
                <span className="text-muted-foreground">Chỉ cần một người duyệt</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground pl-6">
        <Clock className="h-3 w-3 inline mr-1" />
        Thời gian xử lý: Trong vòng 24 giờ làm việc
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
  const queryClient = useQueryClient();
  const [attachment, setAttachment] = useState<File | null>(null);

  const form = useForm<AdjustmentRequestValues>({
    resolver: zodResolver(adjustmentRequestSchema),
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
      toast.success("Đã gửi yêu cầu điều chỉnh chấm công");
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
      toast.error(err.message || "Có lỗi xảy ra khi gửi yêu cầu");
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
          <DialogTitle>Yêu cầu điều chỉnh chấm công</DialogTitle>
          <DialogDescription>
            Điều chỉnh giờ vào/giờ ra khi quên chấm công hoặc cần thay đổi thông
            tin chấm công
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
                  <FormLabel>Ngày</FormLabel>
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
                  <FormLabel>Giờ vào mới</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Bỏ trống nếu không cần điều chỉnh
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
                  <FormLabel>Giờ ra mới</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Bỏ trống nếu không cần điều chỉnh
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
                    Lý do <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Vui lòng nhập lý do điều chỉnh chấm công..."
                      rows={3}
                      maxLength={500}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Tối thiểu 5 ký tự
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
              <Label>Đính kèm minh chứng (tùy chọn)</Label>
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
                    Xóa
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Hỗ trợ: hình ảnh, PDF. Tối đa 5MB. Đính kèm hình ảnh sẽ giúp yêu cầu được duyệt nhanh hơn.
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
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi yêu cầu"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
