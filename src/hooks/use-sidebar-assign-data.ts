"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsers, getDepartments } from "@/app/[locale]/(protected)/attendance/actions";
import type { UserBasic, DepartmentBasic } from "@/app/[locale]/(protected)/attendance/types";

export interface UseSidebarAssignReturn {
    users: UserBasic[];
    departments: DepartmentBasic[];
    isLoading: boolean;
    openAssignCycleUser: (userId?: string, startDate?: Date) => void;
    openAssignCycleDept: () => void;
    openAssignShift: () => void;
    assignCycleUserOpen: boolean;
    assignCycleDeptOpen: boolean;
    assignShiftOpen: boolean;
    setAssignCycleUserOpen: (open: boolean) => void;
    setAssignCycleDeptOpen: (open: boolean) => void;
    setAssignShiftOpen: (open: boolean) => void;
    defaultUserId: string | null;
    defaultStartDate: Date | null;
}

export function useSidebarAssignData(): UseSidebarAssignReturn {
    const [assignCycleUserOpen, setAssignCycleUserOpen] = useState(false);
    const [assignCycleDeptOpen, setAssignCycleDeptOpen] = useState(false);
    const [assignShiftOpen, setAssignShiftOpen] = useState(false);
    const [defaultUserId, setDefaultUserId] = useState<string | null>(null);
    const [defaultStartDate, setDefaultStartDate] = useState<Date | null>(null);

    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ["attendance", "sidebar-users"],
        queryFn: async () => {
            const res = await getUsers();
            return JSON.parse(JSON.stringify(res)) as UserBasic[];
        },
        staleTime: 60 * 1000,
    });

    const { data: departments = [], isLoading: deptsLoading } = useQuery({
        queryKey: ["attendance", "sidebar-departments"],
        queryFn: async () => {
            const res = await getDepartments();
            return JSON.parse(JSON.stringify(res)) as DepartmentBasic[];
        },
        staleTime: 60 * 1000,
    });

    const isLoading = usersLoading || deptsLoading;

    const openAssignCycleUser = useCallback(
        (userId?: string, startDate?: Date) => {
            setDefaultUserId(userId ?? null);
            setDefaultStartDate(startDate ?? null);
            setAssignCycleUserOpen(true);
        },
        [],
    );

    const openAssignCycleDept = useCallback(() => {
        setAssignCycleDeptOpen(true);
    }, []);

    const openAssignShift = useCallback(() => {
        setAssignShiftOpen(true);
    }, []);

    return {
        users,
        departments,
        isLoading,
        openAssignCycleUser,
        openAssignCycleDept,
        openAssignShift,
        assignCycleUserOpen,
        assignCycleDeptOpen,
        assignShiftOpen,
        setAssignCycleUserOpen,
        setAssignCycleDeptOpen,
        setAssignShiftOpen,
        defaultUserId,
        defaultStartDate,
    };
}

