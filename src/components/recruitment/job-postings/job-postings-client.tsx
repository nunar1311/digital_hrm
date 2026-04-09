"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter, Plus, Search, Settings, Briefcase, LayoutGrid, Table2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { useClickOutside, useMergedRef } from "@mantine/hooks";

import {
  getJobPostings,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getDepartments,
  getPositions,
} from "@/app/(protected)/recruitment/actions";
import type {
  JobPostingWithStats,
  JobPostingFilters,
  CreateJobPostingForm,
  JobPostingStatus,
  JobPostingPriority,
  Department,
  Position,
} from "@/app/(protected)/recruitment/types";
import { JobPostingTable } from "./job-posting-table";
import { JobPostingGrid } from "./job-posting-grid";
import { JobPostingToolbar } from "./job-posting-toolbar";

const jobPostingFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  description: z.string().min(1, "Mô tả không được để trống"),
  requirements: z.string().min(1, "Yêu cầu không được để trống"),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  headcount: z.number().int().positive(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  deadline: z.string().optional(),
  benefits: z.string().optional(),
  workLocation: z.string().optional(),
  interviewRounds: z.number().int().positive(),
  status: z.enum(["DRAFT", "OPEN", "ON_HOLD", "CLOSED"]).optional(),
});

type JobPostingFormValues = z.infer<typeof jobPostingFormSchema>;

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED";
type PriorityFilter = "ALL" | "LOW" | "NORMAL" | "HIGH" | "URGENT";

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "DRAFT", label: "Nháp" },
  { value: "OPEN", label: "Đang tuyển" },
  { value: "ON_HOLD", label: "Tạm dừng" },
  { value: "CLOSED", label: "Đã đóng" },
];

