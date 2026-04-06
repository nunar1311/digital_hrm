"use client";

import { ListFilter, RefreshCw, Search, Settings, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DepartmentBasic } from "../types";

interface ShiftSearchBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    totalCount: number;
    debouncedSearch: string;
    departments: DepartmentBasic[];
    departmentIds: string[];
    onDepartmentChange: (ids: string[]) => void;
    onRefresh?: () => void;
}

export function ShiftSearchBar({
    searchQuery,
    onSearchChange,
    departments,
    departmentIds,
    onDepartmentChange,
    onRefresh,
}: ShiftSearchBarProps) {
    const handleDepartmentToggle = (id: string) => {
        if (departmentIds.includes(id)) {
            onDepartmentChange(departmentIds.filter((d) => d !== id));
        } else {
            onDepartmentChange([...departmentIds, id]);
        }
    };

    const handleSelectAll = () => {
        onDepartmentChange([]);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative w-full max-w-50">
                <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm nhân viên..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8 h-6 "
                />
                {searchQuery && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="link"
                                size="icon-xs"
                                className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2"
                                onClick={() => onSearchChange("")}
                            >
                                <X />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Xóa tìm kiếm</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            {departments.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant={
                                departmentIds.length > 0
                                    ? "default"
                                    : "outline"
                            }
                            size="xs"
                        >
                            <ListFilter />
                            {departmentIds.length > 0 &&
                                `${departmentIds.length} phòng ban`}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuCheckboxItem
                            checked={departmentIds.length === 0}
                            onClick={handleSelectAll}
                        >
                            Tất cả phòng ban
                        </DropdownMenuCheckboxItem>
                        {departments.map((d) => (
                            <DropdownMenuCheckboxItem
                                key={d.id}
                                checked={departmentIds.includes(d.id)}
                                onClick={() =>
                                    handleDepartmentToggle(d.id)
                                }
                            >
                                {d.name}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={onRefresh}
                    >
                        <RefreshCw />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Tải lại dữ liệu</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon-xs">
                        <Settings />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Cài đặt</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
