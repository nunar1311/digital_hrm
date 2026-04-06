"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMinus, Users, CheckCircle2, Clock, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    getOffboardings,
    getOffboardingStats,
    getOffboardingTemplates,
    updateOffboarding,
    deleteOffboarding,
} from "./actions";
import { OffboardingTable } from "./offboarding-table";
import { CreateOffboardingDialog } from "./create-offboarding-dialog";
import type { OffboardingListItem, OffboardingStatus, OffboardingTemplate } from "./types";

interface OffboardingStats {
    total: number;
    processing: number;
    completed: number;
    thisMonth: number;
}

export function OffboardingClient({
    initialOffboardings,
    initialStats,
    canManage,
}: {
    initialOffboardings: OffboardingListItem[];
    initialStats: OffboardingStats;
    canManage: boolean;
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const queryClient = useQueryClient();

    // Queries
    const { data: offboardings = initialOffboardings, isLoading: isLoadingList } = useQuery({
        queryKey: ["offboardings", search, statusFilter],
        queryFn: () => getOffboardings({
            search: search || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
        }),
        initialData: initialOffboardings,
    });

    const { data: stats = initialStats } = useQuery({
        queryKey: ["offboarding-stats"],
        queryFn: getOffboardingStats,
        initialData: initialStats,
    });

    const { data: templates = [] } = useQuery({
        queryKey: ["offboarding-templates"],
        queryFn: getOffboardingTemplates,
    });

    // Filter offboardings by status for tabs
    const processingOffboardings = offboardings.filter((o) => o.status === "PROCESSING");
    const completedOffboardings = offboardings.filter((o) => o.status === "COMPLETED");

    // Mutations
    const completeMutation = useMutation({
        mutationFn: ({ id }: { id: string }) =>
            updateOffboarding(id, { status: "COMPLETED" }),
        onSuccess: () => {
            toast.success("Đã hoàn thành quy trình offboarding");
            queryClient.invalidateQueries({ queryKey: ["offboardings"] });
            queryClient.invalidateQueries({ queryKey: ["offboarding-stats"] });
        },
        onError: (error) => {
            toast.error("Lỗi khi cập nhật trạng thái");
            console.error(error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOffboarding,
        onSuccess: () => {
            toast.success("Đã xóa quy trình offboarding");
            queryClient.invalidateQueries({ queryKey: ["offboardings"] });
            queryClient.invalidateQueries({ queryKey: ["offboarding-stats"] });
        },
        onError: (error) => {
            toast.error("Lỗi khi xóa");
            console.error(error);
        },
    });

    const handleClearSearch = () => {
        setSearch("");
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Offboarding - Quy trình nghỉ việc
                    </h1>
                    <p className="text-muted-foreground">
                        Quản lý quy trình nghỉ việc của nhân viên
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4" /> Tạo quy trình nghỉ việc
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tổng số
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Đang xử lý
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.processing}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Hoàn thành
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.completed}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tháng này
                        </CardTitle>
                        <UserMinus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.thisMonth}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên, mã nhân viên..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-10"
                    />
                    {search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                            onClick={handleClearSearch}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                        <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                        <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">
                        Tất cả ({offboardings.length})
                    </TabsTrigger>
                    <TabsTrigger value="processing">
                        Đang xử lý ({processingOffboardings.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Hoàn thành ({completedOffboardings.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            <OffboardingTable
                                offboardings={offboardings}
                                isLoading={isLoadingList}
                                canManage={canManage}
                                onComplete={(id) =>
                                    completeMutation.mutate({ id })
                                }
                                onDelete={(id) => deleteMutation.mutate(id)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="processing" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            <OffboardingTable
                                offboardings={processingOffboardings}
                                isLoading={isLoadingList}
                                canManage={canManage}
                                onComplete={(id) =>
                                    completeMutation.mutate({ id })
                                }
                                onDelete={(id) => deleteMutation.mutate(id)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            <OffboardingTable
                                offboardings={completedOffboardings}
                                isLoading={isLoadingList}
                                canManage={canManage}
                                onComplete={(id) =>
                                    completeMutation.mutate({ id })
                                }
                                onDelete={(id) => deleteMutation.mutate(id)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Dialog */}
            <CreateOffboardingDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                templates={templates}
                onSuccess={() => {
                    setIsCreateOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["offboardings"] });
                    queryClient.invalidateQueries({ queryKey: ["offboarding-stats"] });
                }}
            />

        </div>
    );
}
