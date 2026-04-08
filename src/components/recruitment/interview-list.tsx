"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
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
    getInterviews,
    createInterview,
    updateInterview,
    deleteInterview,
    getCandidates,
    getJobPostings,
    getUsersForInterviewer,
    submitFeedback,
} from "@/app/[locale]/(protected)/recruitment/actions";
import type {
    InterviewBasic,
    InterviewFilters,
    CreateInterviewForm,
    InterviewStatus,
    InterviewResult,
} from "@/app/[locale]/(protected)/recruitment/types";

const interviewFormSchema = z.object({
    candidateId: z.string().min(1, "Candidate is required"),
    jobPostingId: z.string().min(1, "Position is required"),
    round: z.number().int().positive(),
    type: z.enum(["ONSITE", "ONLINE", "PHONE"]),
    method: z.enum(["INDIVIDUAL", "GROUP", "PANEL"]),
    scheduledDate: z.date(),
    scheduledTime: z.string().min(1, "Start time is required"),
    duration: z.number().int().positive(),
    location: z.string().optional(),
    meetingLink: z.string().optional(),
    interviewerIds: z.array(z.string()),
    status: z
        .enum([
            "SCHEDULED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
            "NO_SHOW",
        ])
        .optional(),
    result: z.enum(["PASS", "FAIL", "PENDING"]).optional(),
});

type InterviewFormValues = z.infer<typeof interviewFormSchema>;

const STATUS_LABELS: Record<
    InterviewStatus,
    { label: string; color: string }
> = {
    SCHEDULED: {
        label: "Scheduled",
        color: "bg-blue-100 text-blue-700",
    },
    IN_PROGRESS: {
        label: "In progress",
        color: "bg-yellow-100 text-yellow-700",
    },
    COMPLETED: {
        label: "Completed",
        color: "bg-green-100 text-green-700",
    },
    CANCELLED: {
        label: "Cancelled",
        color: "bg-gray-100 text-gray-700",
    },
    NO_SHOW: { label: "No show", color: "bg-red-100 text-red-700" },
};

const RESULT_LABELS: Record<
    InterviewResult,
    { label: string; color: string }
> = {
    PASS: { label: "Pass", color: "bg-green-100 text-green-700" },
    FAIL: { label: "Fail", color: "bg-red-100 text-red-700" },
    PENDING: {
        label: "Pending",
        color: "bg-gray-100 text-gray-700",
    },
};

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
    ONSITE: "Onsite",
    ONLINE: "Online",
    PHONE: "Phone",
};

