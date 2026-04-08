"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    Package,
    Smartphone,
    Laptop,
    Monitor,
    Mouse,
    Keyboard,
    Headphones,
    Printer,
    Calendar,
    AlertCircle,
    Search,
    type LucideIcon,
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

const CATEGORY_DESKTOP = "M\u00E1y t\u00EDnh \u0111\u1EC3 b\u00E0n";
const CATEGORY_PHONE = "\u0110i\u1EC7n tho\u1EA1i";
const CATEGORY_PRINTER = "M\u00E1y in";
const CATEGORY_MOUSE = "Chu\u1ED9t";
const CATEGORY_KEYBOARD = "B\u00E0n ph\u00EDm";
const CATEGORY_HEADPHONE = "Tai nghe";
const CATEGORY_OTHER = "Kh\u00E1c";

// Icon mapping for asset categories
const categoryIcons: Record<string, LucideIcon> = {
    Laptop,
    [CATEGORY_DESKTOP]: Monitor,
    [CATEGORY_PHONE]: Smartphone,
    [CATEGORY_PRINTER]: Printer,
    [CATEGORY_MOUSE]: Mouse,
    [CATEGORY_KEYBOARD]: Keyboard,
    [CATEGORY_HEADPHONE]: Headphones,
    [CATEGORY_OTHER]: Package,
};

function getIconForCategory(category: string): LucideIcon {
    for (const [key, icon] of Object.entries(categoryIcons)) {
        if (category.toLowerCase().includes(key.toLowerCase())) {
            return icon;
        }
    }
    return Package;
}

function renderCategoryIcon(category: string, className: string) {
    const icon = getIconForCategory(category);

    if (icon === Laptop) return <Laptop className={className} />;
    if (icon === Monitor) return <Monitor className={className} />;
    if (icon === Smartphone) return <Smartphone className={className} />;
    if (icon === Printer) return <Printer className={className} />;
    if (icon === Mouse) return <Mouse className={className} />;
    if (icon === Keyboard) return <Keyboard className={className} />;
    if (icon === Headphones) return <Headphones className={className} />;

    return <Package className={className} />;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function AssetCard({
    asset,
    t,
}: {
    asset: Asset;
    t: ReturnType<typeof useTranslations>;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
                            {renderCategoryIcon(asset.category, "h-5 w-5")}
                        </div>
                        <div>
                            <CardTitle className="text-base">{asset.name}</CardTitle>
                            <CardDescription className="text-xs">
                                {t("essAssetsCodeLabel")}: {asset.code}
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
                        <p className="text-muted-foreground text-xs">{t("essAssetsCategoryLabel")}</p>
                        <p className="font-medium">{asset.category}</p>
                    </div>
                    {asset.serialNumber && (
                        <div>
                            <p className="text-muted-foreground text-xs">{t("essAssetsSerialLabel")}</p>
                            <p className="font-medium">{asset.serialNumber}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-muted-foreground text-xs">{t("essAssetsAssignedDateLabel")}</p>
                        <p className="font-medium">{formatDate(asset.assignedAt)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">{t("essAssetsAssignedByLabel")}</p>
                        <p className="font-medium">{asset.assignedByName}</p>
                    </div>
                    {asset.brand && (
                        <div>
                            <p className="text-muted-foreground text-xs">{t("essAssetsBrandLabel")}</p>
                            <p className="font-medium">{asset.brand}</p>
                        </div>
                    )}
                    {asset.model && (
                        <div>
                            <p className="text-muted-foreground text-xs">{t("essAssetsModelLabel")}</p>
                            <p className="font-medium">{asset.model}</p>
                        </div>
                    )}
                    {asset.location && (
                        <div>
                            <p className="text-muted-foreground text-xs">{t("essAssetsLocationLabel")}</p>
                            <p className="font-medium">{asset.location}</p>
                        </div>
                    )}
                </div>

                {asset.notes && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium">{t("essAssetsNotesLabel")}:</span> {asset.notes}
                        </p>
                    </div>
                )}

                {asset.purchaseDate && (
                    <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{t("essAssetsPurchaseDateLabel")}: {formatDate(asset.purchaseDate)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ESSAssetsClient({ initialAssets }: ESSAssetsClientProps) {
    const t = useTranslations("ProtectedPages");
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
                                {t("essAssetsTitle")}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("essAssetsDescription")}
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
                                    <p className="text-xs text-muted-foreground">{t("essAssetsStatsTotal")}</p>
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
                                            ["Laptop", CATEGORY_DESKTOP].some((c) =>
                                                a.category.toLowerCase().includes(c.toLowerCase())
                                            )
                                        ).length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{t("essAssetsStatsComputingDevices")}</p>
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
                                            [CATEGORY_PHONE, CATEGORY_HEADPHONE].some((c) =>
                                                a.category.toLowerCase().includes(c.toLowerCase())
                                            )
                                        ).length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{t("essAssetsStatsMobileDevices")}</p>
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
                            placeholder={t("essAssetsSearchPlaceholder")}
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
                            {t("essAssetsAll")}
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
                                    ? t("essAssetsEmptyFiltered")
                                    : t("essAssetsEmpty")}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(assetsByCategory).map(([category, assets]) => {
                            return (
                                <div key={category} className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        {renderCategoryIcon(category, "h-4 w-4 text-muted-foreground")}
                                        <h3 className="text-sm font-semibold">{category}</h3>
                                        <Badge variant="secondary" className="text-xs">
                                            {assets.length}
                                        </Badge>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {assets.map((asset) => (
                                            <AssetCard key={asset.id} asset={asset} t={t} />
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
                                <p className="font-medium text-blue-900">{t("essAssetsNoteTitle")}</p>
                                <ul className="mt-2 space-y-1 text-blue-800 text-xs">
                                    <li>• {t("essAssetsNoteItem1")}</li>
                                    <li>• {t("essAssetsNoteItem2")}</li>
                                    <li>• {t("essAssetsNoteItem3")}</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
