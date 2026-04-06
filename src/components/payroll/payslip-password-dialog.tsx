"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    FormMessage,
} from "@/components/ui/form";
import {
    Shield,
    Eye,
    EyeOff,
    AlertCircle,
    HelpCircle,
    Loader2,
} from "lucide-react";

const passwordSchema = z.object({
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type PasswordForm = z.infer<typeof passwordSchema>;

interface PayslipPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    onForgotPassword?: () => void;
    maxAttempts?: number;
    employeeName?: string;
}

export function PayslipPasswordDialog({
    open,
    onOpenChange,
    onSuccess,
    onForgotPassword,
    maxAttempts = 3,
    employeeName,
}: PayslipPasswordDialogProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockUntil, setLockUntil] = useState<Date | null>(null);

    const form = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: "",
        },
    });

    const remainingAttempts = maxAttempts - attempts;

    const onSubmit = async (data: PasswordForm) => {
        if (isLocked) {
            toast.error("Tài khoản đã bị khóa. Vui lòng thử lại sau.");
            return;
        }

        try {
            const response = await fetch("/api/payroll/verify-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: data.password }),
            });

            if (response.ok) {
                toast.success("Xác thực thành công");
                onOpenChange(false);
                form.reset();
                setAttempts(0);
                onSuccess();
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= maxAttempts) {
                    setIsLocked(true);
                    const lockDuration = new Date(Date.now() + 15 * 60 * 1000);
                    setLockUntil(lockDuration);
                    toast.error("Bạn đã nhập sai quá nhiều lần. Tài khoản bị khóa trong 15 phút.");
                } else {
                    toast.error(
                        `Mật khẩu không đúng. Còn ${maxAttempts - newAttempts} lần thử.`
                    );
                }

                form.setValue("password", "");
            }
        } catch {
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset();
            setAttempts(0);
            setIsLocked(false);
            setLockUntil(null);
        }
        onOpenChange(newOpen);
    };

    const getTimeRemaining = () => {
        if (!lockUntil) return "";
        const now = new Date();
        const diff = lockUntil.getTime() - now.getTime();
        if (diff <= 0) {
            setIsLocked(false);
            setLockUntil(null);
            setAttempts(0);
            return "";
        }
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-center">
                        Xác thực mật khẩu phiếu lương
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {employeeName
                            ? `Nhập mật khẩu để xem phiếu lương của ${employeeName}`
                            : "Nhập mật khẩu để xem phiếu lương của bạn"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <Label htmlFor="password">Mật khẩu</Label>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Nhập mật khẩu"
                                                className="pr-10"
                                                disabled={isLocked}
                                                autoComplete="off"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() =>
                                                    setShowPassword(!showPassword)
                                                }
                                                disabled={isLocked}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {attempts > 0 && !isLocked && (
                            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                    Mật khẩu không đúng. Còn{" "}
                                    <strong>{remainingAttempts}</strong> lần thử.
                                </span>
                            </div>
                        )}

                        {isLocked && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                    Tài khoản bị khóa tạm thời. Vui lòng thử lại sau{" "}
                                    <strong>{getTimeRemaining()}</strong>.
                                </span>
                            </div>
                        )}

                        <DialogFooter className="flex-col sm:flex-col gap-2">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={
                                    form.formState.isSubmitting ||
                                    isLocked ||
                                    !form.formState.isValid
                                }
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xác thực...
                                    </>
                                ) : (
                                    "Xác nhận"
                                )}
                            </Button>

                            {onForgotPassword && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-muted-foreground"
                                    onClick={onForgotPassword}
                                >
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    Quên mật khẩu?
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>

                <div className="text-center text-xs text-muted-foreground mt-4">
                    <p>
                        Mật khẩu phiếu lương được cung cấp bởi phòng Nhân sự.
                    </p>
                    <p className="mt-1">
                        Nếu bạn quên mật khẩu, vui lòng liên hệ HR để được hỗ trợ.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
