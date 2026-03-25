"use client";

import { useState, useCallback } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ArrowRight,
    Save,
    Plus,
    CheckCircle,
    XCircle,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getAttendanceApprovalProcess,
    saveAttendanceApprovalProcess,
    getAttendanceAdjustments,
    cancelAttendanceAdjustmentRequest,
    approveAttendanceAdjustment,
    rejectAttendanceAdjustment,
} from "../actions";
import type {
    ApprovalProcessConfig,
    ApprovalStep,
    AdvancedSettings,
    AttendanceAdjustmentRequest,
} from "../types";
import {
    DEFAULT_APPROVAL_STEPS,
    STEP_TYPE_OPTIONS,
    APPROVER_TYPE_OPTIONS,
} from "./approval-constants";
import { StepCard } from "./step-card";
import { StepEditorDialog } from "./step-editor-dialog";
import { AdvancedSettingsPanel } from "./advanced-settings";
import { AdjustmentTable } from "./adjustment-table";
import { AdjustmentRequestDialog } from "./adjustment-request-dialog";

interface ApprovalProcessClientProps {
    initialProcess: ApprovalProcessConfig | null;
    initialAdjustments: {
        items: AttendanceAdjustmentRequest[];
        nextCursor: string | null;
    };
    canConfig: boolean;
    canApprove: boolean;
    currentUserId: string;
}

