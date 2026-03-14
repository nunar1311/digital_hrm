"use client";

import { useState } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
    Search, 
    Plus, 
    MoreHorizontal, 
    Mail, 
    Phone, 
    FileText, 
    Download, 
    Upload,
    Filter,
    X,
    Eye,
    Pencil,
    Trash2,
    Star,
    ExternalLink
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    DropdownMenuSeparator,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

import {
    getCandidates,
    getJobPostings,
    createCandidate,
    updateCandidate,
    deleteCandidate,
} from "@/app/(protected)/recruitment/actions";
import type {
    CandidateBasic,
    CandidateFilters,
    CandidateStage,
    JobPostingBasic,
} from "@/app/(protected)/recruitment/types";
import {
    CANDIDATE_STAGE,
    CANDIDATE_SOURCE,
} from "@/app/(protected)/recruitment/constants";
import { useTimezone } from "@/hooks/use-timezone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

interface PoolClientProps {
    initialCandidates: CandidateBasic[];
    initialJobPostings: JobPostingBasic[];
}

export function RecruitmentPoolClient({
    initialCandidates,
    initialJobPostings,
}: PoolClientProps) {
    const queryClient = useQueryClient();
    const { formatDate } = useTimezone();
    const [filters, setFilters] = useState<CandidateFilters>({});
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const { data: candidatesData, isLoading } = useQuery({
        queryKey: ["recruitment", "candidates", filters],
        queryFn: () => getCandidates(filters),
        initialData: { items: initialCandidates, total: initialCandidates.length, page: 1, limit: 100, totalPages: 1 },
    });

    const { data: jobPostingsData } = useQuery({
        queryKey: ["recruitment", "job-postings"],
        queryFn: () => getJobPostings({}, { limit: 100 }),
        initialData: { items: initialJobPostings, total: initialJobPostings.length, page: 1, limit: 20, totalPages: 1 },
    });

    const form = useForm<z.infer<typeof candidateSchema>>({
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

    const createMutation = useMutation({
        mutationFn: (data: z.infer<typeof candidateSchema>) => createCandidate(data),
        onSuccess: () => {
            toast.success("Thêm ứng viên thành công");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
            setIsCreateDialogOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Có lỗi xảy ra");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCandidate(id),
        onSuccess: () => {
            toast.success("Xóa ứng viên thành công");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Có lỗi xảy ra");
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => Promise.all(ids.map(id => deleteCandidate(id))),
        onSuccess: () => {
            toast.success("Xóa các ứng viên đã chọn thành công");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
            setSelectedCandidates([]);
            setIsAllSelected(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Có lỗi xảy ra");
        },
    });

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedCandidates([]);
        } else {
            setSelectedCandidates(candidatesData.items.map(c => c.id));
        }
        setIsAllSelected(!isAllSelected);
    };

    const handleSelectOne = (id: string) => {
        if (selectedCandidates.includes(id)) {
            setSelectedCandidates(selectedCandidates.filter(c => c !== id));
        } else {
            setSelectedCandidates([...selectedCandidates, id]);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getStageBadgeVariant = (stage: CandidateStage) => {
        switch (stage) {
            case "APPLIED":
                return "default";
            case "SCREENING":
                return "warning";
            case "INTERVIEW":
                return "secondary";
            case "OFFER":
                return "outline";
            case "HIRED":
                return "success";
            case "REJECTED":
                return "destructive";
            default:
                return "secondary";
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Hồ sơ ứng viên</h2>
                    <p className="text-sm text-muted-foreground">
                        Quản lý tất cả ứng viên trong hồ sơ
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {selectedCandidates.length > 0 && (
                        <div className="flex items-center gap-2 mr-4">
                            <span className="text-sm text-muted-foreground">
                                {selectedCandidates.length} đã chọn
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => bulkDeleteMutation.mutate(selectedCandidates)}
                                disabled={bulkDeleteMutation.isPending}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa đã chọn
                            </Button>
                        </div>
                    )}

                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>

                    <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                    </Button>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm ứng viên
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Thêm ứng viên mới</DialogTitle>
                                <DialogDescription>
                                    Nhập thông tin ứng viên
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit((data) => createMutation.mutate(data as any))}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="jobPostingId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vị trí ứng tuyển</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn vị trí" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {jobPostingsData.items.map((posting) => (
                                                            <SelectItem key={posting.id} value={posting.id}>
                                                                {posting.title}
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
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Họ tên</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nguyễn Văn A" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="email@example.com" type="email" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Điện thoại</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="0123456789" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="source"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nguồn</FormLabel>
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
                                                            <SelectItem value="WEBSITE">Website</SelectItem>
                                                            <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                                                            <SelectItem value="FACEBOOK">Facebook</SelectItem>
                                                            <SelectItem value="REFERRAL">Giới thiệu</SelectItem>
                                                            <SelectItem value="AGENCY">Đại lý</SelectItem>
                                                            <SelectItem value="OTHER">Khác</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="linkedinUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>LinkedIn</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://linkedin.com/in/..." {...field} />
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

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateDialogOpen(false)}
                                        >
                                            Hủy
                                        </Button>
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending ? "Đang lưu..." : "Thêm ứng viên"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo tên, email, số điện thoại..."
                                className="pl-9"
                                value={filters.search || ""}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                            />
                        </div>

                        <Select
                            value={filters.stage || "all"}
                            onValueChange={(value) => setFilters({ ...filters, stage: value === "all" ? undefined : value })}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {Object.entries(CANDIDATE_STAGE).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {value.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.jobPostingId || "all"}
                            onValueChange={(value) => setFilters({ ...filters, jobPostingId: value === "all" ? undefined : value })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Vị trí" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả vị trí</SelectItem>
                                {jobPostingsData.items.map((posting) => (
                                    <SelectItem key={posting.id} value={posting.id}>
                                        {posting.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.source || "all"}
                            onValueChange={(value) => setFilters({ ...filters, source: value === "all" ? undefined : value })}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Nguồn" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {Object.entries(CANDIDATE_SOURCE).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {value.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(filters.search || filters.stage || filters.jobPostingId || filters.source) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilters({})}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Xóa lọc
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Ứng viên</TableHead>
                                <TableHead>Vị trí</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Nguồn</TableHead>
                                <TableHead>Ngày ứng tuyển</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {candidatesData.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Không có ứng viên nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                candidatesData.items.map((candidate) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedCandidates.includes(candidate.id)}
                                                onCheckedChange={() => handleSelectOne(candidate.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback>
                                                        {getInitials(candidate.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{candidate.name}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {candidate.email}
                                                    </div>
                                                    {candidate.phone && (
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {candidate.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{candidate.jobPostingTitle}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStageBadgeVariant(candidate.stage)}>
                                                {CANDIDATE_STAGE[candidate.stage]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {CANDIDATE_SOURCE[candidate.source as keyof typeof CANDIDATE_SOURCE]?.label}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(new Date(candidate.createdAt))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Xem chi tiết
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    {candidate.cvUrl && (
                                                        <DropdownMenuItem>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Xem CV
                                                        </DropdownMenuItem>
                                                    )}
                                                    {candidate.linkedinUrl && (
                                                        <DropdownMenuItem>
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            LinkedIn
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => deleteMutation.mutate(candidate.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination info */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Hiển thị {candidatesData.items.length} / {candidatesData.total} ứng viên
                </div>
            </div>
        </div>
    );
}
