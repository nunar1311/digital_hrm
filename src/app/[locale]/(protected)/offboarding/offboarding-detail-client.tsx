"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    CheckCircle,
    Package,
    FileText,
    DollarSign,
    MessageSquare,
    Calendar,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
    getOffboardingById,
    updateChecklistItem,
    updateOffboardingAsset,
    saveExitInterview,
    calculateFinalSettlement,
    addChecklistItem,
    updateOffboarding,
} from "./actions";
import type { OffboardingDetailData } from "./types";
import {
    OFFBOARDING_STATUS_LABELS,
    OFFBOARDING_STATUS_COLORS,
    CHECKLIST_CATEGORY_LABELS,
    CHECKLIST_CATEGORY_COLORS,
    ASSET_STATUS_LABELS,
    REASON_OPTIONS,
} from "./types";
import { useTimezone } from "@/hooks/use-timezone";

interface OffboardingDetailClientProps {
    initialDetail: OffboardingDetailData;
    canManage: boolean;
}

export function OffboardingDetailClient({
    initialDetail,
    canManage,
}: OffboardingDetailClientProps) {
    const t = useTranslations("ProtectedPages");
    const queryClient = useQueryClient();
    const router = useRouter();
    const { formatDate, formatDateTime } = useTimezone();

    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [exitInterviewContent, setExitInterviewContent] = useState(
        initialDetail.exitInterview || "",
    );
    const [settlementData, setSettlementData] = useState({
        finalSalary: initialDetail.finalSalary || 0,
        unusedLeaveDays: initialDetail.unusedLeaveDays || 0,
        unusedLeaveAmount: initialDetail.unusedLeaveAmount || 0,
        severancePay: initialDetail.severancePay || 0,
        otherAllowances: initialDetail.otherAllowances || 0,
    });

    // Fetch detailed offboarding data for updates
    const { data: detailData } = useQuery({
        queryKey: ["offboarding", initialDetail.id],
        queryFn: () => getOffboardingById(initialDetail.id),
        initialData: initialDetail,
    });

    const detail = detailData || initialDetail;

    // Mutations
    const checklistMutation = useMutation({
        mutationFn: ({
            id,
            isCompleted,
        }: {
            id: string;
            isCompleted: boolean;
        }) => updateChecklistItem(id, { isCompleted }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastChecklistUpdated"));
            queryClient.invalidateQueries({
                queryKey: ["offboarding", detail.id],
            });
        },
    });

    const assetMutation = useMutation({
        mutationFn: ({
            id,
            status,
            condition,
        }: {
            id: string;
            status: string;
            condition?: string;
        }) => updateOffboardingAsset(id, { status, condition }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastAssetsUpdated"));
            queryClient.invalidateQueries({
                queryKey: ["offboarding", detail.id],
            });
        },
    });

    const exitInterviewMutation = useMutation({
        mutationFn: (exitInterview: string) =>
            saveExitInterview(detail.id, { exitInterview }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastInterviewSaved"));
            queryClient.invalidateQueries({
                queryKey: ["offboarding", detail.id],
            });
        },
    });

    const settlementMutation = useMutation({
        mutationFn: () =>
            calculateFinalSettlement(detail.id, settlementData),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastSettlementSaved"));
            queryClient.invalidateQueries({
                queryKey: ["offboarding", detail.id],
            });
        },
    });

    const addChecklistMutation = useMutation({
        mutationFn: (taskTitle: string) =>
            addChecklistItem(detail.id, { taskTitle }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastTaskAdded"));
            queryClient.invalidateQueries({
                queryKey: ["offboarding", detail.id],
            });
            setNewChecklistItem("");
        },
    });

    const completeMutation = useMutation({
        mutationFn: () => updateOffboarding(detail.id, { status: "COMPLETED" }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastCompleted"));
            queryClient.invalidateQueries({
                queryKey: ["offboarding", detail.id],
            });
            queryClient.invalidateQueries({ queryKey: ["offboardings"] });
        },
    });

    const reasonLabel =
        REASON_OPTIONS.find((r) => r.value === detail.reason)?.label ||
        detail.reason ||
        t("offboardingDetailUnknownReason");

    const completedCount =
        detail.checklist.filter((c) => c.isCompleted).length || 0;
    const totalCount = detail.checklist.length || 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {t("offboardingDetailMetadataTitle")}
                        </h1>
                        <p className="text-muted-foreground">
                            {t("offboardingDetailDescription", {
                                name: detail.user.name,
                            })}
                        </p>
                    </div>
                </div>
                {canManage && detail.status === "PROCESSING" && (
                    <Button onClick={() => completeMutation.mutate()}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t("offboardingDetailCompleteProcess")}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    {/* Employee Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage
                                            src={
                                                detail.user.image || undefined
                                            }
                                        />
                                        <AvatarFallback>
                                            {detail.user.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">
                                            {detail.user.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {detail.user.employeeCode ||
                                                detail.user.email}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    className={
                                        OFFBOARDING_STATUS_COLORS[
                                            detail.status as keyof typeof OFFBOARDING_STATUS_COLORS
                                        ]
                                    }
                                >
                                    {
                                        OFFBOARDING_STATUS_LABELS[
                                            detail.status as keyof typeof OFFBOARDING_STATUS_LABELS
                                        ]
                                    }
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t("offboardingDetailResignDate")}:
                                </span>{" "}
                                <span className="font-medium">
                                    {formatDate(detail.resignDate, {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t("offboardingDetailLastWorkDate")}:
                                </span>{" "}
                                <span className="font-medium">
                                    {formatDate(detail.lastWorkDate, {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <Separator />
                            <div>
                                <span className="text-muted-foreground">
                                    {t("offboardingDetailReason")}:
                                </span>{" "}
                                <span className="font-medium">
                                    {reasonLabel}
                                </span>
                            </div>
                            {detail.reasonDetail && (
                                <div>
                                    <span className="text-muted-foreground">
                                        {t("offboardingDetailReasonDetail")}:
                                    </span>{" "}
                                    <p className="mt-1 text-sm text-muted-foreground border-l-2 pl-3 italic">
                                        {detail.reasonDetail}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Progress */}
                    {detail.status === "PROCESSING" && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    {t("offboardingDetailProgressTitle")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">
                                        {t("offboardingDetailChecklistLabel")}
                                    </span>
                                    <span className="text-sm font-medium">
                                        {completedCount}/{totalCount}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="md:col-span-2">
                    {/* Tabs */}
                    <Tabs defaultValue="checklist" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="checklist">
                                <FileText className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">
                                    Checklist
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="assets">
                                <Package className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">
                                    {t("offboardingDetailAssetsTab")}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="settlement">
                                <DollarSign className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">
                                    {t("offboardingDetailSettlementTab")}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="interview">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">
                                    {t("offboardingDetailInterviewTab")}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Checklist Tab */}
                        <TabsContent value="checklist" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                                            {t("offboardingDetailChecklistSectionTitle")}
                                        </CardTitle>
                                        {canManage && (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder={t("offboardingDetailAddTaskPlaceholder")}
                                                    value={newChecklistItem}
                                                    onChange={(e) =>
                                                        setNewChecklistItem(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="flex h-8 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        addChecklistMutation.mutate(
                                                            newChecklistItem,
                                                        )
                                                    }
                                                    disabled={
                                                        !newChecklistItem ||
                                                        addChecklistMutation.isPending
                                                    }
                                                >
                                                    {t("offboardingDetailAddTaskButton")}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {detail.checklist.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <Checkbox
                                                    checked={item.isCompleted}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        canManage &&
                                                        checklistMutation.mutate(
                                                            {
                                                                id: item.id,
                                                                isCompleted:
                                                                    checked as boolean,
                                                            },
                                                        )
                                                    }
                                                    disabled={!canManage}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 space-y-1">
                                                    <div
                                                        className={`font-medium ${
                                                            item.isCompleted
                                                                ? "line-through text-muted-foreground"
                                                                : ""
                                                        }`}
                                                    >
                                                        {item.taskTitle}
                                                    </div>
                                                    {item.taskDescription && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {
                                                                item.taskDescription
                                                            }
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                CHECKLIST_CATEGORY_COLORS[
                                                                    item.category as keyof typeof CHECKLIST_CATEGORY_COLORS
                                                                ]
                                                            }
                                                        >
                                                            {
                                                                CHECKLIST_CATEGORY_LABELS[
                                                                    item.category as keyof typeof CHECKLIST_CATEGORY_LABELS
                                                                ]
                                                            }
                                                        </Badge>
                                                        {item.dueDate && (
                                                            <div className="flex items-center text-xs text-muted-foreground">
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {t("offboardingDetailDueLabel")}:{" "}
                                                                {formatDate(
                                                                    item.dueDate,
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "2-digit",
                                                                    },
                                                                )}
                                                            </div>
                                                        )}
                                                        {item.isCompleted &&
                                                            item.completedAt && (
                                                                <div className="text-xs text-green-600 flex items-center">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    {t("offboardingDetailCompletedLabel")}:{" "}
                                                                    {formatDateTime(
                                                                        item.completedAt,
                                                                        {
                                                                            day: "2-digit",
                                                                            month: "2-digit",
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        },
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {detail.checklist.length === 0 && (
                                            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                                                {t("offboardingDetailChecklistEmpty")}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Assets Tab */}
                        <TabsContent value="assets" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                                        {t("offboardingDetailAssetsSectionTitle")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4">
                                        {detail.assets.map((asset) => (
                                            <div
                                                key={asset.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                                            >
                                                <div>
                                                    <div className="font-semibold">
                                                        {asset.assetName}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex gap-2">
                                                        <span>
                                                            {t("offboardingDetailAssetCodeLabel")}:{" "}
                                                            {asset.assetCode}
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {t("offboardingDetailAssetTypeLabel")}:{" "}
                                                            {asset.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {canManage &&
                                                    asset.status ===
                                                        "PENDING" ? (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={() =>
                                                                    assetMutation.mutate(
                                                                        {
                                                                            id: asset.id,
                                                                            status: "RETURNED",
                                                                            condition:
                                                                                "GOOD",
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                {t("offboardingDetailAssetReturned")}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() =>
                                                                    assetMutation.mutate(
                                                                        {
                                                                            id: asset.id,
                                                                            status: "DAMAGED",
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                {t("offboardingDetailAssetDamaged")}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant={
                                                                asset.status ===
                                                                "RETURNED"
                                                                    ? "default"
                                                                    : asset.status ===
                                                                      "DAMAGED"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                            }
                                                        >
                                                            {
                                                                ASSET_STATUS_LABELS[
                                                                    asset.status as keyof typeof ASSET_STATUS_LABELS
                                                                ]
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {detail.assets.length === 0 && (
                                            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                                                {t("offboardingDetailAssetsEmpty")}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Settlement Tab */}
                        <TabsContent value="settlement" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                                            {t("offboardingDetailSettlementSectionTitle")}
                                        </CardTitle>
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    settlementMutation.mutate()
                                                }
                                                disabled={
                                                    settlementMutation.isPending
                                                }
                                            >
                                                {settlementMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                {t("offboardingDetailSaveChanges")}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {t("offboardingDetailFinalSalary")}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                                                    value={
                                                        settlementData.finalSalary
                                                    }
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            finalSalary: Number(
                                                                e.target.value,
                                                            ),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {t("offboardingDetailSeverancePay")}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                                                    value={
                                                        settlementData.severancePay
                                                    }
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            severancePay:
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {t("offboardingDetailUnusedLeaveDays")}
                                            </label>
                                            <input
                                                type="number"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                                                value={
                                                    settlementData.unusedLeaveDays
                                                }
                                                onChange={(e) =>
                                                    setSettlementData({
                                                        ...settlementData,
                                                        unusedLeaveDays: Number(
                                                            e.target.value,
                                                        ),
                                                    })
                                                }
                                                disabled={!canManage}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {t("offboardingDetailUnusedLeaveAmount")}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                                                    value={
                                                        settlementData.unusedLeaveAmount
                                                    }
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            unusedLeaveAmount:
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <label className="text-sm font-medium">
                                                {t("offboardingDetailOtherAdjustments")}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                                                    value={
                                                        settlementData.otherAllowances
                                                    }
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            otherAllowances:
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {t("offboardingDetailNetTotal")}:
                                            </span>
                                            <div className="text-2xl font-bold text-green-600">
                                                {new Intl.NumberFormat(
                                                    "vi-VN",
                                                    {
                                                        style: "currency",
                                                        currency: "VND",
                                                    },
                                                ).format(
                                                    settlementData.finalSalary +
                                                        settlementData.unusedLeaveAmount +
                                                        settlementData.severancePay +
                                                        settlementData.otherAllowances,
                                                )}
                                            </div>
                                        </div>
                                        <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Exit Interview Tab */}
                        <TabsContent value="interview" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                                            {t("offboardingDetailInterviewSectionTitle")}
                                        </CardTitle>
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    exitInterviewMutation.mutate(
                                                        exitInterviewContent,
                                                    )
                                                }
                                                disabled={
                                                    exitInterviewMutation.isPending
                                                }
                                            >
                                                {exitInterviewMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                {t("offboardingDetailSaveContent")}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder={t("offboardingDetailInterviewPlaceholder")}
                                        rows={12}
                                        value={exitInterviewContent}
                                        onChange={(e) =>
                                            setExitInterviewContent(
                                                e.target.value,
                                            )
                                        }
                                        className="resize-none"
                                        disabled={!canManage}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
