"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  Settings2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getSeniorityRules,
  upsertSeniorityRule,
  deleteSeniorityRule,
  initializeLeaveBalances,
  runYearEndCarryOver,
  getAllLeaveTypesWithConfig,
  updateLeaveTypeConfig,
} from "../leave-summary/actions";

type SeniorityRule = {
  id: string;
  minYears: number;
  maxYears: number | null;
  bonusDays: number;
  isActive: boolean;
};

type LeaveTypeConfig = {
  id: string;
  name: string;
  defaultDays: number;
  isPaidLeave: boolean;
  applySeniorityBonus: boolean;
  maxCarryOverDays: number | null;
};

// ─────────────────────────────────────────────────────────────
// Seniority Rule Form Dialog
// ─────────────────────────────────────────────────────────────

function SeniorityRuleDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: SeniorityRule | null;
  onSaved: () => void;
}) {
  const [minYears, setMinYears] = useState(editing?.minYears ?? 5);
  const [maxYears, setMaxYears] = useState<number | "">(
    editing?.maxYears ?? "",
  );
  const [bonusDays, setBonusDays] = useState(editing?.bonusDays ?? 2);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  // Reset when dialog opens with new editing value
  const handleOpen = (v: boolean) => {
    if (v) {
      setMinYears(editing?.minYears ?? 5);
      setMaxYears(editing?.maxYears ?? "");
      setBonusDays(editing?.bonusDays ?? 2);
      setIsActive(editing?.isActive ?? true);
    }
    onOpenChange(v);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      upsertSeniorityRule({
        id: editing?.id,
        minYears,
        maxYears: maxYears === "" ? null : Number(maxYears),
        bonusDays,
        isActive,
      }),
    onSuccess: () => {
      toast.success(editing ? "Đã cập nhật quy tắc" : "Đã thêm quy tắc mới");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Chỉnh sửa quy tắc" : "Thêm quy tắc thâm niên"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Năm thâm niên tối thiểu</Label>
              <Input
                type="number"
                min={0}
                value={minYears}
                onChange={(e) => setMinYears(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Năm thâm niên tối đa</Label>
              <Input
                type="number"
                min={0}
                value={maxYears}
                placeholder="Không giới hạn"
                onChange={(e) =>
                  setMaxYears(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Số ngày cộng thêm</Label>
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={bonusDays}
              onChange={(e) => setBonusDays(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Đang kích hoạt</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending && <Loader2 className="size-3.5 animate-spin mr-1" />}
            {editing ? "Lưu thay đổi" : "Thêm quy tắc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Initialize Dialog
// ─────────────────────────────────────────────────────────────

function InitializeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState<{
    initialized: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => initializeLeaveBalances(year),
    onSuccess: (data) => {
      setResult(data);
      if (data.errors.length === 0) {
        toast.success(`Khởi tạo thành công ${data.initialized} bản ghi phép`);
      } else {
        toast.warning(`Có ${data.errors.length} lỗi khi khởi tạo`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setResult(null);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Khởi tạo phép năm
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Info className="size-4" />
            <AlertTitle className="text-sm">Lưu ý</AlertTitle>
            <AlertDescription className="text-xs">
              Tự động tạo/cập nhật số dư phép cho tất cả nhân viên đang active
              dựa trên loại phép và quy tắc thâm niên đã cấu hình.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <Label className="text-xs">Năm khởi tạo</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          {result && (
            <Alert
              className={
                result.errors.length > 0
                  ? "border-amber-300"
                  : "border-green-300"
              }
            >
              {result.errors.length > 0 ? (
                <AlertCircle className="size-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="size-4 text-green-600" />
              )}
              <AlertTitle className="text-sm">Kết quả</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>✅ Khởi tạo thành công: {result.initialized} bản ghi</p>
                {result.errors.length > 0 && (
                  <p>❌ Lỗi: {result.errors.length} bản ghi</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Sparkles className="size-3.5 mr-1" />
            )}
            Khởi tạo năm {year}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Carry-Over Dialog
// ─────────────────────────────────────────────────────────────

function CarryOverDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const thisYear = new Date().getFullYear();
  const [fromYear, setFromYear] = useState(thisYear - 1);
  const [toYear, setToYear] = useState(thisYear);
  const [result, setResult] = useState<{
    processed: number;
    skipped: number;
    totalCarriedOver: number;
    errors: string[];
  } | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => runYearEndCarryOver(fromYear, toYear),
    onSuccess: (data) => {
      setResult(data);
      if (data.errors.length === 0) {
        toast.success(
          `Chuyển ${data.totalCarriedOver} ngày phép sang năm ${toYear}`,
        );
      } else {
        toast.warning(`Có ${data.errors.length} lỗi khi chuyển phép`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setResult(null);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="size-4 text-primary" />
            Chốt & Chuyển phép cuối năm
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Info className="size-4" />
            <AlertTitle className="text-sm">Lưu ý</AlertTitle>
            <AlertDescription className="text-xs">
              Số ngày phép còn dư của năm cũ (có cấu hình carry-over) sẽ được
              cộng thêm vào số dư năm mới, tối đa theo giới hạn đã cài đặt cho
              từng loại phép.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Từ năm</Label>
              <Input
                type="number"
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
              />
            </div>
            <ArrowRight className="size-4 text-muted-foreground mt-5" />
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Sang năm</Label>
              <Input
                type="number"
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
              />
            </div>
          </div>

          {result && (
            <Alert
              className={
                result.errors.length > 0
                  ? "border-amber-300"
                  : "border-green-300"
              }
            >
              {result.errors.length > 0 ? (
                <AlertCircle className="size-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="size-4 text-green-600" />
              )}
              <AlertTitle className="text-sm">Kết quả</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>✅ Đã chuyển: {result.processed} bản ghi</p>
                <p>📅 Tổng ngày chuyển: {result.totalCarriedOver} ngày</p>
                {result.skipped > 0 && (
                  <p>⏭ Bỏ qua: {result.skipped} bản ghi (không có ngày dư)</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <ArrowRight className="size-3.5 mr-1" />
            )}
            Chuyển phép {fromYear} → {toYear}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function LeavePolicyClient() {
  const queryClient = useQueryClient();
  const [seniorityDialogOpen, setSeniorityDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SeniorityRule | null>(null);
  const [initDialogOpen, setInitDialogOpen] = useState(false);
  const [carryOverDialogOpen, setCarryOverDialogOpen] = useState(false);

  // Seniority rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["seniority-rules"],
    queryFn: getSeniorityRules,
  });

  // Leave type configs
  const { data: leaveTypes = [], isLoading: ltLoading } = useQuery({
    queryKey: ["leave-types-config"],
    queryFn: getAllLeaveTypesWithConfig,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["seniority-rules"] });
    queryClient.invalidateQueries({ queryKey: ["leave-types-config"] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteSeniorityRule,
    onSuccess: () => {
      toast.success("Đã xóa quy tắc");
      queryClient.invalidateQueries({ queryKey: ["seniority-rules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateLeaveTypeMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        applySeniorityBonus?: boolean;
        maxCarryOverDays?: number | null;
      };
    }) => updateLeaveTypeConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types-config"] });
      toast.success("Đã cập nhật cấu hình");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* ─── Header ─── */}
      <section className="border-b">
        <header className="p-2 flex items-center h-10">
          <h1 className="font-bold">Chính sách nghỉ phép</h1>
        </header>
      </section>

      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-end gap-1.5 px-2 py-2 shrink-0 border-b">
        <Button
          size="xs"
          variant="outline"
          onClick={() => setInitDialogOpen(true)}
        >
          Khởi tạo phép năm
        </Button>
        <Button
          size="xs"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={() => setCarryOverDialogOpen(true)}
        >
          <ArrowRight className="size-3.5" />
          Chuyển phép cuối năm
        </Button>

        <Separator orientation="vertical" className="h-4!" />

        <Button size="xs" variant="outline" onClick={() => invalidateAll()}>
          <RefreshCw />
        </Button>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-6 p-4">
          {/* ── Leave Type Config Section ── */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Cấu hình loại nghỉ phép
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bật/tắt tính thâm niên và cài đặt giới hạn chuyển phép cho từng
                loại
              </p>
            </div>

            {ltLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="size-4 animate-spin" />
                Đang tải...
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-xs h-8">
                        Loại nghỉ phép
                      </TableHead>
                      <TableHead className="text-xs text-center h-8">
                        Số ngày mặc định
                      </TableHead>
                      <TableHead className="text-xs text-center h-8">
                        Tính thâm niên
                      </TableHead>
                      <TableHead className="text-xs text-center h-8">
                        Giới hạn carry-over
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(leaveTypes as LeaveTypeConfig[]).map((lt) => (
                      <TableRow key={lt.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {lt.name}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {lt.isPaidLeave ? "Có lương" : "Không lương"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {lt.defaultDays} ngày
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={lt.applySeniorityBonus}
                            onCheckedChange={(v) =>
                              updateLeaveTypeMutation.mutate({
                                id: lt.id,
                                data: { applySeniorityBonus: v },
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              className="w-20 h-7 text-xs text-center"
                              placeholder="0"
                              value={lt.maxCarryOverDays ?? ""}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value);
                                updateLeaveTypeMutation.mutate({
                                  id: lt.id,
                                  data: { maxCarryOverDays: val },
                                });
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              ngày
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Seniority Rules Section ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Quy tắc cộng phép thâm niên
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cấu hình số ngày cộng thêm theo số năm công tác
                </p>
              </div>
              <Button
                size="xs"
                onClick={() => {
                  setEditingRule(null);
                  setSeniorityDialogOpen(true);
                }}
              >
                <Plus className="size-3.5 mr-1" />
                Thêm quy tắc
              </Button>
            </div>

            {rulesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="size-4 animate-spin" />
                Đang tải...
              </div>
            ) : rules.length === 0 ? (
              <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
                <RefreshCw className="size-8 mx-auto mb-3 opacity-30" />
                <p>Chưa có quy tắc thâm niên nào.</p>
                <p className="text-xs mt-1">
                  Ví dụ: &gt;5 năm cộng 2 ngày, &gt;10 năm cộng 4 ngày
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-xs h-8">Thâm niên</TableHead>
                      <TableHead className="text-xs text-center h-8">
                        Ngày cộng thêm
                      </TableHead>
                      <TableHead className="text-xs text-center h-8">
                        Trạng thái
                      </TableHead>
                      <TableHead className="text-xs w-20 h-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(rules as SeniorityRule[]).map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="text-sm">
                          Từ {rule.minYears} năm
                          {rule.maxYears
                            ? ` đến ${rule.maxYears} năm`
                            : " trở lên"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                            +{rule.bonusDays} ngày
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={rule.isActive ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {rule.isActive ? "Đang dùng" : "Đã tắt"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setEditingRule(rule as SeniorityRule);
                                setSeniorityDialogOpen(true);
                              }}
                            >
                              <Settings2 />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(rule.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <SeniorityRuleDialog
        open={seniorityDialogOpen}
        onOpenChange={setSeniorityDialogOpen}
        editing={editingRule}
        onSaved={invalidateAll}
      />
      <InitializeDialog
        open={initDialogOpen}
        onOpenChange={setInitDialogOpen}
      />
      <CarryOverDialog
        open={carryOverDialogOpen}
        onOpenChange={setCarryOverDialogOpen}
      />
    </div>
  );
}
