"use client";

import { useRouter } from "next/navigation";
import { Building2, Loader2, MapPin, Phone, Globe, FileText, Banknote } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { createCompanyProfile } from "./actions";

const setupSchema = z.object({
    companyName: z
        .string()
        .min(2, "Tên công ty phải có ít nhất 2 ký tự"),
    companyCode: z.string().optional(),
    companyEmail: z.string().email("Email không hợp lệ").or(z.literal("")),
    companyPhone: z.string().optional(),
    companyTaxCode: z.string().optional(),
    companyAddress: z.string().optional(),
    companyWard: z.string().optional(),
    companyDistrict: z.string().optional(),
    companyCity: z.string().optional(),
    companyCountry: z.string().min(1, "Vui lòng chọn quốc gia"),
    companyWebsite: z.string().url("URL không hợp lệ").or(z.literal("")),
    companyDescription: z.string().optional(),
    companyIndustry: z.string().optional(),
    companyFoundedDate: z.string().optional(),
    companyEmployeeCount: z.string().optional(),
    companyBusinessLicense: z.string().optional(),
    companyBankAccount: z.string().optional(),
    companyBankName: z.string().optional(),
    agreement: z.boolean().refine((val) => val === true, {
        message: "Bạn phải đồng ý với điều khoản",
    }),
});

type SetupFormValues = z.infer<typeof setupSchema>;

const INDUSTRY_OPTIONS = [
    { value: "technology", label: "Công nghệ thông tin" },
    { value: "finance", label: "Tài chính - Ngân hàng" },
    { value: "manufacturing", label: "Sản xuất" },
    { value: "retail", label: "Bán lẻ" },
    { value: "construction", label: "Xây dựng" },
    { value: "education", label: "Giáo dục" },
    { value: "healthcare", label: "Y tế" },
    { value: "logistics", label: "Logistics" },
    { value: "entertainment", label: "Giải trí - Truyền thông" },
    { value: "consulting", label: "Tư vấn" },
    { value: "real_estate", label: "Bất động sản" },
    { value: "tourism", label: "Du lịch" },
    { value: "agriculture", label: "Nông nghiệp" },
    { value: "energy", label: "Năng lượng" },
    { value: "telecom", label: "Viễn thông" },
    { value: "other", label: "Khác" },
];

const EMPLOYEE_COUNT_OPTIONS = [
    { value: "1-10", label: "1-10 nhân viên" },
    { value: "11-50", label: "11-50 nhân viên" },
    { value: "51-100", label: "51-100 nhân viên" },
    { value: "101-200", label: "101-200 nhân viên" },
    { value: "201-500", label: "201-500 nhân viên" },
    { value: "501-1000", label: "501-1000 nhân viên" },
    { value: "1000+", label: "Trên 1000 nhân viên" },
];

const CITY_OPTIONS = [
    { value: "Hà Nội", label: "Hà Nội" },
    { value: "Hồ Chí Minh", label: "Hồ Chí Minh" },
    { value: "Đà Nẵng", label: "Đà Nẵng" },
    { value: "Hải Phòng", label: "Hải Phòng" },
    { value: "Cần Thơ", label: "Cần Thơ" },
    { value: "Khác", label: "Khác" },
];

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
            companyCode: "",
            companyEmail: "",
            companyPhone: "",
            companyTaxCode: "",
            companyAddress: "",
            companyWard: "",
            companyDistrict: "",
            companyCity: "",
            companyCountry: "Vietnam",
            companyWebsite: "",
            companyDescription: "",
            companyIndustry: "",
            companyFoundedDate: "",
            companyEmployeeCount: "",
            companyBusinessLicense: "",
            companyBankAccount: "",
            companyBankName: "",
            agreement: false,
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
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="space-y-1 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="size-8" />
                </div>
                <CardTitle className="text-2xl font-bold">
                    Tạo hồ sơ công ty
                </CardTitle>
                <CardDescription>
                    Thiết lập thông tin công ty để bắt đầu sử dụng hệ thống
                </CardDescription>
            </CardHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Thông tin cơ bản
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Tên công ty{" "}
                                                <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Tên công ty"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã công ty</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Mã số doanh nghiệp"
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
                                                    placeholder="contact@company.com"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Điện thoại</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="024-xxxx-xxxx"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyIndustry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngành nghề</FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isPending}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn ngành nghề" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INDUSTRY_OPTIONS.map((opt) => (
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
                                <FormField
                                    control={form.control}
                                    name="companyEmployeeCount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quy mô nhân sự</FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isPending}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn quy mô" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EMPLOYEE_COUNT_OPTIONS.map((opt) => (
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
                                <FormField
                                    control={form.control}
                                    name="companyWebsite"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="https://company.com"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyFoundedDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngày thành lập</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="date"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="companyDescription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mô tả công ty</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Mô tả ngắn về công ty..."
                                                rows={2}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Địa chỉ */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Địa chỉ
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="companyAddress"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Địa chỉ</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Số nhà, đường, phường/xã..."
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyWard"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phường/Xã</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Phường/Xã"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyDistrict"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quận/Huyện</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Quận/Huyện"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyCity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tỉnh/Thành phố</FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isPending}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tỉnh/TP" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CITY_OPTIONS.map((opt) => (
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
                                <FormField
                                    control={form.control}
                                    name="companyCountry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Quốc gia{" "}
                                                <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isPending}
                                            >
                                                <SelectTrigger>
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
                            </div>
                        </div>

                        <Separator />

                        {/* Thông tin pháp lý */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Thông tin pháp lý
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="companyTaxCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã số thuế</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Mã số thuế"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyBusinessLicense"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giấy phép KD số</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Số đăng ký KD"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Thông tin ngân hàng */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                Thông tin ngân hàng
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="companyBankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tên ngân hàng</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Ngân hàng..."
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyBankAccount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Số tài khoản</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Số tài khoản"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Điều khoản */}
                        <FormField
                            control={form.control}
                            name="agreement"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <div className="leading-none text-sm">
                                        Tôi đồng ý với{" "}
                                        <a
                                            href="#"
                                            className="text-primary hover:underline"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Điều khoản sử dụng
                                        </a>{" "}
                                        và{" "}
                                        <a
                                            href="#"
                                            className="text-primary hover:underline"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Chính sách bảo mật
                                        </a>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />
                    </CardContent>

                    <div className="px-6 pt-6 pb-6">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!form.formState.isValid || isPending}
                        >
                            {isPending && (
                                <Loader2 className="size-4 animate-spin mr-2" />
                            )}
                            Thiết lập công ty
                        </Button>
                    </div>
                </form>
            </Form>
        </Card>
    );
}