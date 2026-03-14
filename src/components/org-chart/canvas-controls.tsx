"use client";

import { ZoomIn, ZoomOut, RotateCcw, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZOOM_CONFIG, TOOLTIPS } from "./org-chart-constants";

interface CanvasControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
    isLocked: boolean;
    onToggleLock: () => void;
}

export function CanvasControls({
    zoom,
    onZoomIn,
    onZoomOut,
    onResetView,
    isLocked,
    onToggleLock,
}: CanvasControlsProps) {
    return (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 items-center">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-md"
                disabled={isLocked}
                onClick={onZoomIn}
                title={TOOLTIPS.ZOOM_IN}
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
                onClick={onZoomOut}
                title={TOOLTIPS.ZOOM_OUT}
            >
                <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-md mt-1"
                disabled={isLocked}
                onClick={onResetView}
                title={TOOLTIPS.RESET_VIEW}
            >
                <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <div className="w-px h-3 bg-border my-1" />
            <Button
                variant={isLocked ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleLock}
                title={isLocked ? TOOLTIPS.UNLOCK : TOOLTIPS.LOCK}
            >
                {isLocked ? (
                    <Lock className="h-3.5 w-3.5" />
                ) : (
                    <Unlock className="h-3.5 w-3.5" />
                )}
            </Button>
        </div>
    );
}

export { ZOOM_CONFIG };
