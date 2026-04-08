"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserMinus,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  X,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getOffboardings,
  getOffboardingStats,
  getOffboardingTemplates,
  updateOffboarding,
  deleteOffboarding,
} from "./actions";
import { OffboardingTable } from "./offboarding-table";
import { CreateOffboardingDialog } from "./create-offboarding-dialog";
import type { OffboardingListItem, OffboardingTemplate } from "./types";

interface OffboardingStats {
  total: number;
  processing: number;
  completed: number;
  thisMonth: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="p-2 rounded-lg shrink-0 bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OffboardingClient({
  initialOffboardings,
  initialStats,
  canManage,
}: {
  initialOffboardings: OffboardingListItem[];
  initialStats: OffboardingStats;
  canManage: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: offboardings = initialOffboardings, isLoading: isLoadingList } =
    useQuery({
      queryKey: ["offboardings", search, statusFilter],
      queryFn: () =>
        getOffboardings({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        }),
      initialData: initialOffboardings,
    });

  const { data: stats = initialStats } = useQuery({
    queryKey: ["offboarding-stats"],
    queryFn: getOffboardingStats,
    initialData: initialStats,
  });

  const { data: templates = [] } = useQuery<OffboardingTemplate[]>({
    queryKey: ["offboarding-templates"],
    queryFn: getOffboardingTemplates,
  });

  // Filter offboardings by status for tabs
  const processingOffboardings = offboardings.filter(
    (o) => o.status === "PROCESSING",
  );
  const completedOffboardings = offboardings.filter(
    (o) => o.status === "COMPLETED",
  );

  // Mutations
  const completeMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      updateOffboarding(id, { status: "COMPLETED" }),
    onSuccess: () => {
      toast.success(
        "Đã chốt offboarding, khóa tài khoản và cập nhật trạng thái nhân sự",
      );
      queryClient.invalidateQueries({ queryKey: ["offboardings"] });
      queryClient.invalidateQueries({ queryKey: ["offboarding-stats"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Lỗi khi cập nhật trạng thái";
      toast.error(message);
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOffboarding,
    onSuccess: () => {
      toast.success("Đã xóa quy trình offboarding");
      queryClient.invalidateQueries({ queryKey: ["offboardings"] });
      queryClient.invalidateQueries({ queryKey: ["offboarding-stats"] });
    },
    onError: (error) => {
      toast.error("Lỗi khi xóa");
      console.error(error);
    },
  });

  const handleClearSearch = () => {
    setSearch("");
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="shrink-0 border-b h-10 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Offboarding</h1>
          </div>
          {canManage && (
            <Button size="xs" onClick={() => setIsCreateOpen(true)}>
              <Plus /> Tạo quy trình nghỉ việc
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        {/* <div className="grid gap-2 p-2 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tổng số" value={stats.total} icon={Users} />
          <StatCard title="Đang xử lý" value={stats.processing} icon={Clock} />
          <StatCard
            title="Hoàn thành"
            value={stats.completed}
            icon={CheckCircle2}
          />
          <StatCard
            title="Tháng này"
            value={stats.thisMonth}
            icon={UserMinus}
          />
        </div> */}

        <div className="p-2">
          <Card className="border-amber-200 bg-amber-50/60 p-3">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-700 mt-0.5" />
                <div className="space-y-1 text-sm text-amber-900">
                  <p className="font-semibold">Quy tắc chốt thôi việc</p>
                  <p>
                    - Khi chốt offboarding, hệ thống sẽ khóa tài khoản nhân
                    viên.
                  </p>
                  <p>
                    - Trạng thái nhân sự được cập nhật sang &quot;Đã nghỉ
                    việc&quot;.
                  </p>
                  <p>
                    - Bắt buộc hoàn tất checklist bàn giao và xử lý toàn bộ tài
                    sản trước khi chốt.
                  </p>
                  <p>
                    - Exit interview và lý do nghỉ việc được lưu để phục vụ báo
                    cáo phân tích biến động.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-2 flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, mã nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="px-2 pb-2">
          <Tabs defaultValue="all" className="space-y-3">
            <TabsList>
              <TabsTrigger value="all">
                Tất cả ({offboardings.length})
              </TabsTrigger>
              <TabsTrigger value="processing">
                Đang xử lý ({processingOffboardings.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Hoàn thành ({completedOffboardings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <OffboardingTable
                offboardings={offboardings}
                isLoading={isLoadingList}
                canManage={canManage}
                onComplete={(id) => completeMutation.mutate({ id })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="processing" className="mt-0">
              <OffboardingTable
                offboardings={processingOffboardings}
                isLoading={isLoadingList}
                canManage={canManage}
                onComplete={(id) => completeMutation.mutate({ id })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <OffboardingTable
                offboardings={completedOffboardings}
                isLoading={isLoadingList}
                canManage={canManage}
                onComplete={(id) => completeMutation.mutate({ id })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Dialog */}
      <CreateOffboardingDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        templates={templates}
        onSuccess={() => {
          setIsCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: ["offboardings"] });
          queryClient.invalidateQueries({ queryKey: ["offboarding-stats"] });
        }}
      />
    </div>
  );
}
