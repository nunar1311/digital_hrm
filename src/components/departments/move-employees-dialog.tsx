"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Building2,
    CheckIcon,
    ChevronDownIcon,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { getDepartmentTree } from "@/app/[locale]/(protected)/org-chart/actions";
import { updateEmployeesDepartment } from "@/app/[locale]/(protected)/employees/actions";
import { toast } from "sonner";
import DynamicIcon from "../DynamicIcon";
import { useTranslations } from "next-intl";

interface MoveEmployeesDialogProps {
    open: boolean;
    onClose: () => void;
    selectedIds: string[];
    currentDepartmentId: string;
    currentDepartmentName: string;
    onMoved: () => void;
}

export function MoveEmployeesDialog({
    open,
    onClose,
    selectedIds,
    currentDepartmentId,
    currentDepartmentName,
    onMoved,
}: MoveEmployeesDialogProps) {
    const t = useTranslations("ProtectedPages");
    const [targetDepartmentId, setTargetDepartmentId] =
        useState<string>("");
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: departmentTree = [], isLoading } = useQuery({
        queryKey: ["department-tree-for-move"],
        queryFn: getDepartmentTree,
    });

    // Flatten the department tree to show all departments (not just roots)
    const departments = useMemo(() => {
        type DeptNode = (typeof departmentTree)[number];
        const flat: (DeptNode & { depth: number })[] = [];
        const flatten = (nodes: DeptNode[], depth: number) => {
            for (const node of nodes) {
                flat.push({ ...node, depth });
                if (node.children?.length) {
                    flatten(node.children as DeptNode[], depth + 1);
                }
            }
        };
        flatten(departmentTree, 0);
        return flat;
    }, [departmentTree]);

    const filteredDepartments = useMemo(
        () =>
            departments.filter(
                (d) =>
                    d.id !== currentDepartmentId &&
                    d.status !== "INACTIVE",
            ),
        [departments, currentDepartmentId],
    );

    const selectedDepartment = departments.find(
        (d) => d.id === targetDepartmentId,
    );

    const handleMove = async () => {
        if (!targetDepartmentId) return;
        if (targetDepartmentId === currentDepartmentId) {
            toast.error(t("departmentEmployeesMoveSameDepartmentError"));
            return;
        }

        setIsSubmitting(true);
        try {
            const count = await updateEmployeesDepartment(
                selectedIds,
                targetDepartmentId,
            );
            toast.success(
                t("departmentEmployeesMoveSuccess", { count }),
            );
            onMoved();
            onClose();
            setTargetDepartmentId("");
        } catch {
            toast.error(t("departmentEmployeesMoveError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            setTargetDepartmentId("");
            setPopoverOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{t("departmentEmployeesMoveTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("departmentEmployeesMoveDescription", {
                            count: selectedIds.length,
                            from: currentDepartmentName,
                        })}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <Popover
                                open={popoverOpen}
                                onOpenChange={setPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        aria-expanded={popoverOpen}
                                        className={cn(
                                            "w-full justify-between font-normal",
                                            !targetDepartmentId &&
                                                "text-muted-foreground",
                                        )}
                                        role="combobox"
                                        variant="outline"
                                    >
                                        <span className="truncate flex items-center gap-2">
                                            {targetDepartmentId ? (
                                                <>
                                                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    {
                                                        selectedDepartment?.name
                                                    }
                                                </>
                                            ) : (
                                                t("departmentEmployeesMoveSelectTarget")
                                            )}
                                        </span>
                                        <ChevronDownIcon
                                            aria-hidden="true"
                                            className={cn(
                                                "shrink-0 text-muted-foreground/80 transition-transform",
                                                popoverOpen &&
                                                    "rotate-180",
                                            )}
                                            size={16}
                                        />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    className="w-full min-w-(--radix-popper-anchor-width) p-0"
                                >
                                    <Command>
                                        <CommandInput placeholder={t("departmentEmployeesMoveSearchDepartment")} />
                                        <CommandList>
                                            <CommandEmpty>
                                                {t("departmentEmployeesMoveDepartmentNotFound")}
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {filteredDepartments.map(
                                                    (dept) => (
                                                        <CommandItem
                                                            key={
                                                                dept.id
                                                            }
                                                            value={
                                                                dept.name
                                                            }
                                                            onSelect={(
                                                                currentValue,
                                                            ) => {
                                                                setTargetDepartmentId(
                                                                    dept.id,
                                                                );
                                                                setPopoverOpen(
                                                                    false,
                                                                );
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-2",
                                                            )}
                                                        >
                                                            {dept.logo ? (
                                                                <DynamicIcon
                                                                    iconName={
                                                                        dept.logo
                                                                    }
                                                                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                                                />
                                                            ) : (
                                                                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                            )}
                                                            <span className="truncate">
                                                                {
                                                                    dept.name
                                                                }
                                                            </span>
                                                            {targetDepartmentId ===
                                                                dept.id && (
                                                                <CheckIcon className="ml-auto shrink-0 h-4 w-4 text-primary" />
                                                            )}
                                                        </CommandItem>
                                                    ),
                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {targetDepartmentId && (
                                <p className="text-xs text-muted-foreground">
                                    {t("departmentEmployeesMoveToLabel")}{" "}
                                    <strong className="text-foreground">
                                        {selectedDepartment?.name}
                                    </strong>
                                </p>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        {t("departmentEmployeesCancel")}
                    </Button>
                    <Button
                        onClick={handleMove}
                        disabled={!targetDepartmentId || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" />
                                {t("departmentEmployeesMoveProcessing")}
                            </>
                        ) : (
                            t("departmentEmployeesMoveDepartment")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

