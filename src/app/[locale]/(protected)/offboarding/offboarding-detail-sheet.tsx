"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Package, FileText, DollarSign, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
    getOffboardingById,
    updateChecklistItem,
    updateOffboardingAsset,
    saveExitInterview,
    calculateFinalSettlement,
    addChecklistItem,
} from "./actions";
import type { OffboardingListItem } from "./types";
import {
    OFFBOARDING_STATUS_LABELS,
    OFFBOARDING_STATUS_COLORS,
    CHECKLIST_CATEGORY_LABELS,
    CHECKLIST_CATEGORY_COLORS,
    ASSET_STATUS_LABELS,
    REASON_OPTIONS,
} from "./types";
import { useTimezone } from "@/hooks/use-timezone";

interface OffboardingDetailSheetProps {
    offboarding: OffboardingListItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canManage: boolean;
    onComplete: (id: string) => void;
}

export function OffboardingDetailSheet({
    offboarding,
    open,
    onOpenChange,
    canManage,
    onComplete,
}: OffboardingDetailSheetProps) {
    const queryClient = useQueryClient();
    const t = useTranslations("ProtectedPages");
    const { formatDate, formatDateTime } = useTimezone();

    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [exitInterviewContent, setExitInterviewContent] = useState<string | null>(null);
    const [settlementData, setSettlementData] = useState<{
        finalSalary: number;
        unusedLeaveDays: number;
        unusedLeaveAmount: number;
        severancePay: number;
        otherAllowances: number;
    } | null>(null);

    // Fetch detailed offboarding data
    const { data: detail, isLoading } = useQuery({
        queryKey: ["offboarding", offboarding?.id],
        queryFn: () => getOffboardingById(offboarding!.id),
        enabled: !!offboarding?.id && open,
    });

    const resolvedExitInterviewContent = exitInterviewContent ?? detail?.exitInterview ?? "";
    const resolvedSettlementData =
        settlementData ??
        {
            finalSalary: detail?.finalSalary || 0,
            unusedLeaveDays: detail?.unusedLeaveDays || 0,
            unusedLeaveAmount: detail?.unusedLeaveAmount || 0,
            severancePay: detail?.severancePay || 0,
            otherAllowances: detail?.otherAllowances || 0,
        };

    // Mutations
    const checklistMutation = useMutation({
        mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
            updateChecklistItem(id, { isCompleted }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastChecklistUpdated"));
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
        },
    });

    const assetMutation = useMutation({
        mutationFn: ({ id, status, condition }: { id: string; status: string; condition?: string }) =>
            updateOffboardingAsset(id, { status, condition }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastAssetsUpdated"));
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
        },
    });

    const exitInterviewMutation = useMutation({
        mutationFn: (exitInterview: string) =>
            saveExitInterview(offboarding!.id, { exitInterview }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastInterviewSaved"));
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
        },
    });

    const settlementMutation = useMutation({
        mutationFn: () =>
            calculateFinalSettlement(offboarding!.id, resolvedSettlementData),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastSettlementSaved"));
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
        },
    });

    const addChecklistMutation = useMutation({
        mutationFn: (taskTitle: string) =>
            addChecklistItem(offboarding!.id, { taskTitle }),
        onSuccess: () => {
            toast.success(t("offboardingDetailToastTaskAdded"));
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
            setNewChecklistItem("");
        },
    });

    if (!offboarding) return null;

    const reasonLabel =
        REASON_OPTIONS.find((r) => r.value === offboarding.reason)?.label ||
        offboarding.reason ||
        t("offboardingDetailUnknownReason");

    const completedCount = detail?.checklist.filter((c) => c.isCompleted).length || 0;
    const totalCount = detail?.checklist.length || 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{t("offboardingDetailTitle")}</SheetTitle>
                    <SheetDescription>
                        {t("offboardingDetailDescription", { name: offboarding.user.name })}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : detail ? (
                    <div className="mt-6 space-y-6">
                        {/* Employee Info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={detail.user.image || undefined} />
                                            <AvatarFallback>
                                                {detail.user.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{detail.user.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {detail.user.employeeCode || detail.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={OFFBOARDING_STATUS_COLORS[detail.status as keyof typeof OFFBOARDING_STATUS_COLORS]}>
                                        {OFFBOARDING_STATUS_LABELS[detail.status as keyof typeof OFFBOARDING_STATUS_LABELS]}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{t("offboardingDetailResignDate")}:</span>{" "}
                                    <span className="font-medium">{formatDate(detail.resignDate, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{t("offboardingDetailLastWorkDate")}:</span>{" "}
                                    <span className="font-medium">{formatDate(detail.lastWorkDate, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">{t("offboardingDetailReason")}:</span>{" "}
                                    <span className="font-medium">{reasonLabel}</span>
                                </div>
                                {detail.reasonDetail && (
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">{t("offboardingDetailReasonDetail")}:</span>{" "}
                                        <p className="mt-1">{detail.reasonDetail}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Progress */}
                        {detail.status === "PROCESSING" && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">{t("offboardingDetailProgressTitle")}</CardTitle>
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

                        {/* Tabs */}
                        <Tabs defaultValue="checklist">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="checklist">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {t("offboardingDetailChecklistLabel")}
                                </TabsTrigger>
                                <TabsTrigger value="assets">
                                    <Package className="h-4 w-4 mr-2" />
                                    {t("offboardingDetailAssetsTab")}
                                </TabsTrigger>
                                <TabsTrigger value="settlement">
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    {t("offboardingDetailSettlementTab")}
                                </TabsTrigger>
                                <TabsTrigger value="interview">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {t("offboardingDetailInterviewTab")}
                                </TabsTrigger>
                            </TabsList>

                            {/* Checklist Tab */}
                            <TabsContent value="checklist" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm">{t("offboardingDetailChecklistSectionTitle")}</CardTitle>
                                            {canManage && (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder={t("offboardingDetailAddTaskPlaceholder")}
                                                        value={newChecklistItem}
                                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addChecklistMutation.mutate(newChecklistItem)}
                                                        disabled={!newChecklistItem || addChecklistMutation.isPending}
                                                    >
                                                        {t("offboardingDetailAddTaskButton")}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {detail.checklist.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50"
                                                >
                                                    <Checkbox
                                                        checked={item.isCompleted}
                                                        onCheckedChange={(checked) =>
                                                            canManage &&
                                                            checklistMutation.mutate({
                                                                id: item.id,
                                                                isCompleted: checked as boolean,
                                                            })
                                                        }
                                                        disabled={!canManage}
                                                    />
                                                    <div className="flex-1">
                                                        <div className={`${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                                            {item.taskTitle}
                                                        </div>
                                                        {item.taskDescription && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {item.taskDescription}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge
                                                                variant="outline"
                                                                className={CHECKLIST_CATEGORY_COLORS[item.category as keyof typeof CHECKLIST_CATEGORY_COLORS]}
                                                            >
                                                                {CHECKLIST_CATEGORY_LABELS[item.category as keyof typeof CHECKLIST_CATEGORY_LABELS]}
                                                            </Badge>
                                                            {item.dueDate && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {t("offboardingDetailDueLabel")}: {formatDate(item.dueDate, { day: "2-digit", month: "2-digit" })}
                                                                </span>
                                                            )}
                                                            {item.isCompleted && item.completedAt && (
                                                                <span className="text-xs text-green-600">
                                                                    ✓ {t("offboardingDetailCompletedLabel")}: {formatDateTime(item.completedAt, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {detail.checklist.length === 0 && (
                                                <div className="text-center text-muted-foreground py-4">
                                                    {t("offboardingDetailChecklistEmpty")}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Assets Tab */}
                            <TabsContent value="assets" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">{t("offboardingDetailAssetsSectionTitle")}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {detail.assets.map((asset) => (
                                                <div
                                                    key={asset.id}
                                                    className="flex items-center justify-between p-3 border rounded-md"
                                                >
                                                    <div>
                                                        <div className="font-medium">{asset.assetName}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {asset.assetCode} • {asset.category}
                                                        </div>
                                                    </div>
                                                    {canManage && asset.status === "PENDING" ? (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    assetMutation.mutate({
                                                                        id: asset.id,
                                                                        status: "RETURNED",
                                                                        condition: "GOOD",
                                                                    })
                                                                }
                                                            >
                                                                {t("offboardingDetailAssetReturned")}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    assetMutation.mutate({
                                                                        id: asset.id,
                                                                        status: "DAMAGED",
                                                                    })
                                                                }
                                                            >
                                                                {t("offboardingDetailAssetDamaged")}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant={
                                                                asset.status === "RETURNED"
                                                                    ? "default"
                                                                    : asset.status === "DAMAGED"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                            }
                                                        >
                                                            {ASSET_STATUS_LABELS[asset.status as keyof typeof ASSET_STATUS_LABELS]}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                            {detail.assets.length === 0 && (
                                                <div className="text-center text-muted-foreground py-4">
                                                    {t("offboardingDetailAssetsEmpty")}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Settlement Tab */}
                            <TabsContent value="settlement" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">{t("offboardingDetailSettlementSectionTitle")}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-muted-foreground">{t("offboardingDetailFinalSalary")}</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={resolvedSettlementData.finalSalary}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...resolvedSettlementData,
                                                            finalSalary: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground">{t("offboardingDetailUnusedLeaveDays")}</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={resolvedSettlementData.unusedLeaveDays}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...resolvedSettlementData,
                                                            unusedLeaveDays: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground">{t("offboardingDetailUnusedLeaveAmount")}</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={resolvedSettlementData.unusedLeaveAmount}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...resolvedSettlementData,
                                                            unusedLeaveAmount: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground">{t("offboardingDetailSeverancePay")}</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={resolvedSettlementData.severancePay}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...resolvedSettlementData,
                                                            severancePay: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-sm text-muted-foreground">{t("offboardingDetailOtherAllowances")}</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={resolvedSettlementData.otherAllowances}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...resolvedSettlementData,
                                                            otherAllowances: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{t("offboardingDetailNetTotal")}:</span>
                                            <span className="text-xl font-bold text-green-600">
                                                {new Intl.NumberFormat("vi-VN", {
                                                    style: "currency",
                                                    currency: "VND",
                                                }).format(
                                                    resolvedSettlementData.finalSalary +
                                                        resolvedSettlementData.unusedLeaveAmount +
                                                        resolvedSettlementData.severancePay +
                                                        resolvedSettlementData.otherAllowances
                                                )}
                                            </span>
                                        </div>

                                        {canManage && (
                                            <Button
                                                className="w-full"
                                                onClick={() => settlementMutation.mutate()}
                                                disabled={settlementMutation.isPending}
                                            >
                                                {settlementMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                {t("offboardingDetailSaveSettlement")}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Exit Interview Tab */}
                            <TabsContent value="interview" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">{t("offboardingDetailInterviewSectionTitle")}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Textarea
                                            placeholder={t("offboardingDetailInterviewPlaceholder")}
                                            rows={8}
                                            value={resolvedExitInterviewContent}
                                            onChange={(e) => setExitInterviewContent(e.target.value)}
                                            disabled={!canManage}
                                        />
                                        {canManage && (
                                            <Button
                                                className="w-full"
                                                onClick={() => exitInterviewMutation.mutate(resolvedExitInterviewContent)}
                                                disabled={exitInterviewMutation.isPending}
                                            >
                                                {exitInterviewMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                {t("offboardingDetailSaveInterview")}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Actions */}
                        {canManage && detail.status === "PROCESSING" && (
                            <div className="flex gap-2 pt-4">
                                <Button
                                    className="flex-1"
                                    onClick={() => onComplete(detail.id)}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {t("offboardingDetailCompleteProcess")}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
