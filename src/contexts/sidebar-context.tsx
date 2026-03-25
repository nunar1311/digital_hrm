"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useContext, useMemo, useState } from "react";
import type { DepartmentNode } from "@/types/org-chart";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import DepartmentSidebar from "@/components/departments/department-sidebar";
import AttendanceSidebar from "@/components/attendance/attendance-sidebar";

interface SidebarContextValue {
  departmentTree: DepartmentNode[];
  setDepartmentTree: (tree: DepartmentNode[]) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useAppSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useAppSidebar must be used within SidebarContextProvider");
  }
  return ctx;
}

interface SidebarContextProviderProps {
  children: React.ReactNode;
}

export function SidebarContextProvider({
  children,
}: SidebarContextProviderProps) {
  const [departmentTree, setDepartmentTree] = useState<DepartmentNode[]>([]);

  const value = useMemo<SidebarContextValue>(
    () => ({ departmentTree, setDepartmentTree }),
    [departmentTree],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

interface SidebarSlotProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarSlot({ children, className }: SidebarSlotProps) {
  const pathname = usePathname();
  const { departmentTree } = useAppSidebar();

  const sidebarType = useMemo(() => {
    if (pathname === "/departments" || pathname.startsWith("/departments/")) {
      return "departments";
    }

    if (pathname === "/attendance" || pathname.startsWith("/attendance/")) {
      return "attendance";
    }
    return "default";
  }, [pathname]);

  const sidebarContent = useMemo(() => {
    if (sidebarType === "departments") {
      return <DepartmentSidebar departmentTree={departmentTree} />;
    }
    if (sidebarType === "attendance") {
      return <AttendanceSidebar />;
    }
    return <AppSidebar />;
  }, [sidebarType, departmentTree]);

  return (
    <>
      {sidebarContent}
      <SidebarInset
        className={className ?? "overflow-hidden flex-1 relative min-h-0"}
      >
        {children}
      </SidebarInset>
    </>
  );
}
