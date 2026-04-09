"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
    Users,
    Calendar,
    Clock,
    Search,
    RefreshCw,
    Settings,
    ListFilter,
    Briefcase,
    CheckCircle2,
    Eye,
    Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
    type ColumnDef,
} from "@tanstack/react-table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import {
    getJobPostingById,
    getCandidatesByJobPosting,
    getInterviewsByJobPosting,
    updateCandidate,
    deleteCandidate,
    createInterview,
    deleteInterview,
    getUsersForInterviewer,
    updateJobPosting,
} from "../actions";
import type {
    JobPostingWithStats,
    CandidateBasic,
    InterviewBasic,
    CreateInterviewForm,
    CandidateStage,
    InterviewStatus,
    JobPostingStatus,
} from "../types";

const STAGE_LABELS: Record<CandidateStage, { label: string; color: string }> = {
    APPLIED: { label: "Ứng tuyển", color: "bg-gray-100 text-gray-700 border-gray-200" },
    SCREENING: { label: "Sàng lọc", color: "bg-blue-100 text-blue-700 border-blue-200" },
    INTERVIEW: { label: "Phỏng vấn", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    OFFER: { label: "Offer", color: "bg-purple-100 text-purple-700 border-purple-200" },
    HIRED: { label: "Đã tuyển", color: "bg-green-100 text-green-700 border-green-200" },
    REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-700 border-red-200" },
};

const STAGES: CandidateStage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, { label: string; color: string }> = {
    SCHEDULED: { label: "Đã lên lịch", color: "bg-blue-50 text-blue-700 border-blue-200" },
    IN_PROGRESS: { label: "Đang PV", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    COMPLETED: { label: "Hoàn thành", color: "bg-green-50 text-green-700 border-green-200" },
    CANCELLED: { label: "Đã hủy", color: "bg-slate-100 text-slate-700 border-slate-200" },
    NO_SHOW: { label: "Không đến", color: "bg-red-50 text-red-700 border-red-200" },
};

const STAGE_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: "ALL", label: "Tất cả giai đoạn" },
    { value: "APPLIED", label: "Ứng tuyển" },
    { value: "SCREENING", label: "Sàng lọc" },
    { value: "INTERVIEW", label: "Phỏng vấn" },
    { value: "OFFER", label: "Offer" },
    { value: "HIRED", label: "Đã tuyển" },
    { value: "REJECTED", label: "Từ chối" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
    { value: "date_desc", label: "Mới nhất" },
    { value: "date_asc", label: "Cũ nhất" },
    { value: "name_asc", label: "Tên A → Z" },
    { value: "name_desc", label: "Tên Z → A" },
];

// ============================================================
// TYPES
// ============================================================

interface RecruitmentDetailClientProps {
    jobPostingId: string;
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatDate(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return "—";
    try {
        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(new Date(dateStr));
    } catch {
        return "—";
    }
}

function getRelativeTime(dateStr: string | Date): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return formatDate(dateStr);
    } catch {
        return formatDate(dateStr);
    }
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
    title,
    value,
    icon: Icon,
    className,
}: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    className?: string;
}) {
    return (
        <Card className={cn("hover:shadow-md transition-shadow py-1", className)}>
            <CardContent className="flex items-center gap-3 p-3">
                <div
                    className={cn(
                        "p-2 rounded-lg shrink-0",
                        className?.includes("blue")
                            ? "bg-blue-100 text-blue-600"
                            : className?.includes("green")
                                ? "bg-green-100 text-green-600"
                                : className?.includes("yellow")
                                    ? "bg-yellow-100 text-yellow-600"
                                    : className?.includes("purple")
                                        ? "bg-purple-100 text-purple-600"
                                        : "bg-slate-100 text-slate-600",
                    )}
                >
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

// ============================================================
// FILTER POPOVER
// ============================================================

function FilterPopover({
    stageFilter,
    setStageFilter,
    sortBy,
    setSortBy,
    onReset,
}: {
    stageFilter: string;
    setStageFilter: (v: string) => void;
    sortBy: string;
    setSortBy: (v: string) => void;
    onReset: () => void;
}) {
    const [open, setOpen] = useState(false);
    const hasFilters = stageFilter !== "ALL" || sortBy !== "date_desc";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="xs"
                    className={cn(hasFilters && "border-primary bg-primary/5")}
                >
                    <ListFilter className="h-3.5 w-3.5" />
                    Bộ lọc
                    {hasFilters && (
                        <Badge
                            variant="default"
                            className="ml-1 h-4 w-4 p-0 justify-center text-[10px]"
                        >
                            {hasFilters ? 1 : 0}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">Bộ lọc</p>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    onReset();
                                    setOpen(false);
                                }}
                            >
                                Đặt lại
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Giai đoạn</Label>
                        <Select value={stageFilter} onValueChange={setStageFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn giai đoạn" />
                            </SelectTrigger>
                            <SelectContent>
                                {STAGE_FILTER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Sắp xếp</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function RecruitmentDetailClient({ jobPostingId }: RecruitmentDetailClientProps) {
    const queryClient = useQueryClient();
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateBasic | null>(null);
    const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
    const [selectedCandidateForInterview, setSelectedCandidateForInterview] = useState<CandidateBasic | null>(null);
    const [stageFilter, setStageFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("date_desc");
    const [search, setSearch] = useState("");
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [interviewSearch, setInterviewSearch] = useState("");
    const [interviewSearchExpanded, setInterviewSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const interviewSearchInputRef = useRef<HTMLInputElement>(null);
    const interviewSearchContainerRef = useRef<HTMLDivElement>(null);

    // Click outside to close search
    const clickOutsideRef = useClickOutside(() => {
        if (searchExpanded) {
            if (search.trim()) setSearch("");
            setSearchExpanded(false);
        }
    });
    const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

    const interviewClickOutsideRef = useClickOutside(() => {
        if (interviewSearchExpanded) {
            if (interviewSearch.trim()) setInterviewSearch("");
            setInterviewSearchExpanded(false);
        }
    });
    const mergedInterviewSearchRef = useMergedRef(interviewSearchContainerRef, interviewClickOutsideRef);

    const { data: jobPosting } = useQuery<JobPostingWithStats>({
        queryKey: ["recruitment", "job-posting", jobPostingId],
        queryFn: async () => {
            const res = await getJobPostingById(jobPostingId);
            return res as JobPostingWithStats;
        },
    });

    const { data: candidates = [], isFetching: isFetchingCandidates } = useQuery({
        queryKey: ["recruitment", "candidates", "by-job", jobPostingId],
        queryFn: async () => {
            const res = await getCandidatesByJobPosting(jobPostingId);
            return res as CandidateBasic[];
        },
    });

    const { data: interviews = [], isFetching: isFetchingInterviews } = useQuery({
        queryKey: ["recruitment", "interviews", "by-job", jobPostingId],
        queryFn: async () => {
            const res = await getInterviewsByJobPosting(jobPostingId);
            return res as InterviewBasic[];
        },
    });

    const { data: interviewers = [] } = useQuery({
        queryKey: ["recruitment", "interviewers"],
        queryFn: getUsersForInterviewer,
    });

    const updateCandidateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { stage?: string } }) => updateCandidate(id, data),
        onSuccess: () => {
            toast.success("Cập nhật ứng viên thành công");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Lỗi khi cập nhật ứng viên");
        },
    });

    const createInterviewMutation = useMutation({
        mutationFn: (data: CreateInterviewForm) => createInterview(data),
        onSuccess: () => {
            toast.success("Đặt lịch phỏng vấn thành công");
            setIsInterviewDialogOpen(false);
            setSelectedCandidateForInterview(null);
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Lỗi khi đặt lịch phỏng vấn");
        },
    });

    const deleteInterviewMutation = useMutation({
        mutationFn: deleteInterview,
        onSuccess: () => {
            toast.success("Đã xóa lịch phỏng vấn");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Lỗi khi xóa lịch phỏng vấn");
        },
    });

    const updateJobPostingMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: JobPostingStatus }) => updateJobPosting(id, { status }),
        onSuccess: () => {
            toast.success("Cập nhật trạng thái tin tuyển dụng thành công");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "job-posting"] });
            queryClient.invalidateQueries({ queryKey: ["recruitment"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Lỗi khi cập nhật trạng thái");
        },
    });

    const handleMoveStage = (candidateId: string, newStage: CandidateStage) => {
        updateCandidateMutation.mutate({ id: candidateId, data: { stage: newStage } });
    };

    const handleScheduleInterview = (candidate: CandidateBasic) => {
        setSelectedCandidateForInterview(candidate);
        setIsInterviewDialogOpen(true);
    };

    const handleInterviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedCandidateForInterview || !jobPosting) return;
        const formData = new FormData(e.currentTarget);
        const interviewerIds = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement>('input[name="interviewerIds"]:checked')).map(i => i.value);
        
        const data: CreateInterviewForm = {
            candidateId: selectedCandidateForInterview.id,
            jobPostingId: jobPosting.id,
            round: Number(formData.get("round")) || 1,
            type: (formData.get("type") as CreateInterviewForm["type"]) || "ONSITE",
            method: (formData.get("method") as CreateInterviewForm["method"]) || "INDIVIDUAL",
            scheduledDate: formData.get("scheduledDate") as string,
            scheduledTime: formData.get("scheduledTime") as string,
            duration: Number(formData.get("duration")) || 60,
            location: formData.get("location") as string || undefined,
            meetingLink: formData.get("meetingLink") as string || undefined,
            interviewerIds,
        };
        createInterviewMutation.mutate(data);
    };

    // Filter & sort candidates
    const filteredCandidates = useMemo(() => {
        let result = [...candidates];

        if (stageFilter !== "ALL") {
            result = result.filter(c => c.stage === stageFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                (c.phone && c.phone.includes(q))
            );
        }

        switch (sortBy) {
            case "date_asc":
                result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case "date_desc":
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case "name_asc":
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name_desc":
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }

        return result;
    }, [candidates, stageFilter, search, sortBy]);

    // Filter interviews
    const filteredInterviews = useMemo(() => {
        if (!interviewSearch.trim()) return interviews;
        const q = interviewSearch.toLowerCase();
        return interviews.filter(i =>
            (i.candidateName && i.candidateName.toLowerCase().includes(q)) ||
            i.type.toLowerCase().includes(q) ||
            i.status.toLowerCase().includes(q)
        );
    }, [interviews, interviewSearch]);

    // Group candidates by stage for Kanban
    const candidatesByStage = STAGES.reduce((acc, stage) => {
        acc[stage] = filteredCandidates.filter(c => c.stage === stage);
        return acc;
    }, {} as Record<CandidateStage, CandidateBasic[]>);

    // Stats
    const totalCandidates = candidates.length;
    const hiredCount = candidatesByStage.HIRED.length;
    const rejectedCount = candidatesByStage.REJECTED.length;

    // Interview columns for Table view
    const interviewColumns = useMemo<ColumnDef<InterviewBasic>[]>(() => [
        {
            accessorKey: "candidateName",
            id: "candidateName",
            header: "Ứng viên",
            size: 200,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">
                            {row.original.candidateName?.split(" ").pop()?.charAt(0) || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">
                        {row.original.candidateName || "—"}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "round",
            id: "round",
            header: "Vòng",
            size: 80,
            cell: ({ row }) => (
                <Badge variant="outline" className="text-xs">
                    Vòng {row.original.round}
                </Badge>
            ),
        },
        {
            accessorKey: "type",
            id: "type",
            header: "Hình thức",
            size: 120,
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.type === "ONSITE" ? "Trực tiếp" :
                     row.original.type === "ONLINE" ? "Online" : "Điện thoại"}
                </span>
            ),
        },
        {
            accessorKey: "scheduledDate",
            id: "scheduledDate",
            header: "Ngày",
            size: 120,
            cell: ({ row }) => (
                <span className="text-sm">
                    {format(new Date(row.original.scheduledDate), "dd/MM/yyyy", { locale: vi })}
                </span>
            ),
        },
        {
            accessorKey: "scheduledTime",
            id: "scheduledTime",
            header: "Giờ",
            size: 80,
            cell: ({ row }) => (
                <span className="text-sm">{row.original.scheduledTime}</span>
            ),
        },
        {
            accessorKey: "status",
            id: "status",
            header: "Trạng thái",
            size: 120,
            cell: ({ row }) => {
                const status = row.original.status as InterviewStatus;
                return (
                    <Badge className={cn("text-[10px]", INTERVIEW_STATUS_LABELS[status]?.color)}>
                        {INTERVIEW_STATUS_LABELS[status]?.label}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "interviewerNames",
            id: "interviewers",
            header: "Người phỏng vấn",
            size: 180,
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.interviewerNames?.join(", ") || "Chưa phân công"}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Thao tác",
            size: 120,
            enableHiding: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1 justify-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon-xs"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleScheduleInterview({
                                    id: row.original.candidateId,
                                    jobPostingId: row.original.jobPostingId,
                                    name: row.original.candidateName || "",
                                    email: "",
                                    phone: null,
                                    gender: null,
                                    dateOfBirth: null,
                                    address: null,
                                    cvUrl: null,
                                    cvFileName: null,
                                    linkedinUrl: null,
                                    portfolioUrl: null,
                                    source: "OTHER",
                                    sourceDetail: null,
                                    stage: "INTERVIEW",
                                    rating: null,
                                    rejectionReason: null,
                                    hiredSalary: null,
                                    hiredDate: null,
                                    notes: null,
                                    tags: [],
                                    createdAt: "",
                                    updatedAt: "",
                                })}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Đặt lịch</TooltipContent>
                    </Tooltip>
                    {row.original.status !== "COMPLETED" && row.original.status !== "CANCELLED" && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => {
                                        if (confirm("Bạn có chắc chắn muốn xóa lịch phỏng vấn này?")) {
                                            deleteInterviewMutation.mutate(row.original.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xóa</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ], [deleteInterviewMutation]);

    const interviewTable = useReactTable({
        data: filteredInterviews,
        columns: interviewColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    // Search handlers
    const handleSearchToggle = useCallback(() => {
        setSearchExpanded((prev) => {
            const next = !prev;
            if (next) setTimeout(() => searchInputRef.current?.focus(), 50);
            else setSearch("");
            return next;
        });
    }, []);

    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setSearchExpanded(false);
            setSearch("");
            searchInputRef.current?.blur();
        }
    }, []);

    const handleInterviewSearchToggle = useCallback(() => {
        setInterviewSearchExpanded((prev) => {
            const next = !prev;
            if (next) setTimeout(() => interviewSearchInputRef.current?.focus(), 50);
            else setInterviewSearch("");
            return next;
        });
    }, []);

    const handleInterviewSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setInterviewSearchExpanded(false);
            setInterviewSearch("");
            interviewSearchInputRef.current?.blur();
        }
    }, []);

    // Keyboard shortcut for search
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;
            if (isInputFocused) return;
            if (e.key === "/") {
                e.preventDefault();
                handleSearchToggle();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleSearchToggle]);

    const resetFilters = useCallback(() => {
        setStageFilter("ALL");
        setSortBy("date_desc");
        setSearch("");
    }, []);

    const totalKanbanCards = filteredCandidates.length;

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* ─── Header ─── */}
            <div className="flex flex-col gap-0">
                <section>
                    <header className="p-2 flex items-center h-10 border-b">
                        <h1 className="font-bold flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {jobPosting?.title || "Chi tiết tuyển dụng"}
                        </h1>
                    </header>
                </section>

                {/* ─── Stats Row ─── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 border-b bg-muted/20">
                    <StatCard
                        title="Tổng ứng viên"
                        value={totalCandidates}
                        icon={Users}
                        className="blue"
                    />
                    <StatCard
                        title="Đã phỏng vấn"
                        value={interviews.length}
                        icon={Calendar}
                        className="yellow"
                    />
                    <StatCard
                        title="Đã tuyển"
                        value={`${hiredCount} / ${jobPosting?.headcount || 1}`}
                        icon={CheckCircle2}
                        className="green"
                    />
                    <StatCard
                        title="Hạn tuyển"
                        value={jobPosting?.deadline
                            ? format(new Date(jobPosting.deadline), "dd/MM/yyyy", { locale: vi })
                            : "Không giới hạn"}
                        icon={Clock}
                        className="purple"
                    />
                </div>

                {/* ─── Toolbar ─── */}
                <div className="flex items-center justify-end gap-1 px-2 py-2 shrink-0">
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                            updateJobPostingMutation.mutate({
                                id: jobPostingId,
                                status: (jobPosting?.status === "OPEN" ? "CLOSED" : "OPEN") as JobPostingStatus
                            });
                        }}
                        disabled={updateJobPostingMutation.isPending}
                    >
                        {jobPosting?.status === "OPEN" ? "Đóng tin" : "Mở lại tin"}
                    </Button>

                    <Separator orientation="vertical" className="h-4!" />

                    <FilterPopover
                        stageFilter={stageFilter}
                        setStageFilter={setStageFilter}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        onReset={resetFilters}
                    />

                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
                            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
                        }}
                        disabled={isFetchingCandidates || isFetchingInterviews}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", (isFetchingCandidates || isFetchingInterviews) && "animate-spin")} />
                    </Button>

                    {/* Search */}
                    <div className="relative flex items-center" ref={mergedSearchRef}>
                        <Input
                            ref={searchInputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Tìm ứng viên..."
                            className={cn(
                                "h-6 text-xs transition-all duration-300 ease-in-out pr-6",
                                searchExpanded ? "w-48 opacity-100 pl-3" : "w-0 opacity-0 pl-0",
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
                            <Search className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-4!" />

                    <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => setSettingsOpen(true)}
                    >
                        <Settings className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* ─── Status bar ─── */}
                <div className="flex items-center gap-2 px-2 py-1.5 border-b bg-muted/10 shrink-0">
                    <Badge variant={jobPosting?.status === "OPEN" ? "default" : "secondary"}>
                        {jobPosting?.status === "OPEN" ? "Đang tuyển" : jobPosting?.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {jobPosting?.departmentName || "Chưa phòng ban"}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                        {totalCandidates} ứng viên
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                        {hiredCount} đã tuyển
                    </span>
                    {rejectedCount > 0 && (
                        <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                                {rejectedCount} từ chối
                            </span>
                        </>
                    )}
                </div>

                {/* ─── Table Settings ─── */}
                <TableSettingsPanel
                    open={settingsOpen}
                    onClose={setSettingsOpen}
                    columnVisibility={{}}
                    setColumnVisibility={() => {}}
                    defaultVisibleColumns={{}}
                    columnOptions={[]}
                    className="top-10"
                    hiddenColumnIndices={[]}
                    disabledColumnIndices={[]}
                />
            </div>

            {/* ─── Tabs ─── */}
            <div className="flex items-center px-2 pb-0 border-b bg-background shrink-0">
                {(
                    [
                        { value: "kanban", label: "Pipeline", count: totalKanbanCards },
                        { value: "interviews", label: "Lịch phỏng vấn", count: interviews.length },
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => {}}
                        className={cn(
                            "px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px cursor-pointer",
                            tab.value === "kanban"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {tab.label}{" "}
                        <Badge
                            className={cn(
                                "p-0 px-1 text-[10px]",
                                tab.value === "kanban"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                            )}
                        >
                            {tab.count}
                        </Badge>
                    </button>
                ))}
            </div>

            {/* ─── Content ─── */}
            <div className="flex-1 min-h-0 overflow-auto">
                {/* Kanban Pipeline */}
                <div className="space-y-4 p-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Pipeline ứng viên
                    </h2>
                    <div className="grid gap-4 md:grid-cols-6">
                        {STAGES.map((stage) => (
                            <div key={stage} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-sm">
                                        {STAGE_LABELS[stage].label}
                                    </h3>
                                    <Badge variant="outline" className={STAGE_LABELS[stage].color}>
                                        {candidatesByStage[stage].length}
                                    </Badge>
                                </div>
                                <ScrollArea className="h-[450px]">
                                    <div className="space-y-2">
                                        {isFetchingCandidates ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <Card key={i} className="p-3">
                                                    <div className="flex items-start gap-2">
                                                        <Skeleton className="h-8 w-8 rounded-full" />
                                                        <div className="flex-1 space-y-1">
                                                            <Skeleton className="h-3 w-24" />
                                                            <Skeleton className="h-2 w-32" />
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        ) : candidatesByStage[stage].length > 0 ? (
                                            candidatesByStage[stage].map((candidate) => (
                                                <Card key={candidate.id} className="cursor-pointer hover:shadow-md transition-shadow"
                                                    onClick={() => setSelectedCandidate(candidate)}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="flex items-start gap-2">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback>
                                                                    {getInitials(candidate.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">
                                                                    {candidate.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {candidate.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {candidate.phone && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                {candidate.phone}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                {getRelativeTime(candidate.createdAt)}
                                                            </span>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                <Button variant="ghost" size="sm" className="h-6 w-full mt-2">
                                                                    Thao tác
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setSelectedCandidate(candidate)}>
                                                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                                                    Xem chi tiết
                                                                </DropdownMenuItem>
                                                                {stage === "APPLIED" && (
                                                                    <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "SCREENING")}>
                                                                        Chuyển sang Sàng lọc
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {stage === "SCREENING" && (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "INTERVIEW")}>
                                                                            Chuyển sang Phỏng vấn
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "REJECTED")}>
                                                                            Từ chối
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                {stage === "INTERVIEW" && (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => handleScheduleInterview(candidate)}>
                                                                            Đặt lịch phỏng vấn
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "OFFER")}>
                                                                            Chuyển sang Offer
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "REJECTED")}>
                                                                            Từ chối
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                {stage === "OFFER" && (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "HIRED")}>
                                                                            Tuyển dụng
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "REJECTED")}>
                                                                            Từ chối
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem 
                                                                    className="text-red-600"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm("Bạn có chắc chắn muốn xóa ứng viên này?")) {
                                                                            deleteCandidate(candidate.id);
                                                                            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                                    Xóa
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                Không có ứng viên
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lịch phỏng vấn */}
                <div className="space-y-4 p-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Lịch phỏng vấn
                    </h2>

                    {/* Interview Toolbar */}
                    <div className="flex items-center justify-end gap-2 px-2 py-2 shrink-0">
                        <div className="relative flex items-center" ref={mergedInterviewSearchRef}>
                            <Input
                                ref={interviewSearchInputRef}
                                value={interviewSearch}
                                onChange={(e) => setInterviewSearch(e.target.value)}
                                onKeyDown={handleInterviewSearchKeyDown}
                                placeholder="Tìm lịch phỏng vấn..."
                                className={cn(
                                    "h-6 text-xs transition-all duration-300 ease-in-out pr-6",
                                    interviewSearchExpanded ? "w-48 opacity-100 pl-3" : "w-0 opacity-0 pl-0",
                                )}
                            />
                            <Button
                                size={"icon-xs"}
                                variant={"ghost"}
                                onClick={handleInterviewSearchToggle}
                                className={cn(
                                    "absolute right-0.5 z-10",
                                    interviewSearchExpanded && "[&_svg]:text-primary",
                                )}
                            >
                                <Search className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    {interviewTable.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    className="h-7 px-2 select-none z-10 relative bg-background"
                                                    style={{ width: header.getSize() }}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column.columnDef.header,
                                                              header.getContext(),
                                                          )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {isFetchingInterviews ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                {interviewColumns.map((col, j) => (
                                                    <TableCell
                                                        key={j}
                                                        style={{ width: col.size }}
                                                        className="p-2"
                                                    >
                                                        <Skeleton className="h-4 w-full" />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : interviewTable.getRowModel().rows?.length ? (
                                        interviewTable.getRowModel().rows.map((row) => (
                                            <TableRow key={row.id} className="group/row">
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={interviewColumns.length}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                                                    <p>Chưa có lịch phỏng vấn nào</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ─── Summary Footer ─── */}
            <div className="shrink-0 px-2 py-2 border-t bg-background flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Hiển thị <strong>{totalKanbanCards}</strong> / <strong>{totalCandidates}</strong> ứng viên
                </p>
                {jobPosting?.deadline && (
                    <Badge
                        variant="outline"
                        className="text-xs bg-amber-50 border-amber-200 text-amber-700"
                    >
                        Hạn tuyển: {format(new Date(jobPosting.deadline), "dd/MM/yyyy", { locale: vi })}
                    </Badge>
                )}
            </div>

            {/* Candidate Detail Dialog */}
            <Dialog open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết ứng viên</DialogTitle>
                    </DialogHeader>
                    {selectedCandidate && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="text-lg">
                                        {getInitials(selectedCandidate.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold">{selectedCandidate.name}</h3>
                                    <p className="text-muted-foreground">{selectedCandidate.email}</p>
                                    {selectedCandidate.phone && (
                                        <p className="text-sm">{selectedCandidate.phone}</p>
                                    )}
                                </div>
                                <Badge className={STAGE_LABELS[selectedCandidate.stage]?.color}>
                                    {STAGE_LABELS[selectedCandidate.stage]?.label}
                                </Badge>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Nguồn</label>
                                    <p className="text-sm text-muted-foreground">{selectedCandidate.source}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Ngày ứng tuyển</label>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(selectedCandidate.createdAt), "dd/MM/yyyy", { locale: vi })}
                                    </p>
                                </div>
                                {selectedCandidate.cvUrl && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium">CV</label>
                                        <p className="text-sm">
                                            <a href={selectedCandidate.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Xem CV
                                            </a>
                                        </p>
                                    </div>
                                )}
                                {selectedCandidate.linkedinUrl && (
                                    <div>
                                        <label className="text-sm font-medium">LinkedIn</label>
                                        <p className="text-sm">
                                            <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Xem hồ sơ
                                            </a>
                                        </p>
                                    </div>
                                )}
                                {selectedCandidate.notes && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium">Ghi chú</label>
                                        <p className="text-sm text-muted-foreground">{selectedCandidate.notes}</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="flex gap-2 flex-wrap">
                                <Button onClick={() => handleScheduleInterview(selectedCandidate)}>
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Đặt lịch phỏng vấn
                                </Button>
                                {selectedCandidate.stage !== "REJECTED" && selectedCandidate.stage !== "HIRED" && (
                                    <Button variant="destructive" onClick={() => {
                                        handleMoveStage(selectedCandidate.id, "REJECTED");
                                        setSelectedCandidate(null);
                                    }}>
                                        Từ chối
                                    </Button>
                                )}
                                {selectedCandidate.stage === "INTERVIEW" && (
                                    <Button variant="default" onClick={() => {
                                        handleMoveStage(selectedCandidate.id, "OFFER");
                                        setSelectedCandidate(null);
                                    }}>
                                        Chuyển sang Offer
                                    </Button>
                                )}
                                {selectedCandidate.stage === "OFFER" && (
                                    <Button variant="default" onClick={() => {
                                        handleMoveStage(selectedCandidate.id, "HIRED");
                                        setSelectedCandidate(null);
                                    }}>
                                        Tuyển dụng
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Interview Dialog */}
            <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Đặt lịch phỏng vấn</DialogTitle>
                        <DialogDescription>
                            {selectedCandidateForInterview?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInterviewSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Vòng phỏng vấn</Label>
                                    <input name="round" type="number" defaultValue={1} min={1} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Hình thức</Label>
                                    <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="ONSITE">Trực tiếp</option>
                                        <option value="ONLINE">Online</option>
                                        <option value="PHONE">Điện thoại</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Ngày *</Label>
                                    <input name="scheduledDate" type="date" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Giờ *</Label>
                                    <input name="scheduledTime" type="time" required defaultValue="09:00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Thời lượng (phút)</Label>
                                    <input name="duration" type="number" defaultValue={60} min={15} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Địa điểm / Link meeting</Label>
                                <input name="location" placeholder="Phòng họp 1" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                <input name="meetingLink" placeholder="Link meeting (nếu online)" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Người phỏng vấn</Label>
                                <div className="flex flex-wrap gap-2">
                                    {interviewers?.map((user: { id: string; name: string; email: string }) => (
                                        <label key={user.id} className="flex items-center gap-2 border rounded px-2 py-1 cursor-pointer hover:bg-muted">
                                            <input type="checkbox" name="interviewerIds" value={user.id} />
                                            <span className="text-sm">{user.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsInterviewDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={createInterviewMutation.isPending}>
                                {createInterviewMutation.isPending ? "Đang đặt..." : "Đặt lịch"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
