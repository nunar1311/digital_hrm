"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getOvertimeRequests,
    createOvertimeRequest,
    managerApproveOvertimeRequest,
    hrReviewOvertimeRequest,
    confirmOvertimeActualHours,
    cancelOvertimeRequest,
} from "../actions";
import type {
    OvertimeRequest,
    OvertimeRequestsPage,
} from "../types";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { PAGE_SIZE } from "./overtime-constants";

interface UseOvertimeDataParams {
    currentUserId: string;
    canManagerApprove: boolean;
    canHrReview: boolean;
    initialData: {
        my: OvertimeRequestsPage;
        pending: OvertimeRequestsPage;
        managerApproved: OvertimeRequestsPage;
        hrApproved: OvertimeRequestsPage;
        all: OvertimeRequestsPage;
    };
}

function parsePageData(data: unknown): OvertimeRequestsPage {
    return JSON.parse(JSON.stringify(data)) as OvertimeRequestsPage;
}

export function useOvertimeData({
    currentUserId,
    canManagerApprove,
    canHrReview,
    initialData,
}: UseOvertimeDataParams) {
    const queryClient = useQueryClient();
    const canViewAll = canManagerApprove || canHrReview;

    const invalidateAll = () => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "overtime"],
        });
    };

    // ─── Infinite Queries ───

    const myQuery = useInfiniteQuery<OvertimeRequestsPage>({
        queryKey: ["attendance", "overtime", "my", currentUserId],
        queryFn: async ({ pageParam }) => {
            const res = await getOvertimeRequests({
                userId: currentUserId,
                cursor: pageParam as string | undefined,
                pageSize: PAGE_SIZE,
            });
            return parsePageData(res);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialData: {
            pages: [initialData.my],
            pageParams: [undefined],
        },
    });

    const pendingQuery = useInfiniteQuery<OvertimeRequestsPage>({
        queryKey: ["attendance", "overtime", "pending"],
        queryFn: async ({ pageParam }) => {
            const res = await getOvertimeRequests({
                status: "PENDING",
                cursor: pageParam as string | undefined,
                pageSize: PAGE_SIZE,
            });
            return parsePageData(res);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialData: {
            pages: [initialData.pending],
            pageParams: [undefined],
        },
        enabled: canManagerApprove,
    });

    const mgrApprovedQuery = useInfiniteQuery<OvertimeRequestsPage>({
        queryKey: ["attendance", "overtime", "manager-approved"],
        queryFn: async ({ pageParam }) => {
            const res = await getOvertimeRequests({
                status: "MANAGER_APPROVED",
                cursor: pageParam as string | undefined,
                pageSize: PAGE_SIZE,
            });
            return parsePageData(res);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialData: {
            pages: [initialData.managerApproved],
            pageParams: [undefined],
        },
        enabled: canHrReview,
    });

    const hrApprovedQuery = useInfiniteQuery<OvertimeRequestsPage>({
        queryKey: ["attendance", "overtime", "hr-approved", currentUserId],
        queryFn: async ({ pageParam }) => {
            const res = await getOvertimeRequests({
                status: "HR_APPROVED",
                userId: currentUserId,
                cursor: pageParam as string | undefined,
                pageSize: PAGE_SIZE,
            });
            return parsePageData(res);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialData: {
            pages: [initialData.hrApproved],
            pageParams: [undefined],
        },
    });

    const allQuery = useInfiniteQuery<OvertimeRequestsPage>({
        queryKey: ["attendance", "overtime", "all"],
        queryFn: async ({ pageParam }) => {
            const res = await getOvertimeRequests({
                cursor: pageParam as string | undefined,
                pageSize: PAGE_SIZE,
            });
            return parsePageData(res);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialData: {
            pages: [initialData.all],
            pageParams: [undefined],
        },
        enabled: canViewAll,
    });

    // Helper to flatten pages
    const flatPages = (
        pages?: OvertimeRequestsPage[],
    ): OvertimeRequest[] =>
        pages?.flatMap((p) => p.items) ?? [];

    // ─── Real-time WebSocket Updates ───
    useSocketEvent("overtime:requested", (data) => {
        invalidateAll();
        toast.info(`${data.userName} đã tạo đơn OT`, {
            description: `${data.hours}h`,
        });
    });

    useSocketEvent("overtime:manager-approved", (data) => {
        invalidateAll();
        toast.info("Đơn OT đã được quản lý duyệt", {
            description: `Bởi: ${data.approvedBy}`,
        });
    });

    useSocketEvent("overtime:hr-approved", (data) => {
        invalidateAll();
        toast.info("Đơn OT đã được HR duyệt", {
            description: `Bởi: ${data.approvedBy}`,
        });
    });

    useSocketEvent("overtime:rejected", (data) => {
        invalidateAll();
        toast.error(
            `Đơn OT bị từ chối (bước ${data.step === "MANAGER" ? "QL" : "HR"})`,
            { description: `Bởi: ${data.rejectedBy}` },
        );
    });

    useSocketEvent("overtime:completed", () => {
        invalidateAll();
    });

    // ─── Mutations ───
    const createMutation = useMutation({
        mutationFn: createOvertimeRequest,
        onSuccess: () => {
            toast.success("Đã tạo đơn OT thành công");
            invalidateAll();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const managerApproveMutation = useMutation({
        mutationFn: ({
            id,
            action,
            note,
        }: {
            id: string;
            action: "APPROVE" | "REJECT";
            note?: string;
        }) => managerApproveOvertimeRequest(id, action, note),
        onSuccess: (_, vars) => {
            toast.success(
                vars.action === "APPROVE"
                    ? "Đã duyệt đơn OT (QL)"
                    : "Đã từ chối đơn OT (QL)",
            );
            invalidateAll();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const hrReviewMutation = useMutation({
        mutationFn: ({
            id,
            action,
            note,
        }: {
            id: string;
            action: "APPROVE" | "REJECT";
            note?: string;
        }) => hrReviewOvertimeRequest(id, action, note),
        onSuccess: (_, vars) => {
            toast.success(
                vars.action === "APPROVE"
                    ? "Đã duyệt đơn OT (HR)"
                    : "Đã từ chối đơn OT (HR)",
            );
            invalidateAll();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const confirmMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { actualStartTime: string; actualEndTime: string };
        }) => confirmOvertimeActualHours(id, data),
        onSuccess: () => {
            toast.success("Đã xác nhận giờ OT thực tế");
            invalidateAll();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const cancelMutation = useMutation({
        mutationFn: cancelOvertimeRequest,
        onSuccess: () => {
            toast.success("Đã hủy đơn OT");
            invalidateAll();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const isPending =
        createMutation.isPending ||
        managerApproveMutation.isPending ||
        hrReviewMutation.isPending ||
        confirmMutation.isPending ||
        cancelMutation.isPending;

    return {
        // Data
        myReqs: flatPages(myQuery.data?.pages),
        pendingReqs: flatPages(pendingQuery.data?.pages),
        mgrApprovedReqs: flatPages(mgrApprovedQuery.data?.pages),
        hrApprovedReqs: flatPages(hrApprovedQuery.data?.pages),
        allReqs: flatPages(allQuery.data?.pages),

        // Infinite scroll helpers
        myQuery,
        pendingQuery,
        mgrApprovedQuery,
        hrApprovedQuery,
        allQuery,

        // Mutations
        createMutation,
        managerApproveMutation,
        hrReviewMutation,
        confirmMutation,
        cancelMutation,
        isPending,
    };
}
