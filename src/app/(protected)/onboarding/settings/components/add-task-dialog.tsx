"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { addTaskToTemplate } from "../../actions";
import {
  CATEGORY_LABELS,
  ASSIGNEE_ROLE_LABELS,
  type OnboardingCategory,
  type OnboardingAssigneeRole,
  type CreateTaskData,
} from "@/types/onboarding";

const createTaskSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().optional(),
  category: z.string().default("GENERAL"),
  assigneeRole: z.string().optional(),
  dueDays: z.number().int().min(1).default(3),
  isRequired: z.boolean().default(true),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

interface AddTaskDialogProps {
  templateId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddTaskDialog({
  templateId,
  onOpenChange,
  onSuccess,
}: AddTaskDialogProps) {
  const form = useForm<CreateTaskForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTaskSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: "GENERAL",
      assigneeRole: undefined,
      dueDays: 3,
      isRequired: true,
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: ({
      templateId,
      task,
    }: {
      templateId: string;
      task: CreateTaskData;
    }) => addTaskToTemplate(templateId, task),
    onSuccess: () => {
      toast.success("Đã thêm task");
      form.reset();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: () => toast.error("Thêm task thất bại"),
  });

  const onSubmit = (values: CreateTaskForm) => {
    if (!templateId) return;
    addTaskMutation.mutate({
      templateId,
      task: {
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
    <Dialog open={!!templateId} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm công việc mới</DialogTitle>
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
                    <Input placeholder="Ví dụ: Cấp laptop" {...field} />
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
                      placeholder="Mô tả chi tiết công việc..."
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
                size="sm"
                type="submit"
                disabled={addTaskMutation.isPending}
              >
                {addTaskMutation.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                Thêm công việc
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
