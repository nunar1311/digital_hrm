import { useState, useCallback } from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DEPARTMENT_STATUS_OPTIONS } from "@/app/(protected)/departments/constants";
import type { DepartmentListItem } from "@/app/(protected)/departments/types";

interface DepartmentToolbarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    parentFilter: string;
    onParentFilterChange: (value: string) => void;
    allDepartments: DepartmentListItem[];
    onCreateClick: () => void;
    isLoading?: boolean;
}

export function DepartmentToolbar({
    searchValue,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    parentFilter,
    onParentFilterChange,
    allDepartments,
    onCreateClick,
    isLoading,
}: DepartmentToolbarProps) {
    const [localSearch, setLocalSearch] = useState(searchValue);

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalSearch(e.target.value);
        },
        []
    );

    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                onSearchChange(localSearch);
            }
        },
        [localSearch, onSearchChange]
    );

    const handleSearchBlur = useCallback(() => {
        onSearchChange(localSearch);
    }, [localSearch, onSearchChange]);

    const hasActiveFilters =
        statusFilter !== "ALL" || parentFilter !== "all" || searchValue !== "";

    const clearFilters = useCallback(() => {
        setLocalSearch("");
        onSearchChange("");
        onStatusFilterChange("ALL");
        onParentFilterChange("all");
    }, [onSearchChange, onStatusFilterChange, onParentFilterChange]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div className="flex flex-1 gap-2 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm phòng ban..."
                            value={localSearch}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            onBlur={handleSearchBlur}
                            className="pl-8"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            {DEPARTMENT_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={parentFilter} onValueChange={onParentFilterChange}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Phòng ban cha" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="none">Không có (gốc)</SelectItem>
                            {allDepartments
                                .filter((d) => d.parentId === null)
                                .map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-muted-foreground"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Xóa lọc
                        </Button>
                    )}
                </div>

                <Button onClick={onCreateClick} disabled={isLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm phòng ban
                </Button>
            </div>
        </div>
    );
}
