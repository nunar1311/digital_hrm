"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import type { DepartmentNode } from "@/types/org-chart";
import { OrgChartToolbar } from "./org-chart-toolbar";
import { OrgChartCanvas } from "./org-chart-canvas";
import { DepartmentDetailPanel } from "./department-detail-panel";
import { DepartmentFormDialog } from "./department-form-dialog";
import {
    getDepartmentTree,
    moveEmployeeToDepartment,
    updateDepartment,
    applyCompanyStructureTemplate,
} from "@/app/(protected)/org-chart/actions";
import { toast } from "sonner";
import { TemplatePreviewDialog } from "./template-preview-dialog";
import { useSocketEvents } from "@/hooks/use-socket-event";
import type { ServerToClientEvents } from "@/lib/socket/types";

interface OrgChartViewProps {
    data: DepartmentNode[];
}

function collectAllIds(nodes: DepartmentNode[]): Set<string> {
    const ids = new Set<string>();
    function walk(items: DepartmentNode[]) {
        for (const node of items) {
            ids.add(node.id);
            walk(node.children);
        }
    }
    walk(nodes);
    return ids;
}

function findNodeById(
    nodes: DepartmentNode[],
    id: string,
): DepartmentNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNodeById(node.children, id);
        if (found) return found;
    }
    return null;
}

