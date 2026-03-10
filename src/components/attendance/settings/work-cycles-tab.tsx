"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Plus } from "lucide-react";

import {
    createWorkCycle,
    updateWorkCycle,
    deleteWorkCycle,
    toggleWorkCycleActive,
} from "@/app/(protected)/attendance/actions";
import type {
    WorkCycle,
    Shift,
} from "@/app/(protected)/attendance/types";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type {
    WorkCycleFormValues,
    CycleEntryDraft,
} from "./work-cycles-constants";
import { WorkCycleCard } from "./work-cycle-card";
import { WorkCycleFormDialog } from "./work-cycle-form-dialog";
import { DeleteWorkCycleDialog } from "./delete-work-cycle-dialog";

interface Props {
    workCycles: WorkCycle[];
    shifts: Shift[];
    queryClient: ReturnType<typeof useQueryClient>;
}

export function WorkCyclesTab({
    workCycles,
    shifts,
    queryClient,
}: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editCycle, setEditCycle] = useState<WorkCycle | null>(
        null,
    );
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const openCreate = () => {
        setEditCycle(null);
        setShowDialog(true);
    };

    const openEdit = (cycle: WorkCycle) => {
        setEditCycle(cycle);
        setShowDialog(true);
    };

    const createMutation = useMutation({
        mutationFn: ({
            values,
            entries,
        }: {
            values: WorkCycleFormValues;
            entries: CycleEntryDraft[];
        }) =>
            createWorkCycle({
                ...values,
                entries: entries.map((e) => ({
                    dayIndex: e.dayIndex,
                    shiftId: e.isDayOff ? null : e.shiftId,
                    isDayOff: e.isDayOff,
                })),
            }),
        onSuccess: () => {
            toast.success("Đã tạo chu kỳ làm việc");
            setShowDialog(false);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "workCycles"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            values,
            entries,
        }: {
            values: WorkCycleFormValues;
            entries: CycleEntryDraft[];
        }) => {
            if (!editCycle) throw new Error("No cycle");
            return updateWorkCycle(editCycle.id, {
                ...values,
                entries: entries.map((e) => ({
                    dayIndex: e.dayIndex,
                    shiftId: e.isDayOff ? null : e.shiftId,
                    isDayOff: e.isDayOff,
                })),
            });
        },
        onSuccess: () => {
            toast.success("Đã cập nhật chu kỳ làm việc");
            setShowDialog(false);
            setEditCycle(null);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "workCycles"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteWorkCycle(id),
        onSuccess: () => {
            toast.success("Đã xoá chu kỳ làm việc");
            setDeleteId(null);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "workCycles"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const toggleMutation = useMutation({
        mutationFn: ({
            id,
            isActive,
        }: {
            id: string;
            isActive: boolean;
        }) => toggleWorkCycleActive(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "workCycles"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const isSaving =
        createMutation.isPending || updateMutation.isPending;

    const handleFormSubmit = (
        values: WorkCycleFormValues,
        entries: CycleEntryDraft[],
    ) => {
        if (editCycle) {
            updateMutation.mutate({ values, entries });
        } else {
            createMutation.mutate({ values, entries });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Chu kỳ làm việc
                    </CardTitle>
                    <CardDescription>
                        Tạo các chu kỳ làm việc linh động, xoay ca.
                        Mỗi chu kỳ xác định lịch ca làm lặp lại theo
                        số ngày.
                    </CardDescription>
                </div>
                <Button onClick={openCreate} size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Tạo chu kỳ
                </Button>
            </CardHeader>
            <CardContent>
                {workCycles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        Chưa có chu kỳ làm việc nào
                    </p>
                ) : (
                    <div className="space-y-3">
                        {workCycles.map((cycle) => (
                            <WorkCycleCard
                                key={cycle.id}
                                cycle={cycle}
                                onEdit={openEdit}
                                onDelete={(id) => setDeleteId(id)}
                                onToggleActive={(id, isActive) =>
                                    toggleMutation.mutate({
                                        id,
                                        isActive,
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
            </CardContent>

            <WorkCycleFormDialog
                open={showDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowDialog(false);
                        setEditCycle(null);
                    }
                }}
                editCycle={editCycle}
                shifts={shifts}
                onSubmit={handleFormSubmit}
                isSaving={isSaving}
            />

            <DeleteWorkCycleDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={() =>
                    deleteId && deleteMutation.mutate(deleteId)
                }
            />
        </Card>
    );
}
