"use client";

import { ChevronsRight, X } from "lucide-react";
import { useRightSidebar } from "@/contexts/sidebar-context";
import { OnboardingDetailView } from "@/components/onboarding/onboarding-detail-view";
import { PayrollEmployeeDetailView } from "@/components/payroll/payroll-employee-detail-view";
import { cn } from "@/lib/utils";
import type {
  PayrollRecordDetail,
  Payslip,
} from "@/app/(protected)/payroll/types";
import { AIAssistantView } from "./ai/ai-assistant-view";
import { Button } from "./ui/button";

const RightSidebar = () => {
  const { rightOpen, rightType, rightData, closeRightSidebar } =
    useRightSidebar();

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out shrink-0 h-full overflow-hidden",
        rightOpen ? "w-[380px] mr-1.5 opacity-100" : "w-0 opacity-0",
      )}
    >
      <div
        className={cn(
          "w-full h-full border rounded-lg flex flex-col overflow-hidden min-w-0 relative bg-background",
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
          <Button
            onClick={closeRightSidebar}
            tooltip="Đóng"
            variant="ghost"
            size="icon-xs"
          >
            <ChevronsRight className="size-3.5!" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden w-full">
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
          {rightType === "ai_assistant" && (
            <AIAssistantView context="sidebar" />
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
