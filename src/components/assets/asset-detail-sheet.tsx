"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimezone } from "@/hooks/use-timezone";

import { getAssetById } from "@/app/[locale]/(protected)/assets/actions";
import {
    ASSET_CATEGORY_LABELS,
    ASSET_STATUS_LABELS,
    ASSET_STATUS_COLORS,
    ASSIGNMENT_STATUS_LABELS,
    ASSIGNMENT_STATUS_COLORS,
    CONDITION_LABELS,
    formatCurrency,
} from "@/app/[locale]/(protected)/assets/constants";
import type {
    AssetCategory,
    AssetStatus,
    AssignmentStatus,
    AssetCondition,
} from "@/app/[locale]/(protected)/assets/types";

interface AssetDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assetId: string;
}

export function AssetDetailSheet({
    open,
    onOpenChange,
    assetId,
}: AssetDetailSheetProps) {
    const { formatDate } = useTimezone();
    const t = useTranslations("ProtectedPages");

    const { data: asset, isLoading } = useQuery({
        queryKey: ["assets", "detail", assetId],
        queryFn: () => getAssetById(assetId),
        enabled: open && !!assetId,
    });

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{t("assetsDetailSheetTitle")}</SheetTitle>
                </SheetHeader>

                {isLoading ? (
                    <div className="space-y-4 mt-6">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : !asset ? (
                    <p className="mt-6 text-muted-foreground">
                        {t("assetsDetailNotFound")}
                    </p>
                ) : (
                    <div className="space-y-6 px-6">
                        {/* Basic Info */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-lg font-semibold">
                                    {asset.name}
                                </h3>
                                <Badge
                                    variant="secondary"
                                    className={`${ASSET_STATUS_COLORS[asset.status as AssetStatus] || ""} border-0`}
                                >
                                    {ASSET_STATUS_LABELS[
                                        asset.status as AssetStatus
                                    ] || asset.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <InfoRow
                                    label={t("assetsDetailCodeLabel")}
                                    value={asset.code}
                                />
                                <InfoRow
                                    label={t("assetsDetailCategoryLabel")}
                                    value={
                                        ASSET_CATEGORY_LABELS[
                                            asset.category as AssetCategory
                                        ] || asset.category
                                    }
                                />
                                <InfoRow
                                    label={t("assetsDetailBrandLabel")}
                                    value={asset.brand}
                                />
                                <InfoRow
                                    label={t("assetsDetailModelLabel")}
                                    value={asset.model}
                                />
                                <InfoRow
                                    label={t("assetsDetailSerialLabel")}
                                    value={asset.serialNumber}
                                />
                                <InfoRow
                                    label={t("assetsDetailLocationLabel")}
                                    value={asset.location}
                                />
                                <InfoRow
                                    label={t("assetsDetailPurchaseDateLabel")}
                                    value={
                                        asset.purchaseDate
                                            ? formatDate(
                                                  new Date(
                                                      asset.purchaseDate,
                                                  ),
                                              )
                                            : null
                                    }
                                />
                                <InfoRow
                                    label={t("assetsDetailPurchasePriceLabel")}
                                    value={formatCurrency(
                                        asset.purchasePrice,
                                    )}
                                />
                                <InfoRow
                                    label={t("assetsDetailWarrantyEndLabel")}
                                    value={
                                        asset.warrantyEnd
                                            ? formatDate(
                                                  new Date(
                                                      asset.warrantyEnd,
                                                  ),
                                              )
                                            : null
                                    }
                                />
                            </div>

                            {asset.description && (
                                <div className="mt-3">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t("assetsDetailDescriptionLabel")}
                                    </p>
                                    <p className="text-sm mt-1">
                                        {asset.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Assignment History */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3">
                                {t("assetsDetailAssignmentHistoryTitle", {
                                    count: asset.assignments.length,
                                })}
                            </h4>
                            {asset.assignments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t("assetsDetailNoAssignmentHistory")}
                                </p>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    {t("assetsDetailEmployeeHeader")}
                                                </TableHead>
                                                <TableHead>
                                                    {t("assetsDetailAssignedDateHeader")}
                                                </TableHead>
                                                <TableHead>
                                                    {t("assetsDetailReturnDateHeader")}
                                                </TableHead>
                                                <TableHead>
                                                    {t("assetsDetailStatusHeader")}
                                                </TableHead>
                                                <TableHead>
                                                    {t("assetsDetailConditionHeader")}
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {asset.assignments.map((a) => (
                                                <TableRow key={a.id}>
                                                    <TableCell className="font-medium">
                                                        {a.userName}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(
                                                            new Date(
                                                                a.assignDate,
                                                            ),
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {a.returnDate
                                                            ? formatDate(
                                                                  new Date(
                                                                      a.returnDate,
                                                                  ),
                                                              )
                                                            : t("assetsDetailFallbackValue")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`${ASSIGNMENT_STATUS_COLORS[a.status as AssignmentStatus] || ""} border-0`}
                                                        >
                                                            {ASSIGNMENT_STATUS_LABELS[
                                                                a.status as AssignmentStatus
                                                            ] || a.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {a.condition
                                                            ? CONDITION_LABELS[
                                                                  a.condition as AssetCondition
                                                              ] ||
                                                              a.condition
                                                            : t("assetsDetailFallbackValue")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">
                {label}
            </p>
            <p className="text-sm mt-0.5">{value || "—"}</p>
        </div>
    );
}

