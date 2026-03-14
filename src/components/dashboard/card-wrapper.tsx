"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CardWrapperProps {
    id: string;
    title: string;
    children: React.ReactNode;
    isCustomizing: boolean;
    isVisible: boolean;
    onToggleVisibility: (id: string) => void;
    className?: string;
}

export function CardWrapper({
    id,
    title,
    children,
    isCustomizing,
    isVisible,
    onToggleVisibility,
    className,
}: CardWrapperProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled: !isCustomizing,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group",
                isDragging && "z-50 opacity-80",
                !isVisible && "hidden",
                className
            )}
        >
            {isCustomizing && (
                <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                    <Button
                        variant={isVisible ? "default" : "destructive"}
                        size="icon"
                        className="h-6 w-6 rounded-full shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(id);
                        }}
                    >
                        {isVisible ? (
                            <Eye className="h-3 w-3" />
                        ) : (
                            <EyeOff className="h-3 w-3" />
                        )}
                    </Button>
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-md cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical className="h-3 w-3" />
                    </div>
                </div>
            )}
            <div
                className={cn(
                    "h-full transition-all duration-200",
                    isCustomizing && "border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-muted-foreground/60"
                )}
            >
                {children}
            </div>
        </div>
    );
}
