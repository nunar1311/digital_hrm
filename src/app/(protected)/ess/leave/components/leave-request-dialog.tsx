"use client";

import { useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Loader2,
  Sparkles,
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

const formSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Phải chọn loại nghỉ phép"),
    startDate: z.date({ message: "Phải chọn ngày bắt đầu" }),
    endDate: z.date({ message: "Phải chọn ngày kết thúc" }),
    reason: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
    path: ["endDate"],
  });

type FormData = z.infer<typeof formSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VIETNAM_HOLIDAYS: Record<number, string[]> = {
  2026: [
    "1-1",
    "1-17",
    "1-18",
    "1-19",
    "1-20",
    "1-21",
    "1-22",
    "1-23",
    "1-24",
    "1-25",
    "1-26",
    "4-7",
    "4-30",
    "9-1",
    "12-25",
  ],
  2025: [
    "1-1",
    "1-17",
    "1-18",
    "1-19",
    "1-20",
    "1-21",
    "1-22",
    "1-23",
    "1-24",
    "1-25",
    "1-26",
    "4-7",
    "4-30",
    "9-2",
    "12-25",
  ],
  2024: [
    "1-1",
    "1-8",
    "1-9",
    "1-10",
    "1-11",
    "1-12",
    "1-13",
    "1-14",
    "1-15",
    "1-16",
    "1-17",
    "4-18",
    "4-30",
    "9-2",
    "12-25",
  ],
};

function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = VIETNAM_HOLIDAYS[year] || [];
  const key = `${date.getMonth() + 1}-${date.getDate()}`;
  return holidays.includes(key);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isWeekendOrHoliday(date: Date): boolean {
  return isWeekend(date) || isHoliday(date);
}

function calcDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (current <= endDay) {
    if (!isWeekendOrHoliday(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LeaveTypeOption({ type }: { type: LeaveType }) {
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
            {type.isPaidLeave ? "Có lương" : "Không lương"}
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
          <span className="text-xs text-muted-foreground ml-1">ngày</span>
        </div>
      </div>
    </SelectItem>
  );
}

// function DaysPreview({
//   days,
//   balance,
//   isEnough,
// }: {
//   days: number;
//   balance: LeaveBalance | null;
//   isEnough: boolean;
// }) {
//   const remaining = balance ? balance.available - days : null;

//   return (
//     <Card
//       className={cn(
//         "bg-muted/30 py-2",
//         !isEnough && "border-destructive/50 bg-destructive/5",
//       )}
//     >
//       <CardContent className="px-2">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Sparkles className="h-4 w-4 text-muted-foreground" />
//             <span className="text-sm font-medium">Số ngày nghỉ:</span>
//           </div>
//           <div className="flex items-center gap-3">
//             <span
//               className={cn(
//                 "text-lg font-bold",
//                 !isEnough && "text-destructive",
//               )}
//             >
//               {days} ngày
//             </span>
//             {balance && (
//               <Badge variant={isEnough ? "secondary" : "destructive"}>
//                 {isEnough ? (
//                   <>Còn lại: {remaining} ngày</>
//                 ) : (
//                   <>Thiếu {days - balance.available} ngày</>
//                 )}
//               </Badge>
//             )}
//           </div>
//         </div>
//         {!isEnough && (
//           <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
//             <AlertCircle className="h-4 w-4" />
//             <span>Số ngày nghỉ vượt quá số ngày khả dụng!</span>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

function RequestSummary({
  leaveType,
  days,
  approverName,
}: {
  leaveType: string;
  days: number;
  approverName: string;
}) {
  return (
    <Card className="bg-blue-50/50 border-blue-100 py-2">
      <CardContent className="px-2">
        <div className="flex items-start gap-2">
          <div className="text-sm">
            <p className="font-medium text-blue-900">Tóm tắt yêu cầu:</p>
            <ul className="mt-2 space-y-1 text-blue-800 list-disc list-inside">
              <li>
                Loại nghỉ phép: <strong>{leaveType}</strong>
              </li>
              <li>
                Số ngày: <strong>{days} ngày</strong>
              </li>
              <li>
                Người duyệt: <strong>{approverName}</strong>
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
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
    () => selectedLeaveType && calculatedDays > 0 && isBalanceEnough,
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
      toast.success("Đã gửi yêu cầu nghỉ phép thành công!", {
        description: "Yêu cầu của bạn đang chờ được phê duyệt.",
      });
      form.reset();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Không thể gửi yêu cầu", { description: error.message });
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
            Đăng ký nghỉ phép
          </DialogTitle>
          <DialogDescription>
            Điền thông tin bên dưới để gửi yêu cầu nghỉ phép đến quản lý trực
            tiếp.
            {manager && (
              <span className="block mt-1">
                Người duyệt: <strong>{manager.name}</strong>
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
                  <FormLabel>Loại nghỉ phép *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      handleLeaveTypeChange(v);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- Chọn loại nghỉ phép --" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <LeaveTypeOption key={type.id} type={type} />
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Chọn loại nghỉ phép phù hợp với nhu cầu của bạn
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Leave Type Info Card */}
            {/* {selectedLeaveType && (
              <LeaveTypeInfoCard type={selectedLeaveType} />
            )} */}

            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày bắt đầu *</FormLabel>
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
                              <span>Chọn ngày</span>
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
                          disabled={(date) =>
                            date < new Date() || isWeekendOrHoliday(date)
                          }
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
                    <FormLabel>Ngày kết thúc *</FormLabel>
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
                              <span>Chọn ngày</span>
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
                          disabled={(date) =>
                            date < (startDate || new Date()) ||
                            isWeekendOrHoliday(date)
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Days Preview */}
            {/* {calculatedDays > 0 && selectedLeaveType && (
              <DaysPreview
                days={calculatedDays}
                balance={selectedLeaveType.balance}
                isEnough={isBalanceEnough}
              />
            )} */}
            {selectedLeaveType && calculatedDays > 0 && isBalanceEnough && (
              <RequestSummary
                leaveType={selectedLeaveType.name}
                days={calculatedDays}
                approverName={manager?.name || "Quản lý trực tiếp"}
              />
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do nghỉ phép</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Nhập lý do nghỉ phép (không bắt buộc)..."
                    />
                  </FormControl>
                  <FormDescription>
                    Mô tả ngắn gọn lý do nghỉ phép để quản lý dễ xem xét.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!canSubmit || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" /> Đang gửi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 /> Gửi yêu cầu
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
