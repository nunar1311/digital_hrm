"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
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

const passwordSchema = (t: ReturnType<typeof useTranslations>) =>
    z.object({
        password: z.string().min(1, t("payrollPasswordDialogPasswordRequired")),
    });

type PasswordForm = z.infer<ReturnType<typeof passwordSchema>>;

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
    const t = useTranslations("ProtectedPages");
    const [showPassword, setShowPassword] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockUntil, setLockUntil] = useState<Date | null>(null);

    const form = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema(t)),
        defaultValues: {
            password: "",
        },
    });

    const remainingAttempts = maxAttempts - attempts;

    const onSubmit = async (data: PasswordForm) => {
        if (isLocked) {
            toast.error(t("payrollPasswordDialogAccountLocked"));
            return;
        }

        try {
            const response = await fetch("/api/payroll/verify-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: data.password }),
            });

            if (response.ok) {
                toast.success(t("payrollPasswordDialogVerifySuccess"));
                onOpenChange(false);
                form.reset();
                setAttempts(0);
                onSuccess();
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= maxAttempts) {
                    setIsLocked(true);
                    const lockDuration = new Date();
                    lockDuration.setMinutes(lockDuration.getMinutes() + 15);
                    setLockUntil(lockDuration);
                    toast.error(t("payrollPasswordDialogTooManyAttempts"));
                } else {
                    toast.error(
                        t("payrollPasswordDialogWrongPasswordRemaining", {
                            count: maxAttempts - newAttempts,
                        })
                    );
                }

                form.setValue("password", "");
            }
        } catch {
            toast.error(t("payrollPasswordDialogUnexpectedError"));
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
                        {t("payrollPasswordDialogTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {employeeName
                            ? t("payrollPasswordDialogDescriptionWithName", { employeeName })
                            : t("payrollPasswordDialogDescription")}
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
                                    <Label htmlFor="password">{t("payrollPasswordDialogPasswordLabel")}</Label>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder={t("payrollPasswordDialogPasswordPlaceholder")}
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
                                    {t("payrollPasswordDialogWrongPassword")}{" "}
                                    <strong>{remainingAttempts}</strong> {t("payrollPasswordDialogAttemptsLeft")}
                                </span>
                            </div>
                        )}

                        {isLocked && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                    {t("payrollPasswordDialogLockedUntil")}{" "}
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
                                        {t("payrollPasswordDialogVerifying")}
                                    </>
                                ) : (
                                    t("payrollPasswordDialogConfirm")
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
                                    {t("payrollPasswordDialogForgotPassword")}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>

                <div className="text-center text-xs text-muted-foreground mt-4">
                    <p>
                        {t("payrollPasswordDialogFooterProvidedByHr")}
                    </p>
                    <p className="mt-1">
                        {t("payrollPasswordDialogFooterContactHr")}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
