"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  createLeaveType,
  updateLeaveType,
} from "@/app/(protected)/attendance/actions";

const formSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên loại nghỉ phép"),
  description: z.string().optional(),
  isPaidLeave: z.boolean(),
  defaultDays: z.number().min(0, "Số ngày không được âm"),
  isActive: z.boolean(),
  sortOrder: z.number(),
});

export type LeaveTypeFormData = z.infer<typeof formSchema>;

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  isPaidLeave: boolean;
  defaultDays: number;
  isActive: boolean;
  sortOrder: number;
}

interface LeaveTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveType?: LeaveType | null;
  onSuccess?: () => void;
}

export function LeaveTypeDialog({
  open,
  onOpenChange,
  leaveType,
  onSuccess,
}: LeaveTypeDialogProps) {
  const isEditing = !!leaveType;

  const form = useForm<LeaveTypeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isPaidLeave: true,
      defaultDays: 0,
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (leaveType) {
        form.reset({
          name: leaveType.name,
          description: leaveType.description || "",
          isPaidLeave: leaveType.isPaidLeave,
          defaultDays: leaveType.defaultDays,
          isActive: leaveType.isActive,
          sortOrder: leaveType.sortOrder,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          isPaidLeave: true,
          defaultDays: 0,
          isActive: true,
          sortOrder: 0,
        });
      }
    }
  }, [open, leaveType, form]);

  const mutation = useMutation({
    mutationFn: async (values: LeaveTypeFormData) => {
      if (isEditing) {
        await updateLeaveType(leaveType.id, values);
      } else {
        await createLeaveType(values);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing ? "Đã cập nhật loại nghỉ phép" : "Đã tạo loại nghỉ phép",
      );
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Đã xảy ra lỗi");
    },
  });

  const onSubmit = (values: LeaveTypeFormData) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Sửa Loại nghỉ phép" : "Thêm Loại nghỉ phép"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Thay đổi thông tin cho loại nghỉ phép hiện tại."
              : "Tạo cấu hình mới cho loại nghỉ phép trong công ty."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên loại nghỉ phép (*)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Phép năm, Nghỉ ốm..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả chi tiết</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả về quy định của loại nghỉ này..."
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số ngày mặc định</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.5" {...field} />
                    </FormControl>
                    <FormDescription>Ngày cấp / năm</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thứ tự sắp xếp</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Nhỏ ưu tiên trước</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="isPaidLeave"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 flex-1 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel>Có hưởng lương</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 flex-1 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel>Đang hoạt động</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
