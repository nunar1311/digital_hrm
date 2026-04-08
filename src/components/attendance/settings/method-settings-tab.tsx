"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
    Settings,
    MapPin,
    Wifi,
    Camera,
    Plus,
    Trash2,
    Loader2,
} from "lucide-react";

import {
    updateAttendanceConfig,
    addWifiWhitelist,
    removeWifiWhitelist,
} from "@/app/[locale]/(protected)/attendance/actions";
import type {
    AttendanceConfig,
    WifiWhitelist,
} from "@/app/[locale]/(protected)/attendance/types";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

function createMethodSchema(t: ReturnType<typeof useTranslations>) {
    return z.object({
        requireGps: z.boolean(),
        requireWifi: z.boolean(),
        requireSelfie: z.boolean(),
        maxGpsDistanceMeters: z
            .number()
            .min(10, t("attendanceMethodSettingsTabValidationDistanceMin"))
            .max(5000, t("attendanceMethodSettingsTabValidationDistanceMax")),
        officeLat: z.number().nullable(),
        officeLng: z.number().nullable(),
    });
}

type MethodFormValues = z.infer<ReturnType<typeof createMethodSchema>>;

interface Props {
    config: AttendanceConfig | null;
    queryClient: ReturnType<typeof useQueryClient>;
}

