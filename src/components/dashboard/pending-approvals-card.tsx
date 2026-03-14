"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CalendarClock, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getPendingApprovals } from "@/app/(protected)/(dashboard)/actions";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PendingApprovalsData {
    overtime: Array<{
        id: string;
        type: "overtime";
        employeeId: string;
        employeeName: string;
        employeeCode: string | null;
        date: string;
        hours: number;
        reason: string;
        startTime: string;
        endTime: string;
        status: string;
        createdAt: string;
    }>;
    explanations: Array<{
        id: string;
        type: "explanation";
        employeeId: string;
        employeeName: string;
        employeeCode: string | null;
        date: string;
        typeDetail: string;
        reason: string;
        status: string;
        createdAt: string;
    }>;
    leaves: Array<unknown>;
    canApproveOvertime: boolean;
    canApproveExplanation: boolean;
    canApproveLeave: boolean;
}

function PendingApprovalsSkeleton() {
    return (
        <Card className="border shadow-sm">
            <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded mt-1" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ExplanationTypeBadge({ type }: { type: string }) {
    const styles: Record<string, string> = {
        LATE: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
        EARLY_LEAVE: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
        ABSENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        FORGOT_CHECKOUT: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
        OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
    
    const labels: Record<string, string> = {
        LATE: "Đi muộn",
        EARLY_LEAVE: "Về sớm",
        ABSENT: "Vắng mặt",
        FORGOT_CHECKOUT: "Quên checkout",
        OTHER: "Khác",
    };
    
    return (
        <Badge className={cn("text-xs", styles[type] || styles.OTHER)}>
            {labels[type] || type}
        </Badge>
    );
}

function ApprovalItem({
    item,
    onApprove,
    onReject,
    isProcessing,
}: {
    item: PendingApprovalsData["overtime"][0] | PendingApprovalsData["explanations"][0];
    onApprove: (id: string, type: string) => void;
    onReject: (id: string, type: string) => void;
    isProcessing: boolean;
}) {
    const isOvertime = item.type === "overtime";
    
    return (
        <div className="flex items-start justify-between py-3 border-b last:border-0">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                        {item.employeeName}
                    </span>
                    {item.employeeCode && (
                        <Badge variant="outline" className="text-[10px]">
                            {item.employeeCode}
                        </Badge>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">
                    {isOvertime ? (
                        <span>
                            Ngày {item.date} • {item.hours}h ({item.startTime} - {item.endTime})
                        </span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <ExplanationTypeBadge type={(item as PendingApprovalsData["explanations"][0]).typeDetail} />
                            <span>Ngày {item.date}</span>
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {item.reason}
                </p>
            </div>
            <div className="flex items-center gap-1 ml-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={() => onApprove(item.id, item.type)}
                    disabled={isProcessing}
                >
                    <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => onReject(item.id, item.type)}
                    disabled={isProcessing}
                >
                    <XCircle className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function PendingApprovalsCard() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ["pending-approvals"],
        queryFn: async () => getPendingApprovals() as Promise<PendingApprovalsData>,
    });
    
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    const handleApprove = async (id: string, type: string) => {
        setProcessingId(id);
        try {
            // TODO: Implement approval action
            console.log(`Approving ${type} ${id}`);
            refetch();
        } catch (error) {
            console.error("Error approving:", error);
        } finally {
            setProcessingId(null);
        }
    };
    
    const handleReject = async (id: string, type: string) => {
        setProcessingId(id);
        try {
            // TODO: Implement rejection action
            console.log(`Rejecting ${type} ${id}`);
            refetch();
        } catch (error) {
            console.error("Error rejecting:", error);
        } finally {
            setProcessingId(null);
        }
    };
    
    if (isLoading) {
        return <PendingApprovalsSkeleton />;
    }
    
    if (!data) {
        return null;
    }
    
    const totalPending = data.overtime.length + data.explanations.length + data.leaves.length;
    const canApproveAny = data.canApproveOvertime || data.canApproveExplanation || data.canApproveLeave;
    
    if (!canApproveAny) {
        return null;
    }
    
    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Đơn cần duyệt
                    </CardTitle>
                    {totalPending > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {totalPending}
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    {data.canApproveOvertime && "OT • "}
                    {data.canApproveExplanation && "Giải trình • "}
                    {data.canApproveLeave && "Nghỉ phép"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {totalPending === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                        <p className="text-sm">Không có đơn chờ duyệt</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[280px] pr-2">
                        {/* Overtime Requests */}
                        {data.overtime.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CalendarClock className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Làm thêm giờ ({data.overtime.length})
                                    </span>
                                </div>
                                {data.overtime.map((item) => (
                                    <ApprovalItem
                                        key={item.id}
                                        item={item}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        isProcessing={processingId === item.id}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {/* Explanations */}
                        {data.explanations.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-amber-500" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Giải trình ({data.explanations.length})
                                    </span>
                                </div>
                                {data.explanations.map((item) => (
                                    <ApprovalItem
                                        key={item.id}
                                        item={item}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        isProcessing={processingId === item.id}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {/* Leave Requests */}
                        {data.leaves.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <CalendarClock className="h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Nghỉ phép ({data.leaves.length})
                                    </span>
                                </div>
                                {/* Leave items would go here */}
                            </div>
                        )}
                    </ScrollArea>
                )}
                
                {totalPending > 0 && (
                    <div className="mt-4 pt-3 border-t">
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/attendance">
                                Xem tất cả đơn
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
