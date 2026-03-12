"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    Maximize2,
    Minimize2,
    FoldVertical,
    UnfoldVertical,
    Plus,
    LayoutTemplate,
    Lock,
    Unlock,
    X,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COMPANY_STRUCTURE_TEMPLATES } from "@/lib/org-chart-templates";

interface OrgChartToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    isLocked: boolean;
    onToggleLock: () => void;
    matchCount: number;
    onCreateDepartment: () => void;
    onApplyTemplate: (templateId: string) => void;
}

export function OrgChartToolbar({
    searchQuery,
    onSearchChange,
    isExpanded,
    onToggleExpand,
    onToggleFullscreen,
    isFullscreen,
    isLocked,
    onToggleLock,
    matchCount,
    onCreateDepartment,
    onApplyTemplate,
}: OrgChartToolbarProps) {
    const onSearchClear = () => {
        onSearchChange("");
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-50 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm phòng ban, nhân viên..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9 bg-accent"
                />
                {searchQuery && matchCount > 0 && (
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold bg-primary text-primary-foreground rounded-sm size-5.5 flex items-center justify-center shadow-sm">
                        {matchCount}
                    </span>
                )}
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={onSearchClear}
                        title="Xóa tìm kiếm"
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onToggleExpand}
                    title={
                        isExpanded
                            ? "Thu gọn tất cả"
                            : "Mở rộng tất cả"
                    }
                >
                    {isExpanded ? (
                        <FoldVertical className="h-3.5 w-3.5" />
                    ) : (
                        <UnfoldVertical className="h-3.5 w-3.5" />
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 gap-1.5 text-xs"
                    onClick={onToggleFullscreen}
                    title={
                        isFullscreen
                            ? "Thoát toàn màn hình"
                            : "Toàn màn hình"
                    }
                >
                    {isFullscreen ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                    )}
                </Button>

                <Button
                    variant={isLocked ? "default" : "outline"}
                    size="icon"
                    className="gap-1.5 text-xs"
                    onClick={onToggleLock}
                    title={
                        isLocked
                            ? "Mở khóa khung hình"
                            : "Khóa khung hình"
                    }
                >
                    {isLocked ? (
                        <Lock className="h-3.5 w-3.5" />
                    ) : (
                        <Unlock className="h-3.5 w-3.5" />
                    )}
                </Button>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="secondary"
                        className="gap-1.5 text-xs ml-auto border"
                    >
                        <LayoutTemplate className="h-3.5 w-3.5" />
                        Mẫu cơ cấu
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    {COMPANY_STRUCTURE_TEMPLATES.map((t) => (
                        <DropdownMenuItem
                            key={t.id}
                            onClick={() => onApplyTemplate(t.id)}
                            className="cursor-pointer"
                        >
                            {t.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={onCreateDepartment}>
                <Plus className="h-3.5 w-3.5" />
                Thêm phòng ban
            </Button>
        </div>
    );
}
