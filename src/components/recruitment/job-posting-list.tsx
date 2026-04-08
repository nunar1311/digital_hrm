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
} from "@/app/[locale]/(protected)/recruitment/actions";
import type {
    JobPostingWithStats,
    JobPostingFilters,
    Department,
    Position,
    CreateJobPostingForm,
} from "@/app/[locale]/(protected)/recruitment/types";
import { DatePicker } from "../ui/date-picker";

const jobPostingFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    requirements: z.string().min(1, "Requirements are required"),
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
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700" },
    OPEN: {
        label: "Open",
        color: "bg-green-100 text-green-700",
    },
    ON_HOLD: {
        label: "On hold",
        color: "bg-yellow-100 text-yellow-700",
    },
    CLOSED: { label: "Closed", color: "bg-red-100 text-red-700" },
};

const PRIORITY_LABELS: Record<
    string,
    { label: string; color: string }
> = {
    LOW: { label: "Low", color: "bg-gray-100 text-gray-700" },
    NORMAL: {
        label: "Normal",
        color: "bg-blue-100 text-blue-700",
    },
    HIGH: { label: "Cao", color: "bg-orange-100 text-orange-700" },
    URGENT: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    INTERN: "Internship",
    CONTRACT: "Contract",
};

function formatSalary(
    min?: number | null,
    max?: number | null,
    currency = "VND",
) {
    if (!min && !max) return "Negotiable";
    const fmt = (n: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(n);
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return max ? `Up to ${fmt(max)}` : "Negotiable";
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
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "job-postings"] });
            setIsCreateOpen(false);
            return {};
        },
        onSuccess: () => {
            toast.success("Job posting created successfully");
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Failed to create job posting",
            );
            queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Partial<EditJobPostingFormValues>;
        }) => updateJobPosting(id, data),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "job-postings"] });
            // Cannot eagerly update the local state correctly if called from table status change,
            // but for editing dialog, setEditingPost(null) works.
            setEditingPost(null);
            return {};
        },
        onSuccess: () => {
            toast.success("Job posting updated successfully");
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Failed to update job posting",
            );
            queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteJobPosting(id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "job-postings"] });
            return {};
        },
        onSuccess: () => {
            toast.success("Job posting deleted successfully");
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Failed to delete job posting",
            );
            queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] });
        }
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
                    placeholder="Search job postings..."
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
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            Táº¥t cáº£
                        </SelectItem>
                        <SelectItem value="DRAFT">NhÃ¡p</SelectItem>
                        <SelectItem value="OPEN">
                            Äang tuyá»ƒn
                        </SelectItem>
                        <SelectItem value="ON_HOLD">
                            Táº¡m dá»«ng
                        </SelectItem>
                        <SelectItem value="CLOSED">
                            ÄÃ£ Ä‘Ã³ng
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
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            Táº¥t cáº£
                        </SelectItem>
                        <SelectItem value="LOW">Tháº¥p</SelectItem>
                        <SelectItem value="NORMAL">
                            BÃ¬nh thÆ°á»ng
                        </SelectItem>
                        <SelectItem value="HIGH">Cao</SelectItem>
                        <SelectItem value="URGENT">
                            Kháº©n cáº¥p
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
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Táº¥t cáº£</SelectItem>
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
                        <Button>+ Táº¡o tin tuyá»ƒn dá»¥ng</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Táº¡o tin tuyá»ƒn dá»¥ng má»›i
                            </DialogTitle>
                            <DialogDescription>
                                Äiá»n thÃ´ng tin tin tuyá»ƒn dá»¥ng má»›i
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
                    <CardTitle>Danh sÃ¡ch tin tuyá»ƒn dá»¥ng</CardTitle>
                    <CardDescription>
                        {jobPostingsData?.total || 0} tin tuyá»ƒn dá»¥ng
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            Äang táº£i...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>TiÃªu Ä‘á»</TableHead>
                                    <TableHead>PhÃ²ng ban</TableHead>
                                    <TableHead>LÆ°Æ¡ng</TableHead>
                                    <TableHead>Sá»‘ lÆ°á»£ng</TableHead>
                                    <TableHead>Tráº¡ng thÃ¡i</TableHead>
                                    <TableHead>Æ¯u tiÃªn</TableHead>
                                    <TableHead>Háº¡n ná»™p</TableHead>
                                    <TableHead>á»¨ng viÃªn</TableHead>
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
                                            KhÃ´ng cÃ³ tin tuyá»ƒn dá»¥ng
                                            nÃ o
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
                                                                Chá»‰nh
                                                                sá»­a
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
                                                                    ÄÄƒng
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
                                                                        Táº¡m
                                                                        dá»«ng
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleStatusChange(
                                                                                post.id,
                                                                                "CLOSED",
                                                                            )
                                                                        }
                                                                    >
                                                                        ÄÃ³ng
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
                                                                    Má»Ÿ
                                                                    láº¡i
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    if (
                                                                        confirm(
                                                                            "Are you sure you want to delete this job posting?",
                                                                        )
                                                                    ) {
                                                                        deleteMutation.mutate(
                                                                            post.id,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                XÃ³a
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
                            Chá»‰nh sá»­a tin tuyá»ƒn dá»¥ng
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
                            <FormLabel>TiÃªu Ä‘á» *</FormLabel>
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
                                <FormLabel>PhÃ²ng ban</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select department" />
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
                                <FormLabel>Chá»©c vá»¥</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select position" />
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
                            <FormLabel>MÃ´ táº£ cÃ´ng viá»‡c *</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe the job..."
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
                            <FormLabel>YÃªu cáº§u *</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Candidate requirements..."
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
                                <FormLabel>LÆ°Æ¡ng tá»‘i thiá»ƒu</FormLabel>
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
                                <FormLabel>LÆ°Æ¡ng tá»‘i Ä‘a</FormLabel>
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
                                <FormLabel>Sá»‘ lÆ°á»£ng</FormLabel>
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
                                <FormLabel>Loáº¡i hÃ¬nh</FormLabel>
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
                                            ToÃ n thá»i gian
                                        </SelectItem>
                                        <SelectItem value="PART_TIME">
                                            BÃ¡n thá»i gian
                                        </SelectItem>
                                        <SelectItem value="INTERN">
                                            Thá»±c táº­p
                                        </SelectItem>
                                        <SelectItem value="CONTRACT">
                                            Há»£p Ä‘á»“ng
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
                                <FormLabel>Äá»™ Æ°u tiÃªn</FormLabel>
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
                                            Tháº¥p
                                        </SelectItem>
                                        <SelectItem value="NORMAL">
                                            BÃ¬nh thÆ°á»ng
                                        </SelectItem>
                                        <SelectItem value="HIGH">
                                            Cao
                                        </SelectItem>
                                        <SelectItem value="URGENT">
                                            Kháº©n cáº¥p
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
                                <FormLabel>Háº¡n ná»™p há»“ sÆ¡</FormLabel>
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
                                    Äá»‹a Ä‘iá»ƒm lÃ m viá»‡c
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Hanoi / Remote"
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
                                    Sá»‘ vÃ²ng phá»ng váº¥n
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
                                <FormLabel>PhÃºc lá»£i</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Insurance, laptop..."
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
                                <FormLabel>Tráº¡ng thÃ¡i</FormLabel>
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
                                            NhÃ¡p
                                        </SelectItem>
                                        <SelectItem value="OPEN">
                                            Äang tuyá»ƒn
                                        </SelectItem>
                                        <SelectItem value="ON_HOLD">
                                            Táº¡m dá»«ng
                                        </SelectItem>
                                        <SelectItem value="CLOSED">
                                            ÄÃ£ Ä‘Ã³ng
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
                        Há»§y
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? "Äang lÆ°u..."
                            : isEdit
                              ? "LÆ°u"
                              : "Create"}
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

