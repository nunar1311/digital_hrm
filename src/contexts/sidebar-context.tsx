"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useContext, useMemo, useState } from "react";
import type { DepartmentNode } from "@/types/org-chart";
import { SidebarInset } from "@/components/ui/sidebar";
import DepartmentSidebar from "@/components/departments/department-sidebar";
import AttendanceSidebar from "@/components/attendance/attendance-sidebar";
import ESSSidebar from "@/components/ess/ess-sidebar";
import OnboardingSidebar from "@/components/onboarding/onboarding-sidebar";
import PayrollSidebar from "@/components/payroll/payroll-sidebar";
import RecruitmentSidebar from "@/components/recruitment/recruitment-sidebar";

// ============================================================
// Department tree context
// ============================================================

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

// ============================================================
// Right sidebar context
// ============================================================

export type RightSidebarType =
  | "onboarding"
  | "employee"
  | "payroll_employee"
  | "payslip_employee"
  | null;

export interface RightSidebarContextValue {
  rightOpen: boolean;
  rightType: RightSidebarType;
  rightData: unknown;
  openRightSidebar: (type: RightSidebarType, data: unknown) => void;
  closeRightSidebar: () => void;
}

const RightSidebarContext = createContext<RightSidebarContextValue | null>(
  null,
);

export function useRightSidebar() {
  const ctx = useContext(RightSidebarContext);
  if (!ctx) {
    throw new Error(
      "useRightSidebar must be used within SidebarContextProvider",
    );
  }
  return ctx;
}

// ============================================================
// Providers
// ============================================================

interface SidebarContextProviderProps {
  children: React.ReactNode;
}

export function SidebarContextProvider({
  children,
}: SidebarContextProviderProps) {
  const [departmentTree, setDepartmentTree] = useState<DepartmentNode[]>([]);

  // Right sidebar state
  const [rightOpen, setRightOpen] = useState(false);
  const [rightType, setRightType] = useState<RightSidebarType>(null);
  const [rightData, setRightData] = useState<unknown>(null);

  const openRightSidebar = (type: RightSidebarType, data: unknown) => {
    setRightType(type);
    setRightData(data);
    setRightOpen(true);
  };

  const closeRightSidebar = () => {
    setRightOpen(false);
    // Keep type/data briefly for exit animation if needed
    setTimeout(() => {
      setRightType(null);
      setRightData(null);
    }, 300);
  };

  const sidebarContextValue = useMemo<SidebarContextValue>(
    () => ({ departmentTree, setDepartmentTree }),
    [departmentTree],
  );

  const rightSidebarContextValue = useMemo<RightSidebarContextValue>(
    () => ({
      rightOpen,
      rightType,
      rightData,
      openRightSidebar,
      closeRightSidebar,
    }),
    [rightOpen, rightType, rightData],
  );

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <RightSidebarContext.Provider value={rightSidebarContextValue}>
        {children}
      </RightSidebarContext.Provider>
    </SidebarContext.Provider>
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

    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
      return "onboarding";
    }

    if (pathname === "/payroll" || pathname.startsWith("/payroll/")) {
      return "payroll";
    }

    if (pathname === "/recruitment" || pathname.startsWith("/recruitment/")) {
      return "recruitment";
    }

    if (
      pathname === "/ess" ||
      pathname.startsWith("/ess/") ||
      pathname === "/" ||
      pathname === "/org-chart"
    ) {
      return "ess";
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
    if (sidebarType === "onboarding") {
      return <OnboardingSidebar />;
    }
    if (sidebarType === "payroll") {
      return <PayrollSidebar />;
    }
    if (sidebarType === "recruitment") {
      return <RecruitmentSidebar />;
    }
    if (sidebarType === "ess") {
      return <ESSSidebar />;
    }
    // return <AppSidebar />;
    return null;
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
