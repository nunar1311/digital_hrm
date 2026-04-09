"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod/v4";
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter, Plus, Search, Settings, UserCheck, LayoutGrid, Table2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { useClickOutside, useMergedRef } from "@mantine/hooks";

import {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getJobPostings,
} from "@/app/(protected)/recruitment/actions";
import type {
  CandidateBasic,
  CandidateFilters,
  CreateCandidateForm,
  CandidateSource,
} from "@/app/(protected)/recruitment/types";
import { CandidateTable } from "./candidate-table";
import { CandidatePipeline } from "./candidate-pipeline";
import {
  dateToStr,
  strToDate,
} from "@/app/(protected)/attendance/shifts/shift-dialogs";

const candidateSchema = z.object({
  jobPostingId: z.string().min(1, "Vui lòng chọn vị trí"),
  name: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  cvUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  source: z.string().optional(),
  sourceDetail: z.string().optional(),
  notes: z.string().optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;
const PAGE_SIZE = 20;

type SourceFilter =
  | "ALL"
  | "WEBSITE"
  | "LINKEDIN"
  | "FACEBOOK"
  | "REFERRAL"
  | "AGENCY"
  | "OTHER";
type StageFilter =
  | "ALL"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

const STAGE_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "APPLIED", label: "Ứng tuyển" },
  { value: "SCREENING", label: "Sàng lọc" },
  { value: "INTERVIEW", label: "Phỏng vấn" },
  { value: "OFFER", label: "Offer" },
  { value: "HIRED", label: "Đã tuyển" },
  { value: "REJECTED", label: "Từ chối" },
];

