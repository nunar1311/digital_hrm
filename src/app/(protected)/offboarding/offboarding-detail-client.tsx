"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  CheckCircle,
  DollarSign,
  Calendar,
  ArrowLeft,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOffboardingById,
  updateChecklistItem,
  updateOffboardingAsset,
  saveExitInterview,
  calculateFinalSettlement,
  addChecklistItem,
  deleteChecklistItem,
  updateOffboarding,
} from "./actions";
import type { OffboardingDetailData } from "./types";
import {
  CHECKLIST_CATEGORY_LABELS,
  CHECKLIST_CATEGORY_COLORS,
  ASSET_STATUS_LABELS,
  REASON_OPTIONS,
} from "./types";
import { useTimezone } from "@/hooks/use-timezone";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OffboardingDetailClientProps {
  initialDetail: OffboardingDetailData;
  canManage: boolean;
}

function toSettlementData(detail: OffboardingDetailData) {
  return {
    finalSalary: detail.finalSalary || 0,
    unusedLeaveDays: detail.unusedLeaveDays || 0,
    unusedLeaveAmount: detail.unusedLeaveAmount || 0,
    severancePay: detail.severancePay || 0,
    otherAllowances: detail.otherAllowances || 0,
  };
}

export function OffboardingDetailClient({
  initialDetail,
  canManage,
}: OffboardingDetailClientProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { formatDate, formatDateTime } = useTimezone();
  const detailQueryKey = useMemo(
    () => ["offboarding", initialDetail.id] as const,
    [initialDetail.id],
  );

  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newChecklistDescription, setNewChecklistDescription] = useState("");
  const [newChecklistCategory, setNewChecklistCategory] =
    useState<keyof typeof CHECKLIST_CATEGORY_LABELS>("GENERAL");
  const [newChecklistDueDate, setNewChecklistDueDate] = useState("");
  const [addChecklistDialogOpen, setAddChecklistDialogOpen] = useState(false);
  const [deletingChecklistId, setDeletingChecklistId] = useState<string | null>(
    null,
  );
  const [checklistDeleteTarget, setChecklistDeleteTarget] = useState<{
    id: string;
    taskTitle: string;
  } | null>(null);
  const [checklistSearch, setChecklistSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (checklistSearch.trim()) {
        setChecklistSearch("");
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const [exitInterviewContent, setExitInterviewContent] = useState(
    initialDetail.exitInterview || "",
  );
  const [activeTab, setActiveTab] = useState("checklist");
  const [settlementData, setSettlementData] = useState(() =>
    toSettlementData(initialDetail),
  );

  // Fetch detailed offboarding data for updates
  const { data: detailData } = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => getOffboardingById(initialDetail.id),
    initialData: initialDetail,
  });

  const detail = detailData || initialDetail;

  const settlementFormatter = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
    [],
  );

  const reasonLabel = useMemo(
    () =>
      REASON_OPTIONS.find((r) => r.value === detail.reason)?.label ||
      detail.reason ||
      "Không xác định",
    [detail.reason],
  );

  const completedCount = useMemo(
    () => detail.checklist.filter((c) => c.isCompleted).length || 0,
    [detail.checklist],
  );
  const totalCount = detail.checklist.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const totalSettlement = useMemo(
    () =>
      settlementData.finalSalary +
      settlementData.unusedLeaveAmount +
      settlementData.severancePay +
      settlementData.otherAllowances,
    [settlementData],
  );

  const invalidateDetailQuery = () =>
    queryClient.invalidateQueries({ queryKey: detailQueryKey });

  // Mutations
  const checklistMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      updateChecklistItem(id, { isCompleted }),
    onSuccess: () => {
      toast.success("Đã cập nhật checklist");
      invalidateDetailQuery();
    },
  });

  const assetMutation = useMutation({
    mutationFn: ({
      id,
      status,
      condition,
    }: {
      id: string;
      status: string;
      condition?: string;
    }) => updateOffboardingAsset(id, { status, condition }),
    onSuccess: () => {
      toast.success("Đã cập nhật tài sản");
      invalidateDetailQuery();
    },
  });

  const exitInterviewMutation = useMutation({
    mutationFn: (exitInterview: string) =>
      saveExitInterview(detail.id, { exitInterview }),
    onSuccess: () => {
      toast.success("Đã lưu exit interview");
      invalidateDetailQuery();
    },
  });

  const settlementMutation = useMutation({
    mutationFn: () => calculateFinalSettlement(detail.id, settlementData),
    onSuccess: () => {
      toast.success("Đã lưu quyết toán");
      invalidateDetailQuery();
    },
  });

  const addChecklistMutation = useMutation({
    mutationFn: (data: {
      taskTitle: string;
      taskDescription?: string;
      category?: keyof typeof CHECKLIST_CATEGORY_LABELS;
      dueDate?: Date;
    }) => addChecklistItem(detail.id, data),
    onSuccess: () => {
      toast.success("Đã thêm công việc");
      invalidateDetailQuery();
      setNewChecklistItem("");
      setNewChecklistDescription("");
      setNewChecklistCategory("GENERAL");
      setNewChecklistDueDate("");
      setAddChecklistDialogOpen(false);
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (checklistId: string) => deleteChecklistItem(checklistId),
    onMutate: (checklistId: string) => {
      setDeletingChecklistId(checklistId);
    },
    onSuccess: () => {
      toast.success("Đã xóa công việc");
      invalidateDetailQuery();
      setChecklistDeleteTarget(null);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Không thể xóa công việc";
      toast.error(message);
    },
    onSettled: () => {
      setDeletingChecklistId(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => updateOffboarding(detail.id, { status: "COMPLETED" }),
    onSuccess: () => {
      toast.success("Đã chốt offboarding, tài khoản đã bị khóa");
      invalidateDetailQuery();
      queryClient.invalidateQueries({ queryKey: ["offboardings"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Không thể chốt offboarding";
      toast.error(message);
    },
  });

  const trimmedChecklistItem = newChecklistItem.trim();

  const filteredChecklist = useMemo(() => {
    const keyword = checklistSearch.trim().toLowerCase();
    if (!keyword) {
      return detail.checklist;
    }

    return detail.checklist.filter((item) => {
      const title = item.taskTitle?.toLowerCase() || "";
      const description = item.taskDescription?.toLowerCase() || "";
      return title.includes(keyword) || description.includes(keyword);
    });
  }, [detail.checklist, checklistSearch]);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (checklistSearch.trim()) {
        setChecklistSearch("");
      }
      setSearchExpanded(false);
    }
  }, [searchExpanded, checklistSearch]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setChecklistSearch("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  const handleCreateChecklist = useCallback(() => {
    if (!trimmedChecklistItem || addChecklistMutation.isPending) {
      return;
    }

    addChecklistMutation.mutate({
      taskTitle: trimmedChecklistItem,
      taskDescription: newChecklistDescription.trim() || undefined,
      category: newChecklistCategory,
      dueDate: newChecklistDueDate
        ? new Date(`${newChecklistDueDate}T00:00:00`)
        : undefined,
    });
  }, [
    addChecklistMutation,
    newChecklistCategory,
    newChecklistDescription,
    newChecklistDueDate,
    trimmedChecklistItem,
  ]);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="shrink-0 border-b h-10 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className=" font-semibold truncate">Chi tiết Offboarding</h1>
          </div>
          {canManage && detail.status === "PROCESSING" && (
            <Button
              size="xs"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              <CheckCircle />
              Chốt thôi việc
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden h-full">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] h-full overflow-hidden">
          <div className="space-y-4 overflow-hidden lg:self-start border-r p-2 h-full">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 border border-border/60">
                  <AvatarImage src={detail.user.image || undefined} />
                  <AvatarFallback>
                    {detail.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold truncate gap-x-2">
                    {detail.user.name} - {detail.user.username}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {detail.user.email}
                  </p>
                </div>
              </div>
            </div>
            <Card className="p-3">
              <CardHeader className="px-3">
                <CardTitle className="text-base">Thông tin nghỉ việc</CardTitle>
              </CardHeader>
              <CardContent className="px-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ngày nộp đơn:
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(detail.resignDate, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ngày cuối cùng:
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(detail.lastWorkDate, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Lý do:</span>{" "}
                  <span className="text-sm font-medium">{reasonLabel}</span>
                </div>
                {detail.reasonDetail && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Chi tiết:
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground border-l-2 pl-3 italic">
                      {detail.reasonDetail}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {detail.status === "PROCESSING" && (
              <Card className="p-3">
                <CardHeader className="px-3">
                  <CardTitle className="text-base">
                    Tiến độ hoàn thành
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Checklist</span>
                    <span className="text-sm font-medium">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {Math.round(progress)}% checklist đã hoàn thành
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="min-w-0 flex-1 h-full overflow-hidden flex flex-col">
            <div className="flex items-center px-2 h-10 pb-0 border-b bg-background shrink-0 overflow-x-auto no-scrollbar relative">
              {(
                [
                  {
                    value: "checklist",
                    label: "Checklist",
                    count: detail.checklist.length,
                  },
                  {
                    value: "assets",
                    label: "Tài sản",
                    count: detail.assets.length,
                  },
                  {
                    value: "settlement",
                    label: "Quyết toán",
                    count: undefined as number | undefined,
                  },
                  {
                    value: "interview",
                    label: "Exit Interview",
                    count: undefined as number | undefined,
                  },
                ] as const
              ).map((tab) => {
                return (
                  <button
                    key={tab.value}
                    type="button"
                    data-state={activeTab === tab.value ? "active" : "inactive"}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium whitespace-nowrap flex items-center gap-1 rounded-lg",
                      "after:-mb-2 relative after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 hover:bg-accent  hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary",
                    )}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <Badge
                        className={cn(
                          "p-0 px-1 text-[10px]",
                          activeTab === tab.value
                            ? "bg-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 flex-1 min-h-0 overflow-hidden">
              {activeTab === "checklist" && (
                <div className="p-3 h-full min-h-0 flex flex-col">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle>Danh mục công việc</CardTitle>
                    <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                      <div
                        className="relative flex items-center"
                        ref={mergedSearchRef}
                      >
                        <Input
                          ref={searchInputRef}
                          value={checklistSearch}
                          onChange={(e) => setChecklistSearch(e.target.value)}
                          onKeyDown={handleSearchKeyDown}
                          placeholder="Tìm kiếm công việc..."
                          className={cn(
                            "h-7 text-sm transition-all duration-300 ease-in-out pr-6",
                            searchExpanded
                              ? "w-50 opacity-100 pl-3"
                              : "w-0 opacity-0 pl-0",
                          )}
                        />

                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={handleSearchToggle}
                          className={cn(
                            "absolute right-0.5 z-10",
                            searchExpanded && "[&_svg]:text-primary",
                          )}
                        >
                          <Search />
                        </Button>
                      </div>

                      {canManage && (
                        <Dialog
                          open={addChecklistDialogOpen}
                          onOpenChange={setAddChecklistDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button size="xs">Thêm công việc</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                              <DialogTitle>
                                Thêm công việc offboarding
                              </DialogTitle>
                              <DialogDescription>
                                Nhập tên công việc và các thông tin chi tiết nếu
                                cần.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-sm font-medium">
                                  Tên công việc
                                </label>
                                <Input
                                  placeholder="Ví dụ: Bàn giao tài liệu dự án"
                                  value={newChecklistItem}
                                  onChange={(e) =>
                                    setNewChecklistItem(e.target.value)
                                  }
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-sm font-medium">
                                  Mô tả
                                </label>
                                <Input
                                  placeholder="Mô tả công việc (tùy chọn)..."
                                  value={newChecklistDescription}
                                  onChange={(e) =>
                                    setNewChecklistDescription(e.target.value)
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                  <label className="text-sm font-medium">
                                    Tính chất
                                  </label>
                                  <select
                                    value={newChecklistCategory}
                                    onChange={(e) =>
                                      setNewChecklistCategory(
                                        e.target
                                          .value as keyof typeof CHECKLIST_CATEGORY_LABELS,
                                      )
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  >
                                    {Object.entries(
                                      CHECKLIST_CATEGORY_LABELS,
                                    ).map(([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-sm font-medium">
                                    Hạn hoàn thành
                                  </label>
                                  <Input
                                    type="date"
                                    value={newChecklistDueDate}
                                    onChange={(e) =>
                                      setNewChecklistDueDate(e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setAddChecklistDialogOpen(false)}
                                disabled={addChecklistMutation.isPending}
                              >
                                Hủy
                              </Button>
                              <Button
                                onClick={handleCreateChecklist}
                                disabled={
                                  !trimmedChecklistItem ||
                                  addChecklistMutation.isPending
                                }
                              >
                                {addChecklistMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Thêm công việc
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-2 flex-1 min-h-0 overflow-y-auto pr-1">
                    {filteredChecklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-2 border rounded-lg bg-background hover:bg-muted/40 transition-colors"
                      >
                        <Checkbox
                          checked={item.isCompleted}
                          onCheckedChange={(checked) =>
                            canManage &&
                            checklistMutation.mutate({
                              id: item.id,
                              isCompleted: checked as boolean,
                            })
                          }
                          disabled={!canManage}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className={`font-medium ${
                                item.isCompleted
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {item.taskTitle}
                            </div>
                            {canManage && (
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  setChecklistDeleteTarget({
                                    id: item.id,
                                    taskTitle: item.taskTitle,
                                  })
                                }
                                disabled={deleteChecklistMutation.isPending}
                              >
                                {deleteChecklistMutation.isPending &&
                                deletingChecklistId === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                          {item.taskDescription && (
                            <div className="text-sm text-muted-foreground">
                              {item.taskDescription}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <Badge
                              variant="outline"
                              className={
                                CHECKLIST_CATEGORY_COLORS[
                                  item.category as keyof typeof CHECKLIST_CATEGORY_COLORS
                                ]
                              }
                            >
                              {
                                CHECKLIST_CATEGORY_LABELS[
                                  item.category as keyof typeof CHECKLIST_CATEGORY_LABELS
                                ]
                              }
                            </Badge>
                            {item.dueDate && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 mr-1" />
                                Hạn:{" "}
                                {formatDate(item.dueDate, {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </div>
                            )}
                            {item.isCompleted && item.completedAt && (
                              <div className="text-xs text-green-600 flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Hoàn thành:{" "}
                                {formatDateTime(item.completedAt, {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredChecklist.length === 0 && (
                      <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                        {checklistSearch.trim()
                          ? "Không tìm thấy công việc phù hợp"
                          : "Chưa có công việc nào được tạo"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "assets" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                      Tài sản đang bàn giao
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {detail.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-background gap-4"
                        >
                          <div>
                            <div className="font-semibold">
                              {asset.assetName}
                            </div>
                            <div className="text-sm text-muted-foreground flex gap-2">
                              <span>Mã: {asset.assetCode}</span>
                              <span>•</span>
                              <span>Loại: {asset.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {canManage && asset.status === "PENDING" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() =>
                                    assetMutation.mutate({
                                      id: asset.id,
                                      status: "RETURNED",
                                      condition: "GOOD",
                                    })
                                  }
                                >
                                  Đã trả
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    assetMutation.mutate({
                                      id: asset.id,
                                      status: "DAMAGED",
                                    })
                                  }
                                >
                                  Hư hỏng
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant={
                                  asset.status === "RETURNED"
                                    ? "default"
                                    : asset.status === "DAMAGED"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {
                                  ASSET_STATUS_LABELS[
                                    asset.status as keyof typeof ASSET_STATUS_LABELS
                                  ]
                                }
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {detail.assets.length === 0 && (
                        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                          Nhân viên không giữ tài sản nào
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "settlement" && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                        Quyết toán tài chính
                      </CardTitle>
                      {canManage && (
                        <Button
                          size="sm"
                          onClick={() => settlementMutation.mutate()}
                          disabled={settlementMutation.isPending}
                        >
                          {settlementMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Lưu thay đổi
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Lương cuối tháng
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                            value={settlementData.finalSalary}
                            onChange={(e) =>
                              setSettlementData({
                                ...settlementData,
                                finalSalary: Number(e.target.value),
                              })
                            }
                            disabled={!canManage}
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Trợ cấp thôi việc
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                            value={settlementData.severancePay}
                            onChange={(e) =>
                              setSettlementData({
                                ...settlementData,
                                severancePay: Number(e.target.value),
                              })
                            }
                            disabled={!canManage}
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Ngày phép chưa dùng
                        </label>
                        <input
                          type="number"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                          value={settlementData.unusedLeaveDays}
                          onChange={(e) =>
                            setSettlementData({
                              ...settlementData,
                              unusedLeaveDays: Number(e.target.value),
                            })
                          }
                          disabled={!canManage}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Số tiền phép chưa dùng
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                            value={settlementData.unusedLeaveAmount}
                            onChange={(e) =>
                              setSettlementData({
                                ...settlementData,
                                unusedLeaveAmount: Number(e.target.value),
                              })
                            }
                            disabled={!canManage}
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-sm font-medium">
                          Các khoản cộng/trừ khác
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                            value={settlementData.otherAllowances}
                            onChange={(e) =>
                              setSettlementData({
                                ...settlementData,
                                otherAllowances: Number(e.target.value),
                              })
                            }
                            disabled={!canManage}
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Tổng thanh toán thực nhận:
                        </span>
                        <div className="text-2xl font-bold text-green-600">
                          {settlementFormatter.format(totalSettlement)}
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "interview" && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                        Nội dung phỏng vấn nghỉ việc
                      </CardTitle>
                      {canManage && (
                        <Button
                          size="sm"
                          onClick={() =>
                            exitInterviewMutation.mutate(exitInterviewContent)
                          }
                          disabled={exitInterviewMutation.isPending}
                        >
                          {exitInterviewMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Lưu nội dung
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Nhập nội dung exit interview, lý do sâu xa, góp ý cho công ty..."
                      rows={12}
                      value={exitInterviewContent}
                      onChange={(e) => setExitInterviewContent(e.target.value)}
                      className="resize-none"
                      disabled={!canManage}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <AlertDialog
            open={checklistDeleteTarget !== null}
            onOpenChange={(open) => !open && setChecklistDeleteTarget(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa công việc</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa công việc{" "}
                  <strong>{checklistDeleteTarget?.taskTitle}</strong>? Hành động
                  này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteChecklistMutation.isPending}>
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    if (!checklistDeleteTarget) return;
                    deleteChecklistMutation.mutate(checklistDeleteTarget.id);
                  }}
                  disabled={deleteChecklistMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteChecklistMutation.isPending
                    ? "Đang xóa..."
                    : "Xóa công việc"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
