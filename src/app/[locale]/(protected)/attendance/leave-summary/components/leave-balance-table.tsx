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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, RefreshCw, History, Edit } from "lucide-react";
import type { LeaveBalanceWithRelations } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("ProtectedPages");

    const getInitials = (name: string | null | undefined, fullName: string | null | undefined) => {
        const n = fullName || name || "";
        return n
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getCarriedForward = (balance: LeaveBalanceWithRelations): number => {
        const carriedForwardValue = (balance as LeaveBalanceWithRelations & {
            carriedForward?: number;
        }).carriedForward;
        return typeof carriedForwardValue === "number" ? carriedForwardValue : 0;
    };

    const getLeaveTypeColor = (balance: LeaveBalanceWithRelations): string | null => {
        const colorValue = (balance.leaveType as { color?: string } | undefined)?.color;
        return typeof colorValue === "string" && colorValue.trim().length > 0
            ? colorValue
            : null;
    };

    const getAvailable = (balance: LeaveBalanceWithRelations) => {
        return (
            balance.totalDays +
            getCarriedForward(balance) -
            balance.usedDays -
            balance.pendingDays
        );
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">
                            {t("attendanceLeaveBalanceTableHeadEmployee")}
                        </TableHead>
                        <TableHead>{t("attendanceLeaveBalanceTableHeadLeaveType")}</TableHead>
                        <TableHead className="text-right">
                            {t("attendanceLeaveBalanceTableHeadTotalDays")}
                        </TableHead>
                        <TableHead className="text-right">
                            {t("attendanceLeaveBalanceTableHeadUsedDays")}
                        </TableHead>
                        <TableHead className="text-right">
                            {t("attendanceLeaveBalanceTableHeadCarriedForward")}
                        </TableHead>
                        <TableHead className="text-right">
                            {t("attendanceLeaveBalanceTableHeadPendingDays")}
                        </TableHead>
                        <TableHead className="text-right">
                            {t("attendanceLeaveBalanceTableHeadRemaining")}
                        </TableHead>
                        <TableHead className="w-[80px]">
                            {t("attendanceLeaveBalanceTableHeadActions")}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="h-24 text-center text-muted-foreground"
                            >
                                {t("attendanceLeaveBalanceTableEmpty")}
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
                                                    t("attendanceLeaveBalanceTableNotAvailable")}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {balance.user?.department
                                                    ?.name ||
                                                    t("attendanceLeaveBalanceTableNoDepartment")}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {getLeaveTypeColor(balance) && (
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor: getLeaveTypeColor(balance) || undefined,
                                                }}
                                            />
                                        )}
                                        <span>
                                            {balance.leaveType?.name ||
                                                t("attendanceLeaveBalanceTableNotAvailable")}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {balance.totalDays}
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                    {balance.usedDays}
                                </TableCell>
                                <TableCell className="text-right text-blue-600">
                                    {getCarriedForward(balance)}
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
                                                {t("attendanceLeaveBalanceTableActionEdit")}
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
                                                {t("attendanceLeaveBalanceTableActionRecalculate")}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>
                                                <History className="mr-2 h-4 w-4" />
                                                {t("attendanceLeaveBalanceTableActionHistory")}
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
