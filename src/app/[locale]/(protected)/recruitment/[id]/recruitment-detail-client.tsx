"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import {
    getJobPostingById,
    getCandidatesByJobPosting,
    getInterviewsByJobPosting,
    updateCandidate,
    deleteCandidate,
    createInterview,
    updateInterview,
    deleteInterview,
    getUsersForInterviewer,
    submitFeedback,
} from "../actions";
import type {
    JobPostingWithStats,
    CandidateBasic,
    InterviewBasic,
    CreateInterviewForm,
    CandidateStage,
} from "../types";

const STAGE_COLORS: Record<CandidateStage, string> = {
    APPLIED: "bg-gray-100 text-gray-700 border-gray-200",
    SCREENING: "bg-blue-100 text-blue-700 border-blue-200",
    INTERVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
    OFFER: "bg-purple-100 text-purple-700 border-purple-200",
    HIRED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const STAGES: CandidateStage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

interface RecruitmentDetailClientProps {
    jobPostingId: string;
}

export function RecruitmentDetailClient({ jobPostingId }: RecruitmentDetailClientProps) {
    const t = useTranslations("ProtectedPages");
    const queryClient = useQueryClient();
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateBasic | null>(null);
    const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
    const [selectedCandidateForInterview, setSelectedCandidateForInterview] = useState<CandidateBasic | null>(null);

    const { data: jobPosting } = useQuery<JobPostingWithStats>({
        queryKey: ["recruitment", "job-posting", jobPostingId],
        queryFn: async () => {
            const res = await getJobPostingById(jobPostingId);
            return res as JobPostingWithStats;
        },
    });

    const { data: candidates = [] } = useQuery({
        queryKey: ["recruitment", "candidates", "by-job", jobPostingId],
        queryFn: async () => {
            const res = await getCandidatesByJobPosting(jobPostingId);
            return res as CandidateBasic[];
        },
    });

    const { data: interviews = [] } = useQuery({
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
        mutationFn: ({ id, data }: { id: string; data: { stage?: string; status?: string } }) => updateCandidate(id, data),
        onSuccess: () => {
            toast.success(t("recruitmentDetailToastUpdateCandidateSuccess"));
            queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || t("recruitmentDetailToastUpdateCandidateError"));
        },
    });

    const createInterviewMutation = useMutation({
        mutationFn: (data: CreateInterviewForm) => createInterview(data),
        onSuccess: () => {
            toast.success(t("recruitmentDetailToastCreateInterviewSuccess"));
            setIsInterviewDialogOpen(false);
            setSelectedCandidateForInterview(null);
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || t("recruitmentDetailToastCreateInterviewError"));
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

    const candidatesByStage = STAGES.reduce((acc, stage) => {
        acc[stage] = candidates.filter(c => c.stage === stage);
        return acc;
    }, {} as Record<CandidateStage, CandidateBasic[]>);

    const getStageProgress = (stage: CandidateStage) => {
        return candidatesByStage[stage].length;
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

    const getInterviewStatusLabel = (status: InterviewBasic["status"]) => {
        switch (status) {
            case "SCHEDULED":
                return t("recruitmentDetailInterviewStatusScheduled");
            case "IN_PROGRESS":
                return t("recruitmentDetailInterviewStatusInProgress");
            case "COMPLETED":
                return t("recruitmentDetailInterviewStatusCompleted");
            case "CANCELLED":
                return t("recruitmentDetailInterviewStatusCancelled");
            default:
                return t("recruitmentDetailInterviewStatusNoShow");
        }
    };

    const getInterviewResultLabel = (result: InterviewBasic["result"]) => {
        return result === "PASS"
            ? t("recruitmentDetailInterviewResultPass")
            : t("recruitmentDetailInterviewResultFail");
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

    const totalCandidates = candidates.length;
    const hiredCount = candidatesByStage.HIRED.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{jobPosting?.title}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={jobPosting?.status === "OPEN" ? "default" : "secondary"}>
                            {jobPosting?.status === "OPEN" ? t("recruitmentDetailJobStatusOpen") : jobPosting?.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {jobPosting?.departmentName || t("recruitmentDetailNoDepartment")}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                            {t("recruitmentDetailHeaderCandidates", { count: candidates.length })}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                            {t("recruitmentDetailHeaderHired", { count: hiredCount })}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {jobPosting?.status === "OPEN" && (
                        <Button variant="outline" onClick={() => {
                            updateCandidateMutation.mutate({ id: jobPostingId, data: { status: "CLOSED" } });
                        }}>
                            {t("recruitmentDetailClosePosting")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t("recruitmentDetailStatTotalCandidates")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCandidates}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t("recruitmentDetailStatInterviewed")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{interviews.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t("recruitmentDetailStatHired")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hiredCount} / {jobPosting?.headcount || 1}</div>
                        <Progress value={(hiredCount / (jobPosting?.headcount || 1)) * 100} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t("recruitmentDetailStatDeadline")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {jobPosting?.deadline 
                                ? format(new Date(jobPosting.deadline), "dd/MM/yyyy", { locale: vi })
                                : t("recruitmentDetailNoDeadline")}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Pipeline */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">{t("recruitmentDetailPipelineTitle")}</h2>
                <div className="grid gap-4 md:grid-cols-6">
                    {STAGES.map((stage) => (
                        <div key={stage} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm">
                                    {getStageLabel(stage)}
                                </h3>
                                <Badge variant="outline" className={STAGE_COLORS[stage]}>
                                    {candidatesByStage[stage].length}
                                </Badge>
                            </div>
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-2">
                                    {candidatesByStage[stage].map((candidate) => (
                                        <Card key={candidate.id} className="cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => setSelectedCandidate(candidate)}
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex items-start gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>
                                                            {candidate.name.split(" ").pop()?.charAt(0) || "?"}
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
                                                        {format(new Date(candidate.createdAt), "dd/MM/yyyy", { locale: vi })}
                                                    </span>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="sm" className="h-6 w-full mt-2">
                                                            {t("recruitmentDetailActions")}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {stage === "APPLIED" && (
                                                            <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "SCREENING")}>
                                                                {t("recruitmentActionMoveToScreening")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {stage === "SCREENING" && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "INTERVIEW")}>
                                                                    {t("recruitmentActionMoveToInterview")}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "REJECTED")}>
                                                                    {t("recruitmentActionReject")}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {stage === "INTERVIEW" && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleScheduleInterview(candidate)}>
                                                                    {t("recruitmentDetailScheduleInterview")}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "OFFER")}>
                                                                    {t("recruitmentActionMoveToOffer")}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "REJECTED")}>
                                                                    {t("recruitmentActionReject")}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {stage === "OFFER" && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "HIRED")}>
                                                                    {t("recruitmentActionMarkHired")}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleMoveStage(candidate.id, "REJECTED")}>
                                                                    {t("recruitmentActionReject")}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-red-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm(t("recruitmentDeleteConfirm"))) {
                                                                    deleteCandidate(candidate.id);
                                                                }
                                                            }}
                                                        >
                                                            {t("recruitmentActionDelete")}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {candidatesByStage[stage].length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            {t("recruitmentCandidateEmpty")}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lịch phỏng vấn */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">{t("recruitmentTabInterviews")}</h2>
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {interviews.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t("recruitmentDetailInterviewEmpty")}
                                </div>
                            ) : (
                                interviews.map((interview) => (
                                    <div key={interview.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <div className="text-lg font-bold">
                                                    {format(new Date(interview.scheduledDate), "dd")}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(new Date(interview.scheduledDate), "MMM", { locale: vi })}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-medium">{interview.candidateName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {t("recruitmentDetailInterviewRound", {
                                                        round: interview.round,
                                                        time: interview.scheduledTime,
                                                        type: interview.type,
                                                    })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t("recruitmentDetailInterviewers")}: {interview.interviewerNames?.join(", ") || t("recruitmentDetailUnassigned")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                interview.status === "COMPLETED" ? "default" :
                                                interview.status === "CANCELLED" ? "secondary" :
                                                "outline"
                                            }>
                                                {getInterviewStatusLabel(interview.status)}
                                            </Badge>
                                            {interview.result && (
                                                <Badge variant={interview.result === "PASS" ? "default" : "destructive"}>
                                                    {getInterviewResultLabel(interview.result)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Candidate Detail Dialog */}
            <Dialog open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t("recruitmentDetailCandidateDetailTitle")}</DialogTitle>
                    </DialogHeader>
                    {selectedCandidate && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="text-lg">
                                        {selectedCandidate.name.split(" ").pop()?.charAt(0) || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedCandidate.name}</h3>
                                    <p className="text-muted-foreground">{selectedCandidate.email}</p>
                                    {selectedCandidate.phone && (
                                        <p className="text-sm">{selectedCandidate.phone}</p>
                                    )}
                                </div>
                                <Badge className={STAGE_COLORS[selectedCandidate.stage]}>
                                    {getStageLabel(selectedCandidate.stage)}
                                </Badge>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t("recruitmentCandidateHeadSource")}</label>
                                    <p className="text-sm text-muted-foreground">{getSourceLabel(selectedCandidate.source)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t("recruitmentCandidateHeadAppliedDate")}</label>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(selectedCandidate.createdAt), "dd/MM/yyyy", { locale: vi })}
                                    </p>
                                </div>
                                {selectedCandidate.cvUrl && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium">{t("recruitmentDetailCv")}</label>
                                        <p className="text-sm">
                                            <a href={selectedCandidate.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {t("recruitmentDetailViewCv")}
                                            </a>
                                        </p>
                                    </div>
                                )}
                                {selectedCandidate.linkedinUrl && (
                                    <div>
                                        <label className="text-sm font-medium">{t("recruitmentSourceLinkedin")}</label>
                                        <p className="text-sm">
                                            <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {t("recruitmentDetailViewProfile")}
                                            </a>
                                        </p>
                                    </div>
                                )}
                                {selectedCandidate.notes && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium">{t("recruitmentDetailNotes")}</label>
                                        <p className="text-sm text-muted-foreground">{selectedCandidate.notes}</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="flex gap-2">
                                <Button onClick={() => handleScheduleInterview(selectedCandidate)}>
                                    {t("recruitmentDetailScheduleInterview")}
                                </Button>
                                {selectedCandidate.stage !== "REJECTED" && selectedCandidate.stage !== "HIRED" && (
                                    <Button variant="destructive" onClick={() => {
                                        handleMoveStage(selectedCandidate.id, "REJECTED");
                                        setSelectedCandidate(null);
                                    }}>
                                        {t("recruitmentActionReject")}
                                    </Button>
                                )}
                                {selectedCandidate.stage === "INTERVIEW" && (
                                    <Button variant="default" onClick={() => {
                                        handleMoveStage(selectedCandidate.id, "OFFER");
                                        setSelectedCandidate(null);
                                    }}>
                                        {t("recruitmentActionMoveToOffer")}
                                    </Button>
                                )}
                                {selectedCandidate.stage === "OFFER" && (
                                    <Button variant="default" onClick={() => {
                                        handleMoveStage(selectedCandidate.id, "HIRED");
                                        setSelectedCandidate(null);
                                    }}>
                                        {t("recruitmentActionMarkHired")}
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
                        <DialogTitle>{t("recruitmentDetailScheduleInterview")}</DialogTitle>
                        <DialogDescription>
                            {selectedCandidateForInterview?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInterviewSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("recruitmentDetailInterviewRoundLabel")}</label>
                                    <input name="round" type="number" defaultValue={1} min={1} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("recruitmentDetailInterviewType")}</label>
                                    <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="ONSITE">{t("recruitmentDetailInterviewTypeOnsite")}</option>
                                        <option value="ONLINE">{t("recruitmentDetailInterviewTypeOnline")}</option>
                                        <option value="PHONE">{t("recruitmentDetailInterviewTypePhone")}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("recruitmentDetailDateRequired")}</label>
                                    <input name="scheduledDate" type="date" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("recruitmentDetailTimeRequired")}</label>
                                    <input name="scheduledTime" type="time" required defaultValue="09:00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("recruitmentDetailDurationMinutes")}</label>
                                    <input name="duration" type="number" defaultValue={60} min={15} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t("recruitmentDetailLocationOrMeetingLink")}</label>
                                <input name="location" placeholder={t("recruitmentDetailLocationPlaceholder")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                <input name="meetingLink" placeholder={t("recruitmentDetailMeetingLinkPlaceholder")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t("recruitmentDetailInterviewers")}</label>
                                <div className="flex flex-wrap gap-2">
                                    {interviewers?.map((user: { id: string; name: string; email: string }) => (
                                        <label key={user.id} className="flex items-center gap-2 border rounded px-2 py-1">
                                            <input type="checkbox" name="interviewerIds" value={user.id} />
                                            <span className="text-sm">{user.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsInterviewDialogOpen(false)}>
                                {t("recruitmentCancel")}
                            </Button>
                            <Button type="submit" disabled={createInterviewMutation.isPending}>
                                {createInterviewMutation.isPending ? t("recruitmentDetailScheduling") : t("recruitmentDetailSchedule")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
