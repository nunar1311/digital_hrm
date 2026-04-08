"use client";

import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createCompanyProfile } from "./actions";

const setupSchema = z.object({
  companyName: z.string().min(2, "Tên công ty phải có ít nhất 2 ký tự"),
  companyEmail: z.string().email("Email không hợp lệ").or(z.literal("")),
  companyCountry: z.string().min(1, "Vui lòng chọn quốc gia"),
});

type SetupFormValues = z.infer<typeof setupSchema>;

const COUNTRY_OPTIONS = [
  { value: "Vietnam", label: "Việt Nam" },
  { value: "United States", label: "Hoa Kỳ" },
  { value: "United Kingdom", label: "Anh" },
  { value: "Japan", label: "Nhật Bản" },
  { value: "South Korea", label: "Hàn Quốc" },
  { value: "China", label: "Trung Quốc" },
  { value: "Singapore", label: "Singapore" },
  { value: "Malaysia", label: "Malaysia" },
  { value: "Thailand", label: "Thái Lan" },
  { value: "Other", label: "Khác" },
];

export function CompanySetupForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      companyName: "",
      companyEmail: "",
      companyCountry: "Vietnam",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SetupFormValues) => {
      return await createCompanyProfile(data);
    },
    onSuccess: () => {
      toast.success("Thiết lập công ty thành công!");
      queryClient.invalidateQueries({
        queryKey: ["company-setup"],
      });
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    },
  });

  const onSubmit = (values: SetupFormValues) => {
    createMutation.mutate(values);
  };

  const isPending = createMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-sm px-4 sm:px-6 py-8 sm:py-12 md:py-20">
      <h2 className="text-primary text-2xl font-semibold md:text-xl">
        Thiết lập công ty
      </h2>
      <p className="text-muted-foreground text-sm mt-1">
        Nhập thông tin công ty để tiếp tục
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tên công ty <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Nhập tên công ty"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email công ty</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Nhập email công ty"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Quốc gia <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn quốc gia" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!form.formState.isValid || isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Thiết lập công ty
          </Button>
        </form>
      </Form>
    </div>
  );
}