export function OrgChartView({
    data: initialData,
}: OrgChartViewProps) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
        () => collectAllIds(initialData),
    );
    const [selectedDeptId, setSelectedDeptId] = useState<
        string | null
    >(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editDeptId, setEditDeptId] = useState<string | null>(null);
    const [templateToApply, setTemplateToApply] = useState<
        string | null
    >(null);

    const { data: treeData = [] } = useQuery({
        queryKey: ["departmentTree"],
        queryFn: () => getDepartmentTree(),
        initialData,
    });

    useEffect(() => {
        setExpandedNodes(collectAllIds(treeData));
    }, [treeData]);

    // === Real-time WebSocket listeners ===
    const orgChartEvents: (keyof ServerToClientEvents)[] = [
        "department:created",
        "department:updated",
        "department:deleted",
        "department:employee-moved",
        "department:template-applied",
    ];

    useSocketEvents(orgChartEvents, () => {
        queryClient.invalidateQueries({
            queryKey: ["departmentTree"],
        });
    });

    // Highlighted nodes from search
    const filteredHighlights = useMemo(() => {
        if (!searchQuery.trim()) return new Set<string>();
        const query = searchQuery.toLowerCase();
        const matches = new Set<string>();

        function findMatches(nodes: DepartmentNode[]) {
            for (const node of nodes) {
                const nameMatch = node.name
                    .toLowerCase()
                    .includes(query);
                const codeMatch = node.code
                    .toLowerCase()
                    .includes(query);
                const managerMatch = node.manager?.name
                    .toLowerCase()
                    .includes(query);
                const empMatch = node.employees?.some(
                    (e) =>
                        e.name.toLowerCase().includes(query) ||
                        e.employeeCode?.toLowerCase().includes(query),
                );

                if (
                    nameMatch ||
                    codeMatch ||
                    managerMatch ||
                    empMatch
                ) {
                    matches.add(node.id);
                    let parentId = node.parentId;
                    while (parentId) {
                        matches.add(parentId);
                        const parent = findNodeById(
                            treeData,
                            parentId,
                        );
                        parentId = parent?.parentId ?? null;
                    }
                }
                findMatches(node.children);
            }
        }
        findMatches(treeData);
        return matches;
    }, [treeData, searchQuery]);

    const toggleNode = useCallback((id: string) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const isExpanded = expandedNodes.size > 0;

    const toggleExpandAll = useCallback(() => {
        if (expandedNodes.size > 0) {
            setExpandedNodes(new Set());
        } else {
            setExpandedNodes(collectAllIds(treeData));
        }
    }, [expandedNodes.size, treeData]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Drag & drop mutation
    const moveEmployeeMutation = useMutation({
        mutationFn: async ({
            employeeId,
            targetDeptId,
        }: {
            employeeId: string;
            targetDeptId: string;
        }) => {
            return moveEmployeeToDepartment(employeeId, targetDeptId);
        },
        onMutate: async ({ employeeId, targetDeptId }) => {
            await queryClient.cancelQueries({
                queryKey: ["departmentTree"],
            });
            const previousData = queryClient.getQueryData<
                DepartmentNode[]
            >(["departmentTree"]);

            // Optimistic update
            queryClient.setQueryData<DepartmentNode[]>(
                ["departmentTree"],
                (old) => {
                    if (!old) return old;
                    const clone = JSON.parse(
                        JSON.stringify(old),
                    ) as DepartmentNode[];
                    let movedEmployee: DepartmentNode["employees"] extends
                        | (infer T)[]
                        | undefined
                        ? T
                        : never;

                    function removeEmp(nodes: DepartmentNode[]) {
                        for (const n of nodes) {
                            if (n.employees) {
                                const idx = n.employees.findIndex(
                                    (e) => e.id === employeeId,
                                );
                                if (idx !== -1) {
                                    movedEmployee = n.employees[idx];
                                    n.employees.splice(idx, 1);
                                    n.employeeCount = Math.max(
                                        0,
                                        n.employeeCount - 1,
                                    );
                                }
                            }
                            removeEmp(n.children);
                        }
                    }

                    function addEmp(nodes: DepartmentNode[]) {
                        for (const n of nodes) {
                            if (
                                n.id === targetDeptId &&
                                movedEmployee
                            ) {
                                if (!n.employees) n.employees = [];
                                n.employees.push(movedEmployee);
                                n.employeeCount += 1;
                            }
                            addEmp(n.children);
                        }
                    }

                    removeEmp(clone);
                    addEmp(clone);
                    return clone;
                },
            );

            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ["departmentTree"],
                    context.previousData,
                );
            }
            toast.error("Lỗi khi chuyển nhân viên");
        },
        onSuccess: (result, variables) => {
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
                queryClient.invalidateQueries({
                    queryKey: ["departmentTree"],
                });
            }
        },
        onSettled: () => {
            // Background refetch to ensure sync
            queryClient.invalidateQueries({
                queryKey: ["departmentTree"],
            });
        },
    });

    // Move department mutation (re-parent)
    const moveDepartmentMutation = useMutation({
        mutationFn: async ({
            draggedDeptId,
            targetParentId,
        }: {
            draggedDeptId: string;
            targetParentId: string;
        }) => {
            return updateDepartment(draggedDeptId, {
                parentId: targetParentId,
            });
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.message);
                queryClient.invalidateQueries({
                    queryKey: ["departmentTree"],
                });
            } else {
                toast.error(result.message);
            }
        },
        onError: () => {
            toast.error("Lỗi khi di chuyển phòng ban");
        },
    });

    const applyTemplateMutation = useMutation({
        mutationFn: async (templateId: string) => {
            return applyCompanyStructureTemplate(templateId);
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.message);
                setTemplateToApply(null);
                queryClient.invalidateQueries({
                    queryKey: ["departmentTree"],
                });
            } else {
                toast.error(result.message);
            }
        },
        onError: () => {
            toast.error("Lỗi khi áp dụng mẫu cơ cấu");
            setTemplateToApply(null);
        },
    });

    const handleDropEmployee = useCallback(
        (employeeId: string, targetDeptId: string) => {
            moveEmployeeMutation.mutate({ employeeId, targetDeptId });
        },
        [moveEmployeeMutation],
    );

    const handleDropDepartment = useCallback(
        (draggedDeptId: string, targetDeptId: string) => {
            // Prevent dropping a department onto its own descendant
            const draggedNode = findNodeById(treeData, draggedDeptId);
            if (draggedNode) {
                const isDescendant = findNodeById(
                    draggedNode.children,
                    targetDeptId,
                );
                if (isDescendant) {
                    toast.error(
                        "Không thể di chuyển phòng ban vào phòng ban con của nó",
                    );
                    return;
                }
            }
            moveDepartmentMutation.mutate({
                draggedDeptId,
                targetParentId: targetDeptId,
            });
        },
        [moveDepartmentMutation, treeData],
    );

    const selectedDept = selectedDeptId
        ? findNodeById(treeData, selectedDeptId)
        : null;

    return (
        <div className="flex flex-col gap-4 h-full relative">
            <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none">
                <div className="pointer-events-auto">
                    <OrgChartToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        isExpanded={isExpanded}
                        onToggleExpand={toggleExpandAll}
                        onToggleFullscreen={toggleFullscreen}
                        isFullscreen={isFullscreen}
                        isLocked={isLocked}
                        onToggleLock={() =>
                            setIsLocked((prev) => !prev)
                        }
                        matchCount={filteredHighlights.size}
                        onCreateDepartment={() =>
                            setShowCreateDialog(true)
                        }
                        onApplyTemplate={(templateId) =>
                            setTemplateToApply(templateId)
                        }
                    />
                </div>
            </div>

            <OrgChartCanvas
                data={treeData}
                expandedNodes={expandedNodes}
                highlightedNodes={filteredHighlights}
                searchQuery={searchQuery}
                isLocked={isLocked}
                onToggleNode={toggleNode}
                onSelectNode={setSelectedDeptId}
                onDropEmployee={handleDropEmployee}
                onDropDepartment={handleDropDepartment}
            />

            <DepartmentDetailPanel
                department={selectedDept}
                onClose={() => setSelectedDeptId(null)}
                onEdit={(id) => {
                    setEditDeptId(id);
                    setSelectedDeptId(null);
                }}
            />

            <DepartmentFormDialog
                open={showCreateDialog || editDeptId !== null}
                onClose={() => {
                    setShowCreateDialog(false);
                    setEditDeptId(null);
                }}
                department={
                    editDeptId
                        ? findNodeById(treeData, editDeptId)
                        : null
                }
                allDepartments={treeData}
            />

            <TemplatePreviewDialog
                open={templateToApply !== null}
                onClose={() => setTemplateToApply(null)}
                templateId={templateToApply}
                isApplying={applyTemplateMutation.isPending}
                onApply={(id) => {
                    applyTemplateMutation.mutate(id);
                }}
            />
        </div>
    );
}
