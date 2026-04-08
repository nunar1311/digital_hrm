"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApprovalStep } from "../types";
import { StepCard } from "./step-card";
import { useTranslations } from "next-intl";
import {
    parseApprovalFlowSteps,
    type ParsedApprovalFlow,
} from "./approval-flow-layout";

interface ApprovalFlowDiagramProps {
    steps: ApprovalStep[];
    canEdit: boolean;
    getStepSummary: (step: ApprovalStep) => string;
    getApproverIcon: (step: ApprovalStep) => string;
    getApproverFlowTag: (step: ApprovalStep) => string | undefined;
    onEdit: (step: ApprovalStep, index: number) => void;
    onDelete: (index: number) => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    onInsertAt: (
        insertIndex: number,
        type: "APPROVER" | "CONDITION",
    ) => void;
    onAddConditionAppend: () => void;
}

function FlowConnector({ tall }: { tall?: boolean }) {
    return (
        <div
            className={`w-px bg-sky-200 mx-auto ${tall ? "min-h-8" : "min-h-4"}`}
            aria-hidden
        />
    );
}

function BranchInsertApproverButton({
    title,
    onClick,
    disabled,
}: {
    title: string;
    onClick: () => void;
    disabled: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-1 py-1 w-full">
            <FlowConnector />
            <Button
                type="button"
                size="icon"
                disabled={disabled}
                className="h-8 w-8 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
                title={title}
                onClick={onClick}
            >
                <Plus className="h-4 w-4" />
            </Button>
            <FlowConnector />
        </div>
    );
}

function StartEndCapsule({ label }: { label: string }) {
    return (
        <div className="rounded-md border border-sky-200 bg-sky-50/80 px-6 py-2.5 text-center text-sm font-medium text-sky-900 shadow-sm">
            {label}
        </div>
    );
}

function renderApproverChain(
    items: ParsedApprovalFlow["preApprovers"],
    props: Omit<
        ApprovalFlowDiagramProps,
        "steps" | "onAddConditionAppend"
    > & {
        keysPrefix: string;
        stepsLength: number;
        approverHeaderTitle: string;
        insertStepBelowTitle: string;
    },
) {
    const {
        canEdit,
        getStepSummary,
        getApproverIcon,
        getApproverFlowTag,
        onEdit,
        onDelete,
        onMoveUp,
        onMoveDown,
        onInsertAt,
        keysPrefix,
        stepsLength,
        approverHeaderTitle,
        insertStepBelowTitle,
    } = props;

    return items.map(({ step, index }, arrIndex) => (
        <div key={`${keysPrefix}-${index}`} className="flex flex-col items-center w-full">
            {arrIndex > 0 && <FlowConnector tall />}
            <StepCard
                step={step}
                summary={getStepSummary(step)}
                approverIcon={getApproverIcon(step)}
                canEdit={canEdit}
                onEdit={() => onEdit(step, index)}
                onDelete={() => onDelete(index)}
                onMoveUp={
                    index > 0 ? () => onMoveUp(index) : undefined
                }
                onMoveDown={
                    index < stepsLength - 1
                        ? () => onMoveDown(index)
                        : undefined
                }
                displayMode="flow"
                flowHeaderTitle={approverHeaderTitle}
                flowApproverTag={getApproverFlowTag(step)}
            />
            {canEdit && (
                <div className="flex flex-col items-center w-full">
                    <FlowConnector />
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full border-sky-300 bg-sky-500 hover:bg-sky-600 text-white hover:text-white"
                        title={insertStepBelowTitle}
                        onClick={() => onInsertAt(index + 1, "APPROVER")}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <FlowConnector />
                </div>
            )}
        </div>
    ));
}

