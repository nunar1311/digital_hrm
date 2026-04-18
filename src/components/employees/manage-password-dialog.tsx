"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { updateEmployeePassword } from "@/app/(protected)/employees/actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z
  .object({
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

interface ManagePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
}

export function ManagePasswordDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: ManagePasswordDialogProps) {
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateEmployeePassword(employeeId, values.password || undefined),
    onSuccess: (password) => {
      setGeneratedPassword(password);
      form.reset();
      toast.success("Cập nhật mật khẩu thành công!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Cập nhật mật khẩu thất bại",
      );
    },
  });

  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast.success("Đã copy mật khẩu");
    } catch {
      toast.error("Không thể copy");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset();
      setGeneratedPassword(null);
      mutation.reset();
    }, 500);
  };

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  const currentPassword = form.watch("password");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Quản lý mật khẩu
          </DialogTitle>
          <DialogDescription>
            Cập nhật mật khẩu cho nhân viên <strong>{employeeName}</strong>
          </DialogDescription>
        </DialogHeader>

        {!generatedPassword ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Nhập mật khẩu mới"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Nhập lại mật khẩu mới"
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
                  onClick={handleClose}
                  disabled={mutation.isPending}
                >
                  Hủy
                </Button>
                <Button type="submit" size={"sm"} disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <RefreshCw className="sanimate-spin" />
                  )}
                  {currentPassword ? "Lưu mật khẩu" : "Tạo mật khẩu ngẫu nhiên"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="grid gap-6 py-4">
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription className="space-y-3">
                <p>Mật khẩu đã được cập nhật thành công!</p>
                <div className="flex items-center gap-2">
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold flex-1 text-center">
                    {generatedPassword}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vui lòng copy và gửi mật khẩu này cho nhân viên một cách an
                  toàn.
                </p>
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Đóng</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
