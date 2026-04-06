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

const STAGE_LABELS: Record<CandidateStage, { label: string; color: string }> = {
    APPLIED: { label: "Ứng tuyển", color: "bg-gray-100 text-gray-700 border-gray-200" },
    SCREENING: { label: "Sàng lọc", color: "bg-blue-100 text-blue-700 border-blue-200" },
    INTERVIEW: { label: "Phỏng vấn", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    OFFER: { label: "Offer", color: "bg-purple-100 text-purple-700 border-purple-200" },
    HIRED: { label: "Đã tuyển", color: "bg-green-100 text-green-700 border-green-200" },
    REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-700 border-red-200" },
};

const STAGES: CandidateStage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

interface RecruitmentDetailClientProps {
    jobPostingId: string;
}

export function RecruitmentDetailClient({ jobPostingId }: RecruitmentDetailClientProps) {
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
                            {jobPosting?.status === "OPEN" ? "Đang tuyển" : jobPosting?.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {jobPosting?.departmentName || "Chưa phòng ban"}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                            {candidates.length} ứng viên
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                            {hiredCount} đã tuyển
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {jobPosting?.status === "OPEN" && (
                        <Button variant="outline" onClick={() => {
                            updateCandidateMutation.mutate({ id: jobPostingId, data: { status: "CLOSED" } as any });
                        }}>
                            Đóng tin
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Tổng ứng viên</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCandidates}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Đã phỏng vấn</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{interviews.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Đã tuyển</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hiredCount} / {jobPosting?.headcount || 1}</div>
                        <Progress value={(hiredCount / (jobPosting?.headcount || 1)) * 100} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Hạn tuyển</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {jobPosting?.deadline 
                                ? format(new Date(jobPosting.deadline), "dd/MM/yyyy", { locale: vi })
                                : "Không giới hạn"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Pipeline */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Pipeline ứng viên</h2>
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
                                                            Thao tác
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
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
                                                                }
                                                            }}
                                                        >
                                                            Xóa
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {candidatesByStage[stage].length === 0 && (
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
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Lịch phỏng vấn</h2>
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {interviews.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Chưa có lịch phỏng vấn nào
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
                                                    Vòng {interview.round} • {interview.scheduledTime} • {interview.type}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    PV: {interview.interviewerNames?.join(", ") || "Chưa phân công"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                interview.status === "COMPLETED" ? "default" :
                                                interview.status === "CANCELLED" ? "secondary" :
                                                "outline"
                                            }>
                                                {interview.status === "SCHEDULED" ? "Đã lên lịch" :
                                                 interview.status === "IN_PROGRESS" ? "Đang PV" :
                                                 interview.status === "COMPLETED" ? "Hoàn thành" :
                                                 interview.status === "CANCELLED" ? "Đã hủy" : "Không đến"}
                                            </Badge>
                                            {interview.result && (
                                                <Badge variant={interview.result === "PASS" ? "default" : "destructive"}>
                                                    {interview.result === "PASS" ? "Đạt" : "Không đạt"}
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
                        <DialogTitle>Chi tiết ứng viên</DialogTitle>
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

                            <div className="flex gap-2">
                                <Button onClick={() => handleScheduleInterview(selectedCandidate)}>
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
                                    <label className="text-sm font-medium">Vòng phỏng vấn</label>
                                    <input name="round" type="number" defaultValue={1} min={1} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Hình thức</label>
                                    <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="ONSITE">Trực tiếp</option>
                                        <option value="ONLINE">Online</option>
                                        <option value="PHONE">Điện thoại</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Ngày *</label>
                                    <input name="scheduledDate" type="date" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Giờ *</label>
                                    <input name="scheduledTime" type="time" required defaultValue="09:00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Thời lượng (phút)</label>
                                    <input name="duration" type="number" defaultValue={60} min={15} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Địa điểm / Link meeting</label>
                                <input name="location" placeholder="Phòng họp 1" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                <input name="meetingLink" placeholder="Link meeting (nếu online)" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Người phỏng vấn</label>
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
