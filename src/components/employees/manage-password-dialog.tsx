"use client";

import { useState } from "react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { updateEmployeePassword } from "@/app/(protected)/employees/actions";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [newPassword, setNewPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateEmployeePassword(employeeId, newPassword || undefined),
    onSuccess: (password) => {
      setGeneratedPassword(password);
      setNewPassword("");
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
      setNewPassword("");
      setGeneratedPassword(null);
      mutation.reset();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Quản lý mật khẩu
          </DialogTitle>
          <DialogDescription>
            Cập nhật mật khẩu cho nhân viên <strong>{employeeName}</strong>
          </DialogDescription>
        </DialogHeader>

        {!generatedPassword ? (
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <Input
                  id="password"
                  type="text"
                  placeholder="Nhập mật khẩu mới hoặc để trống để tự tạo"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="gap-2"
              >
                {mutation.isPending && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                {newPassword ? "Lưu mật khẩu" : "Tạo mật khẩu ngẫu nhiên"}
              </Button>
            </div>
          </div>
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
                  Vui lòng copy và gửi mật khẩu này cho nhân viên một cách an toàn.
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
