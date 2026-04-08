"use client";

import { useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAppSidebar } from "@/contexts/sidebar-context";
import { useSocketEvents } from "@/hooks/use-socket-event";
import type { DepartmentNode } from "@/types/org-chart";
import { getDepartmentTree } from "./actions";

interface DepartmentsClientWrapperProps {
    departmentTree: DepartmentNode[];
    children: React.ReactNode;
}

export function DepartmentsClientWrapper({
    departmentTree,
    children,
}: DepartmentsClientWrapperProps) {
    const queryClient = useQueryClient();
    const { setDepartmentTree } = useAppSidebar();

    const { data: liveTree } = useQuery({
        queryKey: ["departmentTree"],
        queryFn: getDepartmentTree,
    });

    useSocketEvents(
        [
            "department:created",
            "department:updated",
            "department:deleted",
            "department:employee-moved",
            "department:template-applied",
        ],
        () => {
            queryClient.invalidateQueries({
                queryKey: ["departmentTree"],
            });
        },
    );

    useEffect(() => {
        setDepartmentTree(liveTree ?? departmentTree);
    }, [liveTree, departmentTree, setDepartmentTree]);

    return (
        <div className="flex flex-col flex-1 min-w-0 h-full relative overflow-hidden">
            {children}
        </div>
    );
}
