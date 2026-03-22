"use client";

import { X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@mantine/hooks";

export interface ColumnOption {
    key: string;
    label: string;
    icon: React.ElementType;
}

export interface TableSettingsPanelProps {
    open: boolean;
    onClose: (open: boolean) => void;
    columnVisibility: Record<string, boolean>;
    setColumnVisibility: React.Dispatch<
        React.SetStateAction<Record<string, boolean>>
    >;
    columnOptions: ColumnOption[];
    showEmptyDepartments?: boolean;
    setShowEmptyDepartments?: (value: boolean) => void;
    wrapText?: boolean;
    setWrapText?: (value: boolean) => void;
    disabledColumnIndices?: number[];
    hiddenColumnIndices?: number[];
    defaultVisibleColumns?: Record<string, boolean>;
}

export function TableSettingsPanel({
    open,
    onClose,
    columnVisibility,
    setColumnVisibility,
    columnOptions,
    showEmptyDepartments,
    setShowEmptyDepartments,
    wrapText,
    setWrapText,
    disabledColumnIndices = [],
    hiddenColumnIndices = [],
    defaultVisibleColumns,
}: TableSettingsPanelProps) {
    const panelRef = useClickOutside(() => {
        if (open) onClose(false);
    });

    const hasGeneralToggles =
        setShowEmptyDepartments !== undefined ||
        setWrapText !== undefined;

    return (
        <div
            ref={panelRef}
            className={cn(
                "absolute top-10 right-0 bottom-0 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden z-20 bg-background border-l",
                open ? "w-72" : "w-0 border-0",
            )}
        >
            <div className="flex flex-col h-full w-72">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b">
                    <span className="text-sm font-semibold">
                        Tùy chỉnh hiển thị
                    </span>
                    <Button
                        size="icon-xs"
                        variant="secondary"
                        onClick={() => onClose(false)}
                        className="h-6 w-6"
                    >
                        <X className="size-3.5" />
                    </Button>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-auto pt-2">
                    {hasGeneralToggles && (
                        <>
                            <div className="px-2 min-w-0 flex flex-col">
                                {setShowEmptyDepartments !== undefined && (
                                    <div
                                        className={buttonVariants({
                                            variant: "ghost",
                                            size: "sm",
                                            className:
                                                "justify-between! px-0",
                                        })}
                                    >
                                        <Label htmlFor="show-empty-departments">
                                            Hiện phòng ban trống
                                        </Label>
                                        <Switch
                                            id="show-empty-departments"
                                            checked={showEmptyDepartments}
                                            onCheckedChange={
                                                setShowEmptyDepartments
                                            }
                                        />
                                    </div>
                                )}
                                {setWrapText !== undefined && (
                                    <div
                                        className={buttonVariants({
                                            variant: "ghost",
                                            size: "sm",
                                            className:
                                                "justify-between! px-0",
                                        })}
                                    >
                                        <Label htmlFor="wrap-text">
                                            Xuống dòng
                                        </Label>
                                        <Switch
                                            id="wrap-text"
                                            checked={wrapText}
                                            onCheckedChange={setWrapText}
                                        />
                                    </div>
                                )}
                            </div>
                            <Separator className="my-2" />
                        </>
                    )}

                    <div className="px-2 min-w-0 flex flex-col">
                        {defaultVisibleColumns && (
                            <span
                                className="text-xs text-end font-medium text-muted-foreground cursor-pointer hover:underline mb-1"
                                onClick={() =>
                                    setColumnVisibility(defaultVisibleColumns)
                                }
                            >
                                Ẩn tất cả cột
                            </span>
                        )}
                        {columnOptions.map((option, index) => {
                            const isDisabled =
                                disabledColumnIndices.includes(index);
                            const isHidden =
                                hiddenColumnIndices.includes(index);
                            return (
                                <div
                                    key={option.key}
                                    className={cn(
                                        buttonVariants({
                                            variant: "ghost",
                                            size: "sm",
                                            className:
                                                "justify-between! px-2 ",
                                        }),
                                        (isDisabled || isHidden) &&
                                            "opacity-50 cursor-not-allowed",
                                        isHidden && "hidden",
                                    )}
                                    aria-disabled={isDisabled || isHidden}
                                >
                                    <Label
                                        htmlFor={`column-${option.key}`}
                                        className={
                                            "flex items-center gap-2"
                                        }
                                    >
                                        <option.icon className="size-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {option.label}
                                        </span>
                                    </Label>
                                    <Switch
                                        id={`column-${option.key}`}
                                        checked={
                                            columnVisibility[
                                                option.key as keyof typeof columnVisibility
                                            ] ?? false
                                        }
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({
                                                ...prev,
                                                [option.key]: checked,
                                            }))
                                        }
                                        disabled={isDisabled}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