export function ApprovalProcessClient({
    initialProcess,
    initialAdjustments,
    canConfig,
    canApprove,
    currentUserId,
}: ApprovalProcessClientProps) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("process");

    // ─── Process Config State ───
    const [steps, setSteps] = useState<ApprovalStep[]>(
        initialProcess?.steps ?? DEFAULT_APPROVAL_STEPS,
    );
    const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(
        initialProcess?.advancedSettings ?? {
            sendEmailReminder: false,
            skipDuplicateApprover: true,
            skipSelfApprover: true,
        },
    );
    const [editingStep, setEditingStep] = useState<ApprovalStep | null>(null);
    const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);

    // ─── Adjustment Dialog State ───
    const [selectedRequest, setSelectedRequest] =
        useState<AttendanceAdjustmentRequest | null>(null);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [approveNote, setApproveNote] = useState("");
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);

    // ─── Queries ───
    const { data: processData, isLoading: processLoading } = useQuery({
        queryKey: ["attendance", "approval-process"],
        queryFn: async () => {
            const res = await getAttendanceApprovalProcess();
            return res as ApprovalProcessConfig | null;
        },
        initialData: initialProcess,
    });

    const adjustmentsQuery = useInfiniteQuery({
        queryKey: ["attendance", "adjustments"],
        queryFn: async ({ pageParam }) => {
            const res = await getAttendanceAdjustments({
                cursor: pageParam as string | undefined,
                pageSize: 20,
            });
            return res;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialData: {
            pages: [initialAdjustments],
            pageParams: [undefined],
        },
    });

    // ─── Mutations ───
    const saveMutation = useMutation({
        mutationFn: async () => {
            return saveAttendanceApprovalProcess({
                name: "Quy trình duyệt chấm công",
                steps,
                advancedSettings,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "approval-process"],
            });
            toast.success("Lưu quy trình thành công");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Có lỗi xảy ra");
        },
    });

    const cancelMutation = useMutation({
        mutationFn: cancelAttendanceAdjustmentRequest,
        onSuccess: () => {
            toast.success("Đã hủy yêu cầu");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "adjustments"],
            });
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
        },
    });

    const approveMutation = useMutation({
        mutationFn: async () => {
            if (!selectedRequest) throw new Error("No request");
            return approveAttendanceAdjustment(
                selectedRequest.id,
                selectedRequest.currentStep,
                approveNote || undefined,
            );
        },
        onSuccess: () => {
            toast.success("Duyệt yêu cầu thành công");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "adjustments"],
            });
            setApproveDialogOpen(false);
            setSelectedRequest(null);
            setApproveNote("");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async () => {
            if (!selectedRequest) throw new Error("No request");
            if (!rejectReason.trim())
                throw new Error("Vui lòng nhập lý do từ chối");
            return rejectAttendanceAdjustment(
                selectedRequest.id,
                selectedRequest.currentStep,
                rejectReason,
            );
        },
        onSuccess: () => {
            toast.success("Đã từ chối yêu cầu");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "adjustments"],
            });
            setRejectDialogOpen(false);
            setSelectedRequest(null);
            setRejectReason("");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
        },
    });

    // ─── Step Management ───
    const handleAddStep = useCallback(
        (type: "APPROVER" | "CONDITION") => {
            const newStep: ApprovalStep = {
                stepOrder: steps.length + 1,
                stepType: type,
                approverType:
                    type === "APPROVER" ? "DIRECT_MANAGER" : undefined,
                approvalMethod:
                    type === "APPROVER" ? "FIRST_APPROVES" : undefined,
                skipIfNoApproverFound: type === "APPROVER",
                conditionType:
                    type === "CONDITION" ? "DEPARTMENT" : undefined,
                conditionValues: type === "CONDITION" ? [] : undefined,
            };
            setEditingStep(newStep);
            setEditingStepIndex(null);
            setEditorOpen(true);
        },
        [steps.length],
    );

    const handleEditStep = useCallback((step: ApprovalStep, index: number) => {
        setEditingStep(step);
        setEditingStepIndex(index);
        setEditorOpen(true);
    }, []);

    const handleDeleteStep = useCallback((index: number) => {
        setSteps((prev) =>
            prev
                .filter((_, i) => i !== index)
                .map((s, i) => ({ ...s, stepOrder: i + 1 })),
        );
    }, []);

    const handleMoveStep = useCallback(
        (index: number, direction: "up" | "down") => {
            setSteps((prev) => {
                const newSteps = [...prev];
                const targetIndex = direction === "up" ? index - 1 : index + 1;
                if (targetIndex < 0 || targetIndex >= newSteps.length)
                    return prev;
                [newSteps[index], newSteps[targetIndex]] = [
                    newSteps[targetIndex],
                    newSteps[index],
                ];
                return newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 }));
            });
        },
        [],
    );

    const handleSaveStep = useCallback(
        (step: ApprovalStep) => {
            setSteps((prev) => {
                if (editingStepIndex !== null) {
                    const newSteps = [...prev];
                    newSteps[editingStepIndex] = step;
                    return newSteps;
                }
                return [...prev, step];
            });
            setEditorOpen(false);
            setEditingStep(null);
            setEditingStepIndex(null);
        },
        [editingStepIndex],
    );

    const getStepSummary = (step: ApprovalStep): string => {
        if (step.stepType === "CONDITION") {
            const values = step.conditionValues || [];
            if (values.length > 0) {
                return `${step.conditionType}: ${values.length} giá trị`;
            }
            return step.priority === undefined
                ? "Điều kiện khác"
                : `Ưu tiên ${step.priority}`;
        }
        const approver = APPROVER_TYPE_OPTIONS.find(
            (a) => a.value === step.approverType,
        );
        const approverLabel = approver?.label || "Không xác định";
        if (step.approverType === "MANAGER_LEVEL") {
            return `${approverLabel} - Cấp ${step.managerLevel || 1}`;
        }
        return approverLabel;
    };

    const getApproverIcon = (step: ApprovalStep): string => {
        if (step.stepType === "CONDITION") return "GitBranch";
        switch (step.approverType) {
            case "DIRECT_MANAGER":
            case "MANAGER_LEVEL":
                return "UserCheck";
            case "DEPT_HEAD":
                return "Briefcase";
            case "CUSTOM_LIST":
                return "Users";
            default:
                return "User";
        }
    };

    // ─── Requests Filtering ───
    const requests = adjustmentsQuery.data?.pages.flatMap((p) => p.items) || [];
    const myRequests = requests.filter((r) => r.userId === currentUserId);
    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    const approvedRequests = requests.filter(
        (r) => r.status === "APPROVED" || r.status === "AUTO_APPROVED",
    );
    const rejectedRequests = requests.filter((r) => r.status === "REJECTED");
    const cancelledRequests = requests.filter((r) => r.status === "CANCELLED");

    if (processLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Quy trình duyệt chấm công
                </h1>
                <p className="text-sm text-muted-foreground">
                    Thiết lập quy trình duyệt điều chỉnh chấm công cho nhân
                    viên
                </p>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="mb-4">
                    <TabsTrigger value="process">Cấu hình quy trình</TabsTrigger>
                    <TabsTrigger value="requests">
                        Yêu cầu điều chỉnh
                        {pendingRequests.length > 0 && (
                            <span className="ml-1.5 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                                {pendingRequests.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ─── Process Config Tab ─── */}
                <TabsContent value="process" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>Quy trình phê duyệt</span>
                                {canConfig && (
                                    <Button
                                        size="sm"
                                        onClick={() => saveMutation.mutate()}
                                        disabled={saveMutation.isPending}
                                    >
                                        {saveMutation.isPending && (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        )}
                                        Lưu thay đổi
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {steps.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Chưa có bước nào. Thêm bước để bắt đầu.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {steps.map((step, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3"
                                        >
                                            <StepCard
                                                step={step}
                                                index={index}
                                                summary={getStepSummary(step)}
                                                approverIcon={getApproverIcon(step)}
                                                canEdit={canConfig}
                                                onEdit={() =>
                                                    handleEditStep(step, index)
                                                }
                                                onDelete={() =>
                                                    handleDeleteStep(index)
                                                }
                                                onMoveUp={
                                                    index > 0
                                                        ? () =>
                                                              handleMoveStep(
                                                                  index,
                                                                  "up",
                                                              )
                                                        : undefined
                                                }
                                                onMoveDown={
                                                    index < steps.length - 1
                                                        ? () =>
                                                              handleMoveStep(
                                                                  index,
                                                                  "down",
                                                              )
                                                        : undefined
                                                }
                                            />
                                            {index < steps.length - 1 && (
                                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {canConfig && (
                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddStep("APPROVER")}
                                    >
                                        <Plus className="h-3 w-3" />
                                        Thêm người duyệt
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddStep("CONDITION")}
                                    >
                                        <Plus className="h-3 w-3" />
                                        Thêm điều kiện
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <AdvancedSettingsPanel
                        settings={advancedSettings}
                        onChange={setAdvancedSettings}
                        canEdit={canConfig}
                    />
                </TabsContent>

                {/* ─── Requests Tab ─── */}
                <TabsContent value="requests" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {requests.length} yêu cầu
                        </p>
                        <Button
                            size="sm"
                            onClick={() => setRequestDialogOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Tạo yêu cầu mới
                        </Button>
                    </div>

                    <AdjustmentTable
                        requests={requests}
                        currentUserId={currentUserId}
                        isPending={adjustmentsQuery.isLoading}
                        hasNextPage={
                            adjustmentsQuery.hasNextPage
                        }
                        isFetchingNextPage={
                            adjustmentsQuery.isFetchingNextPage
                        }
                        fetchNextPage={() =>
                            adjustmentsQuery.fetchNextPage()
                        }
                        onCancel={(id) => {
                            if (
                                confirm(
                                    "Bạn có chắc muốn hủy yêu cầu này?",
                                )
                            ) {
                                cancelMutation.mutate(id);
                            }
                        }}
                        onViewDetail={
                            canApprove
                                ? (request) => {
                                      setSelectedRequest(request);
                                      setApproveDialogOpen(true);
                                  }
                                : undefined
                        }
                        actionMode={canApprove ? "approve" : "own"}
                    />
                </TabsContent>
            </Tabs>

            {/* Step Editor Dialog */}
            <StepEditorDialog
                open={editorOpen}
                onOpenChange={(open) => {
                    setEditorOpen(open);
                    if (!open) {
                        setEditingStep(null);
                        setEditingStepIndex(null);
                    }
                }}
                step={editingStep}
                isNew={editingStepIndex === null}
                onSave={handleSaveStep}
            />

            {/* Approve Dialog */}
            <Dialog
                open={approveDialogOpen}
                onOpenChange={(open) => {
                    setApproveDialogOpen(open);
                    if (!open) {
                        setSelectedRequest(null);
                        setApproveNote("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Duyệt yêu cầu điều chỉnh</DialogTitle>
                        <DialogDescription>
                            Xác nhận duyệt yêu cầu điều chỉnh chấm công của{" "}
                            <strong>{selectedRequest?.userName}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">
                                        Giờ vào mới
                                    </p>
                                    <p className="font-medium">
                                        {selectedRequest.checkInTime ?? "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">
                                        Giờ ra mới
                                    </p>
                                    <p className="font-medium">
                                        {selectedRequest.checkOutTime ?? "—"}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground text-xs">
                                        Lý do
                                    </p>
                                    <p className="font-medium">
                                        {selectedRequest.reason}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="approve-note">
                                    Ghi chú (tùy chọn)
                                </Label>
                                <Textarea
                                    id="approve-note"
                                    value={approveNote}
                                    onChange={(e) =>
                                        setApproveNote(e.target.value)
                                    }
                                    placeholder="Nhập ghi chú nếu cần..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setApproveDialogOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={() => approveMutation.mutate()}
                            disabled={approveMutation.isPending}
                        >
                            {approveMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Duyệt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog
                open={rejectDialogOpen}
                onOpenChange={(open) => {
                    setRejectDialogOpen(open);
                    if (!open) {
                        setSelectedRequest(null);
                        setRejectReason("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối yêu cầu</DialogTitle>
                        <DialogDescription>
                            Từ chối yêu cầu điều chỉnh chấm công của{" "}
                            <strong>{selectedRequest?.userName}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">
                                        Giờ vào mới
                                    </p>
                                    <p className="font-medium">
                                        {selectedRequest.checkInTime ?? "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">
                                        Giờ ra mới
                                    </p>
                                    <p className="font-medium">
                                        {selectedRequest.checkOutTime ?? "—"}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground text-xs">
                                        Lý do nhân viên
                                    </p>
                                    <p className="font-medium">
                                        {selectedRequest.reason}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reject-reason">
                                    Lý do từ chối{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="reject-reason"
                                    value={rejectReason}
                                    onChange={(e) =>
                                        setRejectReason(e.target.value)
                                    }
                                    placeholder="Nhập lý do từ chối..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectMutation.mutate()}
                            disabled={rejectMutation.isPending}
                        >
                            {rejectMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Request Adjustment Dialog */}
            <AdjustmentRequestDialog
                open={requestDialogOpen}
                onOpenChange={(open) => {
                    setRequestDialogOpen(open);
                    if (!open) {
                        adjustmentsQuery.refetch();
                    }
                }}
                onSuccess={() => {
                    setRequestDialogOpen(false);
                    adjustmentsQuery.refetch();
                }}
            />
        </div>
    );
}
