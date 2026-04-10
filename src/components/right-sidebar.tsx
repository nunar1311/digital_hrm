"use client";

import { X } from "lucide-react";
import { useRightSidebar } from "@/contexts/sidebar-context";
import { OnboardingDetailView } from "@/components/onboarding/onboarding-detail-view";
import { PayrollEmployeeDetailView } from "@/components/payroll/payroll-employee-detail-view";
import { cn } from "@/lib/utils";
import type {
  PayrollRecordDetail,
  Payslip,
} from "@/app/(protected)/payroll/types";
import { AIAssistantView } from "./ai/ai-assistant-view";

const RightSidebar = () => {
  const { rightOpen, rightType, rightData, closeRightSidebar } =
    useRightSidebar();

  if (!rightOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-[400px] border rounded-lg flex flex-col overflow-hidden relative mr-1.5 shrink-0",
        "transition-all duration-300 ease-in-out",
        rightOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between h-10 px-2 border-b bg-background">
        <h2 className="text-sm font-semibold text-foreground">
          {rightType === "onboarding" && "Chi tiết tiếp nhận"}
          {rightType === "employee" && "Thông tin nhân viên"}
          {rightType === "payroll_employee" && "Chi tiết lương nhân viên"}
          {rightType === "payslip_employee" && "Chi tiết phiếu lương"}
          {rightType === "ai_assistant" && "Trợ lý AI Digital HRM"}
          {!rightType && "Chi tiết"}
        </h2>
        <button
          onClick={closeRightSidebar}
          className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {rightType === "onboarding" && !!rightData && (
          <OnboardingDetailView
            onboardingId={(rightData as { id: string }).id}
          />
        )}
        {rightType === "employee" && (
          <div className="p-4 text-sm text-muted-foreground">
            <p>Thông tin nhân viên đang được phát triển.</p>
          </div>
        )}
        {rightType === "payroll_employee" && !!rightData && (
          <PayrollEmployeeDetailView
            detail={(rightData as { detail: PayrollRecordDetail }).detail}
            month={(rightData as { month: number }).month}
            year={(rightData as { year: number }).year}
          />
        )}
        {rightType === "payslip_employee" && !!rightData && (
          <PayrollEmployeeDetailView
            payslip={
              (rightData as { payslip?: Payslip }).payslip ??
              (rightData as Payslip)
            }
          />
        )}
        {rightType === "ai_assistant" && <AIAssistantView />}
      </div>
    </div>
  );
};

export default RightSidebar;
