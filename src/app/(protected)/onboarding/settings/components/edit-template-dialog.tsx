"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Save, Loader2 } from "lucide-react";
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
import { updateOnboardingTemplate } from "../../actions";
import { type OnboardingTemplateDB } from "@/types/onboarding";

const editTemplateSchema = z.object({
  name: z.string().min(1, "Tên template không được trống"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type EditTemplateForm = z.infer<typeof editTemplateSchema>;

interface EditTemplateDialogProps {
  template: OnboardingTemplateDB | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTemplateDialog({
  template,
  open,
  onOpenChange,
  onSuccess,
}: EditTemplateDialogProps) {
  const form = useForm<EditTemplateForm>({
    resolver: zodResolver(editTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description ?? "",
        isActive: template.isActive,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id, open]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string; isActive?: boolean };
    }) => updateOnboardingTemplate(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật template");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const onSubmit = (values: EditTemplateForm) => {
    if (!template) return;
    updateMutation.mutate({
      id: template.id,
      data: {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        isActive: values.isActive,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chỉnh sửa template
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin template: tên, mô tả và trạng thái
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên template</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên template" {...field} />
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
                      placeholder="Mô tả template..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">
                      Trạng thái hoạt động
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Template không hoạt động sẽ không hiển thị khi tạo
                      onboarding
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
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
