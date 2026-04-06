"use client";

import { useMemo } from "react";
import type { DepartmentNode } from "@/types/org-chart";

interface OrgChartMiniMapProps {
    data: DepartmentNode[];
    onNavigate: (deptId: string) => void;
    zoom: number;
    pan: { x: number; y: number };
    containerSize: { width: number; height: number };
}

const MINIMAP_SCALE = 0.05;
const MINIMAP_SIZE = 150;

interface MiniNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hasChildren: boolean;
    isHighlighted: boolean;
}

export function OrgChartMiniMap({
    data,
    onNavigate,
    zoom,
    pan,
    containerSize,
}: OrgChartMiniMapProps) {
    const { nodes, viewBox } = useMemo(() => {
        const collectedNodes: MiniNode[] = [];
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        function traverse(items: DepartmentNode[], x: number, y: number, level: number) {
            for (const node of items) {
                const nodeWidth = 280 * MINIMAP_SCALE;
                const nodeHeight = 140 * MINIMAP_SCALE;
                const spacingX = 320 * MINIMAP_SCALE;
                const spacingY = 200 * MINIMAP_SCALE;

                collectedNodes.push({
                    id: node.id,
                    x: x,
                    y: y,
                    width: nodeWidth,
                    height: nodeHeight,
                    hasChildren: node.children.length > 0,
                    isHighlighted: false,
                });

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + nodeWidth);
                maxY = Math.max(maxY, y + nodeHeight);

                if (node.children.length > 0) {
                    const childCount = node.children.length;
                    const totalWidth = childCount * spacingX;
                    let startX = x - totalWidth / 2 + spacingX / 2;

                    for (let i = 0; i < childCount; i++) {
                        traverse(
                            [node.children[i]],
                            startX + i * spacingX,
                            y + spacingY,
                            level + 1
                        );
                    }
                }
            }
        }

        traverse(data, MINIMAP_SIZE / 2, 40, 0);

        const padding = 20;
        return {
            nodes: collectedNodes,
            viewBox: {
                x: minX - padding,
                y: minY - padding,
                width: maxX - minX + padding * 2,
                height: maxY - minY + padding * 2,
            },
        };
    }, [data]);

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const scaleX = MINIMAP_SIZE / viewBox.width;
        const scaleY = 100 / viewBox.height;

        const worldX = (clickX / scaleX) + viewBox.x;
        const worldY = (clickY / scaleY) + viewBox.y;

        const clickedNode = nodes.find(
            (n) =>
                worldX >= n.x &&
                worldX <= n.x + n.width &&
                worldY >= n.y &&
                worldY <= n.y + n.height
        );

        if (clickedNode) {
            onNavigate(clickedNode.id);
        }
    };

    if (data.length === 0) return null;

    return (
        <div className="absolute bottom-4 left-4 z-20">
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-md overflow-hidden">
                <svg
                    width={MINIMAP_SIZE}
                    height={100}
                    className="cursor-pointer"
                    onClick={handleClick}
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                >
                    {nodes.map((node) => (
                        <rect
                            key={node.id}
                            x={node.x}
                            y={node.y}
                            width={node.width}
                            height={node.height}
                            rx={2}
                            className="fill-primary/40 hover:fill-primary/70 transition-colors"
                        />
                    ))}
                </svg>
                <div className="px-2 py-1 text-[8px] text-muted-foreground text-center border-t">
                    Mini Map - Click để điều hướng
                </div>
            </div>
        </div>
    );
}
