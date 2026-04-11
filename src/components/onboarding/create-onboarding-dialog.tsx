"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, User, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  createOnboarding,
  getEmployeesForOnboarding,
  getOnboardingTemplates,
} from "@/app/(protected)/onboarding/actions";
import { DatePicker } from "../ui/date-picker";

const createOnboardingSchema = z.object({
  userId: z.string().min(1, "Vui lòng chọn nhân viên"),
  templateId: z.string().optional(),
  startDate: z.date({ message: "Vui lòng chọn ngày bắt đầu" }),
  notes: z.string().optional(),
});

type CreateOnboardingForm = z.infer<typeof createOnboardingSchema>;

interface CreateOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateOnboardingDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOnboardingDialogProps) {
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    department?: { name: string } | null;
  } | null>(null);

  const form = useForm<CreateOnboardingForm>({
    resolver: zodResolver(createOnboardingSchema),
    defaultValues: {
      userId: "",
      templateId: "",
      notes: "",
    },
  });

  // Fetch employees eligible for onboarding
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-onboarding"],
    queryFn: getEmployeesForOnboarding,
    enabled: open,
  });

  // Fetch onboarding templates
  const { data: templates = [] } = useQuery({
    queryKey: ["onboarding-templates"],
    queryFn: getOnboardingTemplates,
    enabled: open,
  });

  // Create mutation
  const mutation = useMutation({
    mutationFn: createOnboarding,
    onSuccess: () => {
      toast.success("Đã tạo onboarding thành công!");
      form.reset();
      setSelectedUser(null);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Tạo onboarding thất bại");
    },
  });

  const onSubmit = (values: CreateOnboardingForm) => {
    mutation.mutate({
      userId: values.userId,
      templateId: values.templateId || undefined,
      startDate: values.startDate,
      notes: values.notes,
    });
  };

  const handleUserSelect = (userId: string) => {
    const user = employees.find((e) => e.id === userId);
    setSelectedUser(user || null);
    form.setValue("userId", userId);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Tạo onboarding mới</DialogTitle>
          <DialogDescription>
            Tạo quy trình tiếp nhận cho nhân viên mới vào công ty
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhân viên</FormLabel>
                  <Select value={field.value} onValueChange={handleUserSelect}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn nhân viên..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Không có nhân viên nào đủ điều kiện
                        </div>
                      ) : (
                        employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{emp.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {emp.username} • {emp.department?.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Employee Info */}
            {selectedUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{selectedUser.name}</span>
                </div>
                {selectedUser.department && (
                  <p className="text-xs text-blue-600 ml-6">
                    Phòng ban: {selectedUser.department.name}
                  </p>
                )}
              </div>
            )}

            {/* Template Selection */}
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value || undefined)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn template (mặc định: template chuẩn)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__default__">
                        Template mặc định
                      </SelectItem>
                      {templates.map((tmpl) => (
                        <SelectItem key={tmpl.id} value={tmpl.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{tmpl.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({tmpl.tasks?.length || 0} tasks)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ngày bắt đầu</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập ghi chú nếu có..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size={"sm"}
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button size={"sm"} type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                Tạo onboarding
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
