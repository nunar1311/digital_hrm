"use client";

import Link from "next/link";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Mail, Phone, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Employee {
    id: string;
    name: string;
    employeeCode?: string | null;
    position?: string | null;
    image?: string | null;
    email?: string | null;
    phone?: string | null;
}

interface EmployeeListItemProps {
    employee: Employee;
    showActions?: boolean;
    onViewProfile?: (id: string) => void;
}

export function EmployeeListItem({
    employee,
    showActions = true,
    onViewProfile,
}: EmployeeListItemProps) {
    const initials = employee.name
        .split(" ")
        .slice(-1)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border text-sm group">
            <Avatar className="h-7 w-7">
                <AvatarImage src={employee.image ?? undefined} />
                <AvatarFallback className="text-[9px] bg-muted font-bold">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <p className="font-medium text-xs truncate">{employee.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate">{employee.position}</span>
                    {employee.employeeCode && (
                        <>
                            <span>•</span>
                            <span className="font-mono">{employee.employeeCode}</span>
                        </>
                    )}
                </div>
            </div>
            {showActions && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreVertical className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        {onViewProfile && (
                            <DropdownMenuItem onClick={() => onViewProfile(employee.id)}>
                                Xem hồ sơ
                            </DropdownMenuItem>
                        )}
                        {employee.email && (
                            <DropdownMenuItem>
                                <Mail className="mr-2 h-3 w-3" />
                                Gửi email
                            </DropdownMenuItem>
                        )}
                        {employee.phone && (
                            <DropdownMenuItem>
                                <Phone className="mr-2 h-3 w-3" />
                                Gọi điện
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
