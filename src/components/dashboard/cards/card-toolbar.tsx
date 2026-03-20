"use client";

import {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    GripVertical,
    Maximize2,
    MoreHorizontal,
    Settings,
    Trash2,
    X,
} from "lucide-react";
import { useGridStackContext } from "@/contexts/grid-stack-context";
import { useGridStackWidgetContext } from "@/contexts/grid-stack-widget-context";
import { useClickOutside } from "@mantine/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cardRegistry } from "@/contexts/fullscreen-card-registry";
import { useFullscreenCardContext } from "@/contexts/fullscreen-card-context";

export interface CardToolbarRef {
    openSettings: () => void;
    closeSettings: () => void;
}

const CardToolbar = forwardRef<
    CardToolbarRef,
    {
        children: React.ReactNode;
        title: string;
        settingsContent?: React.ReactNode;
    }
>(({ children, title, settingsContent }, ref) => {
    const { editMode, removeWidget } = useGridStackContext() ?? {
        editMode: false,
        removeWidget: undefined,
    };
    const { widget } = useGridStackWidgetContext() ?? {
        widget: null,
    };
    const { openFullscreen } = useFullscreenCardContext();

    const [settingsOpen, setSettingsOpen] = useState(false);

    const settingsPanelRef = useClickOutside(() => {
        if (settingsOpen) setSettingsOpen(false);
    });

    useImperativeHandle(ref, () => ({
        openSettings: () => setSettingsOpen(true),
        closeSettings: () => setSettingsOpen(false),
    }));

    // Register this card in the registry when title/content changes
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!widget?.id) return;
        cardRegistry.register({
            id: widget.id,
            title,
            content: <div ref={contentRef}>{children}</div>,
        });
        return () => {
            cardRegistry.unregister(widget.id);
        };
    }, [widget?.id, title, children]);

    const handleOpenFullscreen = () => {
        if (!widget?.id) return;
        const allCards = cardRegistry.getAll();
        const idx = allCards.findIndex((c) => c.id === widget.id);
        openFullscreen(idx >= 0 ? idx : 0);
    };

    return (
        <Card className="h-full gap-0 py-0 group/card [--toolbar-height:40px] [--toolbar-row-height:40px] overflow-hidden relative">
            <div className="absolute flex flex-col justify-center top-0 left-0 right-0 z-0 h-(--toolbar-height)">
                <div className="flex h-(--toolbar-row-height) py-3 pr-3 pl-1">
                    <div className="grow h-6 flex items-center w-full">
                        <div
                            className={`dragging w-3 h-full flex items-center justify-center grow-0 shrink transition-opacity ${!editMode ? "opacity-0" : "opacity-0 group-hover/card:opacity-100 cursor-grab"}`}
                        >
                            <GripVertical className="size-4" />
                        </div>
                        {/* Title */}
                        <div className="grow flex items-center min-w-0 h-full pl-1">
                            <p className="text-sm font-bold truncate">
                                {title}
                            </p>
                        </div>

                        {/* Actions */}
                        <div
                            className={`flex items-center self-end justify-between shrink h-full max-w-[94%] z-11 `}
                        >
                            <div className="flex shrink min-w-0 items-center justify-end ml-4">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() =>
                                            setSettingsOpen(true)
                                        }
                                        className={`${!editMode ? "hidden" : " group-hover/card:flex invisible group-hover/card:visible"}`}
                                    >
                                        <Settings className="size-3.5" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        tooltip={
                                            "Xem ở chế độ toàn màn hình"
                                        }
                                        onClick={handleOpenFullscreen}
                                        className="group-hover/card:opacity-100 opacity-0"
                                    >
                                        <Maximize2 className="size-3.5" />
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className={`${!editMode ? "hidden" : " group-hover/card:flex invisible group-hover/card:visible"}`}
                                            >
                                                <MoreHorizontal className="size-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-40"
                                        >
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => {
                                                    if (
                                                        widget?.id &&
                                                        removeWidget
                                                    ) {
                                                        removeWidget(
                                                            widget.id,
                                                        );
                                                        toast.success(
                                                            `Đã xóa thẻ "${title}"`,
                                                        );
                                                    }
                                                }}
                                            >
                                                <Trash2 className="size-3.5" />
                                                Xóa
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[calc(100%-var(--toolbar-height))] w-full relative top-(--toolbar-height) flex flex-col">
                <CardContent className="px-4 pb-4 flex-1 min-h-0 min-w-0 flex items-center justify-center relative">
                    {children}
                </CardContent>
            </div>

            {/* ── Settings Panel (slides in from right, inside card) ── */}
            {settingsContent && (
                <div
                    ref={settingsPanelRef}
                    className={cn(
                        "absolute top-0 right-0 bottom-0 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden z-20 bg-background border-l",
                        settingsOpen ? "w-72" : "w-0 border-0",
                    )}
                >
                    <div className="flex flex-col h-full w-72">
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-4 py-3 shrink-0">
                            <span className="text-sm font-semibold">
                                Tùy chỉnh hiển thị
                            </span>
                            <Button
                                size="icon-xs"
                                variant="secondary"
                                onClick={() => setSettingsOpen(false)}
                                className="h-6 w-6"
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>

                        {/* Panel content */}
                        <div className="flex-1 overflow-auto pt-1">
                            {settingsContent}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
});

CardToolbar.displayName = "CardToolbar";

export default CardToolbar;
