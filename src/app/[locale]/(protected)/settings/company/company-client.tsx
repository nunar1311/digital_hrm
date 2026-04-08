"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { SOCKET_EVENTS } from "@/lib/socket/types";
import { Upload, X, Building2 } from "lucide-react";
import Image from "next/image";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { SettingsSection } from "@/components/settings/preferences/settings-section";
import {
    useCompanyInfo,
    useUpdateCompanyInfo,
    useUploadCompanyLogo,
    useDeleteCompanyLogo,
} from "./use-company";
import Loading from "../../loading";
import { DatePicker } from "@/components/ui/date-picker";
import { SettingsHeader } from "@/components/settings/settings-header";
import { ReadOnlyNotice } from "@/components/settings/read-only-notice";
import { Separator } from "@/components/ui/separator";

const companyFormSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    companyCode: z.string().optional(),
    companyEmail: z
        .string()
        .email("Invalid email")
        .or(z.literal("")),
    companyPhone: z.string().optional(),
    companyFax: z.string().optional(),
    companyTaxCode: z.string().optional(),
    companyAddress: z.string().optional(),
    companyWard: z.string().optional(),
    companyDistrict: z.string().optional(),
    companyCity: z.string().optional(),
    companyCountry: z.string().optional(),
    companyWebsite: z
        .string()
        .url("Invalid URL")
        .or(z.literal("")),
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
    { value: "technology", labelKey: "settingsCompanyIndustryTechnology" },
    { value: "finance", labelKey: "settingsCompanyIndustryFinance" },
    { value: "manufacturing", labelKey: "settingsCompanyIndustryManufacturing" },
    { value: "retail", labelKey: "settingsCompanyIndustryRetail" },
    { value: "construction", labelKey: "settingsCompanyIndustryConstruction" },
    { value: "education", labelKey: "settingsCompanyIndustryEducation" },
    { value: "healthcare", labelKey: "settingsCompanyIndustryHealthcare" },
    { value: "logistics", labelKey: "settingsCompanyIndustryLogistics" },
    { value: "entertainment", labelKey: "settingsCompanyIndustryEntertainment" },
    { value: "consulting", labelKey: "settingsCompanyIndustryConsulting" },
    { value: "real_estate", labelKey: "settingsCompanyIndustryRealEstate" },
    { value: "tourism", labelKey: "settingsCompanyIndustryTourism" },
    { value: "agriculture", labelKey: "settingsCompanyIndustryAgriculture" },
    { value: "energy", labelKey: "settingsCompanyIndustryEnergy" },
    { value: "telecom", labelKey: "settingsCompanyIndustryTelecom" },
    { value: "other", labelKey: "settingsCompanyIndustryOther" },
] as const;

const EMPLOYEE_COUNT_OPTIONS = [
    { value: "1-10", labelKey: "settingsCompanyEmployeeCount1To10" },
    { value: "11-50", labelKey: "settingsCompanyEmployeeCount11To50" },
    { value: "51-100", labelKey: "settingsCompanyEmployeeCount51To100" },
    { value: "101-200", labelKey: "settingsCompanyEmployeeCount101To200" },
    { value: "201-500", labelKey: "settingsCompanyEmployeeCount201To500" },
    { value: "501-1000", labelKey: "settingsCompanyEmployeeCount501To1000" },
    { value: "1000+", labelKey: "settingsCompanyEmployeeCount1000Plus" },
] as const;

const CITY_OPTIONS = [
    { valueKey: "settingsCompanyCityHaNoi", labelKey: "settingsCompanyCityHaNoi" },
    { valueKey: "settingsCompanyCityHoChiMinh", labelKey: "settingsCompanyCityHoChiMinh" },
    { valueKey: "settingsCompanyCityDaNang", labelKey: "settingsCompanyCityDaNang" },
    { valueKey: "settingsCompanyCityHaiPhong", labelKey: "settingsCompanyCityHaiPhong" },
    { valueKey: "settingsCompanyCityCanTho", labelKey: "settingsCompanyCityCanTho" },
    { valueKey: "settingsCompanyCityHaiDuong", labelKey: "settingsCompanyCityHaiDuong" },
    { valueKey: "settingsCompanyCityNamDinh", labelKey: "settingsCompanyCityNamDinh" },
    { valueKey: "settingsCompanyCityThaiNguyen", labelKey: "settingsCompanyCityThaiNguyen" },
    { valueKey: "settingsCompanyCityVinhPhuc", labelKey: "settingsCompanyCityVinhPhuc" },
    { valueKey: "settingsCompanyCityBacNinh", labelKey: "settingsCompanyCityBacNinh" },
    { valueKey: "settingsCompanyCityHungYen", labelKey: "settingsCompanyCityHungYen" },
    { valueKey: "settingsCompanyCityHaNam", labelKey: "settingsCompanyCityHaNam" },
    { valueKey: "settingsCompanyCityNgheAn", labelKey: "settingsCompanyCityNgheAn" },
    { valueKey: "settingsCompanyCityThanhHoa", labelKey: "settingsCompanyCityThanhHoa" },
    { valueKey: "settingsCompanyCityOther", labelKey: "settingsCompanyCityOther" },
] as const;

