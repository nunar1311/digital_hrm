"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getShifts } from "@/app/(protected)/attendance/actions";
import type { Shift } from "@/app/(protected)/attendance/types";

export interface UseSidebarShiftsReturn {
    shifts: Shift[];
    isLoading: boolean;
    activeShifts: Shift[];
    inactiveShifts: Shift[];
    refresh: () => void;
    handleCreateShift: () => void;
    handleEditShift: (shift: Shift) => void;
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

    return {
        shifts,
        isLoading,
        activeShifts,
        inactiveShifts,
        refresh: refetch,
        handleCreateShift,
        handleEditShift,
        handleToggleActive,
        createDialogOpen,
        editDialogOpen,
        editingShift,
        setCreateDialogOpen,
        setEditDialogOpen,
    };
}
