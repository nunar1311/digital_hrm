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
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-background border border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all group">
            <Avatar className="h-10 w-10 border border-primary/10">
                <AvatarImage src={employee.image ?? undefined} />
                <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-bold">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">{employee.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="truncate">{employee.position || "Chưa có vị trí"}</span>
                    {employee.employeeCode && (
                        <>
                            <span>•</span>
                            <span className="font-mono text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{employee.employeeCode}</span>
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
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        {onViewProfile && (
                            <DropdownMenuItem onClick={() => onViewProfile(employee.id)} className="cursor-pointer">
                                Xem hồ sơ
                            </DropdownMenuItem>
                        )}
                        {employee.email && (
                            <DropdownMenuItem className="cursor-pointer">
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                Gửi email
                            </DropdownMenuItem>
                        )}
                        {employee.phone && (
                            <DropdownMenuItem className="cursor-pointer">
                                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                Gọi điện
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
