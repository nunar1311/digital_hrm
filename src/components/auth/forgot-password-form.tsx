"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const forgotPasswordSchema = z.object({
  email: z.string().email("Vui lòng nhập email hợp lệ").trim(),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ForgotPasswordValues) {
    // const result = await signIn.username({
    //   username: values.username.trim(),
    //   password: values.password,
    // });
    // if (result.error) {
    //   form.setError("root", {
    //     message:
    //       result.error.message ?? "Tên đăng nhập hoặc mật khẩu không đúng",
    //   });
    //   return;
    // }
    // router.push("/");
    // router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 sm:px-6 py-8 sm:py-12 md:py-20">
      <h2 className="text-primary text-2xl font-semibold md:text-xl">
        Quên mật khẩu
      </h2>
      <p className="text-muted-foreground text-sm mt-1">
        Nhập email để lấy lại mật khẩu
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 sm:mt-8 space-y-4 sm:space-y-5"
          noValidate
        >
          {form.formState.errors.root && (
            <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {form.formState.errors.root.message}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Nhập email"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Đăng nhập
          </Button>
          <Button
            type="button"
            variant="link"
            disabled={isSubmitting}
            className="w-full"
            onClick={() => router.push("/login")}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Quay lại đăng nhập
          </Button>
        </form>
      </Form>
    </div>
  );
}
