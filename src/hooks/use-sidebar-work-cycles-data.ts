"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorkCycle,
  getWorkCycles,
} from "@/app/(protected)/attendance/actions";
import type { WorkCycle } from "@/app/(protected)/attendance/types";
import { toast } from "sonner";

export interface UseSidebarWorkCyclesReturn {
  workCycles: WorkCycle[];
  isLoading: boolean;
  activeWorkCycles: WorkCycle[];
  inactiveWorkCycles: WorkCycle[];
  refresh: () => void;
  handleCreateWorkCycle: () => void;
  handleDeleteWorkCycle: (workCycle: WorkCycle) => void;
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
  const [editingWorkCycle, setEditingWorkCycle] = useState<WorkCycle | null>(
    null,
  );

  const queryClient = useQueryClient();

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

  const handleDeleteWorkCycle = useCallback(async (workCycle: WorkCycle) => {
    try {
      await deleteWorkCycle(workCycle.id);
      toast.success("Xóa chu kỳ thành công");
      queryClient.invalidateQueries({
        queryKey: ["attendance", "work-cycles-sidebar"],
      });
      queryClient.invalidateQueries({ queryKey: ["attendance", "workCycles"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "shiftAssignments"] });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Có lỗi xảy ra");
    }
  }, []);

  return {
    workCycles,
    isLoading,
    activeWorkCycles,
    inactiveWorkCycles,
    refresh: refetch,
    handleCreateWorkCycle,
    handleEditWorkCycle,
    handleDeleteWorkCycle,
    createDialogOpen,
    editDialogOpen,
    editingWorkCycle,
    setCreateDialogOpen,
    setEditDialogOpen,
  };
}
