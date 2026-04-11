"use client";

import { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { EmployeeListItem } from "./employee-list-item";

interface Employee {
    id: string;
    name: string;
    username?: string | null;
    position?: string | null;
    image?: string | null;
    email?: string | null;
    phone?: string | null;
}

interface EmployeePopoverProps {
    employees: Employee[];
    trigger?: React.ReactNode;
    onViewProfile?: (id: string) => void;
}

export function EmployeePopover({
    employees,
    trigger,
    onViewProfile,
}: EmployeePopoverProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEmployees = employees.filter((emp) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            emp.name.toLowerCase().includes(query) ||
            emp.username?.toLowerCase().includes(query) ||
            emp.position?.toLowerCase().includes(query)
        );
    });

    const defaultTrigger = (
        <div className="flex items-center gap-1 bg-muted/80 hover:bg-muted rounded-full pl-1 pr-2 py-0.5 text-[10px] cursor-pointer transition-colors">
            <UserPlus className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">
                Xem tất cả ({employees.length})
            </span>
        </div>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || defaultTrigger}
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Tìm nhân viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-7 h-8 text-sm"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <EmployeeListItem
                                    key={emp.id}
                                    employee={emp}
                                    showActions={false}
                                    onViewProfile={onViewProfile}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Không tìm thấy nhân viên
                            </p>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
