"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  BadgeCheck,
  Pencil,
  Trash2,
  ChevronRight,
  Users,
  Hash,
  Ruler,
  Briefcase,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { PositionFormDialog } from "@/components/positions/position-form-dialog";
import { deletePosition } from "../actions";
import type { PositionDetail } from "../types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const AUTHORITY_LABELS: Record<string, { label: string; class: string }> = {
  EXECUTIVE: {
    label: "HĐQT",
    class:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  DIRECTOR: {
    label: "Giám đốc",
    class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  MANAGER: {
    label: "Trưởng phòng",
    class:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  DEPUTY: {
    label: "Phó phòng",
    class:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  TEAM_LEAD: {
    label: "Tổ trưởng",
    class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  STAFF: {
    label: "Nhân viên",
    class:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  INTERN: {
    label: "Thực tập sinh",
    class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

interface PositionDetailClientProps {
  position: PositionDetail;
}

export function PositionDetailClient({ position }: PositionDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const authInfo = AUTHORITY_LABELS[position.authority] || {
    label: position.authority,
    class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  const formatSalary = (value: string | null) => {
    if (!value) return "—";
    const num = Number(value);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("vi-VN").format(num) + " VNĐ";
  };

  const handleDelete = async () => {
    const result = await deletePosition(position.id);
    if (result.success) {
      toast.success("Xóa chức vụ thành công");
      router.push("/positions");
    } else {
      toast.error(result.error);
    }
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 h-[calc(100vh-100px)] overflow-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/positions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/positions" className="hover:underline">
              Chức vụ
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>{position.name}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          Sửa
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
          disabled={position.userCount > 0}
        >
          <Trash2 className="h-4 w-4" />
          Xóa
        </Button>
      </div>

      {/* Title */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {position.name}
            </h1>
            <Badge variant="outline" className={authInfo.class}>
              {authInfo.label}
            </Badge>
            <Badge
              variant={position.status === "ACTIVE" ? "default" : "secondary"}
              className={
                position.status === "ACTIVE"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-500"
              }
            >
              {position.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
            </Badge>
          </div>
          <code className="text-sm bg-muted px-3 py-1.5 rounded font-mono w-fit">
            {position.code}
          </code>
          {position.description && (
            <p className="text-muted-foreground text-sm mt-1">
              {position.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Thông tin chức vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Cấp bậc
                  </p>
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                      {position.level}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {position.level === 1
                        ? "(Cao nhất)"
                        : position.level <= 3
                          ? "(Cao)"
                          : position.level <= 6
                            ? "(Trung bình)"
                            : "(Thấp)"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Phòng ban
                  </p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {position.departmentName ? (
                      <Link
                        href={`/departments/${position.departmentId}`}
                        className="text-sm hover:underline hover:text-foreground"
                      >
                        {position.departmentName}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Chức vụ cha
                  </p>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    {position.parentName ? (
                      <Link
                        href={`/positions/${position.parentId}`}
                        className="text-sm hover:underline hover:text-foreground"
                      >
                        {position.parentName}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Thứ tự hiển thị
                  </p>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                      {position.sortOrder}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Lương tối thiểu
                  </p>
                  <p className="text-sm font-medium">
                    {formatSalary(position.minSalary)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Lương tối đa
                  </p>
                  <p className="text-sm font-medium">
                    {formatSalary(position.maxSalary)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employees card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Nhân viên giữ chức vụ ({position.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {position.users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    Chưa có nhân viên nào giữ chức vụ này
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {position.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/employees/${user.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-medium bg-primary/10 text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.employeeCode || "—"} •{" "}
                          {user.departmentName || "Chưa có phòng ban"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: hierarchy + meta */}
        <div className="space-y-6">
          {/* Children positions */}
          {position.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Chức vụ cấp dưới ({position.children.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {position.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/positions/${child.id}`}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-sm"
                    >
                      <span className="truncate flex-1">{child.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          AUTHORITY_LABELS[child.authority]?.class ||
                          "bg-gray-100 text-gray-600"
                        }
                      >
                        {AUTHORITY_LABELS[child.authority]?.label ||
                          child.authority}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Thông tin hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Ngày tạo
                </p>
                <p className="text-sm">
                  {new Date(position.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Cập nhật lần cuối
                </p>
                <p className="text-sm">
                  {new Date(position.updatedAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Tổng nhân viên
                </p>
                <p className="text-sm font-medium">{position.userCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <PositionFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        // editData={{
        //   id: position.id,
        //   name: position.name,
        //   code: position.code,
        //   authority: position.authority,
        //   departmentId: position.departmentId,
        //   level: position.level,
        //   description: position.description,
        //   parentId: position.parentId,
        //   minSalary: position.minSalary,
        //   maxSalary: position.maxSalary,
        //   status: position.status,
        //   sortOrder: position.sortOrder,
        // }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa chức vụ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chức vụ <strong>{position.name}</strong>{" "}
              không? Hành động này sẽ chuyển chức vụ sang trạng thái không hoạt
              động.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
