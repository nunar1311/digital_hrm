"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import {
    dateToStr,
    strToDate,
} from "@/app/(protected)/attendance/shifts/shift-dialogs";

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
    CandidateStage,
    CandidateSource,
} from "@/app/(protected)/recruitment/types";

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

const STAGE_LABELS: Record<
    CandidateStage,
    { label: string; color: string }
> = {
    APPLIED: {
        label: "Ứng tuyển",
        color: "bg-gray-100 text-gray-700",
    },
    SCREENING: {
        label: "Sàng lọc",
        color: "bg-blue-100 text-blue-700",
    },
    INTERVIEW: {
        label: "Phỏng vấn",
        color: "bg-yellow-100 text-yellow-700",
    },
    OFFER: { label: "Offer", color: "bg-purple-100 text-purple-700" },
    HIRED: {
        label: "Đã tuyển",
        color: "bg-green-100 text-green-700",
    },
    REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-700" },
};

const SOURCE_LABELS: Record<string, string> = {
    WEBSITE: "Website",
    LINKEDIN: "LinkedIn",
    FACEBOOK: "Facebook",
    REFERRAL: "Giới thiệu",
    AGENCY: "Agency",
    OTHER: "Khác",
};

export function CandidateList() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<CandidateFilters>({});
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] =
        useState<CandidateBasic | null>(null);

    const { data: candidatesData, isLoading } = useQuery({
        queryKey: ["recruitment", "candidates", filters],
        queryFn: async () => {
            const res = await getCandidates(filters);
            return res;
        },
    });

    const { data: jobPostings = [] } = useQuery({
        queryKey: ["recruitment", "job-postings", "open"],
        queryFn: async () => {
            const res = await getJobPostings(
                { status: "OPEN" },
                { limit: 100 },
            );
            return res.items;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCandidateForm) =>
            createCandidate(data),
        onSuccess: () => {
            toast.success("Thêm ứng viên thành công");
            setIsCreateOpen(false);
            queryClient.invalidateQueries({
                queryKey: ["recruitment", "candidates"],
            });
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
            setEditingCandidate(null);
            queryClient.invalidateQueries({
                queryKey: ["recruitment", "candidates"],
            });
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
        },
        onError: (error: Error) => {
            toast.error(error.message || "Lỗi khi xóa ứng viên");
        },
    });

    const createForm = useForm<CandidateFormValues>({
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
            source: "",
            sourceDetail: "",
            notes: "",
        },
    });

    const editForm = useForm<CandidateFormValues>({
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
            source: "",
            sourceDetail: "",
            notes: "",
        },
    });

    useEffect(() => {
        if (editingCandidate) {
            editForm.reset({
                jobPostingId: editingCandidate.jobPostingId || "",
                name: editingCandidate.name || "",
                email: editingCandidate.email || "",
                phone: editingCandidate.phone || "",
                gender: editingCandidate.gender as
                    | "MALE"
                    | "FEMALE"
                    | "OTHER"
                    | undefined,
                dateOfBirth: editingCandidate.dateOfBirth || "",
                address: editingCandidate.address || "",
                cvUrl: editingCandidate.cvUrl || "",
                linkedinUrl: editingCandidate.linkedinUrl || "",
                portfolioUrl: editingCandidate.portfolioUrl || "",
                source: editingCandidate.source || "",
                sourceDetail: editingCandidate.sourceDetail || "",
                notes: editingCandidate.notes || "",
            });
        }
    }, [editingCandidate, editForm]);

    const handleCreateSubmit = (values: CandidateFormValues) => {
        const data = {
            ...values,
            source: ((values.source as string) || "WEBSITE") as CandidateSource,
        };
        createMutation.mutate(data);
    };

    const handleUpdateSubmit = (values: CandidateFormValues) => {
        if (!editingCandidate) return;
        updateMutation.mutate({
            id: editingCandidate.id,
            data: {
                ...values,
                source: ((values.source as string) || "WEBSITE") as CandidateSource,
            },
        });
    };

    const handleStageChange = (id: string, stage: string) => {
        updateMutation.mutate({ id, data: { stage } });
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <Input
                    placeholder="Tìm kiếm ứng viên..."
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
                    value={filters.stage || ""}
                    onValueChange={(v) =>
                        setFilters((f) => ({
                            ...f,
                            stage: (v === "__all__"
                                ? ""
                                : v) as CandidateFilters["stage"],
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
                        <SelectItem value="APPLIED">
                            Ứng tuyển
                        </SelectItem>
                        <SelectItem value="SCREENING">
                            Sàng lọc
                        </SelectItem>
                        <SelectItem value="INTERVIEW">
                            Phỏng vấn
                        </SelectItem>
                        <SelectItem value="OFFER">Offer</SelectItem>
                        <SelectItem value="HIRED">
                            Đã tuyển
                        </SelectItem>
                        <SelectItem value="REJECTED">
                            Từ chối
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.jobPostingId || ""}
                    onValueChange={(v) =>
                        setFilters((f) => ({
                            ...f,
                            jobPostingId: v === "__all__" ? "" : v,
                        }))
                    }
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Vị trí ứng tuyển" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            Tất cả
                        </SelectItem>
                        {jobPostings.map((jp) => (
                            <SelectItem key={jp.id} value={jp.id}>
                                {jp.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filters.source || ""}
                    onValueChange={(v) =>
                        setFilters((f) => ({
                            ...f,
                            source: (v === "__all__"
                                ? ""
                                : v) as CandidateFilters["source"],
                        }))
                    }
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Nguồn" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            Tất cả
                        </SelectItem>
                        <SelectItem value="WEBSITE">
                            Website
                        </SelectItem>
                        <SelectItem value="LINKEDIN">
                            LinkedIn
                        </SelectItem>
                        <SelectItem value="FACEBOOK">
                            Facebook
                        </SelectItem>
                        <SelectItem value="REFERRAL">
                            Giới thiệu
                        </SelectItem>
                        <SelectItem value="AGENCY">Agency</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                </Select>
                <Dialog
                    open={isCreateOpen}
                    onOpenChange={(open) => {
                        setIsCreateOpen(open);
                        if (!open) createForm.reset();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>+ Thêm ứng viên</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Thêm ứng viên mới
                            </DialogTitle>
                            <DialogDescription>
                                Thêm thông tin ứng viên
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...createForm}>
                            <form
                                onSubmit={createForm.handleSubmit(
                                    handleCreateSubmit,
                                )}
                                className="grid gap-4 py-4"
                            >
                                <FormField
                                    control={createForm.control}
                                    name="jobPostingId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Vị trí ứng tuyển *
                                            </FormLabel>
                                            <Select
                                                onValueChange={
                                                    field.onChange
                                                }
                                                value={field.value}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Chọn vị trí" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {jobPostings.map(
                                                        (jp) => (
                                                            <SelectItem
                                                                key={
                                                                    jp.id
                                                                }
                                                                value={
                                                                    jp.id
                                                                }
                                                            >
                                                                {
                                                                    jp.title
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Họ tên *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nguyễn Văn A"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Email *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="email@example.com"
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
                                        control={createForm.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Số điện thoại
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="0912345678"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Giới tính
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={
                                                        field.value ||
                                                        ""
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn giới tính" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">
                                                            Nam
                                                        </SelectItem>
                                                        <SelectItem value="FEMALE">
                                                            Nữ
                                                        </SelectItem>
                                                        <SelectItem value="OTHER">
                                                            Khác
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
                                        control={createForm.control}
                                        name="dateOfBirth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Ngày sinh
                                                </FormLabel>
                                                <FormControl>
                                                    <DatePicker
                                                        date={strToDate(
                                                            field.value || "",
                                                        )}
                                                        setDate={(d) =>
                                                            field.onChange(
                                                                dateToStr(d),
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nguồn
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={
                                                        field.value
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="WEBSITE">
                                                            Website
                                                        </SelectItem>
                                                        <SelectItem value="LINKEDIN">
                                                            LinkedIn
                                                        </SelectItem>
                                                        <SelectItem value="FACEBOOK">
                                                            Facebook
                                                        </SelectItem>
                                                        <SelectItem value="REFERRAL">
                                                            Giới thiệu
                                                        </SelectItem>
                                                        <SelectItem value="AGENCY">
                                                            Agency
                                                        </SelectItem>
                                                        <SelectItem value="OTHER">
                                                            Khác
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={createForm.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Địa chỉ
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Địa chỉ"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="cvUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Link CV
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
                                        name="linkedinUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    LinkedIn
                                                </FormLabel>
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
                                        control={createForm.control}
                                        name="portfolioUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Portfolio
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={createForm.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Ghi chú
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Ghi chú thêm..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsCreateOpen(false)
                                        }
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            createMutation.isPending
                                        }
                                    >
                                        {createMutation.isPending
                                            ? "Đang thêm..."
                                            : "Thêm"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách ứng viên</CardTitle>
                    <CardDescription>
                        {candidatesData?.total || 0} ứng viên
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
                                    <TableHead>Họ tên</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Vị trí</TableHead>
                                    <TableHead>Nguồn</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>
                                        Ngày ứng tuyển
                                    </TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidatesData?.items.length ===
                                0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="text-center py-8"
                                        >
                                            Chưa có ứng viên nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    candidatesData?.items.map(
                                        (candidate) => (
                                            <TableRow
                                                key={candidate.id}
                                            >
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {
                                                            candidate.name
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {candidate.email}
                                                </TableCell>
                                                <TableCell>
                                                    {candidate.phone ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {candidate.jobPostingTitle ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {SOURCE_LABELS[
                                                        candidate
                                                            .source
                                                    ] ||
                                                        candidate.source}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            STAGE_LABELS[
                                                                candidate.stage as CandidateStage
                                                            ]?.color
                                                        }
                                                    >
                                                        {
                                                            STAGE_LABELS[
                                                                candidate.stage as CandidateStage
                                                            ]?.label
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {format(
                                                        new Date(
                                                            candidate.createdAt,
                                                        ),
                                                        "dd/MM/yyyy",
                                                        {
                                                            locale: vi,
                                                        },
                                                    )}
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
                                                                    setEditingCandidate(
                                                                        candidate as CandidateBasic,
                                                                    )
                                                                }
                                                            >
                                                                Chỉnh
                                                                sửa
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "SCREENING",
                                                                    )
                                                                }
                                                            >
                                                                Chuyển
                                                                sang
                                                                Sàng
                                                                lọc
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "INTERVIEW",
                                                                    )
                                                                }
                                                            >
                                                                Chuyển
                                                                sang
                                                                Phỏng
                                                                vấn
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "OFFER",
                                                                    )
                                                                }
                                                            >
                                                                Chuyển
                                                                sang
                                                                Offer
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "HIRED",
                                                                    )
                                                                }
                                                            >
                                                                Tuyển
                                                                dụng
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "REJECTED",
                                                                    )
                                                                }
                                                            >
                                                                Từ
                                                                chối
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    if (
                                                                        confirm(
                                                                            "Bạn có chắc chắn muốn xóa ứng viên này?",
                                                                        )
                                                                    ) {
                                                                        deleteMutation.mutate(
                                                                            candidate.id,
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
                open={!!editingCandidate}
                onOpenChange={(open) =>
                    !open && setEditingCandidate(null)
                }
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa ứng viên</DialogTitle>
                    </DialogHeader>
                    {editingCandidate && (
                        <Form {...editForm}>
                            <form
                                onSubmit={editForm.handleSubmit(
                                    handleUpdateSubmit,
                                )}
                                className="grid gap-4 py-4"
                            >
                                <FormField
                                    control={editForm.control}
                                    name="jobPostingId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Vị trí ứng tuyển *
                                            </FormLabel>
                                            <Select
                                                onValueChange={
                                                    field.onChange
                                                }
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn vị trí" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {jobPostings.map(
                                                        (jp) => (
                                                            <SelectItem
                                                                key={
                                                                    jp.id
                                                                }
                                                                value={
                                                                    jp.id
                                                                }
                                                            >
                                                                {
                                                                    jp.title
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={editForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Họ tên *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nguyễn Văn A"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Email *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="email@example.com"
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
                                        control={editForm.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Số điện thoại
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="0912345678"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Giới tính
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={
                                                        field.value ||
                                                        ""
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Chọn giới tính" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">
                                                            Nam
                                                        </SelectItem>
                                                        <SelectItem value="FEMALE">
                                                            Nữ
                                                        </SelectItem>
                                                        <SelectItem value="OTHER">
                                                            Khác
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
                                        control={editForm.control}
                                        name="dateOfBirth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Ngày sinh
                                                </FormLabel>
                                                <FormControl>
                                                    <DatePicker
                                                        date={strToDate(
                                                            field.value ||
                                                                "",
                                                        )}
                                                        setDate={(
                                                            d,
                                                        ) =>
                                                            field.onChange(
                                                                dateToStr(
                                                                    d,
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
                                        control={editForm.control}
                                        name="source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nguồn
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={
                                                        field.value
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="WEBSITE">
                                                            Website
                                                        </SelectItem>
                                                        <SelectItem value="LINKEDIN">
                                                            LinkedIn
                                                        </SelectItem>
                                                        <SelectItem value="FACEBOOK">
                                                            Facebook
                                                        </SelectItem>
                                                        <SelectItem value="REFERRAL">
                                                            Giới thiệu
                                                        </SelectItem>
                                                        <SelectItem value="AGENCY">
                                                            Agency
                                                        </SelectItem>
                                                        <SelectItem value="OTHER">
                                                            Khác
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={editForm.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Địa chỉ
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Địa chỉ"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="cvUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Link CV
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={editForm.control}
                                        name="linkedinUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    LinkedIn
                                                </FormLabel>
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
                                        control={editForm.control}
                                        name="portfolioUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Portfolio
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={editForm.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Ghi chú
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Ghi chú thêm..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setEditingCandidate(null)
                                        }
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            updateMutation.isPending
                                        }
                                    >
                                        {updateMutation.isPending
                                            ? "Đang lưu..."
                                            : "Lưu"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
