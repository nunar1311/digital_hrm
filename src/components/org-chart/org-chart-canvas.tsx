"use client";

import {
    useRef,
    useState,
    useCallback,
    useEffect,
    useMemo,
} from "react";
import type { DepartmentNode } from "@/types/org-chart";
import { OrgChartNode } from "./org-chart-node";
import { Button } from "@/components/ui/button";
import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Lock,
    Unlock,
} from "lucide-react";
import {
    ZOOM_CONFIG,
    HELP_TEXT,
    CHART_THEMES,
    FUNCTIONAL_GROUP_COLORS,
    type ChartThemeId,
    type ChartCardStyle,
    type ChartLayoutMode,
} from "./org-chart-constants";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import { cn } from "@/lib/utils";

const { MIN: MIN_ZOOM, MAX: MAX_ZOOM, STEP: ZOOM_STEP } = ZOOM_CONFIG;

interface OrgChartCanvasProps {
    data: DepartmentNode[];
    expandedNodes: Set<string>;
    highlightedNodes: Set<string>;
    searchQuery: string;
    chartTheme?: ChartThemeId;
    cardStyle?: ChartCardStyle;
    chartLayout?: ChartLayoutMode;
    onToggleNode: (id: string) => void;
    onSelectNode: (id: string) => void;
    onDropEmployee: (
        employeeId: string,
        targetDeptId: string,
    ) => void;
    onDropDepartment: (
        draggedDeptId: string,
        targetDeptId: string,
    ) => void;
    isLocked?: boolean;
}

function countEmployees(n: DepartmentNode): number {
    return (n.employeeCount ?? 0) + n.children.reduce((s, c) => s + countEmployees(c), 0);
}

