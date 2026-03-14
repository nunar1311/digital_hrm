"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

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
    Department,
    Position,
    CreateJobPostingForm,
} from "@/app/(protected)/recruitment/types";
import { DatePicker } from "../ui/date-picker";

const jobPostingFormSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    description: z.string().min(1, "Mô tả không được để trống"),
    requirements: z.string().min(1, "Yêu cầu không được để trống"),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    headcount: z.number().int().positive(),
    employmentType: z.enum([
        "FULL_TIME",
        "PART_TIME",
        "INTERN",
        "CONTRACT",
    ]),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    deadline: z.string().optional(),
    benefits: z.string().optional(),
    workLocation: z.string().optional(),
    interviewRounds: z.number().int().positive(),
    status: z.enum(["DRAFT", "OPEN", "ON_HOLD", "CLOSED"]).optional(),
});

type JobPostingFormValues = z.infer<typeof jobPostingFormSchema>;
type EditJobPostingFormValues = JobPostingFormValues;

const STATUS_LABELS: Record<
    string,
    { label: string; color: string }
> = {
    DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-700" },
    OPEN: {
        label: "Đang tuyển",
        color: "bg-green-100 text-green-700",
    },
    ON_HOLD: {
        label: "Tạm dừng",
        color: "bg-yellow-100 text-yellow-700",
    },
    CLOSED: { label: "Đã đóng", color: "bg-red-100 text-red-700" },
};

const PRIORITY_LABELS: Record<
    string,
    { label: string; color: string }
> = {
    LOW: { label: "Thấp", color: "bg-gray-100 text-gray-700" },
    NORMAL: {
        label: "Bình thường",
        color: "bg-blue-100 text-blue-700",
    },
    HIGH: { label: "Cao", color: "bg-orange-100 text-orange-700" },
    URGENT: { label: "Khẩn cấp", color: "bg-red-100 text-red-700" },
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: "Toàn thời gian",
    PART_TIME: "Bán thời gian",
    INTERN: "Thực tập",
    CONTRACT: "Hợp đồng",
};

