"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
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
  const t = useTranslations("ProtectedPages");
  const locale = useLocale();

  // ─── Socket Events (Real-time updates) ───
  useSocketEvent(SOCKET_EVENTS.ATTENDANCE_ADJUSTMENT_REQUESTED, (data) => {
    toast.info(t("attendanceApprovalProcessToastNewRequest", { userName: data.userName }), {
      description: t("attendanceApprovalProcessToastDate", {
        date: new Date(data.date).toLocaleDateString(locale),
      }),
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
  /** Insert position for a new step (splice); null = append at end on save */
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
        name: t("attendanceApprovalProcessName"),
        steps,
        advancedSettings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "approval-process"],
      });
      toast.success(t("attendanceApprovalProcessToastSaveSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("attendanceApprovalProcessToastError"));
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

  /** Insert a condition branch before the post-approvers segment, if any */
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
        return t("attendanceApprovalConditionTypeOther");
      }
      const values = step.conditionValues || [];
      const typeLabel =
        CONDITION_TYPE_OPTIONS.find((o) => o.value === step.conditionType)
          ?.labelKey;
      const resolvedTypeLabel =
        (typeLabel ? t(typeLabel) : step.conditionType) ??
        t("attendanceApprovalProcessUnknown");
      if (values.length > 0) {
        return t("attendanceApprovalProcessSummaryRequesterValues", {
          typeLabel: resolvedTypeLabel,
          count: values.length,
        });
      }
      if (step.priority != null) {
        return t("attendanceApprovalProcessSummaryPriorityNoSelection", {
          priority: step.priority,
        });
      }
      return t("attendanceApprovalProcessSummaryNoSelection", {
        typeLabel: resolvedTypeLabel,
      });
    }
    const approver = APPROVER_TYPE_OPTIONS.find(
      (a) => a.value === step.approverType,
    );
    const approverLabel = approver?.labelKey
      ? t(approver.labelKey)
      : t("attendanceApprovalProcessUnknown");
    if (step.approverType === "MANAGER_LEVEL") {
      return t("attendanceApprovalProcessSummaryManagerLevel", {
        approverLabel,
        level: step.managerLevel || 1,
      });
    }
    return approverLabel;
  };

  const getApproverFlowTag = (step: ApprovalStep): string | undefined => {
    if (step.stepType !== "APPROVER") return undefined;
    if (step.approvalMethod === "FIRST_APPROVES") {
      return t("attendanceApprovalProcessFlowTagFirstApproves");
    }
    if (step.approvalMethod === "ALL_MUST_APPROVE") {
      return t("attendanceApprovalProcessFlowTagAllMustApprove");
    }
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
        <h1 className="font-semibold">{t("attendanceApprovalProcessTitle")}</h1>
      </div>

      <div className="p-4 space-y-6 overflow-auto h-[calc(100vh-5rem)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{t("attendanceApprovalProcessCardTitle")}</span>
              {canConfig && (
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {t("attendanceApprovalProcessSaveChanges")}
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
                  {t("attendanceApprovalProcessAddApproverAtEnd")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddConditionBranch}
                >
                  <Plus className="h-3 w-3" />
                  {t("attendanceApprovalProcessAddConditionBranch")}
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
