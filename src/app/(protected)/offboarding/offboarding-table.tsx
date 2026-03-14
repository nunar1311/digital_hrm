"use client";

import { Eye, CheckCircle, Trash2, User, Calendar, FileText, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OffboardingListItem, OffboardingStatus } from "./types";
import { OFFBOARDING_STATUS_LABELS, OFFBOARDING_STATUS_COLORS } from "./types";
import { useTimezone } from "@/hooks/use-timezone";

interface OffboardingTableProps {
    offboardings: OffboardingListItem[];
    isLoading: boolean;
    canManage: boolean;
    onComplete?: (id: string) => void;
    onDelete?: (id: string) => void;
}

function StatusBadge({ status }: { status: OffboardingStatus }) {
    const colorClass = OFFBOARDING_STATUS_COLORS[status];
    return (
        <Badge className={`${colorClass} text-white`}>
            {OFFBOARDING_STATUS_LABELS[status]}
        </Badge>
    );
}
export function OffboardingTable({
    offboardings,
    isLoading,
    canManage,
    onComplete,
    onDelete,
}: OffboardingTableProps) {
    const { formatDate, timezone } = useTimezone();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Đang tải...</div>
            </div>
        );
    }

    if (offboardings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có quy trình offboarding nào</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Ngày nghỉ</TableHead>
                    <TableHead>Ngày làm cuối</TableHead>
                    <TableHead>Mẫu</TableHead>
                    <TableHead>Checklist</TableHead>
                    <TableHead>Tài sản</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {offboardings.map((offboarding) => (
                    <TableRow key={offboarding.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={offboarding.user.image || undefined} />
                                    <AvatarFallback>
                                        {offboarding.user.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{offboarding.user.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {offboarding.user.employeeCode || offboarding.user.email}
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-pointer">
                                            {formatDate(offboarding.resignDate, { day: "2-digit", month: "2-digit", year: "numeric" })}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ngày nộp đơn</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                        <TableCell>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-pointer font-medium">
                                            {formatDate(offboarding.lastWorkDate, { day: "2-digit", month: "2-digit", year: "numeric" })}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ngày làm việc cuối cùng</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                        <TableCell>
                            {offboarding.template ? (
                                <Badge variant="outline">
                                    {offboarding.template.name}
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground text-sm">Mặc định</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{offboarding._count.checklist} công việc</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span>{offboarding._count.assets} tài sản</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={offboarding.status as OffboardingStatus} />
                        </TableCell>
                        <TableCell>
                            <div className="text-sm text-muted-foreground">
                                {formatDate(offboarding.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/offboarding/${offboarding.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Xem chi tiết</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {canManage && offboarding.status === "PROCESSING" && (
                                    <>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onComplete?.(offboarding.id)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Hoàn thành</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDelete?.(offboarding.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Xóa</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
