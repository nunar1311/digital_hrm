"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAttendanceApprovalProcess,
  saveAttendanceApprovalProcess,
} from "../actions";
import type {
  ApprovalProcessConfig,
  ApprovalStep,
  AdvancedSettings,
} from "../types";
import {
  DEFAULT_APPROVAL_STEPS,
  APPROVER_TYPE_OPTIONS,
  CONDITION_TYPE_OPTIONS,
} from "./approval-constants";
import { ApprovalFlowDiagram } from "./approval-flow-diagram";
import { parseApprovalFlowSteps } from "./approval-flow-layout";
import { StepEditorDialog } from "./step-editor-dialog";
import { AdvancedSettingsPanel } from "./advanced-settings";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { SOCKET_EVENTS } from "@/lib/socket";

interface ApprovalProcessClientProps {
  initialProcess: ApprovalProcessConfig | null;
  canConfig: boolean;
}

export function ApprovalProcessClient({
  initialProcess,
  canConfig,
}: ApprovalProcessClientProps) {
  const queryClient = useQueryClient();

  // ─── Socket Events (Real-time updates) ───
  useSocketEvent(SOCKET_EVENTS.ATTENDANCE_ADJUSTMENT_REQUESTED, (data) => {
    toast.info(`Yêu cầu mới từ ${data.userName}`, {
      description: `Ngày: ${new Date(data.date).toLocaleDateString("vi-VN")}`,
    });
    queryClient.invalidateQueries({
      queryKey: ["attendance", "adjustments"],
    });
  });

  useSocketEvent(SOCKET_EVENTS.ATTENDANCE_ADJUSTMENT_PENDING, () => {
    queryClient.invalidateQueries({ queryKey: ["attendance", "adjustments"] });
  });

  // ─── Process Config State ───
  const [steps, setSteps] = useState<ApprovalStep[]>(
    initialProcess?.steps ?? DEFAULT_APPROVAL_STEPS,
  );
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(
    initialProcess?.advancedSettings ?? {
      sendEmailReminder: false,
      skipDuplicateApprover: true,
      skipSelfApprover: true,
    },
  );
  const [editingStep, setEditingStep] = useState<ApprovalStep | null>(null);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  /** Vị trí chèn bước mới (splice); null = thêm cuối danh sách khi lưu */
  const [pendingInsertIndex, setPendingInsertIndex] = useState<number | null>(
    null,
  );
  const [editorOpen, setEditorOpen] = useState(false);

  // ─── Query ───
  const { isLoading: processLoading } = useQuery({
    queryKey: ["attendance", "approval-process"],
    queryFn: async () => {
      const res = await getAttendanceApprovalProcess();
      return res as ApprovalProcessConfig | null;
    },
    initialData: initialProcess,
  });

  // ─── Mutations ───
  const saveMutation = useMutation({
    mutationFn: async () => {
      return saveAttendanceApprovalProcess({
        name: "Quy trình duyệt chấm công",
        steps,
        advancedSettings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "approval-process"],
      });
      toast.success("Lưu quy trình thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Có lỗi xảy ra");
    },
  });

  // ─── Step Management ───
  const handleAddStep = useCallback(
    (type: "APPROVER" | "CONDITION") => {
      const newStep: ApprovalStep = {
        stepOrder: steps.length + 1,
        stepType: type,
        approverType: type === "APPROVER" ? "DIRECT_MANAGER" : undefined,
        approvalMethod: type === "APPROVER" ? "FIRST_APPROVES" : undefined,
        skipIfNoApproverFound: type === "APPROVER",
        conditionType: type === "CONDITION" ? "DEPARTMENT" : undefined,
        conditionValues: type === "CONDITION" ? [] : undefined,
      };
      setEditingStep(newStep);
      setEditingStepIndex(null);
      setPendingInsertIndex(null);
      setEditorOpen(true);
    },
    [steps.length],
  );

  /** Thêm nhánh điều kiện trước phần “sau gộp nhánh” (post-approvers) nếu có */
  const handleAddConditionBranch = useCallback(() => {
    const { postApprovers } = parseApprovalFlowSteps(steps);
    const insertAt = Math.max(0, steps.length - postApprovers.length);
    const newStep: ApprovalStep = {
      stepOrder: insertAt + 1,
      stepType: "CONDITION",
      conditionType: "DEPARTMENT",
      conditionValues: [],
    };
    setEditingStep(newStep);
    setEditingStepIndex(null);
    setPendingInsertIndex(insertAt);
    setEditorOpen(true);
  }, [steps]);

  const handleEditStep = useCallback((step: ApprovalStep, index: number) => {
    setEditingStep(step);
    setEditingStepIndex(index);
    setPendingInsertIndex(null);
    setEditorOpen(true);
  }, []);

  const handleInsertStepAt = useCallback(
    (insertIndex: number, type: "APPROVER" | "CONDITION") => {
      const newStep: ApprovalStep = {
        stepOrder: insertIndex + 1,
        stepType: type,
        approverType: type === "APPROVER" ? "DIRECT_MANAGER" : undefined,
        approvalMethod: type === "APPROVER" ? "FIRST_APPROVES" : undefined,
        skipIfNoApproverFound: type === "APPROVER",
        conditionType: type === "CONDITION" ? "DEPARTMENT" : undefined,
        conditionValues: type === "CONDITION" ? [] : undefined,
      };
      setEditingStep(newStep);
      setEditingStepIndex(null);
      setPendingInsertIndex(insertIndex);
      setEditorOpen(true);
    },
    [],
  );

  const handleDeleteStep = useCallback((index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepOrder: i + 1 })),
    );
  }, []);

  const handleMoveStep = useCallback(
    (index: number, direction: "up" | "down") => {
      setSteps((prev) => {
        const newSteps = [...prev];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
        [newSteps[index], newSteps[targetIndex]] = [
          newSteps[targetIndex],
          newSteps[index],
        ];
        return newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 }));
      });
    },
    [],
  );

  const handleSaveStep = useCallback(
    (step: ApprovalStep) => {
      setSteps((prev) => {
        if (pendingInsertIndex !== null) {
          const next = [...prev];
          next.splice(pendingInsertIndex, 0, step);
          return next.map((s, i) => ({ ...s, stepOrder: i + 1 }));
        }
        if (editingStepIndex !== null) {
          const newSteps = [...prev];
          newSteps[editingStepIndex] = step;
          return newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 }));
        }
        return [...prev, step].map((s, i) => ({
          ...s,
          stepOrder: i + 1,
        }));
      });
      setEditorOpen(false);
      setEditingStep(null);
      setEditingStepIndex(null);
      setPendingInsertIndex(null);
    },
    [editingStepIndex, pendingInsertIndex],
  );

  const getStepSummary = (step: ApprovalStep): string => {
    if (step.stepType === "CONDITION") {
      if (step.conditionType === "OTHER") {
        return "Điều kiện khác";
      }
      const values = step.conditionValues || [];
      const typeLabel =
        CONDITION_TYPE_OPTIONS.find((o) => o.value === step.conditionType)
          ?.label || step.conditionType;
      if (values.length > 0) {
        return `Người yêu cầu — ${typeLabel}: ${values.length}`;
      }
      if (step.priority != null) {
        return `Ưu tiên ${step.priority} (chưa chọn danh sách áp dụng)`;
      }
      return `Chưa chọn danh sách áp dụng (${typeLabel})`;
    }
    const approver = APPROVER_TYPE_OPTIONS.find(
      (a) => a.value === step.approverType,
    );
    const approverLabel = approver?.label || "Không xác định";
    if (step.approverType === "MANAGER_LEVEL") {
      return `${approverLabel} — Cấp ${step.managerLevel || 1}`;
    }
    return approverLabel;
  };

  const getApproverFlowTag = (step: ApprovalStep): string | undefined => {
    if (step.stepType !== "APPROVER") return undefined;
    if (step.approvalMethod === "FIRST_APPROVES") return "Một người duyệt";
    if (step.approvalMethod === "ALL_MUST_APPROVE") return "Tất cả duyệt";
    return undefined;
  };

  const getApproverIcon = (step: ApprovalStep): string => {
    if (step.stepType === "CONDITION") return "GitBranch";
    switch (step.approverType) {
      case "DIRECT_MANAGER":
      case "MANAGER_LEVEL":
        return "UserCheck";
      case "DEPT_HEAD":
        return "Briefcase";
      case "CUSTOM_LIST":
        return "Users";
      default:
        return "User";
    }
  };

  if (processLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0">
      <div className="h-10 flex items-center p-2 border-b">
        <h1 className="font-semibold">Quy trình duyệt chấm công</h1>
      </div>

      <div className="p-4 space-y-6 overflow-auto h-[calc(100vh-5rem)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Quy trình phê duyệt</span>
              {canConfig && (
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Lưu thay đổi
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApprovalFlowDiagram
              steps={steps}
              canEdit={canConfig}
              getStepSummary={getStepSummary}
              getApproverIcon={getApproverIcon}
              getApproverFlowTag={getApproverFlowTag}
              onEdit={handleEditStep}
              onDelete={handleDeleteStep}
              onMoveUp={(i) => handleMoveStep(i, "up")}
              onMoveDown={(i) => handleMoveStep(i, "down")}
              onInsertAt={handleInsertStepAt}
              onAddConditionAppend={handleAddConditionBranch}
            />

            {canConfig && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStep("APPROVER")}
                >
                  <Plus className="h-3 w-3" />
                  Thêm người duyệt (cuối quy trình)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddConditionBranch}
                >
                  <Plus className="h-3 w-3" />
                  Thêm điều kiện (nhánh mới)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <AdvancedSettingsPanel
          settings={advancedSettings}
          onChange={setAdvancedSettings}
          canEdit={canConfig}
        />
      </div>

      {/* Step Editor Dialog */}
      <StepEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditingStep(null);
            setEditingStepIndex(null);
            setPendingInsertIndex(null);
          }
        }}
        step={editingStep}
        isNew={editingStepIndex === null}
        onSave={handleSaveStep}
      />
    </div>
  );
}
