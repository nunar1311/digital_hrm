"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Laptop,
    Smartphone,
    Monitor,
    Armchair,
    CreditCard,
    Package,
} from "lucide-react";
import { useTimezone } from "@/hooks/use-timezone";

import { getMyAssets } from "@/app/(protected)/assets/actions";
import { ASSET_CATEGORY_LABELS } from "@/app/(protected)/assets/constants";
import type { AssetCategory } from "@/app/(protected)/assets/types";
import { useSocketEvents } from "@/hooks/use-socket-event";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    LAPTOP: Laptop,
    PHONE: Smartphone,
    MONITOR: Monitor,
    CHAIR: Armchair,
    CARD: CreditCard,
};

export function MyAssets() {
    const queryClient = useQueryClient();
    const { formatDate } = useTimezone();

    // Real-time: invalidate queries when asset events occur
    useSocketEvents(
        [
            "asset:assigned",
            "asset:returned",
        ],
        () => {
            queryClient.invalidateQueries({ queryKey: ["assets", "my"] });
        },
    );

    const { data: assets = [], isLoading } = useQuery({
        queryKey: ["assets", "my"],
        queryFn: getMyAssets,
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                    Không có tài sản nào
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Bạn chưa được cấp phát tài sản nào
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
                const Icon =
                    CATEGORY_ICONS[asset.category] || Package;
                return (
                    <Card
                        key={asset.id}
                        className="hover:shadow-md transition-shadow"
                    >
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate">
                                    {asset.assetName}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-mono">
                                    {asset.assetCode}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Loại
                                </span>
                                <Badge variant="secondary">
                                    {ASSET_CATEGORY_LABELS[
                                        asset.category as AssetCategory
                                    ] || asset.category}
                                </Badge>
                            </div>
                            {(asset.brand || asset.model) && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Thiết bị
                                    </span>
                                    <span>
                                        {[asset.brand, asset.model]
                                            .filter(Boolean)
                                            .join(" ")}
                                    </span>
                                </div>
                            )}
                            {asset.serialNumber && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Serial
                                    </span>
                                    <span className="font-mono text-xs">
                                        {asset.serialNumber}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Ngày nhận
                                </span>
                                <span>
                                    {formatDate(
                                        new Date(asset.assignDate),
                                    )}
                                </span>
                            </div>
                            {asset.expectedReturn && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Dự kiến trả
                                    </span>
                                    <span>
                                        {formatDate(
                                            new Date(
                                                asset.expectedReturn,
                                            ),
                                        )}
                                    </span>
                                </div>
                            )}
                            {asset.notes && (
                                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                    {asset.notes}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
