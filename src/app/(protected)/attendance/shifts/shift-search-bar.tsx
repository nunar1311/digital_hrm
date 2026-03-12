"use client";

import { Search, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { DepartmentBasic } from "../types";

interface ShiftSearchBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    totalCount: number;
    debouncedSearch: string;
    departments: DepartmentBasic[];
    departmentId: string;
    onDepartmentChange: (id: string) => void;
}

export function ShiftSearchBar({
    searchQuery,
    onSearchChange,
    totalCount,
    debouncedSearch,
    departments,
    departmentId,
    onDepartmentChange,
}: ShiftSearchBarProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm nhân viên theo tên hoặc mã..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-8"
                />
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                        onClick={() => onSearchChange("")}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            {departments.length > 0 && (
                <Select
                    value={departmentId || "all"}
                    onValueChange={(val) =>
                        onDepartmentChange(val === "all" ? "" : val)
                    }
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Tất cả phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            Tất cả phòng ban
                        </SelectItem>
                        {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                                {d.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