function formatSalary(
    min?: number | null,
    max?: number | null,
    currency = "VND",
) {
    if (!min && !max) return "Thỏa thuận";
    const fmt = (n: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(n);
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `Từ ${fmt(min)}`;
    return max ? `Đến ${fmt(max)}` : "Thỏa thuận";
}

export function JobPostingList() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<JobPostingFilters>({});
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPost, setEditingPost] =
        useState<JobPostingWithStats | null>(null);

    const { data: jobPostingsData, isLoading } = useQuery({
        queryKey: ["recruitment", "job-postings", filters],
        queryFn: async () => {
            const res = await getJobPostings(filters);
            return res;
        },
    });

    const { data: departments = [] } = useQuery({
        queryKey: ["recruitment", "departments"],
        queryFn: getDepartments,
    });

    const { data: positions = [] } = useQuery({
        queryKey: ["recruitment", "positions"],
        queryFn: getPositions,
    });

    const createMutation = useMutation({
        mutationFn: (data: JobPostingFormValues) =>
            createJobPosting(data),
        onSuccess: () => {
            toast.success("Tạo tin tuyển dụng thành công");
            setIsCreateOpen(false);
            queryClient.invalidateQueries({
                queryKey: ["recruitment", "job-postings"],
            });
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Lỗi khi tạo tin tuyển dụng",
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Partial<EditJobPostingFormValues>;
        }) => updateJobPosting(id, data),
        onSuccess: () => {
            toast.success("Cập nhật tin tuyển dụng thành công");
            setEditingPost(null);
            queryClient.invalidateQueries({
                queryKey: ["recruitment", "job-postings"],
            });
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Lỗi khi cập nhật tin tuyển dụng",
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteJobPosting(id),
        onSuccess: () => {
            toast.success("Xóa tin tuyển dụng thành công");
            queryClient.invalidateQueries({
                queryKey: ["recruitment", "job-postings"],
            });
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Lỗi khi xóa tin tuyển dụng",
            );
        },
    });

    const handleStatusChange = (id: string, status: string) => {
        updateMutation.mutate({
            id,
            data: {
                status: status as EditJobPostingFormValues["status"],
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <Input
                    placeholder="Tìm kiếm tin tuyển dụng..."
                    className="max-w-xs"
                    value={filters.search || ""}
                    onChange={(e) =>
                        setFilters((f) => ({
                            ...f,
                            search: e.target.value,
                        }))
                    }
                />
                <Select
                    value={filters.status || ""}
                    onValueChange={(v) =>
                        setFilters((f) => ({
                            ...f,
                            status: (v === "__all__"
                                ? ""
                                : v) as JobPostingFilters["status"],
                        }))
                    }
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            Tất cả
                        </SelectItem>
                        <SelectItem value="DRAFT">Nháp</SelectItem>
                        <SelectItem value="OPEN">
                            Đang tuyển
                        </SelectItem>
                        <SelectItem value="ON_HOLD">
                            Tạm dừng
                        </SelectItem>
                        <SelectItem value="CLOSED">
                            Đã đóng
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.priority || ""}
                    onValueChange={(v) =>
                        setFilters((f) => ({
                            ...f,
                            priority: (v === "__all__"
                                ? ""
                                : v) as JobPostingFilters["priority"],
                        }))
                    }
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Độ ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            Tất cả
                        </SelectItem>
                        <SelectItem value="LOW">Thấp</SelectItem>
                        <SelectItem value="NORMAL">
                            Bình thường
                        </SelectItem>
                        <SelectItem value="HIGH">Cao</SelectItem>
                        <SelectItem value="URGENT">
                            Khẩn cấp
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.departmentId || ""}
                    onValueChange={(v) =>
                        setFilters((f) => ({
                            ...f,
                            departmentId: v === "__all__" ? "" : v,
                        }))
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                                {d.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Dialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                >
                    <DialogTrigger asChild>
                        <Button>+ Tạo tin tuyển dụng</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Tạo tin tuyển dụng mới
                            </DialogTitle>
                            <DialogDescription>
                                Điền thông tin tin tuyển dụng mới
                            </DialogDescription>
                        </DialogHeader>
                        <JobPostingForm
                            departments={departments}
                            positions={positions}
                            onSubmit={(data) => {
                                createMutation.mutate(data);
                            }}
                            onCancel={() => setIsCreateOpen(false)}
                            isLoading={createMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách tin tuyển dụng</CardTitle>
                    <CardDescription>
                        {jobPostingsData?.total || 0} tin tuyển dụng
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            Đang tải...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tiêu đề</TableHead>
                                    <TableHead>Phòng ban</TableHead>
                                    <TableHead>Lương</TableHead>
                                    <TableHead>Số lượng</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ưu tiên</TableHead>
                                    <TableHead>Hạn nộp</TableHead>
                                    <TableHead>Ứng viên</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobPostingsData?.items.length ===
                                0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="text-center py-8"
                                        >
                                            Không có tin tuyển dụng
                                            nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    jobPostingsData?.items.map(
                                        (post) => (
                                            <TableRow key={post.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {post.title}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {EMPLOYMENT_TYPE_LABELS[
                                                            post
                                                                .employmentType
                                                        ] ||
                                                            post.employmentType}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {post.departmentName ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {formatSalary(
                                                        post.salaryMin,
                                                        post.salaryMax,
                                                        post.salaryCurrency,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {post.headcount}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            STATUS_LABELS[
                                                                post
                                                                    .status
                                                            ]?.color
                                                        }
                                                    >
                                                        {
                                                            STATUS_LABELS[
                                                                post
                                                                    .status
                                                            ]?.label
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            PRIORITY_LABELS[
                                                                post
                                                                    .priority
                                                            ]?.color
                                                        }
                                                    >
                                                        {
                                                            PRIORITY_LABELS[
                                                                post
                                                                    .priority
                                                            ]?.label
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {post.deadline
                                                        ? format(
                                                              new Date(
                                                                  post.deadline,
                                                              ),
                                                              "dd/MM/yyyy",
                                                              {
                                                                  locale: vi,
                                                              },
                                                          )
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {
                                                                post.candidateCount
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                ...
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setEditingPost(
                                                                        post as JobPostingWithStats,
                                                                    )
                                                                }
                                                            >
                                                                Chỉnh
                                                                sửa
                                                            </DropdownMenuItem>
                                                            {post.status ===
                                                                "DRAFT" && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            post.id,
                                                                            "OPEN",
                                                                        )
                                                                    }
                                                                >
                                                                    Đăng
                                                                    tin
                                                                </DropdownMenuItem>
                                                            )}
                                                            {post.status ===
                                                                "OPEN" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleStatusChange(
                                                                                post.id,
                                                                                "ON_HOLD",
                                                                            )
                                                                        }
                                                                    >
                                                                        Tạm
                                                                        dừng
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleStatusChange(
                                                                                post.id,
                                                                                "CLOSED",
                                                                            )
                                                                        }
                                                                    >
                                                                        Đóng
                                                                        tin
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {post.status ===
                                                                "ON_HOLD" && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            post.id,
                                                                            "OPEN",
                                                                        )
                                                                    }
                                                                >
                                                                    Mở
                                                                    lại
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    if (
                                                                        confirm(
                                                                            "Bạn có chắc chắn muốn xóa tin tuyển dụng này?",
                                                                        )
                                                                    ) {
                                                                        deleteMutation.mutate(
                                                                            post.id,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Xóa
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog
                open={!!editingPost}
                onOpenChange={(open) => !open && setEditingPost(null)}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Chỉnh sửa tin tuyển dụng
                        </DialogTitle>
                    </DialogHeader>
                    {editingPost && (
                        <EditJobPostingForm
                            departments={departments}
                            positions={positions}
                            defaultValues={{
                                title: editingPost.title,
                                departmentId:
                                    editingPost.departmentId ||
                                    undefined,
                                positionId:
                                    editingPost.positionId ||
                                    undefined,
                                description: editingPost.description,
                                requirements:
                                    editingPost.requirements,
                                salaryMin:
                                    editingPost.salaryMin ??
                                    undefined,
                                salaryMax:
                                    editingPost.salaryMax ??
                                    undefined,
                                headcount: editingPost.headcount,
                                employmentType:
                                    editingPost.employmentType,
                                priority: editingPost.priority,
                                deadline: editingPost.deadline
                                    ? editingPost.deadline.split(
                                          "T",
                                      )[0]
                                    : undefined,
                                benefits:
                                    editingPost.benefits || undefined,
                                workLocation:
                                    editingPost.workLocation ||
                                    undefined,
                                interviewRounds:
                                    editingPost.interviewRounds,
                                status: editingPost.status,
                            }}
                            onSubmit={(data) => {
                                updateMutation.mutate({
                                    id: editingPost.id,
                                    data,
                                });
                            }}
                            onCancel={() => setEditingPost(null)}
                            isLoading={updateMutation.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface JobPostingFormProps {
    departments?: Department[];
    positions?: Position[];
    defaultValues?: Partial<JobPostingFormValues> & {
        status?: "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED";
    };
    onSubmit: (data: JobPostingFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isEdit?: boolean;
}

function JobPostingForm({
    departments = [],
    positions = [],
    defaultValues,
    onSubmit,
    onCancel,
    isLoading = false,
    isEdit = false,
}: JobPostingFormProps) {
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
            ...defaultValues,
        },
    });

    const handleSubmit = (values: JobPostingFormValues) => {
        onSubmit(values);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
            >
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
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn phòng ban" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {departments.map((d) => (
                                            <SelectItem
                                                key={d.id}
                                                value={d.id}
                                            >
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
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn chức vụ" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {positions.map((p) => (
                                            <SelectItem
                                                key={p.id}
                                                value={p.id}
                                            >
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
                                <Textarea
                                    placeholder="Mô tả công việc..."
                                    rows={4}
                                    {...field}
                                />
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
                                <Textarea
                                    placeholder="Yêu cầu ứng viên..."
                                    rows={4}
                                    {...field}
                                />
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
                                            const val =
                                                e.target.value;
                                            field.onChange(
                                                val
                                                    ? Number(val)
                                                    : undefined,
                                            );
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
                                            const val =
                                                e.target.value;
                                            field.onChange(
                                                val
                                                    ? Number(val)
                                                    : undefined,
                                            );
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
                                        onChange={(e) =>
                                            field.onChange(
                                                Number(
                                                    e.target.value,
                                                ),
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
                        name="employmentType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Loại hình</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="FULL_TIME">
                                            Toàn thời gian
                                        </SelectItem>
                                        <SelectItem value="PART_TIME">
                                            Bán thời gian
                                        </SelectItem>
                                        <SelectItem value="INTERN">
                                            Thực tập
                                        </SelectItem>
                                        <SelectItem value="CONTRACT">
                                            Hợp đồng
                                        </SelectItem>
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
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="LOW">
                                            Thấp
                                        </SelectItem>
                                        <SelectItem value="NORMAL">
                                            Bình thường
                                        </SelectItem>
                                        <SelectItem value="HIGH">
                                            Cao
                                        </SelectItem>
                                        <SelectItem value="URGENT">
                                            Khẩn cấp
                                        </SelectItem>
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
                                        date={
                                            field.value
                                                ? new Date(
                                                      field.value,
                                                  )
                                                : undefined
                                        }
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
                                <FormLabel>
                                    Địa điểm làm việc
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Hà Nội / Remote"
                                        {...field}
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
                        name="interviewRounds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Số vòng phỏng vấn
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        {...field}
                                        onChange={(e) =>
                                            field.onChange(
                                                Number(
                                                    e.target.value,
                                                ),
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
                        name="benefits"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phúc lợi</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Bảo hiểm, laptop..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {isEdit && (
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
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">
                                            Nháp
                                        </SelectItem>
                                        <SelectItem value="OPEN">
                                            Đang tuyển
                                        </SelectItem>
                                        <SelectItem value="ON_HOLD">
                                            Tạm dừng
                                        </SelectItem>
                                        <SelectItem value="CLOSED">
                                            Đã đóng
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? "Đang lưu..."
                            : isEdit
                              ? "Lưu"
                              : "Tạo"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

interface EditJobPostingFormProps extends JobPostingFormProps {
    defaultValues: Partial<EditJobPostingFormValues>;
}

function EditJobPostingForm(props: EditJobPostingFormProps) {
    return <JobPostingForm {...props} isEdit={true} />;
}
