"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { updateTemplateTask } from "../../actions";
import {
  CATEGORY_LABELS,
  ASSIGNEE_ROLE_LABELS,
  type OnboardingCategory,
  type OnboardingAssigneeRole,
  type CreateTaskData,
} from "@/types/onboarding";

interface TaskData {
  title: string;
  description: string;
  category: string;
  assigneeRole: string | null;
  dueDays: number;
  isRequired: boolean;
}

interface EditTaskDialogProps {
  taskId: string;
  initialData: TaskData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const editTaskSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().optional(),
  category: z.string().min(1, "Danh mục không được trống"),
  assigneeRole: z.string().optional(),
  dueDays: z.number().int().min(1, "Phải lớn hơn 0"),
  isRequired: z.boolean(),
});

type EditTaskForm = z.infer<typeof editTaskSchema>;

export function EditTaskDialog({
  taskId,
  initialData,
  open,
  onOpenChange,
  onSuccess,
}: EditTaskDialogProps) {
  const form = useForm<EditTaskForm>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "GENERAL",
      assigneeRole: undefined,
      dueDays: 1,
      isRequired: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: initialData.title,
        description: initialData.description ?? "",
        category: initialData.category,
        assigneeRole: initialData.assigneeRole ?? undefined,
        dueDays: initialData.dueDays,
        isRequired: initialData.isRequired,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId, initialData]);

  const updateMutation = useMutation({
    mutationFn: ({
      taskId: id,
      data,
    }: {
      taskId: string;
      data: Partial<CreateTaskData>;
    }) => updateTemplateTask(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật task");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: () => toast.error("Cập nhật task thất bại"),
  });

  const onSubmit = (values: EditTaskForm) => {
    updateMutation.mutate({
      taskId,
      data: {
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        category: values.category as OnboardingCategory,
        assigneeRole: values.assigneeRole
          ? (values.assigneeRole as OnboardingAssigneeRole)
          : undefined,
        dueDays: values.dueDays,
        isRequired: values.isRequired,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa công việc</DialogTitle>
          <DialogDescription>Thay đổi thông tin công việc</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề task" {...field} />
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
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết task..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Danh mục</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
                name="assigneeRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giao cho (role)</FormLabel>
                    <Select
                      value={field.value ?? "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? undefined : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn vai trò..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Không chỉ định</SelectItem>
                        {Object.entries(ASSIGNEE_ROLE_LABELS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số ngày (hạn hoàn thành)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 1)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Task bắt buộc
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Nhân viên phải hoàn thành task này
                    </p>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