export function OrgChartCanvas({
    data,
    expandedNodes,
    highlightedNodes,
    searchQuery,
    chartTheme = "default",
    cardStyle = "default",
    chartLayout = "hierarchy",
    onToggleNode,
    onSelectNode,
    onDropEmployee,
    onDropDepartment,
    isLocked,
}: OrgChartCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(0.75);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });
    const [matrixLines, setMatrixLines] = useState<
        {
            id: string;
            d: string;
            endX: number;
            endY: number;
            arrowDir: "left" | "right" | "down";
        }[]
    >([]);
    const [hierarchyLines, setHierarchyLines] = useState<
        { id: string; d: string }[]
    >([]);

    // Keyboard shortcuts
    const zoomInRef = useCallback(() => {
        setZoom((z) =>
            Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)),
        );
    }, []);

    const zoomOutRef = useCallback(() => {
        setZoom((z) =>
            Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)),
        );
    }, []);

    const resetViewRef = useCallback(() => {
        setZoom(0.75);
        setPan({ x: 0, y: 0 });
    }, []);

    useKeyboardShortcuts({
        onZoomIn: zoomInRef,
        onZoomOut: zoomOutRef,
        onResetView: resetViewRef,
        enabled: !isLocked,
    });

    // --- Node movement ---
    const [nodeOffsets, setNodeOffsets] = useState<
        Record<string, { x: number; y: number }>
    >({});
    const movingNodeRef = useRef<{
        id: string;
        startX: number;
        startY: number;
        origOffset: { x: number; y: number };
    } | null>(null);

    const handleNodeMoveStart = useCallback(
        (nodeId: string, clientX: number, clientY: number) => {
            if (isLocked) return;
            const orig = nodeOffsets[nodeId] || { x: 0, y: 0 };
            movingNodeRef.current = {
                id: nodeId,
                startX: clientX,
                startY: clientY,
                origOffset: orig,
            };
        },
        [isLocked, nodeOffsets],
    );

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!movingNodeRef.current) return;
            const { id, startX, startY, origOffset } =
                movingNodeRef.current;
            const dx = (e.clientX - startX) / zoom;
            const dy = (e.clientY - startY) / zoom;
            setNodeOffsets((prev) => ({
                ...prev,
                [id]: {
                    x: origOffset.x + dx,
                    y: origOffset.y + dy,
                },
            }));
        };
        const handleUp = () => {
            movingNodeRef.current = null;
        };
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [zoom]);
    // ---------------------

    const handleWheel = useCallback(
        (e: WheelEvent) => {
            if (isLocked) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            setZoom((prev) =>
                Math.min(
                    MAX_ZOOM,
                    Math.max(MIN_ZOOM, +(prev + delta).toFixed(2)),
                ),
            );
        },
        [isLocked],
    );

    // Attach wheel listener with passive: false
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (isLocked) return;
            if (e.button !== 0) return;
            const target = e.target as HTMLElement;
            if (
                target.closest("button") ||
                target.closest("[data-interactive]") ||
                target.closest("[draggable]")
            )
                return;
            setIsPanning(true);
            panStartRef.current = {
                x: e.clientX - pan.x,
                y: e.clientY - pan.y,
            };
        },
        [pan, isLocked],
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isPanning) return;
            setPan({
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y,
            });
        },
        [isPanning],
    );

    const handleMouseUp = useCallback(() => setIsPanning(false), []);

    useEffect(() => {
        const up = () => setIsPanning(false);
        window.addEventListener("mouseup", up);
        return () => window.removeEventListener("mouseup", up);
    }, []);

    const resetView = useCallback(() => {
        setZoom(0.75);
        setPan({ x: 0, y: 0 });
    }, []);

    const hasData = data.length > 0;

    // --- All Lines Logic (hierarchy + matrix) ---
    const recalcAllLines = useCallback(() => {
        const containerEl = contentRef.current;
        if (!containerEl || !hasData) return;
        const containerRect = containerEl.getBoundingClientRect();
        // Compute actual zoom from DOM to stay in sync with CSS transitions
        const actualZoom =
            containerRect.width / containerEl.offsetWidth || 1;

        // Helper: get unscaled coords relative to content container
        const rel = (rect: DOMRect) => ({
            cx:
                (rect.left + rect.width / 2 - containerRect.left) /
                actualZoom,
            top: (rect.top - containerRect.top) / actualZoom,
            bottom: (rect.bottom - containerRect.top) / actualZoom,
            left: (rect.left - containerRect.left) / actualZoom,
            right: (rect.right - containerRect.left) / actualZoom,
            cy:
                (rect.top + rect.height / 2 - containerRect.top) /
                actualZoom,
        });

        // ── 1. Hierarchy lines ──
        const hPairs: { parentId: string; childId: string }[] = [];
        function collectHierarchy(nodes: DepartmentNode[]) {
            for (const n of nodes) {
                if (
                    n.children.length > 0 &&
                    (expandedNodes.has(n.id) || !n.parentId)
                ) {
                    for (const child of n.children) {
                        hPairs.push({
                            parentId: n.id,
                            childId: child.id,
                        });
                    }
                    collectHierarchy(n.children);
                }
            }
        }
        collectHierarchy(data);

        const newHLines: { id: string; d: string }[] = [];
        hPairs.forEach(({ parentId, childId }) => {
            const pEl = document.querySelector(
                `[data-dept-id="${parentId}"]`,
            );
            const cEl = document.querySelector(
                `[data-dept-id="${childId}"]`,
            );
            if (pEl && cEl) {
                const p = rel(pEl.getBoundingClientRect());
                const c = rel(cEl.getBoundingClientRect());
                const midY = p.bottom + (c.top - p.bottom) / 2;
                newHLines.push({
                    id: `h-${parentId}-${childId}`,
                    d: `M ${p.cx} ${p.bottom} L ${p.cx} ${midY} L ${c.cx} ${midY} L ${c.cx} ${c.top}`,
                });
            }
        });
        setHierarchyLines(newHLines);

        // ── 2. Matrix (secondary parent) lines ──
        const mLinks: { childId: string; parentId: string }[] = [];
        function walkMatrix(nodes: DepartmentNode[]) {
            for (const n of nodes) {
                if (
                    n.secondaryParentIds &&
                    n.secondaryParentIds.length > 0
                ) {
                    n.secondaryParentIds.forEach((pId) =>
                        mLinks.push({
                            childId: n.id,
                            parentId: pId,
                        }),
                    );
                }
                if (expandedNodes.has(n.id) || !n.parentId) {
                    walkMatrix(n.children);
                }
            }
        }
        walkMatrix(data);

        const newMLines: {
            id: string;
            d: string;
            endX: number;
            endY: number;
            arrowDir: "left" | "right" | "down";
        }[] = [];

        mLinks.forEach(({ childId, parentId }) => {
            const pEl = document.querySelector(
                `[data-dept-id="${parentId}"]`,
            );
            const cEl = document.querySelector(
                `[data-dept-id="${childId}"]`,
            );
            if (pEl && cEl) {
                const p = rel(pEl.getBoundingClientRect());
                const c = rel(cEl.getBoundingClientRect());

                let endX: number;
                let arrowDir: "left" | "right" | "down";
                if (p.cx <= c.cx) {
                    endX = c.left;
                    arrowDir = "right";
                } else {
                    endX = c.right;
                    arrowDir = "left";
                }
                const pathD = `M ${p.cx} ${p.bottom} L ${p.cx} ${c.cy} L ${endX + (arrowDir === "right" ? -2 : 2)} ${c.cy}`;
                newMLines.push({
                    id: `m-${parentId}-${childId}`,
                    d: pathD,
                    endX,
                    endY: c.cy,
                    arrowDir,
                });
            }
        });
        setMatrixLines(newMLines);
    }, [data, expandedNodes, hasData]);

    // Recalculate on data/expand/zoom changes (delay matches CSS transition)
    useEffect(() => {
        // Quick calc after DOM update + delayed calc after CSS transition (0.15s)
        const t1 = setTimeout(recalcAllLines, 20);
        const t2 = setTimeout(recalcAllLines, 180);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [recalcAllLines, zoom]);

    // Recalculate in real-time during node drag via rAF
    const rafRef = useRef<number>(0);
    useEffect(() => {
        if (Object.keys(nodeOffsets).length === 0) return;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(recalcAllLines);
        return () => cancelAnimationFrame(rafRef.current);
    }, [nodeOffsets, recalcAllLines]);
    // -------------------------

    return (
        <div className="relative flex-1 min-h-125 border-t bg-muted/30 overflow-hidden">
            {/* Grid background pattern */}
            <div
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, currentColor 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 items-center">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-md"
                    disabled={isLocked}
                    onClick={zoomInRef}
                >
                    <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <div className="text-[10px] font-mono text-muted-foreground bg-background/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm">
                    {Math.round(zoom * 100)}%
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-md"
                    disabled={isLocked}
                    onClick={zoomOutRef}
                >
                    <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-md mt-1"
                    disabled={isLocked}
                    onClick={resetView}
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="w-full h-full overflow-hidden select-none"
                style={{
                    cursor: isLocked
                        ? "default"
                        : isPanning
                          ? "grabbing"
                          : "grab",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <div
                    ref={contentRef}
                    className="inline-flex flex-col items-center p-12 min-w-full relative"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: "top left",
                        transition: isPanning
                            ? "none"
                            : "transform 0.15s ease-out",
                    }}
                >
                    {/* SVG Lines Overlay (hierarchy + matrix) */}
                    {(hierarchyLines.length > 0 ||
                        matrixLines.length > 0) && (
                        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                            <svg className="absolute inset-0 w-full h-full overflow-visible">
                                <defs>
                                    <marker
                                        id="arrowRight"
                                        markerWidth="6"
                                        markerHeight="10"
                                        refX="6"
                                        refY="5"
                                        orient="0"
                                    >
                                        <polygon
                                            points="0,0 6,5 0,10"
                                            className="fill-primary dark:fill-primary"
                                        />
                                    </marker>
                                    <marker
                                        id="arrowLeft"
                                        markerWidth="6"
                                        markerHeight="10"
                                        refX="0"
                                        refY="5"
                                        orient="0"
                                    >
                                        <polygon
                                            points="6,0 0,5 6,10"
                                            className="fill-primary dark:fill-primary"
                                        />
                                    </marker>
                                    <marker
                                        id="arrowDown"
                                        markerWidth="10"
                                        markerHeight="6"
                                        refX="5"
                                        refY="6"
                                        orient="0"
                                    >
                                        <polygon
                                            points="0,0 10,0 5,6"
                                            className="fill-primary"
                                        />
                                    </marker>
                                </defs>
                                {/* Hierarchy lines */}
                                {hierarchyLines.map((line) => (
                                    <path
                                        key={line.id}
                                        d={line.d}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-primary"
                                        markerEnd="url(#arrowDown)"
                                    />
                                ))}
                                {/* Matrix lines */}
                                {matrixLines.map((line) => (
                                    <path
                                        key={line.id}
                                        d={line.d}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-primary dark:text-primary"
                                        markerEnd={`url(#arrow${line.arrowDir === "right" ? "Right" : line.arrowDir === "left" ? "Left" : "Down"})`}
                                    />
                                ))}
                            </svg>
                        </div>
                    )}

                    {hasData ? (
                        chartLayout === "functional" ? (
                            <div className="flex flex-col gap-8 items-stretch w-full">
                                {data.map((rootNode, groupIndex) => {
                                    const groupColor =
                                        FUNCTIONAL_GROUP_COLORS[
                                            groupIndex % FUNCTIONAL_GROUP_COLORS.length
                                        ];
                                    const totalInGroup = countEmployees(rootNode);
                                    return (
                                        <div
                                            key={rootNode.id}
                                            className="flex flex-col items-center w-full"
                                        >
                                            <div
                                                className={cn(
                                                    "w-full py-2 px-4 rounded-t-lg text-white font-semibold text-sm flex items-center justify-between mb-2",
                                                    groupColor,
                                                )}
                                            >
                                                <span>{rootNode.name}</span>
                                                <span className="opacity-90">
                                                    {totalInGroup} nhân viên
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center w-full">
                                                <OrgChartBranch
                                                    node={rootNode}
                                                    expandedNodes={expandedNodes}
                                                    highlightedNodes={
                                                        highlightedNodes
                                                    }
                                                    searchQuery={searchQuery}
                                                    chartTheme={chartTheme}
                                                    cardStyle={cardStyle}
                                                    onToggleNode={onToggleNode}
                                                    onSelectNode={onSelectNode}
                                                    onDropEmployee={
                                                        onDropEmployee
                                                    }
                                                    onDropDepartment={
                                                        onDropDepartment
                                                    }
                                                    isLocked={isLocked}
                                                    nodeOffsets={nodeOffsets}
                                                    onNodeMoveStart={
                                                        handleNodeMoveStart
                                                    }
                                                    isRoot
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            data.map((node) => (
                                <OrgChartBranch
                                    key={node.id}
                                    node={node}
                                    expandedNodes={expandedNodes}
                                    highlightedNodes={highlightedNodes}
                                    searchQuery={searchQuery}
                                    chartTheme={chartTheme}
                                    cardStyle={cardStyle}
                                    onToggleNode={onToggleNode}
                                    onSelectNode={onSelectNode}
                                    onDropEmployee={onDropEmployee}
                                    onDropDepartment={onDropDepartment}
                                    isLocked={isLocked}
                                    nodeOffsets={nodeOffsets}
                                    onNodeMoveStart={handleNodeMoveStart}
                                    isRoot
                                />
                            ))
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                            <svg
                                className="h-20 w-20 mb-4 opacity-30"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                            <p className="text-lg font-semibold">
                                Chưa có dữ liệu phòng ban
                            </p>
                            <p className="text-sm mt-1">
                                Hãy tạo phòng ban đầu tiên
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Help text */}
            {hasData && (
                <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
                    🖱️ Cuộn = zoom • Kéo = di chuyển • Click = chi
                    tiết • Kéo thả nhân viên để chuyển phòng ban
                </div>
            )}
        </div>
    );
}

// ─── Recursive branch renderer ───
interface OrgChartBranchProps {
    node: DepartmentNode;
    expandedNodes: Set<string>;
    highlightedNodes: Set<string>;
    searchQuery: string;
    chartTheme?: ChartThemeId;
    cardStyle?: ChartCardStyle;
    onToggleNode: (id: string) => void;
    onSelectNode: (id: string) => void;
    onDropEmployee: (
        employeeId: string,
        targetDeptId: string,
    ) => void;
    onDropDepartment: (
        draggedDeptId: string,
        targetDeptId: string,
    ) => void;
    isLocked?: boolean;
    nodeOffsets: Record<string, { x: number; y: number }>;
    onNodeMoveStart: (
        nodeId: string,
        clientX: number,
        clientY: number,
    ) => void;
    isRoot?: boolean;
}

function OrgChartBranch({
    node,
    expandedNodes,
    highlightedNodes,
    searchQuery,
    chartTheme = "default",
    cardStyle = "default",
    onToggleNode,
    onSelectNode,
    onDropEmployee,
    onDropDepartment,
    isLocked,
    nodeOffsets,
    onNodeMoveStart,
    isRoot = false,
}: OrgChartBranchProps) {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isHighlighted =
        highlightedNodes.size > 0 && highlightedNodes.has(node.id);
    const isDimmed =
        highlightedNodes.size > 0 && !highlightedNodes.has(node.id);
    const offset = nodeOffsets[node.id];

    return (
        <div
            className="flex flex-col items-center"
            style={
                offset
                    ? {
                          transform: `translate(${offset.x}px, ${offset.y}px)`,
                          zIndex: 10,
                      }
                    : undefined
            }
        >
            {/* Spacer for layout (line drawn via SVG) */}
            {!isRoot && <div className="w-px h-8" />}

            <OrgChartNode
                node={node}
                isExpanded={isExpanded}
                isHighlighted={isHighlighted}
                isDimmed={isDimmed}
                searchQuery={searchQuery}
                hasChildren={hasChildren}
                themeBorderClass={CHART_THEMES[chartTheme]?.border}
                cardStyle={cardStyle}
                onToggle={() => onToggleNode(node.id)}
                onSelect={() => onSelectNode(node.id)}
                onDropEmployee={onDropEmployee}
                onDropDepartment={onDropDepartment}
                isLocked={isLocked}
                onMoveStart={onNodeMoveStart}
            />

            {hasChildren && isExpanded && (
                <div className="flex flex-col items-center">
                    {/* Spacer (line drawn via SVG) */}
                    <div className="w-px h-8" />
                    <div className="flex items-start gap-0">
                        {node.children.map((child) => (
                            <div
                                key={child.id}
                                className="flex flex-col items-center relative"
                            >
                                <OrgChartBranch
                                    node={child}
                                    expandedNodes={expandedNodes}
                                    highlightedNodes={
                                        highlightedNodes
                                    }
                                    searchQuery={searchQuery}
                                    chartTheme={chartTheme}
                                    cardStyle={cardStyle}
                                    onToggleNode={onToggleNode}
                                    onSelectNode={onSelectNode}
                                    onDropEmployee={onDropEmployee}
                                    onDropDepartment={
                                        onDropDepartment
                                    }
                                    isLocked={isLocked}
                                    nodeOffsets={nodeOffsets}
                                    onNodeMoveStart={onNodeMoveStart}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
