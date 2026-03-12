"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    COMPANY_STRUCTURE_TEMPLATES,
    type TemplateDepartment,
} from "@/lib/org-chart-templates";
import { AlertCircle, ChevronRight, Building2 } from "lucide-react";
import { DEPARTMENT_ICONS } from "./icon-picker";

interface TemplatePreviewDialogProps {
    open: boolean;
    onClose: () => void;
    templateId: string | null;
    onApply: (templateId: string) => void;
    isApplying?: boolean;
}

function PreviewNode({
    node,
    depth = 0,
}: {
    node: TemplateDepartment;
    depth?: number;
}) {
    const iconObj =
        DEPARTMENT_ICONS[node.logo as keyof typeof DEPARTMENT_ICONS];
    const Icon = iconObj ? iconObj.icon : Building2;

    return (
        <div className="flex flex-col gap-2">
            <div
                className="flex items-center gap-2 p-2 rounded-md border bg-card text-card-foreground shadow-sm"
                style={{ marginLeft: `${depth * 1.5}rem` }}
            >
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate block">
                        {node.name}
                        {node.secondaryParentCodes &&
                            node.secondaryParentCodes.length > 0 && (
                                <span className="ml-2 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 font-normal">
                                    + Nối thêm từ{" "}
                                    {node.secondaryParentCodes.join(
                                        ", ",
                                    )}
                                </span>
                            )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1 block">
                        {node.description}
                    </p>
                </div>
            </div>
            {node.children && node.children.length > 0 && (
                <div className="flex flex-col gap-2 relative">
                    <div
                        className="absolute left-[13px] top-0 bottom-4 w-px bg-border z-0"
                        style={{ marginLeft: `${depth * 1.5}rem` }}
                    />
                    {node.children.map((child, idx) => (
                        <div key={idx} className="relative z-10">
                            <PreviewNode
                                node={child}
                                depth={depth + 1}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function TemplatePreviewDialog({
    open,
    onClose,
    templateId,
    onApply,
    isApplying = false,
}: TemplatePreviewDialogProps) {
    const template = COMPANY_STRUCTURE_TEMPLATES.find(
        (t) => t.id === templateId,
    );

    if (!template) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        Xem trước: {template.name}
                    </DialogTitle>
                    <DialogDescription>
                        Cấu trúc phòng ban sẽ được tạo theo mẫu này.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4 min-h-[300px]">
                    <div className="flex items-start gap-3 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-1">
                                Cảnh báo xóa dữ liệu hiện tại
                            </p>
                            <p>
                                Khi áp dụng mẫu,{" "}
                                <strong>
                                    toàn bộ phòng ban hiện tại sẽ bị
                                    xóa
                                </strong>
                                . Nhân viên và chức vụ sẽ được giữ lại
                                nhưng sẽ bị gỡ khỏi phòng ban cũ. Hành
                                động này không thể hoàn tác.
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 bg-muted/30 border rounded-md overflow-hidden">
                        <ScrollArea className="h-full p-4">
                            <div className="flex flex-col gap-4">
                                {template.departments.map(
                                    (dept, idx) => (
                                        <PreviewNode
                                            key={idx}
                                            node={dept}
                                        />
                                    ),
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isApplying}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={() => onApply(template.id)}
                        disabled={isApplying}
                    >
                        {isApplying
                            ? "Đang áp dụng..."
                            : "Đồng ý áp dụng mẫu này"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