export function CandidatesClient() {
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
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [jobPostingIdFilter, setJobPostingIdFilter] = useState<string>("ALL");
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    select: true,
    name: true,
    phone: false,
    jobPosting: true,
    source: false,
    stage: true,
    createdAt: true,
  });

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<CandidateBasic | null>(null);

  // View mode: "pipeline" | "table"
  const [viewMode, setViewMode] = useState<"pipeline" | "table">("pipeline");

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit dialog state
  const [editingCandidate, setEditingCandidate] =
    useState<CandidateBasic | null>(null);

  // View detail handler
  const handleViewDetail = useCallback(
    (candidate: CandidateBasic) => {
      router.push(`/recruitment/candidate/${candidate.id}`);
    },
    [router],
  );

  // Build filter params
  const filters = useMemo<CandidateFilters>(
    () => ({
      search: search || undefined,
      stage: stageFilter !== "ALL" ? stageFilter : undefined,
      source: sourceFilter !== "ALL" ? sourceFilter : undefined,
      jobPostingId:
        jobPostingIdFilter !== "ALL" ? jobPostingIdFilter : undefined,
    }),
    [search, stageFilter, sourceFilter, jobPostingIdFilter],
  );

  // Job postings for filter & form
  const { data: jobPostingsData } = useQuery({
    queryKey: ["recruitment", "job-postings", "open"],
    queryFn: async () => {
      const res = await getJobPostings({ status: "OPEN" }, { limit: 100 });
      return res.items;
    },
  });

  // Infinite query for candidates
  const {
    data: candidatesData,
    isLoading: isLoadingCandidates,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["recruitment", "candidates", filters],
    queryFn: ({ pageParam }) =>
      getCandidates(filters, { page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const candidates = useMemo(
    () => candidatesData?.pages.flatMap((p) => p.items) ?? [],
    [candidatesData],
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateCandidateForm) => createCandidate(data),
    onSuccess: () => {
      toast.success("Thêm ứng viên thành công");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "candidates"],
      });
      setIsCreateOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi thêm ứng viên");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCandidateForm> & { stage?: string };
    }) => updateCandidate(id, data),
    onSuccess: () => {
      toast.success("Cập nhật ứng viên thành công");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "candidates"],
      });
      setEditingCandidate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi cập nhật ứng viên");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: () => {
      toast.success("Xóa ứng viên thành công");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "candidates"],
      });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi xóa ứng viên");
    },
  });

  // Stage change mutation (for pipeline drag-and-drop)
  const stageChangeMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      updateCandidate(id, { stage }),
    onSuccess: () => {
      toast.success("Đã chuyển giai đoạn");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "candidates"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi chuyển giai đoạn");
    },
  });

  // Search toggle handlers
  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (search.trim()) {
        setSearch("");
      }
      setSearchExpanded(false);
    }
  }, [searchExpanded, search]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearch("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  // Infinite scroll fetch
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Table action handlers
  const handleEdit = useCallback((candidate: CandidateBasic) => {
    setEditingCandidate(candidate);
  }, []);

  const handleDeleteClick = useCallback((candidate: CandidateBasic) => {
    setDeleteTarget(candidate);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }, [deleteTarget, deleteMutation]);

  const handleStageChange = useCallback(
    (id: string, stage: string) => {
      updateMutation.mutate({ id, data: { stage } });
    },
    [updateMutation],
  );

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold">Tất cả ứng viên</h1>
          </header>
          <div className="flex items-center justify-end gap-2 px-2 py-2">
            {/* Stage filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={stageFilter !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    stageFilter !== "ALL" &&
                      "bg-primary/10 border-primary text-primary hover:text-primary",
                  )}
                >
                  <ListFilter className="h-3 w-3" />
                  {stageFilter !== "ALL" && (
                    <span className="ml-1 text-xs">
                      {
                        STAGE_FILTER_OPTIONS.find(
                          (s) => s.value === stageFilter,
                        )?.label
                      }
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Giai đoạn
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={stageFilter}
                  onValueChange={(v) => setStageFilter(v as StageFilter)}
                >
                  {STAGE_FILTER_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={stageFilter === option.value}
                      onCheckedChange={() => setStageFilter(option.value as StageFilter)}
                      className="text-sm"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Source filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={sourceFilter !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    sourceFilter !== "ALL" &&
                      "bg-primary/10 border-primary text-primary hover:text-primary",
                  )}
                >
                  <ListFilter className="h-3 w-3" />
                  {sourceFilter !== "ALL" && (
                    <span className="ml-1 text-xs">{sourceFilter}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Nguồn
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sourceFilter}
                  onValueChange={(v) => setSourceFilter(v as SourceFilter)}
                >
                  {[
                    { value: "ALL", label: "Tất cả" },
                    { value: "WEBSITE", label: "Website" },
                    { value: "LINKEDIN", label: "LinkedIn" },
                    { value: "FACEBOOK", label: "Facebook" },
                    { value: "REFERRAL", label: "Giới thiệu" },
                    { value: "AGENCY", label: "Agency" },
                    { value: "OTHER", label: "Khác" },
                  ].map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={sourceFilter === option.value}
                      onCheckedChange={() => setSourceFilter(option.value as SourceFilter)}
                      className="text-sm"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Job Posting filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={jobPostingIdFilter !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    jobPostingIdFilter !== "ALL" &&
                      "bg-primary/10 border-primary text-primary hover:text-primary",
                  )}
                >
                  <ListFilter className="h-3 w-3" />
                  {jobPostingIdFilter !== "ALL" && (
                    <span className="ml-1 text-xs">
                      {jobPostingsData?.find((jp) => jp.id === jobPostingIdFilter)?.title ?? jobPostingIdFilter}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Vị trí tuyển dụng
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={jobPostingIdFilter}
                  onValueChange={setJobPostingIdFilter}
                >
                  <DropdownMenuCheckboxItem
                    checked={jobPostingIdFilter === "ALL"}
                    onCheckedChange={() => setJobPostingIdFilter("ALL")}
                    className="text-sm"
                  >
                    Tất cả
                  </DropdownMenuCheckboxItem>
                  {jobPostingsData?.map((jp) => (
                    <DropdownMenuCheckboxItem
                      key={jp.id}
                      checked={jobPostingIdFilter === jp.id}
                      onCheckedChange={() => setJobPostingIdFilter(jp.id)}
                      className="text-sm"
                    >
                      {jp.title}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm kiếm ứng viên..."
                className={cn(
                  "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                  searchExpanded
                    ? "w-50 opacity-100 pl-3"
                    : "w-0 opacity-0 pl-0",
                )}
              />
              <Button
                size={"icon-xs"}
                variant={"ghost"}
                onClick={handleSearchToggle}
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

            {/* View mode toggle */}
            <div className="flex items-center border rounded-md overflow-hidden h-7">
              <Button
                variant={viewMode === "pipeline" ? "secondary" : "ghost"}
                size={"icon-xs"}
                className={cn(
                  "h-7 w-7 rounded-none",
                  viewMode === "pipeline" &&
                    "bg-primary/10 text-primary",
                )}
                onClick={() => setViewMode("pipeline")}
                title="Dạng pipeline"
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
              <div className="w-px h-3 bg-border" />
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size={"icon-xs"}
                className={cn(
                  "h-7 w-7 rounded-none",
                  viewMode === "table" && "bg-primary/10 text-primary",
                )}
                onClick={() => setViewMode("table")}
                title="Dạng bảng"
              >
                <Table2 className="h-3 w-3" />
              </Button>
            </div>

            <Button size={"xs"} onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Ứng viên
            </Button>
          </div>

          {/* Settings Panel */}
          <TableSettingsPanel
            open={settingsOpen}
            onClose={setSettingsOpen}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            columnOptions={[
              { key: "select", label: "Chọn", icon: Checkbox },
              { key: "name", label: "Họ tên", icon: UserCheck },
              { key: "phone", label: "Điện thoại", icon: UserCheck },
              { key: "jobPosting", label: "Vị trí", icon: UserCheck },
              { key: "source", label: "Nguồn", icon: UserCheck },
              { key: "stage", label: "Trạng thái", icon: UserCheck },
              { key: "createdAt", label: "Ngày ứng tuyển", icon: UserCheck },
            ]}
            hiddenColumnIndices={[0]}
            defaultVisibleColumns={{
              select: true,
              name: true,
              phone: false,
              jobPosting: true,
              source: false,
              stage: true,
              createdAt: true,
            }}
          />
        </section>

        {/* Table / Pipeline */}
        <section className="flex-1 relative h-full min-h-0 overflow-hidden">
          {viewMode === "pipeline" ? (
            <CandidatePipeline
              data={candidates as CandidateBasic[]}
              isLoading={isLoadingCandidates}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewDetail={handleViewDetail}
              onStageChange={(candidateId, newStage) =>
                stageChangeMutation.mutate({ id: candidateId, stage: newStage })
              }
            />
          ) : (
            <CandidateTable
              data={candidates as CandidateBasic[]}
              isLoading={isLoadingCandidates}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewDetail={handleViewDetail}
              onStageChange={handleStageChange}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={!!isFetchingNextPage}
              onLoadMore={handleFetchNextPage}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              totalCandidates={candidatesData?.pages[0]?.total ?? 0}
            />
          )}
        </section>
      </div>

      {/* Create Dialog */}
      <CandidateCreateDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        jobPostings={jobPostingsData ?? []}
        onSubmit={(data) => {
          const submitData = {
            ...data,
            source: ((data.source as string) || "WEBSITE") as CandidateSource,
          };
          createMutation.mutate(submitData);
        }}
        isLoading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      <CandidateEditDialog
        open={!!editingCandidate}
        onClose={() => setEditingCandidate(null)}
        candidate={editingCandidate}
        jobPostings={jobPostingsData ?? []}
        onSubmit={(data) => {
          if (!editingCandidate) return;
          updateMutation.mutate({
            id: editingCandidate.id,
            data: {
              ...data,
              source: ((data.source as string) || "WEBSITE") as CandidateSource,
            },
          });
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
              Bạn có chắc chắn muốn xóa ứng viên{" "}
              <strong>{deleteTarget?.name}</strong> không?
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
// ─── Candidate Create Dialog ──────────────────────────────────────────────────

interface CandidateCreateDialogProps {
  open: boolean;
  onClose: () => void;
  jobPostings: Array<{ id: string; title: string }>;
  onSubmit: (data: CandidateFormValues) => void;
  isLoading?: boolean;
}

function CandidateCreateDialog({
  open,
  onClose,
  jobPostings,
  onSubmit,
  isLoading,
}: CandidateCreateDialogProps) {
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      jobPostingId: "",
      name: "",
      email: "",
      phone: "",
      gender: undefined,
      dateOfBirth: "",
      address: "",
      cvUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
      source: "WEBSITE",
      sourceDetail: "",
      notes: "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm ứng viên mới</DialogTitle>
          <DialogDescription>Thêm thông tin ứng viên</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="jobPostingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vị trí ứng tuyển *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobPostings.map((jp) => (
                        <SelectItem key={jp.id} value={jp.id}>
                          {jp.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ tên *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input placeholder="0912345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới tính</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Nam</SelectItem>
                        <SelectItem value="FEMALE">Nữ</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
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
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sinh</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={strToDate(field.value || "")}
                        setDate={(d) => field.onChange(dateToStr(d))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nguồn</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "WEBSITE"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEBSITE">Website</SelectItem>
                        <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                        <SelectItem value="FACEBOOK">Facebook</SelectItem>
                        <SelectItem value="REFERRAL">Giới thiệu</SelectItem>
                        <SelectItem value="AGENCY">Agency</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Địa chỉ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cvUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link CV</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ghi chú thêm..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang thêm..." : "Thêm"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Candidate Edit Dialog ───────────────────────────────────────────────────

interface CandidateEditDialogProps {
  open: boolean;
  onClose: () => void;
  candidate: CandidateBasic | null;
  jobPostings: Array<{ id: string; title: string }>;
  onSubmit: (data: CandidateFormValues) => void;
  isLoading?: boolean;
}

function CandidateEditDialog({
  open,
  onClose,
  candidate,
  jobPostings,
  onSubmit,
  isLoading,
}: CandidateEditDialogProps) {
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      jobPostingId: candidate?.jobPostingId || "",
      name: candidate?.name || "",
      email: candidate?.email || "",
      phone: candidate?.phone || "",
      gender: candidate?.gender as "MALE" | "FEMALE" | "OTHER" | undefined,
      dateOfBirth: candidate?.dateOfBirth || "",
      address: candidate?.address || "",
      cvUrl: candidate?.cvUrl || "",
      linkedinUrl: candidate?.linkedinUrl || "",
      portfolioUrl: candidate?.portfolioUrl || "",
      source: candidate?.source || "",
      sourceDetail: candidate?.sourceDetail || "",
      notes: candidate?.notes || "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa ứng viên</DialogTitle>
          <DialogDescription>Chỉnh sửa thông tin ứng viên</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="jobPostingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vị trí ứng tuyển *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobPostings.map((jp) => (
                        <SelectItem key={jp.id} value={jp.id}>
                          {jp.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ tên *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input placeholder="0912345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới tính</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Nam</SelectItem>
                        <SelectItem value="FEMALE">Nữ</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
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
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sinh</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={strToDate(field.value || "")}
                        setDate={(d) => field.onChange(dateToStr(d))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nguồn</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "WEBSITE"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEBSITE">Website</SelectItem>
                        <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                        <SelectItem value="FACEBOOK">Facebook</SelectItem>
                        <SelectItem value="REFERRAL">Giới thiệu</SelectItem>
                        <SelectItem value="AGENCY">Agency</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Địa chỉ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cvUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link CV</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ghi chú thêm..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
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
