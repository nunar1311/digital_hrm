"use client";

import { useState } from "react";
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
} from "@/app/(protected)/attendance/actions";
import type { AttendanceConfig } from "@/app/(protected)/attendance/types";

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

const methodSchema = z.object({
    requireGps: z.boolean(),
    requireWifi: z.boolean(),
    requireSelfie: z.boolean(),
    maxGpsDistanceMeters: z
        .number()
        .min(10, "Tối thiểu 10m")
        .max(5000, "Tối đa 5000m"),
    officeLat: z.number().nullable(),
    officeLng: z.number().nullable(),
});

type MethodFormValues = z.infer<typeof methodSchema>;

interface Props {
    config: AttendanceConfig | null;
    queryClient: ReturnType<typeof useQueryClient>;
}

export function MethodSettingsTab({ config, queryClient }: Props) {
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
            queryClient.setQueryData(["attendance", "config"], (old: any) => {
                if (!old) return old;
                return { ...old, ...values };
            });
            return {};
        },
        onSuccess: () => {
            toast.success("Đã lưu phương thức chấm công");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
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
                throw new Error("Chưa có cấu hình, hãy lưu cài đặt trước");
            return addWifiWhitelist(config.id, wifiSsid, wifiBssid || undefined);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "config"] });
            const optimisticWifi = {
                id: `optimistic-${Date.now()}`,
                configId: config?.id || "",
                ssid: wifiSsid,
                bssid: wifiBssid || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            queryClient.setQueryData(["attendance", "config"], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    wifiWhitelist: [...(old.wifiWhitelist || []), optimisticWifi],
                };
            });
            return {};
        },
        onSuccess: () => {
            toast.success("Đã thêm WiFi");
            setWifiSsid("");
            setWifiBssid("");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
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
            queryClient.setQueryData(["attendance", "config"], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    wifiWhitelist: (old.wifiWhitelist || []).filter((w: any) => w.id !== id),
                };
            });
            return {};
        },
        onSuccess: () => {
            toast.success("Đã xoá WiFi");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
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
                            Yêu cầu chấm công
                        </CardTitle>
                        <CardDescription>
                            Bật/tắt các phương thức xác minh khi chấm
                            công
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
                                                Yêu cầu GPS
                                            </FormLabel>
                                            <FormDescription>
                                                Nhân viên phải ở gần
                                                văn phòng
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
                                                Yêu cầu WiFi
                                            </FormLabel>
                                            <FormDescription>
                                                Phải kết nối WiFi văn
                                                phòng
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
                                                Yêu cầu chụp ảnh
                                            </FormLabel>
                                            <FormDescription>
                                                Chụp ảnh selfie khi
                                                chấm công
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
                            Vị trí văn phòng
                        </CardTitle>
                        <CardDescription>
                            Toạ độ GPS và khoảng cách cho phép chấm
                            công
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
                                            Vĩ độ (Lat)
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
                                            Kinh độ (Lng)
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
                                        Khoảng cách cho phép (mét)
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
                                        Nhân viên cách văn phòng tối
                                        đa {field.value}m mới được
                                        chấm công
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
                            Danh sách WiFi được phép
                        </CardTitle>
                        <CardDescription>
                            Thêm mạng WiFi văn phòng. Nhân viên cần
                            kết nối vào một trong các mạng này để chấm
                            công hợp lệ.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Tên WiFi (SSID)"
                                value={wifiSsid}
                                onChange={(e) =>
                                    setWifiSsid(e.target.value)
                                }
                                className="flex-1"
                            />
                            <Input
                                placeholder="BSSID (tuỳ chọn)"
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
                                Thêm
                            </Button>
                        </div>

                        {wifiList.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                Chưa có WiFi nào được thêm
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
                                                    BSSID:{" "}
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
                        Lưu phương thức chấm công
                    </Button>
                </div>
            </form>
        </Form>
    );
}
