"use client";

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getMyExplanations,
    getPendingExplanations,
    getAllExplanations,
    getMyExplainableAttendances,
    submitExplanation,
    approveExplanation,
} from "../actions";
import type {
    ExplanationWithAttendance,
    ExplanationWithAttendanceAndUser,
    ExplainableAttendance,
} from "../types";
import { useSocketEvent } from "@/hooks/use-socket-event";

export function useExplanationsData({
    userId,
    myExplanations,
    pendingExplanations,
    allExplanations,
    canApprove,
}: {
    userId: string;
    myExplanations: ExplanationWithAttendance[];
    pendingExplanations: ExplanationWithAttendanceAndUser[];
    allExplanations: ExplanationWithAttendanceAndUser[];
    canApprove: boolean;
}) {
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "explanations"],
        });
    };

    // ─── Queries ───
    const { data: myData = myExplanations } = useQuery<
        ExplanationWithAttendance[]
    >({
        queryKey: ["attendance", "explanations", "my", userId],
        queryFn: async () => {
            const result = await getMyExplanations();
            return JSON.parse(
                JSON.stringify(result),
            ) as ExplanationWithAttendance[];
        },
        initialData: myExplanations,
    });

    const { data: pendingData = pendingExplanations } = useQuery<
        ExplanationWithAttendanceAndUser[]
    >({
        queryKey: ["attendance", "explanations", "pending"],
        queryFn: async () => {
            const result = await getPendingExplanations();
            return JSON.parse(
                JSON.stringify(result),
            ) as ExplanationWithAttendanceAndUser[];
        },
        initialData: pendingExplanations,
        enabled: canApprove,
    });

    const { data: allData = allExplanations } = useQuery<
        ExplanationWithAttendanceAndUser[]
    >({
        queryKey: ["attendance", "explanations", "all"],
        queryFn: async () => {
            const result = await getAllExplanations();
            return JSON.parse(
                JSON.stringify(result),
            ) as ExplanationWithAttendanceAndUser[];
        },
        initialData: allExplanations,
        enabled: canApprove,
    });

    const { data: explainableAttendances = [] } = useQuery<
        ExplainableAttendance[]
    >({
        queryKey: [
            "attendance",
            "explanations",
            "explainable",
            userId,
        ],
        queryFn: async () => {
            const result = await getMyExplainableAttendances();
            return JSON.parse(
                JSON.stringify(result),
            ) as ExplainableAttendance[];
        },
    });

    // ─── Real-time WebSocket Updates ───
    useSocketEvent("explanation:submitted", (data) => {
        invalidateAll();
        toast.info(`${data.userName} đã gửi giải trình`, {
            description: `Loại: ${data.type}`,
        });
    });

    useSocketEvent("explanation:approved", (data) => {
        invalidateAll();
        toast.info(
            `Giải trình được ${data.status === "APPROVED" ? "duyệt" : "từ chối"}`,
            { description: `Bởi: ${data.approvedBy}` },
        );
    });

    // ─── Mutations ───
    const submitMutation = useMutation({
        mutationFn: submitExplanation,
        onSuccess: () => {
            toast.success("Đã gửi giải trình thành công");
            invalidateAll();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const approveMutation = useMutation({
        mutationFn: ({
            id,
            action,
            reason,
        }: {
            id: string;
            action: "APPROVED" | "REJECTED";
            reason?: string;
        }) => approveExplanation(id, action, reason),
        onSuccess: (_, vars) => {
            toast.success(
                vars.action === "APPROVED"
                    ? "Đã duyệt giải trình"
                    : "Đã từ chối giải trình",
            );
            invalidateAll();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const isPending =
        submitMutation.isPending || approveMutation.isPending;

    return {
        myData,
        pendingData,
        allData,
        explainableAttendances,
        submitMutation,
        approveMutation,
        isPending,
    };
}
