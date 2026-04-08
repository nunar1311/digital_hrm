"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getShifts, deleteShift } from "@/app/[locale]/(protected)/attendance/actions";
import type { Shift } from "@/app/[locale]/(protected)/attendance/types";
import { toast } from "sonner";

export interface UseSidebarShiftsReturn {
    shifts: Shift[];
    isLoading: boolean;
    activeShifts: Shift[];
    inactiveShifts: Shift[];
    refresh: () => void;
    handleCreateShift: () => void;
    handleEditShift: (shift: Shift) => void;
    handleDeleteShift: (shift: Shift) => Promise<void>;
    handleToggleActive: (shift: Shift) => void;
    createDialogOpen: boolean;
    editDialogOpen: boolean;
    editingShift: Shift | null;
    setCreateDialogOpen: (open: boolean) => void;
    setEditDialogOpen: (open: boolean) => void;
}

export function useSidebarShiftsData(): UseSidebarShiftsReturn {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    const queryClient = useQueryClient();

    const {
        data: shifts = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["attendance", "shifts-sidebar"],
        queryFn: async () => {
            const res = await getShifts();
            return JSON.parse(JSON.stringify(res)) as Shift[];
        },
        staleTime: 30 * 1000,
    });

    const activeShifts = shifts.filter((s) => s.isActive);
    const inactiveShifts = shifts.filter((s) => !s.isActive);

    const handleCreateShift = useCallback(() => {
        setEditingShift(null);
        setCreateDialogOpen(true);
    }, []);

    const handleEditShift = useCallback((shift: Shift) => {
        setEditingShift(shift);
        setEditDialogOpen(true);
    }, []);

    const handleToggleActive = useCallback((shift: Shift) => {
        setEditingShift(shift);
        setEditDialogOpen(true);
    }, []);

    const handleDeleteShift = useCallback(async (shift: Shift) => {
        try {
            await deleteShift(shift.id);
            toast.success("XÃ³a ca lÃ m viá»‡c thÃ nh cÃ´ng");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts-sidebar"],
            });
            queryClient.invalidateQueries({ queryKey: ["attendance", "shifts"] });
            queryClient.invalidateQueries({ queryKey: ["attendance", "shiftAssignments"] });
            // Cáº­p nháº­t query dá»¯ liá»‡u chu ká»³ chá»©a ca
            queryClient.invalidateQueries({ queryKey: ["attendance", "work-cycles-sidebar"] });
            queryClient.invalidateQueries({ queryKey: ["attendance", "workCycles"] });
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || "CÃ³ lá»—i xáº£y ra");
        }
    }, [queryClient]);

    return {
        shifts,
        isLoading,
        activeShifts,
        inactiveShifts,
        refresh: refetch,
        handleCreateShift,
        handleEditShift,
        handleDeleteShift,
        handleToggleActive,
        createDialogOpen,
        editDialogOpen,
        editingShift,
        setCreateDialogOpen,
        setEditDialogOpen,
    };
}

