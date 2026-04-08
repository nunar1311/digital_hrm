"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMinus, Users, CheckCircle2, Clock, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useTranslations } from "next-intl";
import { OffboardingTable } from "./offboarding-table";
import { CreateOffboardingDialog } from "./create-offboarding-dialog";
import type { OffboardingListItem } from "./types";

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
    const t = useTranslations("ProtectedPages");

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
            toast.success(t("offboardingToastCompleted"));
            queryClient.invalidateQueries({ queryKey: ["offboardings"] });
            queryClient.invalidateQueries({ queryKey: ["offboarding-stats"] });
        },
        onError: (error) => {
            toast.error(t("offboardingToastStatusUpdateError"));
            console.error(error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOffboarding,
        onSuccess: () => {
            toast.success(t("offboardingToastDeleted"));
            queryClient.invalidateQueries({ queryKey: ["offboardings"] });
            queryClient.invalidateQueries({ queryKey: ["offboarding-stats"] });
        },
        onError: (error) => {
            toast.error(t("offboardingToastDeleteError"));
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
                        {t("offboardingListTitle")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("offboardingListDescription")}
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4" /> {t("offboardingCreateButton")}
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t("offboardingStatsTotal")}
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
                            {t("offboardingStatsProcessing")}
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
                            {t("offboardingStatsCompleted")}
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
                            {t("offboardingStatsThisMonth")}
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
                        placeholder={t("offboardingSearchPlaceholder")}
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
                        <SelectValue placeholder={t("offboardingFilterStatusPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("offboardingFilterAll")}</SelectItem>
                        <SelectItem value="PROCESSING">{t("offboardingFilterProcessing")}</SelectItem>
                        <SelectItem value="COMPLETED">{t("offboardingFilterCompleted")}</SelectItem>
                        <SelectItem value="CANCELLED">{t("offboardingFilterCancelled")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">
                        {t("offboardingTabAll", { count: offboardings.length })}
                    </TabsTrigger>
                    <TabsTrigger value="processing">
                        {t("offboardingTabProcessing", {
                            count: processingOffboardings.length,
                        })}
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        {t("offboardingTabCompleted", {
                            count: completedOffboardings.length,
                        })}
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