export function MethodSettingsTab({ config, queryClient }: Props) {
    const t = useTranslations("ProtectedPages");
    const methodSchema = createMethodSchema(t);

    const form = useForm<MethodFormValues>({
        resolver: zodResolver(methodSchema),
        defaultValues: {
            requireGps: config?.requireGps ?? false,
            requireWifi: config?.requireWifi ?? false,
            requireSelfie: config?.requireSelfie ?? false,
            maxGpsDistanceMeters: config?.maxGpsDistanceMeters ?? 200,
            officeLat: config?.officeLat ?? null,
            officeLng: config?.officeLng ?? null,
        },
    });

    const [wifiSsid, setWifiSsid] = useState("");
    const [wifiBssid, setWifiBssid] = useState("");
    const wifiList = config?.wifiWhitelist ?? [];

    const saveMutation = useMutation({
        mutationFn: (values: MethodFormValues) =>
            updateAttendanceConfig({
                ...values,
                standardWorkHours: config?.standardWorkHours ?? 8,
                standardWorkDays: config?.standardWorkDays ?? 22,
                otWeekdayCoeff: config?.otWeekdayCoeff ?? 1.5,
                otWeekendCoeff: config?.otWeekendCoeff ?? 2.0,
                otHolidayCoeff: config?.otHolidayCoeff ?? 3.0,
            }),
        onMutate: async (values) => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "config"] });
            queryClient.setQueryData<AttendanceConfig>(
                ["attendance", "config"],
                (old) => {
                    if (!old) return old;
                    return { ...old, ...values };
                },
            );
            return {};
        },
        onSuccess: () => {
            toast.success(t("attendanceMethodSettingsTabToastSaveSuccess"));
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceMethodSettingsTabToastGenericError"));
            queryClient.invalidateQueries({ queryKey: ["attendance", "config"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "config"],
            });
        }
    });

    const addWifiMutation = useMutation({
        mutationFn: () => {
            if (!config?.id)
                throw new Error(
                    t("attendanceMethodSettingsTabErrorConfigMissing"),
                );
            return addWifiWhitelist(config.id, wifiSsid, wifiBssid || undefined);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "config"] });
            const optimisticWifi: WifiWhitelist = {
                id: `optimistic-${Date.now()}`,
                configId: config?.id || "",
                ssid: wifiSsid,
                bssid: wifiBssid || null,
            };
            queryClient.setQueryData<AttendanceConfig>(
                ["attendance", "config"],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        wifiWhitelist: [
                            ...(old.wifiWhitelist || []),
                            optimisticWifi,
                        ],
                    };
                },
            );
            return {};
        },
        onSuccess: () => {
            toast.success(t("attendanceMethodSettingsTabToastAddWifiSuccess"));
            setWifiSsid("");
            setWifiBssid("");
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceMethodSettingsTabToastGenericError"));
            queryClient.invalidateQueries({ queryKey: ["attendance", "config"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "config"],
            });
        }
    });

    const removeWifiMutation = useMutation({
        mutationFn: removeWifiWhitelist,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "config"] });
            queryClient.setQueryData<AttendanceConfig>(
                ["attendance", "config"],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        wifiWhitelist: (old.wifiWhitelist || []).filter(
                            (w) => w.id !== id,
                        ),
                    };
                },
            );
            return {};
        },
        onSuccess: () => {
            toast.success(t("attendanceMethodSettingsTabToastRemoveWifiSuccess"));
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceMethodSettingsTabToastGenericError"));
            queryClient.invalidateQueries({ queryKey: ["attendance", "config"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "config"],
            });
        }
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((v) =>
                    saveMutation.mutate(v),
                )}
                className="grid gap-6 lg:grid-cols-2"
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            {t("attendanceMethodSettingsTabRequirementsTitle")}
                        </CardTitle>
                        <CardDescription>
                            {t("attendanceMethodSettingsTabRequirementsDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="requireGps"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <FormLabel className="text-sm font-medium">
                                                {t("attendanceMethodSettingsTabRequireGpsLabel")}
                                            </FormLabel>
                                            <FormDescription>
                                                {t("attendanceMethodSettingsTabRequireGpsDescription")}
                                            </FormDescription>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={
                                                field.onChange
                                            }
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Separator />

                        <FormField
                            control={form.control}
                            name="requireWifi"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Wifi className="h-5 w-5 text-green-500" />
                                        <div>
                                            <FormLabel className="text-sm font-medium">
                                                {t("attendanceMethodSettingsTabRequireWifiLabel")}
                                            </FormLabel>
                                            <FormDescription>
                                                {t("attendanceMethodSettingsTabRequireWifiDescription")}
                                            </FormDescription>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={
                                                field.onChange
                                            }
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Separator />

                        <FormField
                            control={form.control}
                            name="requireSelfie"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Camera className="h-5 w-5 text-orange-500" />
                                        <div>
                                            <FormLabel className="text-sm font-medium">
                                                {t("attendanceMethodSettingsTabRequireSelfieLabel")}
                                            </FormLabel>
                                            <FormDescription>
                                                {t("attendanceMethodSettingsTabRequireSelfieDescription")}
                                            </FormDescription>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={
                                                field.onChange
                                            }
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            {t("attendanceMethodSettingsTabOfficeLocationTitle")}
                        </CardTitle>
                        <CardDescription>
                            {t("attendanceMethodSettingsTabOfficeLocationDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="officeLat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceMethodSettingsTabOfficeLatLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.000001"
                                                placeholder="21.0285"
                                                value={
                                                    field.value ?? ""
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value
                                                            ? Number(
                                                                  e
                                                                      .target
                                                                      .value,
                                                              )
                                                            : null,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="officeLng"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceMethodSettingsTabOfficeLngLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.000001"
                                                placeholder="105.8542"
                                                value={
                                                    field.value ?? ""
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value
                                                            ? Number(
                                                                  e
                                                                      .target
                                                                      .value,
                                                              )
                                                            : null,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="maxGpsDistanceMeters"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("attendanceMethodSettingsTabMaxDistanceLabel")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={10}
                                            max={5000}
                                            value={field.value}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target
                                                        .valueAsNumber,
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t(
                                            "attendanceMethodSettingsTabMaxDistanceDescription",
                                            { meters: field.value },
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wifi className="h-5 w-5" />
                            {t("attendanceMethodSettingsTabWifiListTitle")}
                        </CardTitle>
                        <CardDescription>
                            {t("attendanceMethodSettingsTabWifiListDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder={t(
                                    "attendanceMethodSettingsTabWifiSsidPlaceholder",
                                )}
                                value={wifiSsid}
                                onChange={(e) =>
                                    setWifiSsid(e.target.value)
                                }
                                className="flex-1"
                            />
                            <Input
                                placeholder={t(
                                    "attendanceMethodSettingsTabWifiBssidPlaceholder",
                                )}
                                value={wifiBssid}
                                onChange={(e) =>
                                    setWifiBssid(e.target.value)
                                }
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                onClick={() =>
                                    addWifiMutation.mutate()
                                }
                                disabled={
                                    !wifiSsid.trim() ||
                                    addWifiMutation.isPending
                                }
                                size="sm"
                            >
                                <Plus className="mr-1 h-4 w-4" />
                                {t("attendanceMethodSettingsTabAdd")}
                            </Button>
                        </div>

                        {wifiList.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                {t("attendanceMethodSettingsTabWifiEmpty")}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {wifiList.map((wifi) => (
                                    <div
                                        key={wifi.id}
                                        className="flex items-center justify-between rounded-lg border px-4 py-3"
                                    >
                                        <div>
                                            <p className="font-medium text-sm">
                                                {wifi.ssid}
                                            </p>
                                            {wifi.bssid && (
                                                <p className="text-xs text-muted-foreground">
                                                    {t("attendanceMethodSettingsTabBssidLabel")} {" "}
                                                    {wifi.bssid}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                removeWifiMutation.mutate(
                                                    wifi.id,
                                                )
                                            }
                                            disabled={
                                                removeWifiMutation.isPending
                                            }
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 flex justify-end">
                    <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                    >
                        {saveMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t("attendanceMethodSettingsTabSave")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

