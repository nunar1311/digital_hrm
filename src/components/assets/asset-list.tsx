"use client";

import { useState } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    UserPlus,
    RotateCcw,
    Eye,
    ChevronLeft,
    ChevronRight,
    Package,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
    getAssets,
    deleteAsset,
} from "@/app/[locale]/(protected)/assets/actions";
import {
    ASSET_CATEGORY_OPTIONS,
    ASSET_STATUS_OPTIONS,
    ASSET_CATEGORY_LABELS,
    ASSET_STATUS_LABELS,
    ASSET_STATUS_COLORS,
    formatCurrency,
} from "@/app/[locale]/(protected)/assets/constants";
import type {
    AssetWithCurrentUser,
    AssetFilters,
    AssetCategory,
    AssetStatus,
} from "@/app/[locale]/(protected)/assets/types";

import { AssetFormDialog } from "./asset-form-dialog";
import { AssetAssignDialog } from "./asset-assign-dialog";
import { AssetReturnDialog } from "./asset-return-dialog";
import { AssetDetailSheet } from "./asset-detail-sheet";
import DeleteConfirm from "@/components/delete-confirm";
import { useSocketEvents } from "@/hooks/use-socket-event";

export function AssetList() {
    const queryClient = useQueryClient();
    const t = useTranslations("ProtectedPages");

    // Filters
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);

    // Dialogs
    const [createOpen, setCreateOpen] = useState(false);
    const [editAsset, setEditAsset] =
        useState<AssetWithCurrentUser | null>(null);
    const [assignAssetId, setAssignAssetId] = useState<string | null>(
        null,
    );
    const [returnAssignmentId, setReturnAssignmentId] = useState<
        string | null
    >(null);
    const [detailAssetId, setDetailAssetId] = useState<string | null>(
        null,
    );

    // Real-time: invalidate queries when asset events occur
    useSocketEvents(
        [
            "asset:created",
            "asset:updated",
            "asset:deleted",
            "asset:assigned",
            "asset:returned",
        ],
        () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
        },
    );

    const filters: AssetFilters = {
        search: search || undefined,
        category: (categoryFilter as AssetCategory) || undefined,
        status: (statusFilter as AssetStatus) || undefined,
    };

    const { data, isLoading } = useQuery({
        queryKey: ["assets", "list", filters, page],
        queryFn: () => getAssets(filters, { page, limit: 20 }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAsset(id),
        onSuccess: () => {
            toast.success(t("assetsListToastDeleteSuccess"));
            queryClient.invalidateQueries({ queryKey: ["assets"] });
        },
        onError: (err: Error) => {
            toast.error(err.message || t("assetsListToastDeleteError"));
        },
    });

    const items = (data?.items || []) as AssetWithCurrentUser[];
    const totalPages = data?.totalPages || 1;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("assetsListSearchPlaceholder")}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-8 h-8"
                        />
                    </div>
                    <Select
                        value={categoryFilter}
                        onValueChange={(v) => {
                            setCategoryFilter(v === "ALL" ? "" : v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger
                            size="sm"
                            className="w-[160px]"
                        >
                            <SelectValue
                                placeholder={t("assetsListCategoryPlaceholder")}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">
                                Táº¥t cáº£ loáº¡i
                            </SelectItem>
                            {ASSET_CATEGORY_OPTIONS.map((o) => (
                                <SelectItem
                                    key={o.value}
                                    value={o.value}
                                >
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v === "ALL" ? "" : v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger
                            size="sm"
                            className="w-[160px]"
                        >
                            <SelectValue
                                placeholder={t("assetsListStatusPlaceholder")}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">
                                Táº¥t cáº£
                            </SelectItem>
                            {ASSET_STATUS_OPTIONS.map((o) => (
                                <SelectItem
                                    key={o.value}
                                    value={o.value}
                                >
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    size={"sm"}
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    ThÃªm tÃ i sáº£n
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>MÃ£</TableHead>
                            <TableHead>TÃªn tÃ i sáº£n</TableHead>
                            <TableHead>Loáº¡i</TableHead>
                            <TableHead>Tráº¡ng thÃ¡i</TableHead>
                            <TableHead>ThÆ°Æ¡ng hiá»‡u</TableHead>
                            <TableHead>GiÃ¡ mua</TableHead>
                            <TableHead>NgÆ°á»i sá»­ dá»¥ng</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 8 }).map(
                                        (_, j) => (
                                            <TableCell key={j}>
                                                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                            </TableCell>
                                        ),
                                    )}
                                </TableRow>
                            ))
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="h-32 text-center"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            ChÆ°a cÃ³ tÃ i sáº£n nÃ o
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((asset) => (
                                <TableRow
                                    key={asset.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                >
                                    <TableCell className="font-mono text-sm">
                                        {asset.code}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {asset.name}
                                    </TableCell>
                                    <TableCell>
                                        {ASSET_CATEGORY_LABELS[
                                            asset.category as AssetCategory
                                        ] || asset.category}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`${
                                                ASSET_STATUS_COLORS[
                                                    asset.status as AssetStatus
                                                ] || ""
                                            } border-0`}
                                        >
                                            {ASSET_STATUS_LABELS[
                                                asset.status as AssetStatus
                                            ] || asset.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {[asset.brand, asset.model]
                                            .filter(Boolean)
                                            .join(" ") ||
                                            t("assetsListFallbackValue")}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(
                                            asset.purchasePrice,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {asset.currentUserName ||
                                            t("assetsListFallbackValue")}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                asChild
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetailAssetId(
                                                            asset.id,
                                                        );
                                                    }}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Xem chi tiáº¿t
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditAsset(
                                                            asset,
                                                        );
                                                    }}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Chá»‰nh sá»­a
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {asset.status !==
                                                    "ASSIGNED" &&
                                                    asset.status !==
                                                        "DISPOSED" && (
                                                        <DropdownMenuItem
                                                            onClick={(
                                                                e,
                                                            ) => {
                                                                e.stopPropagation();
                                                                setAssignAssetId(
                                                                    asset.id,
                                                                );
                                                            }}
                                                        >
                                                            <UserPlus className="mr-2 h-4 w-4" />
                                                            Cáº¥p phÃ¡t
                                                        </DropdownMenuItem>
                                                    )}
                                                {asset.status ===
                                                    "ASSIGNED" &&
                                                    asset.currentAssignmentId && (
                                                        <DropdownMenuItem
                                                            onClick={(
                                                                e,
                                                            ) => {
                                                                e.stopPropagation();
                                                                setReturnAssignmentId(
                                                                    asset.currentAssignmentId!,
                                                                );
                                                            }}
                                                        >
                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                            Thu há»“i
                                                        </DropdownMenuItem>
                                                    )}
                                                <DropdownMenuSeparator />
                                                <DeleteConfirm
                                                    title={t(
                                                        "assetsListDeleteConfirmTitle",
                                                    )}
                                                    description={t(
                                                        "assetsListDeleteConfirmDescription",
                                                        {
                                                            name: asset.name,
                                                            code: asset.code,
                                                        },
                                                    )}
                                                    onConfirm={() =>
                                                        deleteMutation.mutate(
                                                            asset.id,
                                                        )
                                                    }
                                                />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Trang {page} / {totalPages} â€” Tá»•ng{" "}
                        {data?.total || 0} tÃ i sáº£n
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <AssetFormDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                mode="create"
            />

            {editAsset && (
                <AssetFormDialog
                    open={!!editAsset}
                    onOpenChange={(open) => {
                        if (!open) setEditAsset(null);
                    }}
                    mode="edit"
                    asset={editAsset}
                />
            )}

            {assignAssetId && (
                <AssetAssignDialog
                    open={!!assignAssetId}
                    onOpenChange={(open) => {
                        if (!open) setAssignAssetId(null);
                    }}
                    assetId={assignAssetId}
                />
            )}

            {returnAssignmentId && (
                <AssetReturnDialog
                    open={!!returnAssignmentId}
                    onOpenChange={(open) => {
                        if (!open) setReturnAssignmentId(null);
                    }}
                    assignmentId={returnAssignmentId}
                />
            )}

            {detailAssetId && (
                <AssetDetailSheet
                    open={!!detailAssetId}
                    onOpenChange={(open) => {
                        if (!open) setDetailAssetId(null);
                    }}
                    assetId={detailAssetId}
                />
            )}
        </div>
    );
}

