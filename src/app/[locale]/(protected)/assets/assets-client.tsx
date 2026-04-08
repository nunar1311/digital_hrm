"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Package,
    CheckCircle,
    UserCheck,
    Wrench,
    DollarSign,
} from "lucide-react";

import { getAssetStats } from "./actions";
import { formatCurrency } from "./constants";
import { AssetList } from "@/components/assets/asset-list";
import { MyAssets } from "@/components/assets/my-assets";
import type { AssetStats } from "./types";
import { useSocketEvents } from "@/hooks/use-socket-event";

export function AssetsClient() {
    const queryClient = useQueryClient();

    // Real-time: invalidate stats when asset events occur
    useSocketEvents(
        [
            "asset:created",
            "asset:updated",
            "asset:deleted",
            "asset:assigned",
            "asset:returned",
        ],
        () => {
            queryClient.invalidateQueries({ queryKey: ["assets", "stats"] });
        },
    );

    const { data: stats } = useQuery<AssetStats>({
        queryKey: ["assets", "stats"],
        queryFn: getAssetStats,
    });

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold">Quản lý tài sản</h1>
                <p className="text-sm text-muted-foreground">
                    Quản lý danh mục tài sản, cấp phát và thu hồi tài sản
                    cho nhân viên
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tổng tài sản
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalAssets || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Sẵn sàng
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {stats?.availableAssets || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Đã cấp phát
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats?.assignedAssets || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Bảo trì
                        </CardTitle>
                        <Wrench className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {stats?.maintenanceAssets || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tổng giá trị
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(stats?.totalValue || 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all-assets" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all-assets">
                        Danh sách tài sản
                    </TabsTrigger>
                    <TabsTrigger value="my-assets">
                        Tài sản của tôi
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all-assets">
                    <AssetList />
                </TabsContent>

                <TabsContent value="my-assets">
                    <MyAssets />
                </TabsContent>
            </Tabs>
        </div>
    );
}
