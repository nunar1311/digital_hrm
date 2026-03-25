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

interface StepCardProps {
    step: ApprovalStep;
    index: number;
    summary: string;
    approverIcon: string;
    canEdit: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
}

export function StepCard({
    step,
    index,
    summary,
    approverIcon,
    canEdit,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
}: StepCardProps) {
    const Icon = ICON_MAP[approverIcon] || User;
    const isCondition = step.stepType === "CONDITION";
    const isOtherCondition =
        isCondition && step.priority === undefined;

    return (
        <div
            className={`
                flex items-center gap-3 p-4 rounded-lg border bg-card text-card-foreground
                ${isOtherCondition ? "border-dashed border-muted-foreground/30 bg-muted/20" : ""}
            `}
        >
            {/* Icon */}
            <div
                className={`
                    flex items-center justify-center w-10 h-10 rounded-full shrink-0
                    ${isCondition ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}
                    ${isOtherCondition ? "opacity-50" : ""}
                `}
            >
                <Icon className="h-5 w-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        Bước {step.stepOrder} — {STEP_TYPE_LABELS[step.stepType]}
                    </span>
                    {isOtherCondition && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            Fallback
                        </span>
                    )}
                </div>
                <p className={`text-sm text-muted-foreground truncate ${isOtherCondition ? "italic" : ""}`}>
                    {summary}
                </p>
            </div>

            {/* Actions */}
            {canEdit && (
                <div className="flex items-center gap-1 shrink-0">
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
                            {!isOtherCondition && (
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Xóa bước
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
}
