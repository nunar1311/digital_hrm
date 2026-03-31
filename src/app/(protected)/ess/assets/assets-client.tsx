"use client";

import { useState } from "react";
import {
    Package,
    Smartphone,
    Laptop,
    Monitor,
    Mouse,
    Keyboard,
    Headphones,
    Printer,
    Other,
    Calendar,
    User,
    FileText,
    AlertCircle,
    Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Asset {
    id: string;
    assetId: string;
    name: string;
    code: string;
    category: string;
    serialNumber: string | null;
    purchaseDate: string | null;
    assignedAt: string;
    condition: string;
    notes: string | null;
    assignedByName: string;
    brand: string | null;
    model: string | null;
    location: string | null;
}

interface ESSAssetsClientProps {
    initialAssets: Asset[];
}

// Icon mapping for asset categories
const categoryIcons: Record<string, any> = {
    "Laptop": Laptop,
    "Máy tính để bàn": Monitor,
    "Điện thoại": Smartphone,
    "Máy in": Printer,
    "Chuột": Mouse,
    "Bàn phím": Keyboard,
    "Tai nghe": Headphones,
    "Khác": Package,
};

function getIconForCategory(category: string) {
    for (const [key, icon] of Object.entries(categoryIcons)) {
        if (category.toLowerCase().includes(key.toLowerCase())) {
            return icon;
        }
    }
    return Package;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function AssetCard({ asset }: { asset: Asset }) {
    const Icon = getIconForCategory(asset.category);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{asset.name}</CardTitle>
                            <CardDescription className="text-xs">
                                Mã: {asset.code}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {asset.condition}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-muted-foreground text-xs">Loại tài sản</p>
                        <p className="font-medium">{asset.category}</p>
                    </div>
                    {asset.serialNumber && (
                        <div>
                            <p className="text-muted-foreground text-xs">Số serial</p>
                            <p className="font-medium">{asset.serialNumber}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-muted-foreground text-xs">Ngày nhận</p>
                        <p className="font-medium">{formatDate(asset.assignedAt)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Người giao</p>
                        <p className="font-medium">{asset.assignedByName}</p>
                    </div>
                    {asset.brand && (
                        <div>
                            <p className="text-muted-foreground text-xs">Hãng</p>
                            <p className="font-medium">{asset.brand}</p>
                        </div>
                    )}
                    {asset.model && (
                        <div>
                            <p className="text-muted-foreground text-xs">Model</p>
                            <p className="font-medium">{asset.model}</p>
                        </div>
                    )}
                    {asset.location && (
                        <div>
                            <p className="text-muted-foreground text-xs">Vị trí</p>
                            <p className="font-medium">{asset.location}</p>
                        </div>
                    )}
                </div>

                {asset.notes && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Ghi chú:</span> {asset.notes}
                        </p>
                    </div>
                )}

                {asset.purchaseDate && (
                    <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Mua ngày: {formatDate(asset.purchaseDate)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ESSAssetsClient({ initialAssets }: ESSAssetsClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

    // Get unique categories
    const categories = Array.from(new Set(initialAssets.map((a) => a.category)));

    // Filter assets
    const filteredAssets = initialAssets.filter((asset) => {
        const matchesSearch =
            searchTerm === "" ||
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
            categoryFilter === "ALL" || asset.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    // Group assets by category
    const assetsByCategory = filteredAssets.reduce((acc, asset) => {
        if (!acc[asset.category]) {
            acc[asset.category] = [];
        }
        acc[asset.category].push(asset);
        return acc;
    }, {} as Record<string, Asset[]>);

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* Header */}
            <div className="shrink-0 border-b bg-linear-to-r from-orange-50/50 to-primary/5">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <Package className="h-6 w-6 text-orange-600" />
                                Tài sản được giao
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Danh sách tài sản và thiết bị được cấp phát cho bạn
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{initialAssets.length}</div>
                                    <p className="text-xs text-muted-foreground">Tổng tài sản</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                    <Laptop className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {initialAssets.filter((a) =>
                                            ["Laptop", "Máy tính để bàn"].some((c) =>
                                                a.category.toLowerCase().includes(c.toLowerCase())
                                            )
                                        ).length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Thiết bị máy tính</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {initialAssets.filter((a) =>
                                            ["Điện thoại", "Tai nghe"].some((c) =>
                                                a.category.toLowerCase().includes(c.toLowerCase())
                                            )
                                        ).length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Thiết bị di động</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm tài sản..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={categoryFilter === "ALL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCategoryFilter("ALL")}
                        >
                            Tất cả
                        </Button>
                        {categories.slice(0, 4).map((cat) => (
                            <Button
                                key={cat}
                                variant={categoryFilter === cat ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCategoryFilter(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Assets List */}
                {filteredAssets.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground mb-4">
                                {searchTerm || categoryFilter !== "ALL"
                                    ? "Không tìm thấy tài sản phù hợp"
                                    : "Bạn chưa được giao tài sản nào"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(assetsByCategory).map(([category, assets]) => {
                            const Icon = getIconForCategory(category);
                            return (
                                <div key={category} className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="text-sm font-semibold">{category}</h3>
                                        <Badge variant="secondary" className="text-xs">
                                            {assets.length}
                                        </Badge>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {assets.map((asset) => (
                                            <AssetCard key={asset.id} asset={asset} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Info Card */}
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-900">Lưu ý về tài sản</p>
                                <ul className="mt-2 space-y-1 text-blue-800 text-xs">
                                    <li>• Tài sản được liệt kê là tài sản bạn đang sử dụng</li>
                                    <li>• Nếu có vấn đề về tài sản, vui lòng liên hệ bộ phận HCNS</li>
                                    <li>• Khi nghỉ việc, bạn cần hoàn trả tài sản cho công ty</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
