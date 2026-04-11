"use client";

import { useState, useEffect } from "react";
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
import { Loader2, CheckCircle, XCircle, Package, FileText, DollarSign, MessageSquare, Calendar, User, Building } from "lucide-react";
import { toast } from "sonner";
import {
    getOffboardingById,
    updateChecklistItem,
    updateOffboardingAsset,
    saveExitInterview,
    calculateFinalSettlement,
    addChecklistItem,
} from "./actions";
import type { OffboardingListItem, ChecklistItem, OffboardingAsset } from "./types";
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
    const { formatDate, formatDateTime, timezone } = useTimezone();

    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [exitInterviewContent, setExitInterviewContent] = useState("");
    const [settlementData, setSettlementData] = useState({
        finalSalary: 0,
        unusedLeaveDays: 0,
        unusedLeaveAmount: 0,
        severancePay: 0,
        otherAllowances: 0,
    });

    // Fetch detailed offboarding data
    const { data: detail, isLoading } = useQuery({
        queryKey: ["offboarding", offboarding?.id],
        queryFn: () => getOffboardingById(offboarding!.id),
        enabled: !!offboarding?.id && open,
    });

    // Update local state when detail loads
    useEffect(() => {
        if (detail) {
            setExitInterviewContent(detail.exitInterview || "");
            setSettlementData({
                finalSalary: detail.finalSalary || 0,
                unusedLeaveDays: detail.unusedLeaveDays || 0,
                unusedLeaveAmount: detail.unusedLeaveAmount || 0,
                severancePay: detail.severancePay || 0,
                otherAllowances: detail.otherAllowances || 0,
            });
        }
    }, [detail]);

    // Mutations
    const checklistMutation = useMutation({
        mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
            updateChecklistItem(id, { isCompleted }),
        onSuccess: () => {
            toast.success("Đã cập nhật checklist");
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
        },
    });

    const assetMutation = useMutation({
        mutationFn: ({ id, status, condition }: { id: string; status: string; condition?: string }) =>
            updateOffboardingAsset(id, { status, condition }),
        onSuccess: () => {
            toast.success("Đã cập nhật tài sản");
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
        },
    });

    const exitInterviewMutation = useMutation({
        mutationFn: (exitInterview: string) =>
            saveExitInterview(offboarding!.id, { exitInterview }),
        onSuccess: () => {
            toast.success("Đã lưu exit interview");
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
        },
    });

    const settlementMutation = useMutation({
        mutationFn: () =>
            calculateFinalSettlement(offboarding!.id, settlementData),
        onSuccess: () => {
            toast.success("Đã lưu quyết toán");
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
        },
    });

    const addChecklistMutation = useMutation({
        mutationFn: (taskTitle: string) =>
            addChecklistItem(offboarding!.id, { taskTitle }),
        onSuccess: () => {
            toast.success("Đã thêm công việc");
            queryClient.invalidateQueries({ queryKey: ["offboarding", offboarding?.id] });
            setNewChecklistItem("");
        },
    });

    if (!offboarding) return null;

    const reasonLabel = REASON_OPTIONS.find((r) => r.value === offboarding.reason)?.label || offboarding.reason || "Không xác định";

    const completedCount = detail?.checklist.filter((c) => c.isCompleted).length || 0;
    const totalCount = detail?.checklist.length || 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Chi tiết offboarding</SheetTitle>
                    <SheetDescription>
                        Quy trình nghỉ việc của {offboarding.user.name}
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
                                                {detail.user.username || detail.user.email}
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
                                    <span className="text-muted-foreground">Ngày nghỉ:</span>{" "}
                                    <span className="font-medium">{formatDate(detail.resignDate, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Ngày làm cuối:</span>{" "}
                                    <span className="font-medium">{formatDate(detail.lastWorkDate, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Lý do:</span>{" "}
                                    <span className="font-medium">{reasonLabel}</span>
                                </div>
                                {detail.reasonDetail && (
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">Chi tiết:</span>{" "}
                                        <p className="mt-1">{detail.reasonDetail}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Progress */}
                        {detail.status === "PROCESSING" && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Tiến độ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">
                                            Hoàn thành checklist
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
                                    Checklist
                                </TabsTrigger>
                                <TabsTrigger value="assets">
                                    <Package className="h-4 w-4 mr-2" />
                                    Tài sản
                                </TabsTrigger>
                                <TabsTrigger value="settlement">
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Quyết toán
                                </TabsTrigger>
                                <TabsTrigger value="interview">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Exit Interview
                                </TabsTrigger>
                            </TabsList>

                            {/* Checklist Tab */}
                            <TabsContent value="checklist" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm">Công việc cần hoàn thành</CardTitle>
                                            {canManage && (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Thêm công việc..."
                                                        value={newChecklistItem}
                                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addChecklistMutation.mutate(newChecklistItem)}
                                                        disabled={!newChecklistItem || addChecklistMutation.isPending}
                                                    >
                                                        Thêm
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
                                                                    Hạn: {formatDate(item.dueDate, { day: "2-digit", month: "2-digit" })}
                                                                </span>
                                                            )}
                                                            {item.isCompleted && item.completedAt && (
                                                                <span className="text-xs text-green-600">
                                                                    ✓ Hoàn thành: {formatDateTime(item.completedAt, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {detail.checklist.length === 0 && (
                                                <div className="text-center text-muted-foreground py-4">
                                                    Chưa có công việc nào
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
                                        <CardTitle className="text-sm">Tài sản cần thu hồi</CardTitle>
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
                                                                Đã trả
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
                                                                Hư hỏng
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
                                                    Không có tài sản nào
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
                                        <CardTitle className="text-sm">Quyết toán cuối kỳ</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-muted-foreground">Lương cuối tháng</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={settlementData.finalSalary}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            finalSalary: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground">Ngày phép chưa dùng</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={settlementData.unusedLeaveDays}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            unusedLeaveDays: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground">Tiền phép chưa dùng</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={settlementData.unusedLeaveAmount}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            unusedLeaveAmount: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground">Trợ cấp thôi việc</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={settlementData.severancePay}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            severancePay: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-sm text-muted-foreground">Các khoản khác</label>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={settlementData.otherAllowances}
                                                    onChange={(e) =>
                                                        setSettlementData({
                                                            ...settlementData,
                                                            otherAllowances: Number(e.target.value),
                                                        })
                                                    }
                                                    disabled={!canManage}
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Tổng thanh toán:</span>
                                            <span className="text-xl font-bold text-green-600">
                                                {new Intl.NumberFormat("vi-VN", {
                                                    style: "currency",
                                                    currency: "VND",
                                                }).format(
                                                    settlementData.finalSalary +
                                                        settlementData.unusedLeaveAmount +
                                                        settlementData.severancePay +
                                                        settlementData.otherAllowances
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
                                                Lưu quyết toán
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Exit Interview Tab */}
                            <TabsContent value="interview" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Exit Interview</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Textarea
                                            placeholder="Nhập nội dung exit interview..."
                                            rows={8}
                                            value={exitInterviewContent}
                                            onChange={(e) => setExitInterviewContent(e.target.value)}
                                            disabled={!canManage}
                                        />
                                        {canManage && (
                                            <Button
                                                className="w-full"
                                                onClick={() => exitInterviewMutation.mutate(exitInterviewContent)}
                                                disabled={exitInterviewMutation.isPending}
                                            >
                                                {exitInterviewMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                Lưu exit interview
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
                                    Hoàn thành quy trình
                                </Button>
                            </div>
                        )}
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