export function InterviewList() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<InterviewFilters>({});
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingInterview, setEditingInterview] =
        useState<InterviewBasic | null>(null);
    const [feedbackInterview, setFeedbackInterview] =
        useState<InterviewBasic | null>(null);

    const { data: interviewsData, isLoading } = useQuery({
        queryKey: ["recruitment", "interviews", filters],
        queryFn: async () => {
            const res = await getInterviews(filters);
            return res;
        },
    });

    const { data: candidates = [] } = useQuery({
        queryKey: ["recruitment", "candidates", "active"],
        queryFn: async () => {
            const res = await getCandidates(
                { stage: "INTERVIEW" },
                { limit: 100 },
            );
            return res.items;
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

    const { data: interviewers = [] } = useQuery({
        queryKey: ["recruitment", "interviewers"],
        queryFn: getUsersForInterviewer,
    });

    const createMutation = useMutation({
        mutationFn: (data: InterviewFormValues) =>
            createInterview({
                ...data,
                scheduledDate: data.scheduledDate
                    .toISOString()
                    .split("T")[0],
            } as CreateInterviewForm),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "interviews"] });
            setIsCreateOpen(false);
            return {};
        },
        onSuccess: () => {
            toast.success("Interview scheduled successfully");
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Failed to schedule interview",
            );
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Partial<InterviewFormValues>;
        }) =>
            updateInterview(id, {
                ...data,
                scheduledDate: data.scheduledDate
                    ? data.scheduledDate.toISOString().split("T")[0]
                    : undefined,
            } as Partial<CreateInterviewForm>),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "interviews"] });
            setEditingInterview(null);
            return {};
        },
        onSuccess: () => {
            toast.success("Interview updated successfully");
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Failed to update interview",
            );
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteInterview(id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "interviews"] });
            return {};
        },
        onSuccess: () => {
            toast.success("Interview deleted successfully");
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Failed to delete interview",
            );
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        }
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
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["recruitment", "interviews"] });
            setFeedbackInterview(null);
            return {};
        },
        onSuccess: () => {
            toast.success("Feedback submitted successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to submit feedback");
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        }
    });

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <Select
                    value={filters.status || ""}
                    onValueChange={(v) =>
                        setFilters((f) => ({
                            ...f,
                            status: (v === "__all__"
                                ? ""
                                : v) as InterviewFilters["status"],
                        }))
                    }
                >
                    <SelectTrigger className="w-60">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            Táº¥t cáº£
                        </SelectItem>
                        <SelectItem value="SCHEDULED">
                            Scheduled
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS">
                            In progress
                        </SelectItem>
                        <SelectItem value="COMPLETED">
                            Completed
                        </SelectItem>
                        <SelectItem value="CANCELLED">
                            Cancelled
                        </SelectItem>
                        <SelectItem value="NO_SHOW">
                            No show
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.jobPostingId || ""}
                    onValueChange={(v) =>
                        setFilters((f) => ({
                            ...f,
                            jobPostingId: v || "",
                        }))
                    }
                >
                    <SelectTrigger className="w-60">
                        <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">
                            Táº¥t cáº£
                        </SelectItem>
                        {jobPostings.map((jp) => (
                            <SelectItem key={jp.id} value={jp.id}>
                                {jp.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <DatePicker
                    className="min-w-60"
                    date={
                        filters.fromDate
                            ? new Date(filters.fromDate)
                            : undefined
                    }
                    setDate={(date) =>
                        setFilters((f) => ({
                            ...f,
                            fromDate: date
                                ? date.toISOString()
                                : undefined,
                        }))
                    }
                />
                <DatePicker
                    className="min-w-60"
                    date={
                        filters.toDate
                            ? new Date(filters.toDate)
                            : undefined
                    }
                    setDate={(date) =>
                        setFilters((f) => ({
                            ...f,
                            toDate: date
                                ? date.toISOString()
                                : undefined,
                        }))
                    }
                />
                <Dialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                >
                    <DialogTrigger asChild>
                        <Button>+ Schedule interview</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Schedule interview
                            </DialogTitle>
                            <DialogDescription>
                                Schedule an interview for candidate
                            </DialogDescription>
                        </DialogHeader>
                        <InterviewForm
                            candidates={candidates}
                            jobPostings={jobPostings}
                            interviewers={interviewers}
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
                    <CardTitle>Interview schedule</CardTitle>
                    <CardDescription>
                        {interviewsData?.total || 0} interviews
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            Loading...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Round</TableHead>
                                    <TableHead>Date & time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Interviewers</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {interviewsData?.items.length ===
                                0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="text-center py-8"
                                        >
                                            No interview scheduled yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    interviewsData?.items.map(
                                        (interview) => (
                                            <TableRow
                                                key={interview.id}
                                            >
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {
                                                            interview.candidateName
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        interview.jobPostingTitle
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    Round{" "}
                                                    {interview.round}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        {format(
                                                            new Date(
                                                                interview.scheduledDate,
                                                            ),
                                                            "dd/MM/yyyy",
                                                            {
                                                                locale: vi,
                                                            },
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {
                                                            interview.scheduledTime
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        INTERVIEW_TYPE_LABELS[
                                                            interview
                                                                .type
                                                        ]
                                                    }
                                                    {interview.location && (
                                                        <div className="text-xs">
                                                            {
                                                                interview.location
                                                            }
                                                        </div>
                                                    )}
                                                    {interview.meetingLink && (
                                                        <div className="text-xs text-blue-600">
                                                            Link
                                                            meeting
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {interview.interviewerNames?.map(
                                                        (name, i) => (
                                                            <div
                                                                key={
                                                                    i
                                                                }
                                                                className="text-sm"
                                                            >
                                                                {name}
                                                            </div>
                                                        ),
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            STATUS_LABELS[
                                                                interview.status as InterviewStatus
                                                            ]?.color
                                                        }
                                                    >
                                                        {
                                                            STATUS_LABELS[
                                                                interview.status as InterviewStatus
                                                            ]?.label
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {interview.result && (
                                                        <Badge
                                                            className={
                                                                RESULT_LABELS[
                                                                    interview.result as InterviewResult
                                                                ]
                                                                    ?.color
                                                            }
                                                        >
                                                            {
                                                                RESULT_LABELS[
                                                                    interview.result as InterviewResult
                                                                ]
                                                                    ?.label
                                                            }
                                                        </Badge>
                                                    )}
                                                    {interview.score && (
                                                        <span className="ml-2 text-sm">
                                                            (
                                                            {
                                                                interview.score
                                                            }
                                                            /10)
                                                        </span>
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
                                                                    setEditingInterview(
                                                                        interview as InterviewBasic,
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setFeedbackInterview(
                                                                        interview as InterviewBasic,
                                                                    )
                                                                }
                                                            >
                                                                Feedback
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    updateMutation.mutate(
                                                                        {
                                                                            id: interview.id,
                                                                            data: {
                                                                                status: "COMPLETED" as const,
                                                                            },
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                Mark completed
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    updateMutation.mutate(
                                                                        {
                                                                            id: interview.id,
                                                                            data: {
                                                                                status: "NO_SHOW" as const,
                                                                            },
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                No show
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    updateMutation.mutate(
                                                                        {
                                                                            id: interview.id,
                                                                            data: {
                                                                                status: "CANCELLED" as const,
                                                                            },
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                Cancel
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    if (
                                                                        confirm(
                                                                            "Are you sure you want to delete this interview?",
                                                                        )
                                                                    ) {
                                                                        deleteMutation.mutate(
                                                                            interview.id,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Delete
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
                open={!!editingInterview}
                onOpenChange={(open) =>
                    !open && setEditingInterview(null)
                }
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Edit interview schedule
                        </DialogTitle>
                    </DialogHeader>
                    {editingInterview && (
                        <InterviewForm
                            candidates={candidates}
                            jobPostings={jobPostings}
                            interviewers={interviewers}
                            defaultValues={{
                                candidateId:
                                    editingInterview.candidateId,
                                jobPostingId:
                                    editingInterview.jobPostingId,
                                round: editingInterview.round,
                                type: editingInterview.type as
                                    | "ONSITE"
                                    | "ONLINE"
                                    | "PHONE",
                                method: editingInterview.method as
                                    | "INDIVIDUAL"
                                    | "GROUP"
                                    | "PANEL",
                                scheduledDate: new Date(
                                    editingInterview.scheduledDate,
                                ),
                                scheduledTime:
                                    editingInterview.scheduledTime,
                                duration: editingInterview.duration,
                                location:
                                    editingInterview.location ||
                                    undefined,
                                meetingLink:
                                    editingInterview.meetingLink ||
                                    undefined,
                                interviewerIds:
                                    editingInterview.interviewerIds ||
                                    [],
                                status:
                                    (editingInterview.status as
                                        | "SCHEDULED"
                                        | "IN_PROGRESS"
                                        | "COMPLETED"
                                        | "CANCELLED"
                                        | "NO_SHOW") || undefined,
                                result:
                                    (editingInterview.result as
                                        | "PASS"
                                        | "FAIL"
                                        | "PENDING") || undefined,
                            }}
                            onSubmit={(data) => {
                                updateMutation.mutate({
                                    id: editingInterview.id,
                                    data,
                                });
                            }}
                            onCancel={() => setEditingInterview(null)}
                            isLoading={updateMutation.isPending}
                            isEdit={true}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Feedback Dialog */}
            <Dialog
                open={!!feedbackInterview}
                onOpenChange={(open) =>
                    !open && setFeedbackInterview(null)
                }
            >
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Interview feedback</DialogTitle>
                        <DialogDescription>
                            {feedbackInterview?.candidateName} -{" "}
                            {feedbackInterview?.jobPostingTitle}
                        </DialogDescription>
                    </DialogHeader>
                    {feedbackInterview && (
                        <FeedbackForm
                            interview={feedbackInterview}
                            onSubmit={(data) => {
                                feedbackMutation.mutate({
                                    ...data,
                                    interviewId: feedbackInterview.id,
                                });
                            }}
                            onCancel={() =>
                                setFeedbackInterview(null)
                            }
                            isLoading={feedbackMutation.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface InterviewFormProps {
    candidates: Array<{
        id: string;
        name: string;
        jobPostingTitle: string;
    }>;
    jobPostings: Array<{ id: string; title: string }>;
    interviewers: Array<{ id: string; name: string }>;
    defaultValues?: Partial<InterviewFormValues>;
    interview?: InterviewBasic;
    onSubmit: (data: InterviewFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isEdit?: boolean;
}

function InterviewForm({
    candidates = [],
    jobPostings = [],
    interviewers = [],
    defaultValues,
    onSubmit,
    onCancel,
    isLoading = false,
    isEdit = false,
}: InterviewFormProps) {
    const form = useForm<InterviewFormValues>({
        resolver: zodResolver(interviewFormSchema),
        defaultValues:
            isEdit && defaultValues
                ? (defaultValues as InterviewFormValues)
                : {
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
                      ...defaultValues,
                  },
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
            >
                <FormField
                    control={form.control}
                    name="candidateId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Candidate *</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select candidate" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {candidates.map((c) => (
                                        <SelectItem
                                            key={c.id}
                                            value={c.id}
                                        >
                                            {c.name} -{" "}
                                            {c.jobPostingTitle}
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
                                <FormLabel>Position *</FormLabel>
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
                                        {jobPostings.map((jp) => (
                                            <SelectItem
                                                key={jp.id}
                                                value={jp.id}
                                            >
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
                                <FormLabel>Interview round</FormLabel>
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
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
                                        <SelectItem value="ONSITE">
                                            Onsite
                                        </SelectItem>
                                        <SelectItem value="ONLINE">
                                            Online
                                        </SelectItem>
                                        <SelectItem value="PHONE">
                                            Phone
                                        </SelectItem>
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
                                <FormLabel>Method</FormLabel>
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
                                        <SelectItem value="INDIVIDUAL">
                                            Individual
                                        </SelectItem>
                                        <SelectItem value="GROUP">
                                            Group
                                        </SelectItem>
                                        <SelectItem value="PANEL">
                                            Panel
                                        </SelectItem>
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
                            <FormLabel>Date *</FormLabel>
                            <FormControl>
                                <DatePicker
                                    date={field.value}
                                    setDate={field.onChange}
                                />
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
                                <FormLabel>Start time *</FormLabel>
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
                                <FormLabel>
                                    Duration (minutes)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={15}
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
                </div>
                <FormField
                    control={form.control}
                    name="interviewerIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Interviewers</FormLabel>
                            <FormControl>
                                <Combobox
                                    options={interviewers.map(
                                        (u) => ({
                                            value: u.id,
                                            label: u.name,
                                        }),
                                    )}
                                    value={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Select interviewers..."
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
                                <FormLabel>
                                    Location (ONSITE)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Meeting room 1"
                                        {...field}
                                    />
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
                                <FormLabel>
                                    Link meeting (ONLINE)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="https://meet.google.com/..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {isEdit && (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
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
                                            <SelectItem value="SCHEDULED">
                                                Scheduled
                                            </SelectItem>
                                            <SelectItem value="IN_PROGRESS">
                                                In progress
                                            </SelectItem>
                                            <SelectItem value="COMPLETED">
                                                Completed
                                            </SelectItem>
                                            <SelectItem value="CANCELLED">
                                                Cancelled
                                            </SelectItem>
                                            <SelectItem value="NO_SHOW">
                                                No show
                                            </SelectItem>
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
                                    <FormLabel>Result</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select result" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PASS">
                                                Pass
                                            </SelectItem>
                                            <SelectItem value="FAIL">
                                                Fail
                                            </SelectItem>
                                            <SelectItem value="PENDING">
                                                Pending
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? "Saving..."
                            : isEdit
                              ? "Save"
                              : "Schedule"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

const feedbackFormSchema = z.object({
    score: z.number().min(1).max(10).optional(),
    result: z.enum(["PASS", "FAIL", "PENDING"]).optional(),
    strengths: z.string().optional(),
    improvements: z.string().optional(),
    notes: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface FeedbackFormProps {
    interview: InterviewBasic;
    defaultValues?: Partial<FeedbackFormValues>;
    onSubmit: (data: FeedbackFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

function FeedbackForm({
    interview,
    defaultValues,
    onSubmit,
    onCancel,
    isLoading = false,
}: FeedbackFormProps) {
    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackFormSchema),
        defaultValues: {
            score: undefined,
            result: undefined,
            strengths: "",
            improvements: "",
            notes: "",
            ...defaultValues,
        },
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
            >
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="score"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Score (1-10)</FormLabel>
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
                                                e.target.value
                                                    ? Number(
                                                          e.target
                                                              .value,
                                                      )
                                                    : undefined,
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
                                <FormLabel>Result</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select result" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PASS">
                                            Pass
                                        </SelectItem>
                                        <SelectItem value="FAIL">
                                            Fail
                                        </SelectItem>
                                        <SelectItem value="PENDING">
                                            Pending
                                        </SelectItem>
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
                            <FormLabel>Strengths</FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={2}
                                    placeholder="Good skills, good communication..."
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
                            <FormLabel>Areas for improvement</FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={2}
                                    placeholder="Needs improvement..."
                                    {...field}
                                />
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
                            <FormLabel>Additional notes</FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={2}
                                    placeholder="Other notes..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Submitting..." : "Submit feedback"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

