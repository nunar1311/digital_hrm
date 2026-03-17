"use client";

import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    LayoutGrid,
    Maximize2,
    Plus,
    MoreHorizontal,
    FileText,
    Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocEmptyStateCardProps {
    title?: string;
    emptyMessage?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function DocEmptyStateCard({
    title = "Docs",
    emptyMessage = "There are no Docs in this location yet.",
    actionLabel = "Add a Doc",
    onAction,
    className,
}: DocEmptyStateCardProps) {
    return (
        <Card
            className={cn(
                "border shadow-sm flex flex-col overflow-hidden",
                className
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/80 text-muted-foreground">
                        <LayoutGrid className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                    <button
                        type="button"
                        className="rounded p-2 hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="Fullscreen"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        className="rounded p-2 hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="Add"
                        onClick={onAction}
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        className="rounded p-2 hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="More options"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center py-12 px-4">
                <div className="relative mb-4">
                    <FileText className="h-16 w-16 text-muted-foreground/60" />
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-1 text-muted-foreground">
                        <Heart className="h-5 w-5" />
                    </span>
                </div>
                <p className="text-center text-sm text-muted-foreground mb-6 max-w-[240px]">
                    {emptyMessage}
                </p>
                <Button
                    onClick={onAction}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                >
                    {actionLabel}
                </Button>
            </CardContent>
        </Card>
    );
}