export function CompanyPageClient() {
    const t = useTranslations("ProtectedPages");
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

    const handleLogoUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
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
                    <p className="text-red-500 mb-2">
                        Không thể tải thông tin công ty
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
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
                    title={t("settingsCompanyHeaderTitle")}
                    description={t("settingsCompanyHeaderDescription")}
                    canEdit={canEdit}
                    hasChanges={hasChanges}
                    isSaving={isSaving}
                    onSave={onSubmit}
                />
            </div>

            <div className="flex-1 px-4 md:px-6 pb-6 overflow-auto h-full min-h-0 no-scrollbar">
                <Form {...form}>
                    {/* Logo & Thông tin cơ bản */}
                    <SettingsSection
                        title={t("settingsCompanySectionBasicTitle")}
                        description={t("settingsCompanySectionBasicDescription")}
                    >
                        <div className="space-y-6 w-full">
                            <div className="flex flex-col items-start gap-2">
                                <p className="text-xs font-medium">
                                    {t("settingsCompanyLogoLabel")}
                                </p>
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
                                                        {t("settingsCompanyLogoEmpty")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {canEdit && (
                                            <div className="absolute inset-0 bg-primary/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                    disabled={
                                                        isUploading
                                                    }
                                                    className="h-7 text-xs"
                                                >
                                                    <Upload className="h-3 w-3" />
                                                </Button>
                                                {logoUrl && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={
                                                            handleDeleteLogo
                                                        }
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
                                            onChange={
                                                handleLogoUpload
                                            }
                                            className="hidden"
                                            disabled={
                                                !canEdit ||
                                                isUploading
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {t("settingsCompanyLogoHint")}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelName")}{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderName")}
                                                    disabled={
                                                        !canEdit
                                                    }
                                                    className="h-9"
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelCode")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderCode")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelIndustry")}
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={
                                                    field.onChange
                                                }
                                                disabled={!canEdit}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t("settingsCompanyPlaceholderSelectIndustry")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INDUSTRY_OPTIONS.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={
                                                                    opt.value
                                                                }
                                                                value={
                                                                    opt.value
                                                                }
                                                            >
                                                                {
                                                                    t(opt.labelKey)
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelEmployeeCount")}
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={
                                                    field.onChange
                                                }
                                                disabled={!canEdit}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t("settingsCompanyPlaceholderSelectEmployeeCount")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EMPLOYEE_COUNT_OPTIONS.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={
                                                                    opt.value
                                                                }
                                                                value={
                                                                    opt.value
                                                                }
                                                            >
                                                                {
                                                                    t(opt.labelKey)
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelFoundedDate")}
                                            </FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    date={field.value}
                                                    setDate={
                                                        field.onChange
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelWebsite")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderWebsiteDomain")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                        <FormLabel className="text-xs">
                                            {t("settingsCompanyLabelDescription")}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder={t("settingsCompanyPlaceholderDescription")}
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
                        title={t("settingsCompanySectionContactTitle")}
                        description={t("settingsCompanySectionContactDescription")}
                    >
                        <div className="space-y-4 w-full">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="companyAddress"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelAddress")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderAddress")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelWard")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderWard")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelDistrict")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderDistrict")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelCity")}
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={
                                                    field.onChange
                                                }
                                                disabled={!canEdit}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t("settingsCompanyPlaceholderSelectCity")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CITY_OPTIONS.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={
                                                                    t(opt.valueKey)
                                                                }
                                                                value={
                                                                    t(opt.valueKey)
                                                                }
                                                            >
                                                                {
                                                                    t(opt.labelKey)
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelCountry")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderCountry")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelEmail")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder={t("settingsCompanyPlaceholderEmail")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelPhone")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderPhone")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelFax")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderFax")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelWebsite")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderWebsite")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                        title={t("settingsCompanySectionLegalTitle")}
                        description={t("settingsCompanySectionLegalDescription")}
                    >
                        <div className="space-y-4 w-full">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="companyTaxCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelTaxCode")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderTaxCode")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelBusinessLicense")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderBusinessLicense")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                        title={t("settingsCompanySectionBankTitle")}
                        description={t("settingsCompanySectionBankDescription")}
                    >
                        <div className="space-y-4 w-full">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="companyBankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelBankName")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderBankName")}
                                                    disabled={
                                                        !canEdit
                                                    }
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
                                            <FormLabel className="text-xs">
                                                {t("settingsCompanyLabelBankAccount")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("settingsCompanyPlaceholderBankAccount")}
                                                    disabled={
                                                        !canEdit
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </SettingsSection>

                    {!canEdit && <ReadOnlyNotice />}
                </Form>
            </div>
        </div>
    );
}

export default CompanyPageClient;
