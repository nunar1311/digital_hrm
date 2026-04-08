"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
} from "@/app/[locale]/(protected)/attendance/shifts/shift-dialogs";

import {
    getCandidates,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    getJobPostings,
} from "@/app/[locale]/(protected)/recruitment/actions";
import type {
    CandidateBasic,
    CandidateFilters,
    CreateCandidateForm,
    CandidateStage,
    CandidateSource,
} from "@/app/[locale]/(protected)/recruitment/types";

const candidateSchema = z.object({
    jobPostingId: z.string().min(1, "Please select a position"),
    name: z.string().min(1, "Please enter full name"),
    email: z.string().email("Invalid email"),
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
        label: "Applied",
        color: "bg-gray-100 text-gray-700",
    },
    SCREENING: {
        label: "Screening",
        color: "bg-blue-100 text-blue-700",
    },
    INTERVIEW: {
        label: "Interview",
        color: "bg-yellow-100 text-yellow-700",
    },
    OFFER: { label: "Offer", color: "bg-purple-100 text-purple-700" },
    HIRED: {
        label: "Hired",
        color: "bg-green-100 text-green-700",
    },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

const SOURCE_LABELS: Record<string, string> = {
    WEBSITE: "Website",
    LINKEDIN: "LinkedIn",
    FACEBOOK: "Facebook",
    REFERRAL: "Referral",
    AGENCY: "Agency",
    OTHER: "Other",
};

export function CandidateList() {
    const t = useTranslations("ProtectedPages");
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
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "candidates"] });
            setIsCreateOpen(false);
            return {};
        },
        onSuccess: () => {
            toast.success("Candidate created successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create candidate");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Partial<CreateCandidateForm> & { stage?: string };
        }) => updateCandidate(id, data),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "candidates"] });
            setEditingCandidate(null);
            return {};
        },
        onSuccess: () => {
            toast.success("Candidate updated successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update candidate");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCandidate(id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "candidates"] });
            return {};
        },
        onSuccess: () => {
            toast.success("Candidate deleted successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete candidate");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        }
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

    const getStageLabel = (stage: CandidateStage) => {
        switch (stage) {
            case "APPLIED":
                return t("recruitmentStageApplied");
            case "SCREENING":
                return t("recruitmentStageScreening");
            case "INTERVIEW":
                return t("recruitmentStageInterview");
            case "OFFER":
                return t("recruitmentStageOffer");
            case "HIRED":
                return t("recruitmentStageHired");
            case "REJECTED":
                return t("recruitmentStageRejected");
            default:
                return stage;
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case "WEBSITE":
                return t("recruitmentSourceWebsite");
            case "LINKEDIN":
                return t("recruitmentSourceLinkedin");
            case "FACEBOOK":
                return t("recruitmentSourceFacebook");
            case "REFERRAL":
                return t("recruitmentSourceReferral");
            case "AGENCY":
                return t("recruitmentSourceAgency");
            case "OTHER":
                return t("recruitmentSourceOther");
            default:
                return source;
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <Input
                    placeholder="Search candidates..."
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
                        <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            All
                        </SelectItem>
                        <SelectItem value="APPLIED">
                            Applied
                        </SelectItem>
                        <SelectItem value="SCREENING">
                            Screening
                        </SelectItem>
                        <SelectItem value="INTERVIEW">
                            Interview
                        </SelectItem>
                        <SelectItem value="OFFER">Offer</SelectItem>
                        <SelectItem value="HIRED">
                            Hired
                        </SelectItem>
                        <SelectItem value="REJECTED">
                            Rejected
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
                        <SelectValue placeholder="Applied position" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            All
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
                        <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            All
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
                            Referral
                        </SelectItem>
                        <SelectItem value="AGENCY">Agency</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
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
                        <Button>+ Add candidate</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Add new candidate
                            </DialogTitle>
                            <DialogDescription>
                                Add candidate information
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
                                                Applied position *
                                            </FormLabel>
                                            <Select
                                                onValueChange={
                                                    field.onChange
                                                }
                                                value={field.value}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select position" />
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
                                                    Full name *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nguyen Van A"
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
                                                    Phone number
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
                                                    Gender
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
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">
                                                            Male
                                                        </SelectItem>
                                                        <SelectItem value="FEMALE">
                                                            Female
                                                        </SelectItem>
                                                        <SelectItem value="OTHER">
                                                            Other
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
                                                    Date of birth
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
                                                    Source
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
                                                            Referral
                                                        </SelectItem>
                                                        <SelectItem value="AGENCY">
                                                            Agency
                                                        </SelectItem>
                                                        <SelectItem value="OTHER">
                                                            Other
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
                                                Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Address"
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
                                                Notes
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional notes..."
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
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            createMutation.isPending
                                        }
                                    >
                                        {createMutation.isPending
                                            ? "Adding..."
                                            : "Add"}
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
                    <CardTitle>{t("recruitmentCandidateListTitle")}</CardTitle>
                    <CardDescription>
                        {t("recruitmentCandidateListCount", {
                            count: candidatesData?.total || 0,
                        })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            {t("recruitmentCandidateListLoading")}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("recruitmentCandidateHeadName")}</TableHead>
                                    <TableHead>{t("recruitmentCandidateHeadEmail")}</TableHead>
                                    <TableHead>{t("recruitmentCandidateHeadPhone")}</TableHead>
                                    <TableHead>{t("recruitmentCandidateHeadPosition")}</TableHead>
                                    <TableHead>{t("recruitmentCandidateHeadSource")}</TableHead>
                                    <TableHead>{t("recruitmentCandidateHeadStatus")}</TableHead>
                                    <TableHead>
                                        {t("recruitmentCandidateHeadAppliedDate")}
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
                                            {t("recruitmentCandidateEmpty")}
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
                                                    {getSourceLabel(candidate.source)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            STAGE_LABELS[
                                                                candidate.stage as CandidateStage
                                                            ]?.color
                                                        }
                                                    >
                                                        {getStageLabel(
                                                            candidate.stage as CandidateStage,
                                                        )}
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
                                                                {t("recruitmentActionEdit")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "SCREENING",
                                                                    )
                                                                }
                                                            >
                                                                {t("recruitmentActionMoveToScreening")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "INTERVIEW",
                                                                    )
                                                                }
                                                            >
                                                                {t("recruitmentActionMoveToInterview")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "OFFER",
                                                                    )
                                                                }
                                                            >
                                                                {t("recruitmentActionMoveToOffer")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "HIRED",
                                                                    )
                                                                }
                                                            >
                                                                {t("recruitmentActionMarkHired")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStageChange(
                                                                        candidate.id,
                                                                        "REJECTED",
                                                                    )
                                                                }
                                                            >
                                                                {t("recruitmentActionReject")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    if (
                                                                        confirm(
                                                                            t("recruitmentDeleteConfirm"),
                                                                        )
                                                                    ) {
                                                                        deleteMutation.mutate(
                                                                            candidate.id,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                {t("recruitmentActionDelete")}
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
                        <DialogTitle>Edit candidate</DialogTitle>
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
                                                Applied position *
                                            </FormLabel>
                                            <Select
                                                onValueChange={
                                                    field.onChange
                                                }
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select position" />
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
                                                    Full name *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nguyen Van A"
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
                                                    Phone number
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
                                                    Gender
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
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">
                                                            Male
                                                        </SelectItem>
                                                        <SelectItem value="FEMALE">
                                                            Female
                                                        </SelectItem>
                                                        <SelectItem value="OTHER">
                                                            Other
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
                                                    Date of birth
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
                                                    Source
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
                                                            Referral
                                                        </SelectItem>
                                                        <SelectItem value="AGENCY">
                                                            Agency
                                                        </SelectItem>
                                                        <SelectItem value="OTHER">
                                                            Other
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
                                                Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Address"
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
                                                Notes
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional notes..."
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
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            updateMutation.isPending
                                        }
                                    >
                                        {updateMutation.isPending
                                            ? "Äang lÆ°u..."
                                            : "LÆ°u"}
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

