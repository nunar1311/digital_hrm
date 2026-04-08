// ============================================================
// Position Salary Manager - Dialog để thêm/sửa lương chức vụ
// ============================================================

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  BadgeCheck,
  Loader2,
  Banknote,
} from "lucide-react";
import {
  getPositionSalaries,
  createPositionSalary,
  updatePositionSalary,
  deletePositionSalary,
} from "@/app/(protected)/departments/actions";
import type { PositionSalaryItem } from "@/app/(protected)/departments/types";

const SALARY_GRADES = ["A", "B", "C", "D", "E", "F"];

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

interface PositionSalaryFormDialogProps {
  open: boolean;
  onClose: () => void;
  positionId: string;
  positionName: string;
  editSalary?: PositionSalaryItem | null;
}

export function PositionSalaryFormDialog({
  open,
  onClose,
  positionId,
  positionName,
  editSalary,
}: PositionSalaryFormDialogProps) {
  const [form, setForm] = useState({
    salaryGrade: editSalary?.salaryGrade ?? "A",
    baseSalary: editSalary ? String(editSalary.baseSalary) : "",
    description: editSalary?.description ?? "",
    effectiveDate: editSalary?.effectiveDate
      ? new Date(editSalary.effectiveDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    isActive: editSalary?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form when editSalary changes
  useState(() => {
    if (editSalary) {
      setForm({
        salaryGrade: editSalary.salaryGrade,
        baseSalary: String(editSalary.baseSalary),
        description: editSalary.description ?? "",
        effectiveDate: editSalary.effectiveDate
          ? new Date(editSalary.effectiveDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        isActive: editSalary.isActive,
      });
    } else {
      setForm({
        salaryGrade: "A",
        baseSalary: "",
        description: "",
        effectiveDate: new Date().toISOString().split("T")[0],
        isActive: true,
      });
    }
  });

  const handleSubmit = async () => {
    if (!form.baseSalary || isNaN(parseFloat(form.baseSalary))) {
      toast.error("Vui lòng nhập lương cơ bản hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseSalary = parseFloat(form.baseSalary);
      let result;
      if (editSalary) {
        result = await updatePositionSalary(editSalary.id, {
          baseSalary,
          description: form.description || undefined,
          effectiveDate: form.effectiveDate || undefined,
        });
      } else {
        result = await createPositionSalary({
          positionId,
          salaryGrade: form.salaryGrade,
          baseSalary,
          description: form.description || undefined,
          effectiveDate: form.effectiveDate || undefined,
        });
      }

      if (result.success) {
        toast.success(
          editSalary
            ? "Cập nhật lương chức vụ thành công"
            : "Thêm lương chức vụ thành công",
        );
        onClose();
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editSalary ? "Cập nhật lương chức vụ" : "Thêm lương chức vụ"}
          </DialogTitle>
          <DialogDescription>
            Đặt lương cơ bản cho chức vụ{" "}
            <strong>{positionName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!editSalary && (
            <div className="space-y-2">
              <Label>Bậc lương</Label>
              <div className="flex gap-2">
                {SALARY_GRADES.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, salaryGrade: grade }))
                    }
                    className={cn(
                      "flex-1 h-9 rounded-md border text-sm font-medium transition-colors",
                      form.salaryGrade === grade
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background hover:bg-muted",
                    )}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="baseSalary">Lương cơ bản (VND)</Label>
            <Input
              id="baseSalary"
              type="number"
              min="0"
              step="100000"
              placeholder="Ví dụ: 15000000"
              value={form.baseSalary}
              onChange={(e) =>
                setForm((f) => ({ ...f, baseSalary: e.target.value }))
              }
            />
            {form.baseSalary && !isNaN(parseFloat(form.baseSalary)) && (
              <p className="text-xs text-muted-foreground">
                = {formatCurrency(parseFloat(form.baseSalary))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveDate">Ngày hiệu lực</Label>
            <Input
              id="effectiveDate"
              type="date"
              value={form.effectiveDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, effectiveDate: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Ghi chú thêm..."
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Đang lưu...
              </>
            ) : editSalary ? (
              "Cập nhật"
            ) : (
              "Thêm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Position Salary Manager - Bảng quản lý lương chức vụ
// ============================================================

interface PositionSalaryManagerProps {
  positionId: string;
  positionName: string;
}

export function PositionSalaryManager({
  positionId,
  positionName,
}: PositionSalaryManagerProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editSalary, setEditSalary] = useState<PositionSalaryItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PositionSalaryItem | null>(
    null,
  );

  const { data: salaries, isLoading } = useQuery<PositionSalaryItem[]>({
    queryKey: ["positionSalaries", positionId],
    queryFn: () => getPositionSalaries(positionId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePositionSalary(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Xóa lương chức vụ thành công");
        queryClient.invalidateQueries({
          queryKey: ["positionSalaries"],
        });
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Có lỗi xảy ra");
      setDeleteTarget(null);
    },
  });

  const activeSalaries = salaries?.filter((s) => s.isActive) ?? [];
  const currentSalary = activeSalaries[0];

  return (
    <>
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Lương theo chức vụ</h4>
          </div>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setEditSalary(null);
              setAddOpen(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Thêm lương
          </Button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !salaries || salaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có lương nào được đặt cho chức vụ này</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setAddOpen(true)}
                className="mt-2"
              >
                Thêm lương đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Lương hiện tại */}
              {currentSalary && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Bậc {currentSalary.salaryGrade}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium">
                          Hiện tại
                        </span>
                      </div>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                        {formatCurrency(currentSalary.baseSalary)}
                      </p>
                      {currentSalary.effectiveDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Hiệu lực từ:{" "}
                          {new Date(currentSalary.effectiveDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditSalary(currentSalary);
                            setAddOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {/* Các bậc lương khác */}
              {salaries.length > 1 && (
                <div className="text-xs text-muted-foreground px-1">
                  Các bậc lương khác:
                </div>
              )}
              {salaries
                .filter((s) => s.id !== currentSalary?.id)
                .map((salary) => (
                  <div
                    key={salary.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          Bậc {salary.salaryGrade}
                        </span>
                        {!salary.isActive && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                            Không active
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-0.5">
                        {formatCurrency(salary.baseSalary)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditSalary(salary);
                            setAddOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(salary)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <PositionSalaryFormDialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setEditSalary(null);
        }}
        positionId={positionId}
        positionName={positionName}
        editSalary={editSalary}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa lương chức vụ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lương bậc{" "}
              <strong>{deleteTarget?.salaryGrade}</strong> (
              {deleteTarget && formatCurrency(deleteTarget.baseSalary)}) không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