export function ApprovalFlowDiagram({
    steps,
    canEdit,
    getStepSummary,
    getApproverIcon,
    getApproverFlowTag,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    onInsertAt,
    onAddConditionAppend,
}: ApprovalFlowDiagramProps) {
    const t = useTranslations("ProtectedPages");
    const flow = parseApprovalFlowSteps(steps);
    const { preApprovers, branches, postApprovers } = flow;

    const conditionOrdinal = (branchIndex: number) => branchIndex + 1;

    const showParallelBranches = branches.length > 0;
    const hasOnlyLinearApprovers =
        !showParallelBranches && preApprovers.length > 0;

    return (
        <div className="rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/40 to-background p-6 md:p-8">
            <div className="flex flex-col items-center max-w-5xl mx-auto">
                <StartEndCapsule label={t("attendanceApprovalFlowStart")} />

                {canEdit && (
                    <div className="flex flex-col items-center w-full max-w-[200px]">
                        <FlowConnector tall />
                        <Button
                            type="button"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
                            title={t("attendanceApprovalFlowAddStepAfterStart")}
                            onClick={() => onInsertAt(0, "APPROVER")}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <FlowConnector />
                    </div>
                )}

                {!showParallelBranches &&
                    renderApproverChain(preApprovers, {
                        canEdit,
                        getStepSummary,
                        getApproverIcon,
                        getApproverFlowTag,
                        onEdit,
                        onDelete,
                        onMoveUp,
                        onMoveDown,
                        onInsertAt,
                        keysPrefix: "pre",
                        stepsLength: steps.length,
                        approverHeaderTitle: t("attendanceApprovalFlowApprover"),
                        insertStepBelowTitle: t(
                            "attendanceApprovalFlowInsertStepBelow",
                        ),
                    })}

                {showParallelBranches && (
                    <>
                        {preApprovers.length > 0 && (
                            <div className="w-full flex flex-col items-center mb-2">
                                {renderApproverChain(preApprovers, {
                                    canEdit,
                                    getStepSummary,
                                    getApproverIcon,
                                    getApproverFlowTag,
                                    onEdit,
                                    onDelete,
                                    onMoveUp,
                                    onMoveDown,
                                    onInsertAt,
                                    keysPrefix: "pre-b",
                                    stepsLength: steps.length,
                                    approverHeaderTitle: t(
                                        "attendanceApprovalFlowApprover",
                                    ),
                                    insertStepBelowTitle: t(
                                        "attendanceApprovalFlowInsertStepBelow",
                                    ),
                                })}
                            </div>
                        )}

                        <div className="w-full flex flex-col items-stretch gap-2 py-2">
                            <div className="h-px bg-sky-200 w-full relative">
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {canEdit ? (
                                        <button
                                            type="button"
                                            className="text-sky-600 hover:underline font-medium"
                                            onClick={onAddConditionAppend}
                                        >
                                            {t("attendanceApprovalFlowAddCondition")}
                                        </button>
                                    ) : (
                                        t("attendanceApprovalFlowConditionBranch")
                                    )}
                                </span>
                            </div>
                        </div>

                        <div
                            className={`grid w-full gap-6 md:gap-10 pt-2 ${
                                branches.length <= 1
                                    ? "grid-cols-1 max-w-sm mx-auto"
                                    : branches.length === 2
                                      ? "grid-cols-1 sm:grid-cols-2"
                                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            }`}
                        >
                            {branches.map((branch, bi) => (
                                <div
                                    key={branch.conditionIndex}
                                    className="flex flex-col items-center"
                                >
                                    <StepCard
                                        step={branch.condition}
                                        summary={getStepSummary(
                                            branch.condition,
                                        )}
                                        approverIcon={getApproverIcon(
                                            branch.condition,
                                        )}
                                        canEdit={canEdit}
                                        onEdit={() =>
                                            onEdit(
                                                branch.condition,
                                                branch.conditionIndex,
                                            )
                                        }
                                        onDelete={() =>
                                            onDelete(branch.conditionIndex)
                                        }
                                        onMoveUp={
                                            branch.conditionIndex > 0
                                                ? () =>
                                                      onMoveUp(
                                                          branch.conditionIndex,
                                                      )
                                                : undefined
                                        }
                                        onMoveDown={
                                            branch.conditionIndex <
                                            steps.length - 1
                                                ? () =>
                                                      onMoveDown(
                                                          branch.conditionIndex,
                                                      )
                                                : undefined
                                        }
                                        displayMode="flow"
                                        flowHeaderTitle={`${t("attendanceApprovalFlowCondition")} ${conditionOrdinal(bi)}`}
                                        flowHeaderBadge={
                                            branch.condition.conditionType ===
                                            "OTHER"
                                                ? t("attendanceApprovalStepCardFallback")
                                                : branch.condition.priority !=
                                                    null
                                                  ? t("attendanceApprovalFlowPriority", {
                                                        priority: branch.condition.priority,
                                                    })
                                                  : undefined
                                        }
                                    />

                                    {canEdit && (
                                        <BranchInsertApproverButton
                                            title={t("attendanceApprovalFlowAddApproverOnBranch")}
                                            disabled={false}
                                            onClick={() =>
                                                onInsertAt(
                                                    branch.conditionIndex + 1,
                                                    "APPROVER",
                                                )
                                            }
                                        />
                                    )}
                                    {!canEdit && <FlowConnector tall />}

                                    {branch.approvers.map((ap, ai) => (
                                        <div
                                            key={ap.index}
                                            className="flex flex-col items-center w-full"
                                        >
                                            <StepCard
                                                step={ap.step}
                                                summary={getStepSummary(
                                                    ap.step,
                                                )}
                                                approverIcon={getApproverIcon(
                                                    ap.step,
                                                )}
                                                canEdit={canEdit}
                                                onEdit={() =>
                                                    onEdit(ap.step, ap.index)
                                                }
                                                onDelete={() =>
                                                    onDelete(ap.index)
                                                }
                                                onMoveUp={
                                                    ap.index > 0
                                                        ? () =>
                                                              onMoveUp(
                                                                  ap.index,
                                                              )
                                                        : undefined
                                                }
                                                onMoveDown={
                                                    ap.index <
                                                    steps.length - 1
                                                        ? () =>
                                                              onMoveDown(
                                                                  ap.index,
                                                              )
                                                        : undefined
                                                }
                                                displayMode="flow"
                                                flowHeaderTitle={t("attendanceApprovalFlowApprover")}
                                                flowApproverTag={getApproverFlowTag(
                                                    ap.step,
                                                )}
                                            />
                                            {canEdit && (
                                                <div className="flex flex-col items-center w-full">
                                                    <FlowConnector />
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-full border-sky-300 bg-sky-500 hover:bg-sky-600 text-white hover:text-white"
                                                        title={t("attendanceApprovalFlowInsertStepBelow")}
                                                        onClick={() =>
                                                            onInsertAt(
                                                                ap.index + 1,
                                                                "APPROVER",
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <FlowConnector />
                                                </div>
                                            )}
                                            {ai < branch.approvers.length - 1 &&
                                                !canEdit && <FlowConnector tall />}
                                        </div>
                                    ))}

                                    {branch.approvers.length === 0 && canEdit && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mt-1 border-dashed"
                                            onClick={() =>
                                                onInsertAt(
                                                    branch.conditionIndex + 1,
                                                    "APPROVER",
                                                )
                                            }
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            {t("attendanceApprovalFlowAddApprover")}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {showParallelBranches && postApprovers.length > 0 && (
                    <div className="w-full flex flex-col items-center mt-4 pt-4 border-t border-sky-100">
                        <p className="text-xs text-muted-foreground mb-2">
                            {t("attendanceApprovalFlowAfterMerge")}
                        </p>
                        {renderApproverChain(postApprovers, {
                            canEdit,
                            getStepSummary,
                            getApproverIcon,
                            getApproverFlowTag,
                            onEdit,
                            onDelete,
                            onMoveUp,
                            onMoveDown,
                            onInsertAt,
                            keysPrefix: "post",
                            stepsLength: steps.length,
                            approverHeaderTitle: t("attendanceApprovalFlowApprover"),
                            insertStepBelowTitle: t(
                                "attendanceApprovalFlowInsertStepBelow",
                            ),
                        })}
                    </div>
                )}

                {!showParallelBranches &&
                    !hasOnlyLinearApprovers &&
                    steps.length === 0 && (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            {t("attendanceApprovalFlowNoSteps")}
                        </p>
                    )}

                <FlowConnector tall />
                <StartEndCapsule label={t("attendanceApprovalFlowEnd")} />
            </div>
        </div>
    );
}