export function JobPostingsClient() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Search state
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [departmentIdFilter, setDepartmentIdFilter] = useState<string>("ALL");
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    select: true,
    title: true,
    department: true,
    salary: false,
    headcount: true,
    status: true,
    priority: true,
    deadline: false,
    candidateCount: true,
  });

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<JobPostingWithStats | null>(null);

  // View mode: "grid" | "table"
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit dialog state
  const [editingPost, setEditingPost] = useState<JobPostingWithStats | null>(null);

  // Build filter params
  const filters = useMemo<JobPostingFilters>(() => ({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
    departmentId: departmentIdFilter !== "ALL" ? departmentIdFilter : undefined,
  }), [search, statusFilter, priorityFilter, departmentIdFilter]);

  // Departments & positions for filter & form
  const { data: departments = [] } = useQuery({
    queryKey: ["recruitment", "departments"],
    queryFn: getDepartments,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["recruitment", "positions"],
    queryFn: getPositions,
  });

  // Infinite query for job postings
  const {
    data: jobPostingsData,
    isLoading: isLoadingPostings,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["recruitment", "job-postings", filters],
    queryFn: ({ pageParam }) =>
      getJobPostings(filters, { page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const jobPostings = useMemo(
    () => jobPostingsData?.pages.flatMap((p) => p.items) ?? [],
    [jobPostingsData],
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateJobPostingForm) => createJobPosting(data),
    onSuccess: () => {
      toast.success("Tạo tin tuyển dụng thành công");
      queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
      setIsCreateOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi tạo tin tuyển dụng");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: { id: string; data: Partial<CreateJobPostingForm> }) =>
      updateJobPosting(id, data),
    onSuccess: () => {
      toast.success("Cập nhật tin tuyển dụng thành công");
      queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
      setEditingPost(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi cập nhật tin tuyển dụng");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJobPosting(id),
    onSuccess: () => {
      toast.success("Xóa tin tuyển dụng thành công");
      queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi xóa tin tuyển dụng");
    },
  });

  // Infinite scroll fetch
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Table action handlers
  const handleEdit = useCallback((posting: JobPostingWithStats) => {
    setEditingPost(posting);
  }, []);

  const handleDeleteClick = useCallback((posting: JobPostingWithStats) => {
    setDeleteTarget(posting);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }, [deleteTarget, deleteMutation]);

  const handleStatusChange = useCallback((id: string, status: JobPostingStatus) => {
    updateMutation.mutate({ id, data: { status } });
  }, [updateMutation]);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header + Toolbar */}
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold">Tin tuyển dụng</h1>
          </header>
          <div className="flex items-center justify-end gap-2 px-2 py-2">
            {/* Status filter via dropdown */}
            <DropdownMenuFilter
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              options={STATUS_FILTER_OPTIONS}
              icon={<ListFilter className="h-3 w-3" />}
            />

            {/* Search */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm tin tuyển dụng..."
                className={cn(
                  "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                  searchExpanded
                    ? "w-50 opacity-100 pl-3"
                    : "w-32 opacity-100 pl-7",
                )}
              />
              <Button
                size={"icon-xs"}
                variant={"ghost"}
                onClick={() => {
                  if (!searchExpanded) {
                    setSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  } else {
                    if (search.trim()) setSearch("");
                    setSearchExpanded(false);
                  }
                }}
                className={cn(
                  "absolute right-0.5 z-10",
                  searchExpanded && "[&_svg]:text-primary",
                )}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-4!" />

            <Button
              variant={"outline"}
              size={"xs"}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <div className="flex items-center border rounded-md overflow-hidden h-7">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size={"icon-xs"}
                className={cn("h-7 w-7 rounded-none", viewMode === "grid" && "bg-primary/10 text-primary")}
                onClick={() => setViewMode("grid")}
                title="Dạng lưới"
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
              <div className="w-px h-3 bg-border" />
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size={"icon-xs"}
                className={cn("h-7 w-7 rounded-none", viewMode === "table" && "bg-primary/10 text-primary")}
                onClick={() => setViewMode("table")}
                title="Dạng bảng"
              >
                <Table2 className="h-3 w-3" />
              </Button>
            </div>
            <Button size={"xs"} onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Tạo tin tuyển dụng
            </Button>
          </div>

          {/* Toolbar with filters */}
          <div className="px-2 pb-2">
            <JobPostingToolbar
              searchValue={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={(v) => setPriorityFilter(v as PriorityFilter)}
              departmentIdFilter={departmentIdFilter}
              onDepartmentIdFilterChange={setDepartmentIdFilter}
              departments={departments.map((d) => ({ id: d.id, name: d.name }))}
              onCreateClick={() => setIsCreateOpen(true)}
              isLoading={isLoadingPostings}
            />
          </div>

          {/* Settings Panel */}
          <TableSettingsPanel
            open={settingsOpen}
            onClose={setSettingsOpen}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            columnOptions={[
              { key: "select", label: "Chọn", icon: Checkbox },
              { key: "title", label: "Tiêu đề", icon: Briefcase },
              { key: "department", label: "Phòng ban", icon: Briefcase },
              { key: "salary", label: "Lương", icon: Briefcase },
              { key: "headcount", label: "Số lượng", icon: Briefcase },
              { key: "status", label: "Trạng thái", icon: Briefcase },
              { key: "priority", label: "Ưu tiên", icon: Briefcase },
              { key: "deadline", label: "Hạn nộp", icon: Briefcase },
              { key: "candidateCount", label: "Ứng viên", icon: Briefcase },
            ]}
            hiddenColumnIndices={[0]}
            defaultVisibleColumns={{
              select: true,
              title: true,
              department: true,
              salary: false,
              headcount: true,
              status: true,
              priority: true,
              deadline: false,
              candidateCount: true,
            }}
          />
        </section>

        {/* Table / Grid */}
        <section className="flex-1 relative h-full min-h-0 overflow-hidden">
          {viewMode === "grid" ? (
            <JobPostingGrid
              data={jobPostings}
              isLoading={isLoadingPostings}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onStatusChange={handleStatusChange}
              onView={(posting) => router.push(`/recruitment/${posting.id}`)}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={!!isFetchingNextPage}
              onLoadMore={handleFetchNextPage}
            />
          ) : (
            <JobPostingTable
              data={jobPostings}
              isLoading={isLoadingPostings}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onStatusChange={handleStatusChange}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={!!isFetchingNextPage}
              onLoadMore={handleFetchNextPage}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              totalPostings={jobPostingsData?.pages[0]?.total ?? 0}
            />
          )}
        </section>
      </div>

      {/* Create Dialog */}
      <JobPostingCreateDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        departments={departments}
        positions={positions}
        onSubmit={(data) => {
          createMutation.mutate(data);
        }}
        isLoading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      <JobPostingEditDialog
        open={!!editingPost}
        onClose={() => setEditingPost(null)}
        posting={editingPost}
        departments={departments}
        positions={positions}
        onSubmit={(data) => {
          if (!editingPost) return;
          updateMutation.mutate({ id: editingPost.id, data });
        }}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tin tuyển dụng{" "}
              <strong>{deleteTarget?.title}</strong> không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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

// ─── Dropdown Filter Component ─────────────────────────────────────────────────

function DropdownMenuFilter({
  value,
  onValueChange,
  options,
  icon,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={value !== "ALL" ? "outline" : "ghost"}
          size="xs"
          className={cn(
            value !== "ALL" && "bg-primary/10 border-primary text-primary hover:text-primary",
          )}
        >
          {icon}
          {value !== "ALL" && (
            <span className="ml-1 text-xs">
              {options.find((o) => o.value === value)?.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={value === option.value}
              onCheckedChange={() => onValueChange(option.value)}
              className="text-sm"
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Job Posting Create Dialog ──────────────────────────────────────────────────

interface JobPostingCreateDialogProps {
  open: boolean;
  onClose: () => void;
  departments: Department[];
  positions: Position[];
  onSubmit: (data: CreateJobPostingForm) => void;
  isLoading?: boolean;
}

function JobPostingCreateDialog({
  open,
  onClose,
  departments,
  positions,
  onSubmit,
  isLoading,
}: JobPostingCreateDialogProps) {
  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingFormSchema),
    defaultValues: {
      title: "",
      departmentId: undefined,
      positionId: undefined,
      description: "",
      requirements: "",
      salaryMin: undefined,
      salaryMax: undefined,
      headcount: 1,
      employmentType: "FULL_TIME",
      priority: "NORMAL",
      deadline: undefined,
      benefits: undefined,
      workLocation: undefined,
      interviewRounds: 1,
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo tin tuyển dụng mới</DialogTitle>
          <DialogDescription>Điền thông tin tin tuyển dụng mới</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phòng ban</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn phòng ban" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chức vụ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn chức vụ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả công việc *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Mô tả công việc..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yêu cầu *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Yêu cầu ứng viên..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lương tối thiểu</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000000"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? Number(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lương tối đa</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="20000000"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? Number(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="headcount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại hình</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Toàn thời gian</SelectItem>
                        <SelectItem value="PART_TIME">Bán thời gian</SelectItem>
                        <SelectItem value="INTERN">Thực tập</SelectItem>
                        <SelectItem value="CONTRACT">Hợp đồng</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Độ ưu tiên</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Thấp</SelectItem>
                        <SelectItem value="NORMAL">Bình thường</SelectItem>
                        <SelectItem value="HIGH">Cao</SelectItem>
                        <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hạn nộp hồ sơ</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        setDate={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa điểm làm việc</FormLabel>
                    <FormControl>
                      <Input placeholder="Hà Nội / Remote" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interviewRounds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số vòng phỏng vấn</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phúc lợi</FormLabel>
                    <FormControl>
                      <Input placeholder="Bảo hiểm, laptop..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang lưu..." : "Tạo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Job Posting Edit Dialog ───────────────────────────────────────────────────

interface JobPostingEditDialogProps {
  open: boolean;
  onClose: () => void;
  posting: JobPostingWithStats | null;
  departments: Department[];
  positions: Position[];
  onSubmit: (data: Partial<CreateJobPostingForm>) => void;
  isLoading?: boolean;
}

function JobPostingEditDialog({
  open,
  onClose,
  posting,
  departments,
  positions,
  onSubmit,
  isLoading,
}: JobPostingEditDialogProps) {
  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingFormSchema),
    defaultValues: posting
      ? {
          title: posting.title,
          departmentId: posting.departmentId || undefined,
          positionId: posting.positionId || undefined,
          description: posting.description,
          requirements: posting.requirements,
          salaryMin: posting.salaryMin ?? undefined,
          salaryMax: posting.salaryMax ?? undefined,
          headcount: posting.headcount,
          employmentType: posting.employmentType as "FULL_TIME" | "PART_TIME" | "INTERN" | "CONTRACT",
          priority: posting.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
          deadline: posting.deadline || undefined,
          benefits: posting.benefits || undefined,
          workLocation: posting.workLocation || undefined,
          interviewRounds: posting.interviewRounds,
          status: posting.status as "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED" | undefined,
        }
      : {
          title: "",
          departmentId: undefined,
          positionId: undefined,
          description: "",
          requirements: "",
          salaryMin: undefined,
          salaryMax: undefined,
          headcount: 1,
          employmentType: "FULL_TIME" as const,
          priority: "NORMAL" as const,
          deadline: undefined,
          benefits: undefined,
          workLocation: undefined,
          interviewRounds: 1,
          status: undefined,
        },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tin tuyển dụng</DialogTitle>
          <DialogDescription>Chỉnh sửa thông tin tin tuyển dụng</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phòng ban</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn phòng ban" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chức vụ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn chức vụ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả công việc *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Mô tả công việc..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yêu cầu *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Yêu cầu ứng viên..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lương tối thiểu</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000000"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? Number(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lương tối đa</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="20000000"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? Number(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="headcount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại hình</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Toàn thời gian</SelectItem>
                        <SelectItem value="PART_TIME">Bán thời gian</SelectItem>
                        <SelectItem value="INTERN">Thực tập</SelectItem>
                        <SelectItem value="CONTRACT">Hợp đồng</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Độ ưu tiên</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Thấp</SelectItem>
                        <SelectItem value="NORMAL">Bình thường</SelectItem>
                        <SelectItem value="HIGH">Cao</SelectItem>
                        <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hạn nộp hồ sơ</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        setDate={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa điểm làm việc</FormLabel>
                    <FormControl>
                      <Input placeholder="Hà Nội / Remote" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interviewRounds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số vòng phỏng vấn</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phúc lợi</FormLabel>
                    <FormControl>
                      <Input placeholder="Bảo hiểm, laptop..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {posting && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Nháp</SelectItem>
                        <SelectItem value="OPEN">Đang tuyển</SelectItem>
                        <SelectItem value="ON_HOLD">Tạm dừng</SelectItem>
                        <SelectItem value="CLOSED">Đã đóng</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
