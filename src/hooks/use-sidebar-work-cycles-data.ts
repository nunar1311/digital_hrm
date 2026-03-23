"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkCycles } from "@/app/(protected)/attendance/actions";
import type { WorkCycle } from "@/app/(protected)/attendance/types";

export interface UseSidebarWorkCyclesReturn {
    workCycles: WorkCycle[];
    isLoading: boolean;
    activeWorkCycles: WorkCycle[];
    inactiveWorkCycles: WorkCycle[];
    refresh: () => void;
    handleCreateWorkCycle: () => void;
    handleEditWorkCycle: (workCycle: WorkCycle) => void;
    createDialogOpen: boolean;
    editDialogOpen: boolean;
    editingWorkCycle: WorkCycle | null;
    setCreateDialogOpen: (open: boolean) => void;
    setEditDialogOpen: (open: boolean) => void;
}

export function useSidebarWorkCyclesData(): UseSidebarWorkCyclesReturn {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingWorkCycle, setEditingWorkCycle] = useState<WorkCycle | null>(null);

    const {
        data: workCycles = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["attendance", "work-cycles-sidebar"],
        queryFn: async () => {
            const res = await getWorkCycles();
            return JSON.parse(JSON.stringify(res)) as WorkCycle[];
        },
        staleTime: 30 * 1000,
    });

    const activeWorkCycles = workCycles.filter((c) => c.isActive);
    const inactiveWorkCycles = workCycles.filter((c) => !c.isActive);

    const handleCreateWorkCycle = useCallback(() => {
        setEditingWorkCycle(null);
        setCreateDialogOpen(true);
    }, []);

    const handleEditWorkCycle = useCallback((workCycle: WorkCycle) => {
        setEditingWorkCycle(workCycle);
        setEditDialogOpen(true);
    }, []);

    return {
        workCycles,
        isLoading,
        activeWorkCycles,
        inactiveWorkCycles,
        refresh: refetch,
        handleCreateWorkCycle,
        handleEditWorkCycle,
        createDialogOpen,
        editDialogOpen,
        editingWorkCycle,
        setCreateDialogOpen,
        setEditDialogOpen,
    };
}
