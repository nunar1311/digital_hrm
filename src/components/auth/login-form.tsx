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

const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập").trim(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: LoginValues) {
    const result = await signIn.username({
      username: values.username.trim(),
      password: values.password,
    });

    if (result.error) {
      form.setError("root", {
        message:
          result.error.message ?? "Tên đăng nhập hoặc mật khẩu không đúng",
      });
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 sm:px-6 py-8 sm:py-12 md:py-20">
      <h2 className="text-primary text-2xl font-semibold md:text-xl">
        Đăng nhập
      </h2>
      <p className="text-muted-foreground text-sm mt-1">
        Nhập tên đăng nhập và mật khẩu để tiếp tục
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 sm:mt-8 space-y-4 sm:space-y-5"
          noValidate
        >
          {form.formState.errors.root && (
            <div className="text-sm relative px-4 after:absolute after:w-0.5 after:bg-primary after:left-0 after:h-full">
              {form.formState.errors.root.message}
            </div>
          )}

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên đăng nhập</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    autoComplete="username"
                    tabIndex={1}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>Mật khẩu</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                    tabIndex={4}
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Nhập mật khẩu"
                    tabIndex={2}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            tabIndex={3}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Đăng nhập
          </Button>
        </form>
      </Form>
    </div>
  );
}
