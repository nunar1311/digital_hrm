"use client";

import {
    UserCheck,
    User,
    Users,
    Briefcase,
    GitBranch,
    Pencil,
    Trash2,
    ChevronUp,
    ChevronDown,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApprovalStep } from "../types";

const ICON_MAP: Record<string, React.ElementType> = {
    UserCheck,
    User,
    Users,
    Briefcase,
    GitBranch,
};

const STEP_TYPE_LABELS: Record<string, string> = {
    APPROVER: "Người duyệt",
    CONDITION: "Điều kiện",
};

export type StepCardDisplayMode = "list" | "flow";

interface StepCardProps {
    step: ApprovalStep;
    summary: string;
    approverIcon: string;
    canEdit: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    /** list: hàng ngang như trước; flow: thẻ có header màu như sơ đồ quy trình */
    displayMode?: StepCardDisplayMode;
    /** Tiêu đề header ở chế độ flow (vd: Điều kiện 1) */
    flowHeaderTitle?: string;
    /** Nhãn phụ trên header (vd: Độ ưu tiên 1) */
    flowHeaderBadge?: string;
    /** Tag phụ cho người duyệt (vd: phương thức duyệt rút gọn) */
    flowApproverTag?: string;
}

export function StepCard({
    step,
    summary,
    approverIcon,
    canEdit,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    displayMode = "list",
    flowHeaderTitle,
    flowHeaderBadge,
    flowApproverTag,
}: StepCardProps) {
    const Icon = ICON_MAP[approverIcon] || User;
    const isCondition = step.stepType === "CONDITION";
    const isFallbackCondition =
        isCondition && step.conditionType === "OTHER";

    const actions = canEdit && (
        <div className="flex items-center gap-1 shrink-0">
            {displayMode === "list" && (
                <>
                    {onMoveUp && (
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={onMoveUp}
                            className="size-6"
                        >
                            <ChevronUp className="h-3 w-3" />
                        </Button>
                    )}
                    {onMoveDown && (
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={onMoveDown}
                            className="size-6"
                        >
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    )}
                </>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-6"
                    >
                        <span className="sr-only">Mở menu</span>
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                        >
                            <path
                                d="M8 2.5C8.82843 2.5 9.5 3.17157 9.5 4C9.5 4.82843 8.82843 5.5 8 5.5C7.17157 5.5 6.5 4.82843 6.5 4C6.5 3.17157 7.17157 2.5 8 2.5Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                            />
                            <path
                                d="M8 9.5C8.82843 9.5 9.5 10.1716 9.5 11C9.5 11.8284 8.82843 12.5 8 12.5C7.17157 12.5 6.5 11.8284 6.5 11C6.5 10.1716 7.17157 9.5 8 9.5Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                            />
                            <path
                                d="M8 6C8.82843 6 9.5 6.67157 9.5 7.5C9.5 8.32843 8.82843 9 8 9C7.17157 9 6.5 8.32843 6.5 7.5C6.5 6.67157 7.17157 6 8 6Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                            />
                        </svg>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                        Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        Xóa bước
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    if (displayMode === "flow") {
        const headerTitle =
            flowHeaderTitle ||
            `Bước ${step.stepOrder} — ${STEP_TYPE_LABELS[step.stepType]}`;
        const isGreen = step.stepType === "APPROVER";

        return (
            <div
                className={`
                    w-full max-w-[min(100%,280px)] mx-auto rounded-lg border overflow-hidden bg-card shadow-sm
                    ${isFallbackCondition ? "border-dashed border-muted-foreground/40" : ""}
                `}
            >
                <div
                    className={`
                    flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-white
                    ${isGreen ? "bg-emerald-600" : "bg-sky-600"}
                `}
                >
                    <span className="truncate">{headerTitle}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {flowHeaderBadge && (
                            <span className="text-[10px] font-medium uppercase tracking-wide rounded border border-white/50 px-1.5 py-0.5 text-white/95">
                                {flowHeaderBadge}
                            </span>
                        )}
                        {flowApproverTag && (
                            <span className="text-[10px] font-medium rounded bg-white/20 px-1.5 py-0.5">
                                {flowApproverTag}
                            </span>
                        )}
                    </div>
                </div>
                <div className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                        <div
                            className={`
                            flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5
                            ${isCondition ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"}
                            ${isFallbackCondition ? "opacity-70" : ""}
                        `}
                        >
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-sm text-foreground leading-snug ${isFallbackCondition ? "italic text-muted-foreground" : ""}`}
                            >
                                {summary}
                            </p>
                            {isFallbackCondition && (
                                <Info className="h-3.5 w-3.5 text-muted-foreground inline ml-1 align-middle" />
                            )}
                        </div>
                        {actions}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
                flex items-center gap-3 p-4 rounded-lg border bg-card text-card-foreground
                ${isFallbackCondition ? "border-dashed border-muted-foreground/30 bg-muted/20" : ""}
            `}
        >
            <div
                className={`
                    flex items-center justify-center w-10 h-10 rounded-full shrink-0
                    ${isCondition ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}
                    ${isFallbackCondition ? "opacity-50" : ""}
                `}
            >
                <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        Bước {step.stepOrder} — {STEP_TYPE_LABELS[step.stepType]}
                    </span>
                    {isFallbackCondition && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            Fallback
                        </span>
                    )}
                </div>
                <p
                    className={`text-sm text-muted-foreground truncate ${isFallbackCondition ? "italic" : ""}`}
                >
                    {summary}
                </p>
            </div>

            {actions}
        </div>
    );
}
