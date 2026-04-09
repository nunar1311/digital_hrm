"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  Search,
  Info,
  ChevronDown,
  Settings,
  Table2,
  ChevronRight,
  Grid2X2,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import DynamicIcon from "@/components/DynamicIcon";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// ─── Mobile Detection ─────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ─── Category Icon Mapping ─────────────────────────────────────────────────────

const categoryIcons: Record<string, LucideIcon> = {
  Laptop: Laptop,
  "Máy tính để bàn": Monitor,
  "Điện thoại": Smartphone,
  "Máy in": Printer,
  Chuột: Mouse,
  "Bàn phím": Keyboard,
  "Tai nghe": Headphones,
  Khác: Package,
};

function getIconForCategory(category: string): LucideIcon {
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

// ─── Condition Badge Config ─────────────────────────────────────────────────────

const CONDITION_CONFIG: Record<string, { label: string; className: string }> = {
  MỚI: { label: "Mới", className: "bg-emerald-100 text-emerald-800" },
  TỐT: { label: "Tốt", className: "bg-blue-100 text-blue-800" },
  BÌNH_THƯỜNG: {
    label: "Bình thường",
    className: "bg-amber-100 text-amber-800",
  },
  CẦN_SỬA: { label: "Cần sửa", className: "bg-orange-100 text-orange-800" },
  HỎNG: { label: "Hỏng", className: "bg-red-100 text-red-800" },
};

// ─── Column Config ─────────────────────────────────────────────────────────────

type ColumnKey =
  | "name"
  | "category"
  | "serialNumber"
  | "condition"
  | "brand"
  | "model"
  | "assignedAt"
  | "assignedByName"
  | "location"
  | "purchaseDate";

const DEFAULT_VISIBLE: Record<ColumnKey, boolean> = {
  name: true,
  category: true,
  serialNumber: true,
  condition: true,
  brand: false,
  model: false,
  assignedAt: true,
  assignedByName: false,
  location: false,
  purchaseDate: false,
};

// ─── Mobile Asset Card ──────────────────────────────────────────────────────────

function MobileAssetCard({
  asset,
  onClick,
}: {
  asset: Asset;
  onClick?: () => void;
}) {
  const condCfg = CONDITION_CONFIG[asset.condition] ?? {
    label: asset.condition,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <div
      onClick={onClick}
      className="px-3 py-3 border-b bg-background last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            asset.category.toLowerCase().includes("laptop") ||
              asset.category.toLowerCase().includes("máy tính")
              ? "bg-blue-100 text-blue-600"
              : asset.category.toLowerCase().includes("điện thoại") ||
                  asset.category.toLowerCase().includes("tai nghe")
                ? "bg-purple-100 text-purple-600"
                : asset.category.toLowerCase().includes("máy in")
                  ? "bg-amber-100 text-amber-600"
                  : "bg-orange-100 text-orange-600",
          )}
        >
          <DynamicIcon iconName={asset.category} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold truncate">{asset.name}</p>
            <Badge
              variant="outline"
              className={cn("text-[10px] py-0 h-5 shrink-0", condCfg.className)}
            >
              {condCfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-1">Mã: {asset.code}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(asset.assignedAt)}
            </span>
            <span>{asset.assignedByName}</span>
          </div>
          {asset.serialNumber && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              SN: {asset.serialNumber}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ─── Desktop Asset Card ─────────────────────────────────────────────────────────

function AssetCard({ asset, onClick }: { asset: Asset; onClick?: () => void }) {
  const condCfg = CONDITION_CONFIG[asset.condition] ?? {
    label: asset.condition,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                asset.category.toLowerCase().includes("laptop") ||
                  asset.category.toLowerCase().includes("máy tính")
                  ? "bg-blue-100 text-blue-600"
                  : asset.category.toLowerCase().includes("điện thoại") ||
                      asset.category.toLowerCase().includes("tai nghe")
                    ? "bg-purple-100 text-purple-600"
                    : asset.category.toLowerCase().includes("máy in")
                      ? "bg-amber-100 text-amber-600"
                      : "bg-orange-100 text-orange-600",
              )}
            >
              <DynamicIcon iconName={asset.category} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight truncate">
                {asset.name}
              </CardTitle>
              <CardDescription className="text-[11px]">
                {asset.code}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] py-0 h-5 shrink-0", condCfg.className)}
          >
            {condCfg.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px]">Loại</p>
            <p className="font-medium text-xs leading-tight truncate">
              {asset.category}
            </p>
          </div>
          {asset.brand && (
            <div>
              <p className="text-muted-foreground text-[10px]">Hãng</p>
              <p className="font-medium text-xs leading-tight truncate">
                {asset.brand}
              </p>
            </div>
          )}
          {asset.serialNumber && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-[10px]">Số serial</p>
              <p className="font-medium text-xs font-mono truncate">
                {asset.serialNumber}
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-[10px]">Ngày nhận</p>
            <p className="font-medium text-xs leading-tight">
              {formatDate(asset.assignedAt)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px]">Người giao</p>
            <p className="font-medium text-xs leading-tight truncate">
              {asset.assignedByName}
            </p>
          </div>
          {asset.model && (
            <div>
              <p className="text-muted-foreground text-[10px]">Model</p>
              <p className="font-medium text-xs leading-tight truncate">
                {asset.model}
              </p>
            </div>
          )}
          {asset.location && (
            <div>
              <p className="text-muted-foreground text-[10px]">Vị trí</p>
              <p className="font-medium text-xs leading-tight truncate">
                {asset.location}
              </p>
            </div>
          )}
        </div>

        {asset.notes && (
          <div className="pt-1.5 border-t">
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              <span className="font-medium">Ghi chú:</span> {asset.notes}
            </p>
          </div>
        )}

        {asset.purchaseDate && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Mua: {formatDate(asset.purchaseDate)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Asset Detail Dialog (Desktop) ─────────────────────────────────────────────

function AssetDetailDialog({
  asset,
  onClose,
}: {
  asset: Asset | null;
  onClose: () => void;
}) {
  if (!asset) return null;

  const condCfg = CONDITION_CONFIG[asset.condition] ?? {
    label: asset.condition,
    className: "bg-muted text-muted-foreground",
  };

  const detailRows = [
    { label: "Mã tài sản", value: asset.code },
    { label: "Loại tài sản", value: asset.category },
    { label: "Tình trạng", value: condCfg.label, color: condCfg.className },
    { label: "Số serial", value: asset.serialNumber },
    { label: "Hãng", value: asset.brand },
    { label: "Model", value: asset.model },
    { label: "Vị trí", value: asset.location },
    { label: "Ngày nhận", value: formatDate(asset.assignedAt) },
    {
      label: "Ngày mua",
      value: asset.purchaseDate ? formatDate(asset.purchaseDate) : null,
    },
    { label: "Người giao", value: asset.assignedByName },
  ].filter((r) => r.value !== null && r.value !== undefined);

  return (
    <Dialog open={!!asset} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Chi tiết tài sản
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "p-3 rounded-xl shrink-0",
                asset.category.toLowerCase().includes("laptop") ||
                  asset.category.toLowerCase().includes("máy tính")
                  ? "bg-blue-100 text-blue-600"
                  : asset.category.toLowerCase().includes("điện thoại") ||
                      asset.category.toLowerCase().includes("tai nghe")
                    ? "bg-purple-100 text-purple-600"
                    : asset.category.toLowerCase().includes("máy in")
                      ? "bg-amber-100 text-amber-600"
                      : "bg-orange-100 text-orange-600",
              )}
            >
              <DynamicIcon iconName={asset.category} className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold leading-tight">{asset.name}</h3>
              <p className="text-sm text-muted-foreground">{asset.code}</p>
              <Badge
                variant="outline"
                className={cn("mt-1 text-xs", condCfg.className)}
              >
                {condCfg.label}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {detailRows.map((row) => (
              <div key={row.label}>
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    row.color ? `px-1.5 py-0.5 rounded ${row.color}` : "",
                  )}
                >
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {asset.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Ghi chú</p>
                <p className="text-sm bg-muted/50 rounded-lg p-3">
                  {asset.notes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ESSAssetsClient({ initialAssets }: ESSAssetsClientProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [columnVisibility, setColumnVisibility] =
    useState<Record<string, boolean>>(DEFAULT_VISIBLE);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      setSearchTerm("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Get unique categories
  const categories = Array.from(new Set(initialAssets.map((a) => a.category)));

  // Filter assets
  const filteredAssets = useMemo(() => {
    return initialAssets.filter((asset) => {
      const matchesSearch =
        searchTerm === "" ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" || asset.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [initialAssets, searchTerm, categoryFilter]);

  // Group assets by category (for grid view)
  const assetsByCategory = useMemo(() => {
    return filteredAssets.reduce(
      (acc, asset) => {
        if (!acc[asset.category]) {
          acc[asset.category] = [];
        }
        acc[asset.category].push(asset);
        return acc;
      },
      {} as Record<string, Asset[]>,
    );
  }, [filteredAssets]);

  // Stats
  const stats = useMemo(() => {
    const total = initialAssets.length;
    const computers = initialAssets.filter((a) =>
      ["Laptop", "Máy tính để bàn"].some((c) =>
        a.category.toLowerCase().includes(c.toLowerCase()),
      ),
    ).length;
    const mobile = initialAssets.filter((a) =>
      ["Điện thoại", "Tai nghe"].some((c) =>
        a.category.toLowerCase().includes(c.toLowerCase()),
      ),
    ).length;
    return { total, computers, mobile };
  }, [initialAssets]);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm("");
      setSearchExpanded(false);
    }
  }, [searchExpanded]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchTerm("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  // Column definitions
  const columns = useMemo(() => {
    const items: { key: ColumnKey; label: string; width: number }[] = [
      { key: "name", label: "Tên tài sản", width: 200 },
      { key: "category", label: "Loại", width: 130 },
      { key: "serialNumber", label: "Số serial", width: 180 },
      { key: "condition", label: "Tình trạng", width: 110 },
      { key: "brand", label: "Hãng", width: 120 },
      { key: "model", label: "Model", width: 130 },
      { key: "assignedAt", label: "Ngày nhận", width: 110 },
      { key: "assignedByName", label: "Người giao", width: 140 },
      { key: "location", label: "Vị trí", width: 120 },
      { key: "purchaseDate", label: "Ngày mua", width: 110 },
    ];
    return items;
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((col) => columnVisibility[col.key] !== false),
    [columns, columnVisibility],
  );

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="px-2 flex items-center sm:px-4 h-10 border-b">
            <h1 className="font-bold text-sm sm:text-base">
              Tài sản được giao
            </h1>
          </header>

          {/* Stats row */}
          <div className="px-2 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Total */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Tổng
                  </p>
                  <p className="text-sm font-bold leading-tight">
                    {stats.total}
                  </p>
                </div>
              </div>

              {/* Computers */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <Laptop className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Máy tính
                  </p>
                  <p className="text-sm font-bold leading-tight text-emerald-700">
                    {stats.computers}
                  </p>
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <Smartphone className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Di động
                  </p>
                  <p className="text-sm font-bold leading-tight text-purple-700">
                    {stats.mobile}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-1 sm:gap-2 px-2 py-2">
            {/* Search */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm..."
                className={cn(
                  "h-7 sm:h-8 text-xs transition-all duration-300 ease-in-out pr-7",
                  searchExpanded ? "w-32 sm:w-48 pl-3" : "w-0 opacity-0 pl-0",
                )}
              />
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleSearchToggle}
                className={cn(
                  "absolute right-0 z-10 ",
                  searchExpanded && "[&_svg]:text-primary",
                )}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Category Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={categoryFilter !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    categoryFilter !== "ALL" &&
                      "bg-primary/10 border-primary text-primary",
                  )}
                >
                  <Package className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {categoryFilter === "ALL" ? "Loại" : categoryFilter}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground py-1">
                  Loại tài sản
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v)}
                >
                  <DropdownMenuCheckboxItem
                    checked={categoryFilter === "ALL"}
                    onCheckedChange={() => setCategoryFilter("ALL")}
                    className="text-xs"
                  >
                    Tất cả
                  </DropdownMenuCheckboxItem>
                  {categories.map((cat) => (
                    <DropdownMenuCheckboxItem
                      key={cat}
                      checked={categoryFilter === cat}
                      onCheckedChange={() => setCategoryFilter(cat)}
                      className="text-xs"
                    >
                      <DynamicIcon
                        iconName={cat}
                        className="h-3 w-3 shrink-0 mr-2"
                      />
                      <span className="truncate">{cat}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick category pills (desktop) */}
            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant={categoryFilter === "ALL" ? "default" : "outline"}
                size="xs"
                onClick={() => setCategoryFilter("ALL")}
                className="text-xs"
              >
                Tất cả
              </Button>
              {categories.slice(0, 3).map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="xs"
                  onClick={() => setCategoryFilter(cat)}
                  className="text-xs"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View Mode Toggle (Desktop only) */}
            <div className="hidden sm:flex items-center border rounded-md overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50 ",
                )}
                title="Dạng bảng"
              >
                <Table2 className="h-3 w-3" />
                <span className="hidden lg:inline">Bảng</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs transition-colors border-l",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50 ",
                )}
                title="Dạng lưới"
              >
                <Grid2X2 className="h-3 w-3" />
                <span className="hidden lg:inline">Lưới</span>
              </button>
            </div>

            <Separator
              orientation="vertical"
              className="h-4! hidden sm:block"
            />

            {/* Settings (Desktop only) */}
            <Button
              variant="outline"
              size="icon-xs"
              className="hidden sm:flex"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>

          <TableSettingsPanel
            className="top-10"
            open={settingsOpen}
            onClose={setSettingsOpen}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            defaultVisibleColumns={DEFAULT_VISIBLE}
            columnOptions={[
              { key: "name", label: "Tên tài sản", icon: Package },
              { key: "category", label: "Loại", icon: Monitor },
              { key: "serialNumber", label: "Số serial", icon: Settings },
              { key: "condition", label: "Tình trạng", icon: Settings },
              { key: "brand", label: "Hãng", icon: Settings },
              { key: "model", label: "Model", icon: Settings },
              { key: "assignedAt", label: "Ngày nhận", icon: Calendar },
              { key: "assignedByName", label: "Người giao", icon: Settings },
              { key: "location", label: "Vị trí", icon: Settings },
              { key: "purchaseDate", label: "Ngày mua", icon: Calendar },
            ]}
            disabledColumnIndices={[0]}
            hiddenColumnIndices={[]}
          />
        </section>

        {/* Content */}
        <div className="flex-1 relative h-full min-h-0 overflow-hidden">
          <div className="h-full flex flex-col pb-8">
            {isMobile ? (
              /* ── Mobile Card List View ── */
              <div className="overflow-auto h-full">
                {filteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                    <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center">
                      {searchTerm || categoryFilter !== "ALL"
                        ? "Không tìm thấy tài sản phù hợp"
                        : "Bạn chưa được giao tài sản nào"}
                    </p>
                    {(searchTerm || categoryFilter !== "ALL") && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchTerm("");
                          setCategoryFilter("ALL");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredAssets.map((asset) => (
                      <MobileAssetCard
                        key={asset.id}
                        asset={asset}
                        onClick={() => setSelectedAsset(asset)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : viewMode === "table" ? (
              /* ── Desktop Table View ── */
              <div className="overflow-x-auto h-full">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {visibleColumns.map((col) => (
                        <TableHead
                          key={col.key}
                          style={{ width: col.width }}
                          className="h-8 px-3 text-xs font-semibold select-none z-10 relative"
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumns.length}
                          className="h-32 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                            <p>
                              {searchTerm || categoryFilter !== "ALL"
                                ? "Không tìm thấy tài sản phù hợp"
                                : "Bạn chưa được giao tài sản nào"}
                            </p>
                            {(searchTerm || categoryFilter !== "ALL") && (
                              <Button
                                variant="link"
                                onClick={() => {
                                  setSearchTerm("");
                                  setCategoryFilter("ALL");
                                }}
                              >
                                Xóa bộ lọc
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssets.map((asset) => {
                        const condCfg = CONDITION_CONFIG[asset.condition] ?? {
                          label: asset.condition,
                          className: "bg-muted text-muted-foreground",
                        };
                        return (
                          <TableRow
                            key={asset.id}
                            className="group/row cursor-pointer"
                            onClick={() => setSelectedAsset(asset)}
                          >
                            {/* Name */}
                            {columnVisibility.name !== false && (
                              <TableCell className="px-3 py-2">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={cn(
                                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                      asset.category
                                        .toLowerCase()
                                        .includes("laptop") ||
                                        asset.category
                                          .toLowerCase()
                                          .includes("máy tính")
                                        ? "bg-blue-100 text-blue-600"
                                        : asset.category
                                              .toLowerCase()
                                              .includes("điện thoại") ||
                                            asset.category
                                              .toLowerCase()
                                              .includes("tai nghe")
                                          ? "bg-purple-100 text-purple-600"
                                          : asset.category
                                                .toLowerCase()
                                                .includes("máy in")
                                            ? "bg-amber-100 text-amber-600"
                                            : "bg-orange-100 text-orange-600",
                                    )}
                                  >
                                    <DynamicIcon
                                      iconName={asset.category}
                                      className="h-4 w-4"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate leading-tight">
                                      {asset.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-mono">
                                      {asset.code}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                            )}

                            {/* Category */}
                            {columnVisibility.category !== false && (
                              <TableCell className="px-3 py-2">
                                <span className="text-sm">
                                  {asset.category}
                                </span>
                              </TableCell>
                            )}

                            {/* Serial Number */}
                            {columnVisibility.serialNumber !== false && (
                              <TableCell className="px-3 py-2">
                                <span className="text-sm font-mono text-muted-foreground">
                                  {asset.serialNumber || "—"}
                                </span>
                              </TableCell>
                            )}

                            {/* Condition */}
                            {columnVisibility.condition !== false && (
                              <TableCell className="px-3 py-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] py-0 h-5",
                                    condCfg.className,
                                  )}
                                >
                                  {condCfg.label}
                                </Badge>
                              </TableCell>
                            )}

                            {/* Brand */}
                            {columnVisibility.brand !== false && (
                              <TableCell className="px-3 py-2">
                                <span className="text-sm text-muted-foreground truncate">
                                  {asset.brand || "—"}
                                </span>
                              </TableCell>
                            )}

                            {/* Model */}
                            {columnVisibility.model !== false && (
                              <TableCell className="px-3 py-2">
                                <span className="text-sm text-muted-foreground truncate">
                                  {asset.model || "—"}
                                </span>
                              </TableCell>
                            )}

                            {/* Assigned At */}
                            {columnVisibility.assignedAt !== false && (
                              <TableCell className="px-3 py-2">
                                <span className="text-sm">
                                  {formatDate(asset.assignedAt)}
                                </span>
                              </TableCell>
                            )}

                            {/* Assigned By */}
                            {columnVisibility.assignedByName !== false && (
                              <TableCell className="px-3 py-2">
                                <span className="text-sm text-muted-foreground truncate">
                                  {asset.assignedByName}
                                </span>
                              </TableCell>
                            )}

                            {/* Location */}
                            {columnVisibility.location !== false && (
                              <TableCell className="px-3 py-2">
                                <span className="text-sm text-muted-foreground truncate">
                                  {asset.location || "—"}
                                </span>
                              </TableCell>
                            )}

                            {/* Purchase Date */}
                            {columnVisibility.purchaseDate !== false && (
                              <TableCell className="px-3 py-2">
                                <span className="text-sm text-muted-foreground">
                                  {asset.purchaseDate
                                    ? formatDate(asset.purchaseDate)
                                    : "—"}
                                </span>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* ── Desktop Grid View ── */
              <div className="overflow-auto h-full p-3">
                <div className="space-y-5">
                  {Object.entries(assetsByCategory).map(
                    ([category, assets]) => {
                      const Icon = getIconForCategory(category);
                      return (
                        <div key={category} className="space-y-2">
                          {/* Category Header */}
                          <div className="flex items-center gap-2 px-1">
                            <div className="p-1 rounded-md bg-muted/50">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <h3 className="text-xs font-semibold">
                              {category}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="text-[10px] py-0 h-4 px-1.5"
                            >
                              {assets.length}
                            </Badge>
                          </div>

                          {/* Asset Grid */}
                          <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                            {assets.map((asset) => (
                              <AssetCard
                                key={asset.id}
                                asset={asset}
                                onClick={() => setSelectedAsset(asset)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}

                  {/* Info Card */}
                  <Card className="bg-blue-50/50 border-blue-100">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <p className="font-medium text-blue-900">
                            Lưu ý về tài sản
                          </p>
                          <ul className="mt-1.5 space-y-0.5 text-blue-800">
                            <li>
                              • Tài sản được liệt kê là tài sản bạn đang sử dụng
                            </li>
                            <li>
                              • Nếu có vấn đề, vui lòng liên hệ bộ phận HCNS
                            </li>
                            <li>
                              • Khi nghỉ việc, cần hoàn trả tài sản cho công ty
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Bottom bar */}
            {filteredAssets.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-3 py-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{filteredAssets.length}</strong> /{" "}
                  <strong>{initialAssets.length}</strong> tài sản
                </p>
                {categoryFilter !== "ALL" && (
                  <span className="text-xs text-muted-foreground">
                    Lọc: {categoryFilter}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <AssetDetailDialog
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}
