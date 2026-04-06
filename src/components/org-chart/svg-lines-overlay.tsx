"use client";

import type { DepartmentNode } from "@/types/org-chart";

interface SvgLinesOverlayProps {
    hierarchyLines: { id: string; d: string }[];
    matrixLines: {
        id: string;
        d: string;
        endX: number;
        endY: number;
        arrowDir: "left" | "right" | "down";
    }[];
    hasLines: boolean;
}

export function SvgLinesOverlay({
    hierarchyLines,
    matrixLines,
    hasLines,
}: SvgLinesOverlayProps) {
    if (!hasLines) return null;

    return (
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
    );
}
