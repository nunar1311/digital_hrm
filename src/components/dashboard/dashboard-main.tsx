"use client";

import { useEffect, useRef } from "react";
import { GridStack } from "gridstack";

import "gridstack/dist/gridstack.min.css";

import TotalTasksPieCard from "./cards/total-tasks-pie-card";
import OpenTasksBarCard from "./cards/open-tasks-bar-card";
import EmptyStateCard from "./cards/empty-state-card";

interface DashboardMainProps {
    editMode: boolean;
}

const DashboardMain = ({ editMode }: DashboardMainProps) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const gridStackRef = useRef<GridStack | null>(null);

    useEffect(() => {
        if (!gridRef.current) return;

        const grid = GridStack.init(
            {
                column: 12,
                cellHeight: 53,
                margin: 8,
                animate: true,
                staticGrid: true,
                float: false,
                resizable: {
                    handles: "w, s, e, n",
                },
                draggable: {
                    handle: ".grid-stack-item-content",
                },
            },
            gridRef.current,
        );

        gridStackRef.current = grid;

        return () => {
            grid.destroy(false);
            gridStackRef.current = null;
        };
    }, []);

    useEffect(() => {
        const grid = gridStackRef.current;
        if (!grid) return;
        grid.setStatic(!editMode);
    }, [editMode]);

    return (
        <div className="h-full w-full">
            <div ref={gridRef} className="grid-stack">
                <div
                    gs-id="total-tasks-pie"
                    gs-x="0"
                    gs-y="6"
                    gs-w="4"
                    gs-h="9"
                    className="grid-stack-item"
                >
                    <div className="grid-stack-item-content">
                        <TotalTasksPieCard />
                    </div>
                </div>
                <div
                    gs-id="open-tasks-bar"
                    gs-x="4"
                    gs-y="6"
                    gs-w="5"
                    gs-h="9"
                    className="grid-stack-item"
                >
                    <div className="grid-stack-item-content">
                        <OpenTasksBarCard />
                    </div>
                </div>
                <div
                    gs-id="tasks-completed-week"
                    gs-x="9"
                    gs-y="6"
                    gs-w="3"
                    gs-h="9"
                    className="grid-stack-item"
                >
                    <div className="grid-stack-item-content">
                        <EmptyStateCard title="Tasks Completed This Week" />
                    </div>
                </div>
                <div
                    gs-id="tasks-completed-month"
                    gs-x="0"
                    gs-y="15"
                    gs-w="9"
                    gs-h="9"
                    className="grid-stack-item"
                >
                    <div className="grid-stack-item-content">
                        <EmptyStateCard title="Tasks Completed This Month" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardMain;
