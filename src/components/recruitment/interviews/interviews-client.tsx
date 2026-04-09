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
import { Combobox } from "@/components/ui/combobox";
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
import { ListFilter, Plus, Search, Settings, CalendarCheck, LayoutGrid, Table2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { useClickOutside, useMergedRef } from "@mantine/hooks";

import {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  getCandidates,
  getJobPostings,
  getUsersForInterviewer,
  submitFeedback,
} from "@/app/(protected)/recruitment/actions";
import type {
  InterviewBasic,
  InterviewFilters,
  CreateInterviewForm,
  InterviewStatus,
  InterviewResult,
} from "@/app/(protected)/recruitment/types";
import { InterviewTable } from "./interview-table";
import { InterviewCalendar } from "./interview-calendar";
import { InterviewToolbar } from "./interview-toolbar";

const interviewFormSchema = z.object({
  candidateId: z.string().min(1, "Ứng viên không được để trống"),
  jobPostingId: z.string().min(1, "Vị trí không được để trống"),
  round: z.number().int().positive(),
  type: z.enum(["ONSITE", "ONLINE", "PHONE"]),
  method: z.enum(["INDIVIDUAL", "GROUP", "PANEL"]),
  scheduledDate: z.date(),
  scheduledTime: z.string().min(1, "Giờ không được để trống"),
  duration: z.number().int().positive(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  interviewerIds: z.array(z.string()),
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  result: z.enum(["PASS", "FAIL", "PENDING"]).optional(),
});

type InterviewFormValues = z.infer<typeof interviewFormSchema>;

const feedbackFormSchema = z.object({
  score: z.number().min(1).max(10).optional(),
  result: z.enum(["PASS", "FAIL", "PENDING"]).optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  notes: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "SCHEDULED", label: "Đã lên lịch" },
  { value: "IN_PROGRESS", label: "Đang phỏng vấn" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "NO_SHOW", label: "Không đến" },
];

export function InterviewsClient() {
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
  const [jobPostingIdFilter, setJobPostingIdFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    select: true,
    candidate: true,
    jobPosting: true,
    round: true,
    datetime: true,
    type: false,
    interviewers: false,
    status: true,
    result: true,
  });

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<InterviewBasic | null>(null);

  // View mode: "calendar" | "table"
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit dialog state
  const [editingInterview, setEditingInterview] = useState<InterviewBasic | null>(null);

  // Feedback dialog state
  const [feedbackInterview, setFeedbackInterview] = useState<InterviewBasic | null>(null);

  // Build filter params
  const filters = useMemo<InterviewFilters>(() => ({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    jobPostingId: jobPostingIdFilter !== "ALL" ? jobPostingIdFilter : undefined,
    fromDate: fromDate ? fromDate.toISOString() : undefined,
    toDate: toDate ? toDate.toISOString() : undefined,
  }), [statusFilter, jobPostingIdFilter, fromDate, toDate]);

  // Job postings for filter & form
  const { data: jobPostings = [] } = useQuery({
    queryKey: ["recruitment", "job-postings", "open"],
    queryFn: async () => {
      const res = await getJobPostings({ status: "OPEN" }, { limit: 100 });
      return res.items;
    },
  });

  // Candidates for form
  const { data: candidates = [] } = useQuery({
    queryKey: ["recruitment", "candidates", "active"],
    queryFn: async () => {
      const res = await getCandidates({ stage: "INTERVIEW" }, { limit: 100 });
      return res.items;
    },
  });

  // Interviewers for form
  const { data: interviewers = [] } = useQuery({
    queryKey: ["recruitment", "interviewers"],
    queryFn: getUsersForInterviewer,
  });

  // Infinite query for interviews
  const {
    data: interviewsData,
    isLoading: isLoadingInterviews,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["recruitment", "interviews", filters],
    queryFn: ({ pageParam }) =>
      getInterviews(filters, { page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const interviews = useMemo(
    () =>
      (interviewsData?.pages.flatMap((p) => p.items) ?? []).map((item) => ({
        id: item.id,
        candidateId: item.candidateId,
        candidateName: item.candidateName,
        jobPostingId: item.jobPostingId,
        jobPostingTitle: item.jobPostingTitle,
        round: item.round,
        type: item.type as import("@/app/(protected)/recruitment/types").InterviewType,
        method: item.method as import("@/app/(protected)/recruitment/types").InterviewMethod,
        scheduledDate: item.scheduledDate,
        scheduledTime: item.scheduledTime,
        endTime: item.endTime,
        duration: item.duration,
        location: item.location,
        meetingLink: item.meetingLink,
        meetingId: item.meetingId,
        interviewerIds: item.interviewerIds,
        interviewerNames: item.interviewerNames,
        status: item.status as import("@/app/(protected)/recruitment/types").InterviewStatus,
        result: item.result as import("@/app/(protected)/recruitment/types").InterviewResult | null,
        score: item.score,
        strengths: item.strengths,
        weaknesses: item.weaknesses,
        notes: item.notes,
        googleEventId: item.googleEventId,
        calendarSync: item.calendarSync,
        reviewedBy: item.reviewedBy,
        reviewedAt: item.reviewedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    [interviewsData],
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: InterviewFormValues) =>
      createInterview({
        ...data,
        scheduledDate: data.scheduledDate.toISOString().split("T")[0],
      } as CreateInterviewForm),
    onSuccess: () => {
      toast.success("Đặt lịch phỏng vấn thành công");
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      setIsCreateOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi đặt lịch phỏng vấn");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: { id: string; data: Partial<InterviewFormValues> }) =>
      updateInterview(id, {
        ...data,
        scheduledDate: data.scheduledDate
          ? data.scheduledDate.toISOString().split("T")[0]
          : undefined,
      } as Partial<CreateInterviewForm>),
    onSuccess: () => {
      toast.success("Cập nhật phỏng vấn thành công");
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      setEditingInterview(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi cập nhật phỏng vấn");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInterview(id),
    onSuccess: () => {
      toast.success("Xóa lịch phỏng vấn thành công");
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi xóa phỏng vấn");
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: (data: {
      interviewId: string;
      score?: number;
      result?: InterviewResult;
      strengths?: string;
      improvements?: string;
      notes?: string;
    }) => submitFeedback(data),
    onSuccess: () => {
      toast.success("Gửi feedback thành công");
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      setFeedbackInterview(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi gửi feedback");
    },
  });

  // Infinite scroll fetch
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Table action handlers
  const handleEdit = useCallback((interview: InterviewBasic) => {
    setEditingInterview(interview);
  }, []);

  const handleDeleteClick = useCallback((interview: InterviewBasic) => {
    setDeleteTarget(interview);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }, [deleteTarget, deleteMutation]);

  const handleViewDetail = useCallback((interview: InterviewBasic) => {
    router.push(`/recruitment/interview/${interview.id}`);
  }, [router]);

  const handleFeedback = useCallback((interview: InterviewBasic) => {
    setFeedbackInterview(interview);
  }, []);

  const handleStatusChange = useCallback((id: string, status: InterviewStatus) => {
    updateMutation.mutate({ id, data: { status } as Partial<InterviewFormValues> });
  }, [updateMutation]);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header + Toolbar */}
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold">Lịch phỏng vấn</h1>
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
                placeholder="Tìm kiếm..."
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
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size={"icon-xs"}
                className={cn("h-7 w-7 rounded-none", viewMode === "calendar" && "bg-primary/10 text-primary")}
                onClick={() => setViewMode("calendar")}
                title="Dạng lịch"
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
              Đặt lịch PV
            </Button>
          </div>

          {/* Toolbar with filters */}
          <div className="px-2 pb-2">
            <InterviewToolbar
              searchValue={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
              jobPostingIdFilter={jobPostingIdFilter}
              onJobPostingIdFilterChange={setJobPostingIdFilter}
              fromDate={fromDate}
              onFromDateChange={setFromDate}
              toDate={toDate}
              onToDateChange={setToDate}
              jobPostings={jobPostings ?? []}
              onCreateClick={() => setIsCreateOpen(true)}
              isLoading={isLoadingInterviews}
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
              { key: "candidate", label: "Ứng viên", icon: CalendarCheck },
              { key: "jobPosting", label: "Vị trí", icon: CalendarCheck },
              { key: "round", label: "Vòng", icon: CalendarCheck },
              { key: "datetime", label: "Ngày giờ", icon: CalendarCheck },
              { key: "type", label: "Hình thức", icon: CalendarCheck },
              { key: "interviewers", label: "Người PV", icon: CalendarCheck },
              { key: "status", label: "Trạng thái", icon: CalendarCheck },
              { key: "result", label: "Kết quả", icon: CalendarCheck },
            ]}
            hiddenColumnIndices={[0]}
            defaultVisibleColumns={{
              select: true,
              candidate: true,
              jobPosting: true,
              round: true,
              datetime: true,
              type: false,
              interviewers: false,
              status: true,
              result: true,
            }}
          />
        </section>

        {/* Table / Calendar */}
        <section className="flex-1 relative h-full min-h-0 overflow-hidden">
          {viewMode === "calendar" ? (
            <InterviewCalendar
              data={interviews}
              isLoading={isLoadingInterviews}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewDetail={handleViewDetail}
              onFeedback={handleFeedback}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <InterviewTable
              data={interviews}
              isLoading={isLoadingInterviews}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewDetail={handleViewDetail}
              onFeedback={handleFeedback}
              onStatusChange={handleStatusChange}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={!!isFetchingNextPage}
              onLoadMore={handleFetchNextPage}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              totalInterviews={interviewsData?.pages[0]?.total ?? 0}
            />
          )}
        </section>
      </div>

      {/* Create Dialog */}
      <InterviewCreateDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        candidates={candidates.map((c) => ({
          id: c.id,
          name: c.name,
          jobPostingTitle: c.jobPostingTitle || "",
        }))}
        jobPostings={jobPostings.map((jp) => ({ id: jp.id, title: jp.title }))}
        interviewers={interviewers.map((u) => ({ id: u.id, name: u.name }))}
        onSubmit={(data) => {
          createMutation.mutate(data);
        }}
        isLoading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      <InterviewEditDialog
        open={!!editingInterview}
        onClose={() => setEditingInterview(null)}
        interview={editingInterview}
        candidates={candidates.map((c) => ({
          id: c.id,
          name: c.name,
          jobPostingTitle: c.jobPostingTitle || "",
        }))}
        jobPostings={jobPostings.map((jp) => ({ id: jp.id, title: jp.title }))}
        interviewers={interviewers.map((u) => ({ id: u.id, name: u.name }))}
        onSubmit={(data) => {
          if (!editingInterview) return;
          updateMutation.mutate({ id: editingInterview.id, data });
        }}
        isLoading={updateMutation.isPending}
      />

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={!!feedbackInterview}
        onClose={() => setFeedbackInterview(null)}
        interview={feedbackInterview}
        onSubmit={(data) => {
          if (!feedbackInterview) return;
          feedbackMutation.mutate({ interviewId: feedbackInterview.id, ...data });
        }}
        isLoading={feedbackMutation.isPending}
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
              Bạn có chắc chắn muốn xóa lịch phỏng vấn của{" "}
              <strong>{deleteTarget?.candidateName}</strong> không?
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

// ─── Interview Create Dialog ───────────────────────────────────────────────────

interface InterviewCreateDialogProps {
  open: boolean;
  onClose: () => void;
  candidates: Array<{ id: string; name: string; jobPostingTitle: string }>;
  jobPostings: Array<{ id: string; title: string }>;
  interviewers: Array<{ id: string; name: string }>;
  onSubmit: (data: InterviewFormValues) => void;
  isLoading?: boolean;
}

function InterviewCreateDialog({
  open,
  onClose,
  candidates,
  jobPostings,
  interviewers,
  onSubmit,
  isLoading,
}: InterviewCreateDialogProps) {
  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      candidateId: "",
      jobPostingId: "",
      round: 1,
      type: "ONSITE",
      method: "INDIVIDUAL",
      scheduledDate: new Date(),
      scheduledTime: "09:00",
      duration: 60,
      location: undefined,
      meetingLink: undefined,
      interviewerIds: [],
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đặt lịch phỏng vấn</DialogTitle>
          <DialogDescription>Đặt lịch phỏng vấn ứng viên</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="candidateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ứng viên *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn ứng viên" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {candidates.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.jobPostingTitle}
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
                name="jobPostingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vị trí *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn vị trí" />
                        </SelectTrigger>
                      </FormControl>
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
              <FormField
                control={form.control}
                name="round"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vòng phỏng vấn</FormLabel>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hình thức</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ONSITE">Trực tiếp</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="PHONE">Điện thoại</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phương pháp</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Cá nhân</SelectItem>
                        <SelectItem value="GROUP">Nhóm</SelectItem>
                        <SelectItem value="PANEL">Panel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày *</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ bắt đầu *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời lượng (phút)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={15}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="interviewerIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Người phỏng vấn</FormLabel>
                  <FormControl>
                    <Combobox
                      options={interviewers.map((u) => ({
                        value: u.id,
                        label: u.name,
                      }))}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Chọn người phỏng vấn..."
                      multiple
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa điểm (ONSITE)</FormLabel>
                    <FormControl>
                      <Input placeholder="Phòng họp 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link meeting (ONLINE)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://meet.google.com/..." {...field} />
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
                {isLoading ? "Đang lưu..." : "Đặt lịch"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Interview Edit Dialog ────────────────────────────────────────────────────

interface InterviewEditDialogProps {
  open: boolean;
  onClose: () => void;
  interview: InterviewBasic | null;
  candidates: Array<{ id: string; name: string; jobPostingTitle: string }>;
  jobPostings: Array<{ id: string; title: string }>;
  interviewers: Array<{ id: string; name: string }>;
  onSubmit: (data: InterviewFormValues) => void;
  isLoading?: boolean;
}

function InterviewEditDialog({
  open,
  onClose,
  interview,
  candidates,
  jobPostings,
  interviewers,
  onSubmit,
  isLoading,
}: InterviewEditDialogProps) {
  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: interview
      ? {
          candidateId: interview.candidateId,
          jobPostingId: interview.jobPostingId,
          round: interview.round,
          type: interview.type as "ONSITE" | "ONLINE" | "PHONE",
          method: interview.method as "INDIVIDUAL" | "GROUP" | "PANEL",
          scheduledDate: new Date(interview.scheduledDate),
          scheduledTime: interview.scheduledTime,
          duration: interview.duration,
          location: interview.location || undefined,
          meetingLink: interview.meetingLink || undefined,
          interviewerIds: interview.interviewerIds || [],
          status: interview.status as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | undefined,
          result: interview.result as "PASS" | "FAIL" | "PENDING" | undefined,
        }
      : {
          candidateId: "",
          jobPostingId: "",
          round: 1,
          type: "ONSITE" as const,
          method: "INDIVIDUAL" as const,
          scheduledDate: new Date(),
          scheduledTime: "09:00",
          duration: 60,
          location: undefined,
          meetingLink: undefined,
          interviewerIds: [],
        },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa lịch phỏng vấn</DialogTitle>
          <DialogDescription>Chỉnh sửa thông tin lịch phỏng vấn</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="candidateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ứng viên *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn ứng viên" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {candidates.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.jobPostingTitle}
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
                name="jobPostingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vị trí *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn vị trí" />
                        </SelectTrigger>
                      </FormControl>
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
              <FormField
                control={form.control}
                name="round"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vòng phỏng vấn</FormLabel>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hình thức</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ONSITE">Trực tiếp</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="PHONE">Điện thoại</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phương pháp</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Cá nhân</SelectItem>
                        <SelectItem value="GROUP">Nhóm</SelectItem>
                        <SelectItem value="PANEL">Panel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày *</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ bắt đầu *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời lượng (phút)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={15}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="interviewerIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Người phỏng vấn</FormLabel>
                  <FormControl>
                    <Combobox
                      options={interviewers.map((u) => ({
                        value: u.id,
                        label: u.name,
                      }))}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Chọn người phỏng vấn..."
                      multiple
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa điểm (ONSITE)</FormLabel>
                    <FormControl>
                      <Input placeholder="Phòng họp 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link meeting (ONLINE)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://meet.google.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {interview && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                          <SelectItem value="IN_PROGRESS">Đang phỏng vấn</SelectItem>
                          <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                          <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                          <SelectItem value="NO_SHOW">Không đến</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kết quả</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn kết quả" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PASS">Đạt</SelectItem>
                          <SelectItem value="FAIL">Không đạt</SelectItem>
                          <SelectItem value="PENDING">Chờ kết quả</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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

// ─── Feedback Dialog ──────────────────────────────────────────────────────────

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  interview: InterviewBasic | null;
  onSubmit: (data: FeedbackFormValues) => void;
  isLoading?: boolean;
}

function FeedbackDialog({
  open,
  onClose,
  interview,
  onSubmit,
  isLoading,
}: FeedbackDialogProps) {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      score: undefined,
      result: undefined,
      strengths: "",
      improvements: "",
      notes: "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Feedback phỏng vấn</DialogTitle>
          <DialogDescription>
            {interview?.candidateName} - {interview?.jobPostingTitle}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Điểm (1-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        placeholder="8"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kết quả</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kết quả" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PASS">Đạt</SelectItem>
                        <SelectItem value="FAIL">Không đạt</SelectItem>
                        <SelectItem value="PENDING">Chờ kết quả</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="strengths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm mạnh</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Kỹ năng tốt, giao tiếp tốt..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="improvements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm cần cải thiện</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Cần cải thiện..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú thêm</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Ghi chú khác..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang gửi..." : "Gửi feedback"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
