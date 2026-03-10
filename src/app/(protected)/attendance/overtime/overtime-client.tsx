"use client";

import { useState } from "react";
import {
    Plus,
    Clock,
    AlertCircle,
    ShieldCheck,
    Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import type { OvertimeRequest, OvertimeRequestsPage } from "../types";
import { useOvertimeData } from "./use-overtime-data";
import { OvertimeTable } from "./overtime-table";
import { CreateOvertimeDialog } from "./create-overtime-dialog";
import { ApproveOvertimeDialog } from "./approve-overtime-dialog";
import { RejectOvertimeDialog } from "./reject-overtime-dialog";
import { ConfirmOvertimeDialog } from "./confirm-overtime-dialog";
import type { CreateOvertimeValues } from "./overtime-schemas";

interface OvertimeClientProps {
    initialData: {
        my: OvertimeRequestsPage;
        pending: OvertimeRequestsPage;
        managerApproved: OvertimeRequestsPage;
        hrApproved: OvertimeRequestsPage;
        all: OvertimeRequestsPage;
    };
    canManagerApprove: boolean;
    canHrReview: boolean;
    currentUserId: string;
}

export function OvertimeClient({
    initialData,
    canManagerApprove,
    canHrReview,
    currentUserId,
}: OvertimeClientProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [approveDialog, setApproveDialog] = useState<{
        id: string;
        step: "MANAGER" | "HR";
    } | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{
        id: string;
        step: "MANAGER" | "HR";
    } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        id: string;
        startTime: string;
        endTime: string;
    } | null>(null);

    const canViewAll = canManagerApprove || canHrReview;

    const {
        myReqs,
        pendingReqs,
        mgrApprovedReqs,
        hrApprovedReqs,
        allReqs,
        myQuery,
        pendingQuery,
        mgrApprovedQuery,
        hrApprovedQuery,
        allQuery,
        createMutation,
        managerApproveMutation,
        hrReviewMutation,
        confirmMutation,
        cancelMutation,
        isPending,
    } = useOvertimeData({
        currentUserId,
        canManagerApprove,
        canHrReview,
        initialData,
    });

    // ─── Handlers ───

    const handleCreate = (values: CreateOvertimeValues) => {
        createMutation.mutate(values, {
            onSuccess: () => setIsCreateOpen(false),
        });
    };

    const handleApprove = (note?: string) => {
        if (!approveDialog) return;
        const { id, step } = approveDialog;
        const mutation =
            step === "MANAGER"
                ? managerApproveMutation
                : hrReviewMutation;
        mutation.mutate(
            { id, action: "APPROVE", note },
            { onSuccess: () => setApproveDialog(null) },
        );
    };

    const handleReject = (reason?: string) => {
        if (!rejectDialog) return;
        const { id, step } = rejectDialog;
        const mutation =
            step === "MANAGER"
                ? managerApproveMutation
                : hrReviewMutation;
        mutation.mutate(
            { id, action: "REJECT", note: reason },
            { onSuccess: () => setRejectDialog(null) },
        );
    };

    const handleConfirm = (values: {
        actualStartTime: string;
        actualEndTime: string;
    }) => {
        if (!confirmDialog) return;
        confirmMutation.mutate(
            { id: confirmDialog.id, data: values },
            { onSuccess: () => setConfirmDialog(null) },
        );
    };

    const openConfirmDialog = (r: OvertimeRequest) => {
        setConfirmDialog({
            id: r.id,
            startTime: r.startTime,
            endTime: r.endTime,
        });
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Đăng ký & Duyệt OT
                    </h1>
                    <p className="text-muted-foreground">
                        Quản lý đơn đăng ký làm thêm giờ
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Đăng ký OT
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="my">
                <TabsList className="flex-wrap">
                    <TabsTrigger value="my">
                        Đơn của tôi ({myReqs.length})
                    </TabsTrigger>
                    {canManagerApprove && (
                        <TabsTrigger value="pending">
                            Chờ QL duyệt ({pendingReqs.length})
                        </TabsTrigger>
                    )}
                    {canHrReview && (
                        <TabsTrigger value="hr-pending">
                            Chờ HR duyệt ({mgrApprovedReqs.length})
                        </TabsTrigger>
                    )}
                    {hrApprovedReqs.length > 0 && (
                        <TabsTrigger value="confirm">
                            Chờ xác nhận ({hrApprovedReqs.length})
                        </TabsTrigger>
                    )}
                    {canViewAll && (
                        <TabsTrigger value="all">
                            Tất cả ({allReqs.length})
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* My Requests */}
                <TabsContent value="my" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" /> Đơn OT
                                của tôi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OvertimeTable
                                requests={myReqs}
                                showUser={false}
                                actionMode="own"
                                currentUserId={currentUserId}
                                isPending={isPending}
                                hasNextPage={myQuery.hasNextPage}
                                isFetchingNextPage={
                                    myQuery.isFetchingNextPage
                                }
                                fetchNextPage={myQuery.fetchNextPage}
                                onCancel={(id) =>
                                    cancelMutation.mutate(id)
                                }
                                onConfirmHours={openConfirmDialog}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pending Manager Approval */}
                {canManagerApprove && (
                    <TabsContent value="pending" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />{" "}
                                    Đơn chờ quản lý duyệt
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <OvertimeTable
                                    requests={pendingReqs}
                                    showUser
                                    actionMode="manager-approve"
                                    currentUserId={currentUserId}
                                    isPending={isPending}
                                    hasNextPage={
                                        pendingQuery.hasNextPage
                                    }
                                    isFetchingNextPage={
                                        pendingQuery.isFetchingNextPage
                                    }
                                    fetchNextPage={
                                        pendingQuery.fetchNextPage
                                    }
                                    onManagerApprove={(id) =>
                                        setApproveDialog({
                                            id,
                                            step: "MANAGER",
                                        })
                                    }
                                    onManagerReject={(id) =>
                                        setRejectDialog({
                                            id,
                                            step: "MANAGER",
                                        })
                                    }
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Pending HR Review */}
                {canHrReview && (
                    <TabsContent value="hr-pending" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-blue-500" />{" "}
                                    Đơn chờ HR duyệt
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <OvertimeTable
                                    requests={mgrApprovedReqs}
                                    showUser
                                    actionMode="hr-review"
                                    currentUserId={currentUserId}
                                    isPending={isPending}
                                    hasNextPage={
                                        mgrApprovedQuery.hasNextPage
                                    }
                                    isFetchingNextPage={
                                        mgrApprovedQuery.isFetchingNextPage
                                    }
                                    fetchNextPage={
                                        mgrApprovedQuery.fetchNextPage
                                    }
                                    onHrApprove={(id) =>
                                        setApproveDialog({
                                            id,
                                            step: "HR",
                                        })
                                    }
                                    onHrReject={(id) =>
                                        setRejectDialog({
                                            id,
                                            step: "HR",
                                        })
                                    }
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Confirm Actual Hours */}
                <TabsContent value="confirm" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Timer className="h-5 w-5 text-green-500" />{" "}
                                Chờ xác nhận giờ thực tế
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OvertimeTable
                                requests={hrApprovedReqs}
                                showUser={false}
                                actionMode="confirm"
                                currentUserId={currentUserId}
                                isPending={isPending}
                                hasNextPage={
                                    hrApprovedQuery.hasNextPage
                                }
                                isFetchingNextPage={
                                    hrApprovedQuery.isFetchingNextPage
                                }
                                fetchNextPage={
                                    hrApprovedQuery.fetchNextPage
                                }
                                onConfirmHours={openConfirmDialog}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* All Requests */}
                {canViewAll && (
                    <TabsContent value="all" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tất cả đơn OT</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <OvertimeTable
                                    requests={allReqs}
                                    showUser
                                    actionMode={false}
                                    currentUserId={currentUserId}
                                    isPending={isPending}
                                    hasNextPage={allQuery.hasNextPage}
                                    isFetchingNextPage={
                                        allQuery.isFetchingNextPage
                                    }
                                    fetchNextPage={
                                        allQuery.fetchNextPage
                                    }
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            {/* Dialogs */}
            <CreateOvertimeDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSubmit={handleCreate}
                isPending={createMutation.isPending}
            />

            <ApproveOvertimeDialog
                open={!!approveDialog}
                step={approveDialog?.step ?? "MANAGER"}
                onOpenChange={(v) => {
                    if (!v) setApproveDialog(null);
                }}
                onSubmit={handleApprove}
                isPending={
                    managerApproveMutation.isPending ||
                    hrReviewMutation.isPending
                }
            />

            <RejectOvertimeDialog
                open={!!rejectDialog}
                step={rejectDialog?.step ?? "MANAGER"}
                onOpenChange={(v) => {
                    if (!v) setRejectDialog(null);
                }}
                onSubmit={handleReject}
                isPending={
                    managerApproveMutation.isPending ||
                    hrReviewMutation.isPending
                }
            />

            <ConfirmOvertimeDialog
                open={!!confirmDialog}
                registeredStartTime={confirmDialog?.startTime}
                registeredEndTime={confirmDialog?.endTime}
                onOpenChange={(v) => {
                    if (!v) setConfirmDialog(null);
                }}
                onSubmit={handleConfirm}
                isPending={confirmMutation.isPending}
            />
        </div>
    );
}
