"use client";

import {
    useState,
    useMemo,
    useEffect,
    useCallback,
    useRef,
} from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import type { DepartmentNode } from "@/types/org-chart";
import {
    OrgChartToolbar,
    ViewMode,
    StatusFilter,
} from "./org-chart-toolbar";
import {
    type ChartThemeId,
    type ChartCardStyle,
    type ChartLayoutMode,
} from "./org-chart-constants";
import { OrgChartCanvas } from "./org-chart-canvas";
import { DepartmentDetailPanel } from "./department-detail-panel";
import { DepartmentFormDialog } from "./department-form-dialog";
import { BulkMoveBar } from "./bulk-move-bar";
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
import { ANIMATION_CONFIG } from "./org-chart-constants";
import { cn } from "@/lib/utils";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    Mail,
    Phone,
    Briefcase,
    Building2,
    Users,
    ChevronRight,
} from "lucide-react";
import "@/app/(protected)/org-chart/print.css";

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

// Cache for node lookups
const nodeCache = new Map<string, DepartmentNode>();
function buildNodeCache(nodes: DepartmentNode[]) {
    nodeCache.clear();
    function traverse(items: DepartmentNode[]) {
        for (const node of items) {
            nodeCache.set(node.id, node);
            traverse(node.children);
        }
    }
    traverse(nodes);
}

