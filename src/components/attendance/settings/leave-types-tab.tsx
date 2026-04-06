"use client";

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

import { deleteLeaveType } from "@/app/(protected)/attendance/actions";
import { LeaveTypeDialog } from "./leave-type-dialog";

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  isPaidLeave: boolean;
  defaultDays: number;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    leaveBalances: number;
    leaveRequests: number;
  };
}

interface LeaveTypesTabProps {
  leaveTypes: LeaveType[];
}

export function LeaveTypesTab({ leaveTypes }: LeaveTypesTabProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: LeaveType | null;
  }>({
    open: false,
    type: null,
  });

  const handleEdit = (type: LeaveType) => {
    setEditingType(type);
    setIsDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteLeaveType,
    onSuccess: (data) => {
      if (!data.success) {
        toast.warning(data.error || "Không thể xoá loại nghỉ phép");
      } else {
        toast.success(data?.message || "Đã xóa loại nghỉ phép");
      }
      queryClient.invalidateQueries({ queryKey: ["attendance", "leaveTypes"] });
      setDeleteDialog({ open: false, type: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể xoá loại nghỉ phép");
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Loại nghỉ phép</CardTitle>
          <CardDescription>
            Quản lý các loại hình nghỉ phép trong công ty
          </CardDescription>
        </div>
        <Button
          onClick={() => {
            setEditingType(null);
            setIsDialogOpen(true);
          }}
          size={"sm"}
        >
          <Plus className="h-4 w-4" />
          Tạo mới
        </Button>
      </CardHeader>
      <CardContent>
        {leaveTypes.length === 0 ? (
          <div className="text-center py-10 border rounded-lg border-dashed">
            <p className="text-muted-foreground">
              Chưa cấu hình loại nghỉ phép nào.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Có lương</TableHead>
                  <TableHead>Số ngày mặc định</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">
                      <div>
                        {type.name}
                        {type.description && (
                          <div className="text-xs text-muted-foreground font-normal mt-1">
                            {type.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {type.isPaidLeave ? (
                        <Badge
                          variant="outline"
                          className="text-emerald-600 bg-emerald-50"
                        >
                          Có lương
                        </Badge>
                      ) : (
                        <Badge variant="outline">Không lương</Badge>
                      )}
                    </TableCell>
                    <TableCell>{type.defaultDays}</TableCell>
                    <TableCell>
                      {type.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Đã ẩn</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteDialog({ open: true, type })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <LeaveTypeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        leaveType={editingType}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["attendance", "leaveTypes"],
          });
        }}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, type: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa loại nghỉ phép?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa loại nghỉ phép{" "}
              <span className="font-semibold text-foreground">
                {deleteDialog.type?.name}
              </span>{" "}
              không? Nếu loại nghỉ này đã cấp cho nhân viên, nó sẽ tự động được
              chuyển sang trạng thái &quot;Ẩn&quot; để lưu trữ dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteDialog.type) {
                  deleteMutation.mutate(deleteDialog.type.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Đang xử lý..." : "Xóa/Vô hiệu hóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
