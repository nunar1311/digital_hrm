"use client";

import { useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { SOCKET_EVENTS } from "@/lib/socket/types";
import { Upload, X, Building2, Info } from "lucide-react";
import Image from "next/image";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { SettingsSection } from "../../../../components/settings/preferences/settings-section";
import {
  useCompanyInfo,
  useUpdateCompanyInfo,
  useUploadCompanyLogo,
  useDeleteCompanyLogo,
} from "./use-company";
import Loading from "../../loading";
import { DatePicker } from "@/components/ui/date-picker";

import { SettingsHeader } from "@/components/settings/settings-header";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const companyFormSchema = z.object({
  companyName: z.string().min(1, "Tên công ty không được để trống"),
  companyCode: z.string().optional(),
  companyEmail: z.string().email("Email không hợp lệ").or(z.literal("")),
  companyPhone: z.string().optional(),
  companyFax: z.string().optional(),
  companyTaxCode: z.string().optional(),
  companyAddress: z.string().optional(),
  companyWard: z.string().optional(),
  companyDistrict: z.string().optional(),
  companyCity: z.string().optional(),
  companyCountry: z.string().optional(),
  companyWebsite: z.string().url("URL không hợp lệ").or(z.literal("")),
  companyDescription: z.string().optional(),
  companyLogo: z.string().optional(),
  companyIndustry: z.string().optional(),
  companyFoundedDate: z.date().optional(),
  companyEmployeeCount: z.string().optional(),
  companyBusinessLicense: z.string().optional(),
  companyBankAccount: z.string().optional(),
  companyBankName: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

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
  { value: "Hải Dương", label: "Hải Dương" },
  { value: "Nam Định", label: "Nam Định" },
  { value: "Thái Nguyên", label: "Thái Nguyên" },
  { value: "Vĩnh Phúc", label: "Vĩnh Phúc" },
  { value: "Bắc Ninh", label: "Bắc Ninh" },
  { value: "Hưng Yên", label: "Hưng Yên" },
  { value: "Hà Nam", label: "Hà Nam" },
  { value: "Nghệ An", label: "Nghệ An" },
  { value: "Thanh Hóa", label: "Thanh Hóa" },
  { value: "Khác", label: "Khác" },
];

export function CompanyPageClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useCompanyInfo();
  const updateMutation = useUpdateCompanyInfo();
  const uploadMutation = useUploadCompanyLogo();
  const deleteMutation = useDeleteCompanyLogo();

  const canEdit = data?.canEdit ?? false;

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: "",
      companyCode: "",
      companyEmail: "",
      companyPhone: "",
      companyFax: "",
      companyTaxCode: "",
      companyAddress: "",
      companyWard: "",
      companyDistrict: "",
      companyCity: "",
      companyCountry: "",
      companyWebsite: "",
      companyDescription: "",
      companyLogo: "",
      companyIndustry: "",
      companyFoundedDate: undefined,
      companyEmployeeCount: "",
      companyBusinessLicense: "",
      companyBankAccount: "",
      companyBankName: "",
    },
  });

  // Real-time updates
  useSocketEvent(SOCKET_EVENTS.COMPANY_UPDATED, () => {
    queryClient.invalidateQueries({ queryKey: ["company"] });
  });

  useSocketEvent(SOCKET_EVENTS.COMPANY_LOGO_UPDATED, () => {
    queryClient.invalidateQueries({ queryKey: ["company"] });
  });

  // Update form values when data changes (after save/reload)
  useEffect(() => {
    if (data?.data && Object.keys(data.data).length > 0) {
      const dateValue = data.data.companyFoundedDate
        ? new Date(data.data.companyFoundedDate)
        : undefined;
      form.reset({
        ...form.getValues(),
        ...data.data,
        companyFoundedDate: dateValue,
      });
    }
  }, [data?.data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const dataToSubmit = {
      ...values,
      companyFoundedDate: values.companyFoundedDate
        ? values.companyFoundedDate.toISOString()
        : undefined,
    };
    await updateMutation.mutateAsync(dataToSubmit);
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadMutation.mutateAsync(formData);
    } catch (err) {
      console.error("Failed to upload logo:", err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await deleteMutation.mutateAsync();
    } catch (err) {
      console.error("Failed to delete logo:", err);
    }
  };

  const isSaving = updateMutation.isPending;
  const isUploading = uploadMutation.isPending;
  const hasChanges = form.formState.isDirty;

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">Không thể tải thông tin công ty</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const logoUrl = form.watch("companyLogo");

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden min-h-0">
      <div className="shrink-0 p-4 md:p-6">
        <SettingsHeader
          title="Thông tin công ty"
          description="Quản lý thông tin và cấu hình công ty của bạn"
          canEdit={canEdit}
          hasChanges={hasChanges}
          isSaving={isSaving}
          onSave={onSubmit}
        />
      </div>

      {!canEdit && (
        <div className="px-4 md:px-6 pb-0">
          <Alert className="bg-muted/50 border-amber-200 dark:border-amber-800">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm">
              <span className="font-medium text-amber-700 dark:text-amber-300">
                Bạn đang xem ở chế độ chỉ đọc.
              </span>{" "}
              <span className="text-muted-foreground">
                Các trường thông tin bên dưới chỉ hiển thị. Liên hệ quản trị
                viên để thực hiện thay đổi.
              </span>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 px-4 md:px-6 pb-6 pt-4 overflow-auto h-full min-h-0 no-scrollbar">
        <Form {...form}>
          {/* Logo & Thông tin cơ bản */}
          <SettingsSection
            title="Logo & Thông tin cơ bản"
            description="Thông tin cơ bản về công ty"
          >
            <div className="space-y-6 w-full">
              <div className="flex flex-col items-start gap-2">
                <p className="text-xs font-medium">Logo công ty</p>
                <div className="shrink-0">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt="Company Logo"
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <Building2 className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                          <span className="text-[10px] text-gray-400">
                            Chưa có
                          </span>
                        </div>
                      )}
                    </div>
                    {canEdit && (
                      <div className="absolute inset-0 bg-primary/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="h-7 text-xs"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                        {logoUrl && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDeleteLogo}
                            className="h-7 text-xs"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={!canEdit || isUploading}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, SVG. Max 2MB
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Tên công ty <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập tên công ty"
                          disabled={!canEdit}
                          className={cn(
                            "h-9",
                            !canEdit && "bg-muted/30 cursor-not-allowed",
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Mã công ty</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập mã công ty"
                          disabled={!canEdit}
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyIndustry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Ngành nghề</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="w-full">
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
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyEmployeeCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Quy mô nhân sự</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="w-full">
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
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyFoundedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Ngày thành lập</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập tên miền công ty"
                          disabled={!canEdit}
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="companyDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Mô tả công ty</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Mô tả ngắn về công ty..."
                        rows={2}
                        disabled={!canEdit}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </SettingsSection>

          <Separator />

          {/* Địa chỉ & Liên hệ */}
          <SettingsSection
            title="Địa chỉ & Liên hệ"
            description="Thông tin địa chỉ và liên lạc của công ty"
          >
            <div className="space-y-4 w-full">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs">Địa chỉ</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Số nhà, đường, phường/xã..."
                          disabled={!canEdit}
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyWard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Phường/Xã</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Phường/Xã"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyDistrict"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Quận/Huyện</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Quận/Huyện"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Tỉnh/Thành phố</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="w-full">
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
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Quốc gia</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập quốc gia"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Nhập email công ty"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Điện thoại</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập số điện thoại"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyFax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Fax</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập số fax"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập website công ty"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </SettingsSection>

          <Separator />

          {/* Thông tin pháp lý */}
          <SettingsSection
            title="Thông tin pháp lý"
            description="Mã số thuế và giấy phép kinh doanh"
          >
            <div className="space-y-4 w-full">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyTaxCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Mã số thuế</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập mã số thuế"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyBusinessLicense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Giấy phép KD số</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập số đăng ký KD"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </SettingsSection>

          <Separator />

          {/* Thông tin ngân hàng */}
          <SettingsSection
            title="Thông tin ngân hàng"
            description="Thông tin tài khoản ngân hàng công ty"
          >
            <div className="space-y-4 w-full">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyBankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Tên ngân hàng</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ngân hàng..."
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyBankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Số tài khoản</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập số tài khoản"
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </SettingsSection>
        </Form>
      </div>
    </div>
  );
}

export default CompanyPageClient;