function findNodeByIdCached(id: string): DepartmentNode | null {
    return nodeCache.get(id) ?? null;
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

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
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
    const [viewMode, setViewMode] = useState<ViewMode>("tree");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
    const canvasRef = useRef<HTMLDivElement>(null);

    // Cá nhân hóa & layout (persist in localStorage)
    const [chartTheme, setChartTheme] = useState<ChartThemeId>(() => {
        if (typeof window === "undefined") return "default";
        return (
            (localStorage.getItem("orgChartTheme") as ChartThemeId) ||
            "default"
        );
    });
    const [cardStyle, setCardStyle] = useState<ChartCardStyle>(() => {
        if (typeof window === "undefined") return "default";
        return (
            (localStorage.getItem(
                "orgChartCardStyle",
            ) as ChartCardStyle) || "default"
        );
    });
    const [chartLayout, setChartLayout] = useState<ChartLayoutMode>(
        () => {
            if (typeof window === "undefined") return "hierarchy";
            return (
                (localStorage.getItem(
                    "orgChartLayout",
                ) as ChartLayoutMode) || "hierarchy"
            );
        },
    );

    useEffect(() => {
        try {
            localStorage.setItem("orgChartTheme", chartTheme);
            localStorage.setItem("orgChartCardStyle", cardStyle);
            localStorage.setItem("orgChartLayout", chartLayout);
        } catch {
            // ignore
        }
    }, [chartTheme, cardStyle, chartLayout]);

    const handleShare = useCallback(() => {
        const url =
            typeof window !== "undefined" ? window.location.href : "";
        navigator.clipboard?.writeText(url).then(
            () => toast.success("Đã sao chép liên kết vào clipboard"),
            () => toast.error("Không thể sao chép liên kết"),
        );
    }, []);

    const handleExportImage = useCallback(() => {
        toast.info(
            'Xuất ảnh: dùng chức năng In (Ctrl+P) và chọn "Lưu dưới dạng PDF" để xuất.',
        );
    }, []);

    // Debounce search query for performance
    const debouncedSearchQuery = useDebounce(
        searchQuery,
        ANIMATION_CONFIG.DEBOUNCE_DELAY,
    );

    const { data: treeData = [] } = useQuery({
        queryKey: ["departmentTree"],
        queryFn: () => getDepartmentTree(),
        initialData,
    });

    useEffect(() => {
        setExpandedNodes(collectAllIds(treeData));
    }, [treeData]);

    // Build cache when treeData changes
    useEffect(() => {
        buildNodeCache(treeData);
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
            queryClient.invalidateQueries({
                queryKey: ["departmentTree"],
            });
        },
    });

    // Undo/Redo
    const handleUndo = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["departmentTree"] });
        toast.info("Đã hoàn tác thao tác trước đó");
    }, [queryClient]);

    const handleRedo = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["departmentTree"] });
        toast.info("Đã làm lại thao tác");
    }, [queryClient]);

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

    // Bulk selection
    const handleToggleEmployee = useCallback((employeeId: string) => {
        setSelectedEmployeeIds((prev) => {
            const next = new Set(prev);
            if (next.has(employeeId)) {
                next.delete(employeeId);
            } else {
                next.add(employeeId);
            }
            return next;
        });
    }, []);

    const clearEmployeeSelection = useCallback(() => {
        setSelectedEmployeeIds(new Set());
    }, []);

    // Bulk move
    const handleBulkMove = useCallback(
        (employeeIds: string[], targetDeptId: string) => {
            for (const empId of employeeIds) {
                moveEmployeeMutation.mutate({
                    employeeId: empId,
                    targetDeptId,
                });
            }
            clearEmployeeSelection();
        },
        [moveEmployeeMutation, clearEmployeeSelection],
    );

    // Undo/Redo
    const { undo, redo, canUndo, canRedo } = useUndoRedo<DepartmentNode[]>({
        initialState: treeData,
        maxHistory: 30,
    });

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

    // Flatten tree for list view with status filter
    const flatDepartments = useMemo(() => {
        const result: DepartmentNode[] = [];
        function flatten(nodes: DepartmentNode[]) {
            for (const node of nodes) {
                if (
                    statusFilter === "all" ||
                    node.status === statusFilter
                ) {
                    result.push(node);
                }
                flatten(node.children);
            }
        }
        flatten(treeData);
        return result;
    }, [treeData, statusFilter]);

    // Filter by search query
    const filteredDepartments = useMemo(() => {
        if (!debouncedSearchQuery.trim()) return flatDepartments;
        const query = debouncedSearchQuery.toLowerCase();
        return flatDepartments.filter(
            (dept) =>
                dept.name.toLowerCase().includes(query) ||
                dept.code.toLowerCase().includes(query) ||
                dept.manager?.name.toLowerCase().includes(query),
        );
    }, [flatDepartments, debouncedSearchQuery]);

    const renderListView = () => (
        <div className="flex-1 overflow-auto p-4 pt-20">
            <div className="grid gap-3">
                {filteredDepartments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <Building2 className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-semibold">
                            Không tìm thấy phòng ban
                        </p>
                        <p className="text-sm mt-1">
                            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                    </div>
                ) : (
                    filteredDepartments.map((dept) => (
                        <div
                            key={dept.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors",
                                selectedDeptId === dept.id &&
                                    "border-primary ring-1 ring-primary",
                            )}
                            onClick={() => setSelectedDeptId(dept.id)}
                        >
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold truncate">
                                        {dept.name}
                                    </h3>
                                    <Badge
                                        variant={
                                            dept.status === "ACTIVE"
                                                ? "default"
                                                : "secondary"
                                        }
                                        className="text-xs"
                                    >
                                        {dept.status === "ACTIVE"
                                            ? "Hoạt động"
                                            : "Ngừng"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {dept.code} •{" "}
                                    {dept.employeeCount || 0} nhân
                                    viên
                                </p>
                            </div>
                            {dept.manager && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={
                                                dept.manager.image ??
                                                undefined
                                            }
                                            alt={dept.manager.name}
                                        />
                                        <AvatarFallback className="text-xs">
                                            {dept.manager.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-sm shrink-0">
                                        <p className="font-medium truncate max-w-24">
                                            {dept.manager.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate max-w-24">
                                            {dept.manager.position}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );

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
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        chartTheme={chartTheme}
                        onChartThemeChange={setChartTheme}
                        cardStyle={cardStyle}
                        onCardStyleChange={setCardStyle}
                        chartLayout={chartLayout}
                        onChartLayoutChange={setChartLayout}
                        onShare={handleShare}
                        onExportImage={handleExportImage}
                        canvasRef={canvasRef}
                    />
                </div>
            </div>

            {viewMode === "list" ? (
                renderListView()
            ) : (
                <OrgChartCanvas
                    data={treeData}
                    expandedNodes={expandedNodes}
                    highlightedNodes={filteredHighlights}
                    searchQuery={searchQuery}
                    chartTheme={chartTheme}
                    cardStyle={cardStyle}
                    chartLayout={chartLayout}
                    isLocked={isLocked}
                    canvasRef={canvasRef}
                    selectedEmployees={selectedEmployeeIds}
                    onToggleEmployee={handleToggleEmployee}
                    onToggleNode={toggleNode}
                    onSelectNode={setSelectedDeptId}
                    onDropEmployee={handleDropEmployee}
                    onDropDepartment={handleDropDepartment}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                />
            )}

            {/* Bulk Move Bar */}
            {selectedEmployeeIds.size > 0 && (
                <BulkMoveBar
                    selectedEmployeeIds={selectedEmployeeIds}
                    allDepartments={treeData}
                    onMove={handleBulkMove}
                    onClear={clearEmployeeSelection}
                    isPending={moveEmployeeMutation.isPending}
                />
            )}

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
