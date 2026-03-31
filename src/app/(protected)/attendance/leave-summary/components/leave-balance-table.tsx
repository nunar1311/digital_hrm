"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
    User,
    MoreHorizontal,
    RefreshCw,
    History,
    Edit,
    Eye,
} from "lucide-react";
import type { LeaveBalanceWithRelations } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LeaveBalanceTableProps {
    data: LeaveBalanceWithRelations[];
    onEdit: (balance: LeaveBalanceWithRelations) => void;
    onRecalculate: (
        userId: string,
        leaveTypeId: string,
        year: number
    ) => void;
    year: number;
}

export function LeaveBalanceTable({
    data,
    onEdit,
    onRecalculate,
    year,
}: LeaveBalanceTableProps) {
    const getInitials = (name: string | null | undefined, fullName: string | null | undefined) => {
        const n = fullName || name || "";
        return n
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvailable = (balance: LeaveBalanceWithRelations) => {
        return (
            balance.totalDays +
            balance.carriedForward -
            balance.usedDays -
            balance.pendingDays
        );
    };

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Nhân viên</TableHead>
                        <TableHead>Loại nghỉ</TableHead>
                        <TableHead className="text-right">Tổng ngày</TableHead>
                        <TableHead className="text-right">Đã dùng</TableHead>
                        <TableHead className="text-right">Tích lũy</TableHead>
                        <TableHead className="text-right">Đang chờ</TableHead>
                        <TableHead className="text-right">Còn lại</TableHead>
                        <TableHead className="w-[80px]">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="h-24 text-center text-muted-foreground"
                            >
                                Không có dữ liệu số dư ngày nghỉ
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((balance) => (
                            <TableRow key={balance.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={balance.user?.avatar || undefined}
                                            />
                                            <AvatarFallback>
                                                {getInitials(
                                                    balance.user?.name,
                                                    balance.user?.fullName
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {balance.user?.fullName ||
                                                    balance.user?.name ||
                                                    "N/A"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {balance.user?.department
                                                    ?.name || "Không có phòng"}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {balance.leaveType?.color && (
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        balance.leaveType.color,
                                                }}
                                            />
                                        )}
                                        <span>{balance.leaveType?.name || "N/A"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {balance.totalDays}
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                    {balance.usedDays}
                                </TableCell>
                                <TableCell className="text-right text-blue-600">
                                    {balance.carriedForward}
                                </TableCell>
                                <TableCell className="text-right text-yellow-600">
                                    {balance.pendingDays}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        variant={
                                            getAvailable(balance) > 0
                                                ? "default"
                                                : "destructive"
                                        }
                                    >
                                        {getAvailable(balance)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => onEdit(balance)}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Chỉnh sửa
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    onRecalculate(
                                                        balance.userId,
                                                        balance.leaveTypeId,
                                                        year
                                                    )
                                                }
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Tính lại
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>
                                                <History className="mr-2 h-4 w-4" />
                                                Lịch sử
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
