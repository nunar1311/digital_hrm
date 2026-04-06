"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  MoreHorizontal,
  Plus,
  User,
  Mail,
  Phone,
  FileText,
  Star,
  ChevronRight,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  CreateCandidateForm,
} from "@/app/(protected)/recruitment/types";
import {
  CANDIDATE_STAGE,
  CANDIDATE_SOURCE,
  INTERVIEW_TYPE,
} from "@/app/(protected)/recruitment/constants";
import { useTimezone } from "@/hooks/use-timezone";

const STAGES: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

const STAGE_COLORS: Record<CandidateStage, string> = {
  APPLIED:
    "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  SCREENING:
    "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
  INTERVIEW:
    "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  OFFER:
    "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
  HIRED:
    "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
  REJECTED: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
};

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

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface PipelineClientProps {
  initialCandidates: CandidateBasic[];
  initialJobPostings: JobPostingBasic[];
}

export function RecruitmentPipelineClient({
  initialCandidates,
  initialJobPostings,
}: PipelineClientProps) {
  const queryClient = useQueryClient();
  const { formatDate } = useTimezone();
  const [filters, setFilters] = useState<CandidateFilters>({});
  const [selectedJobPosting, setSelectedJobPosting] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateBasic | null>(null);

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ["recruitment", "candidates", filters],
    queryFn: () => getCandidates(filters),
  });

  const { data: jobPostingsData } = useQuery({
    queryKey: ["recruitment", "job-postings"],
    queryFn: () => getJobPostings({}, { limit: 100 }),
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
    mutationFn: (data: z.infer<typeof candidateSchema>) =>
      createCandidate(data as any),
    onSuccess: () => {
      toast.success("Thêm ứng viên thành công");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "candidates"],
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Có lỗi xảy ra");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CandidateBasic> }) =>
      updateCandidate(id, data as any),
    onSuccess: () => {
      toast.success("Cập nhật ứng viên thành công");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "candidates"],
      });
      setSelectedCandidate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Có lỗi xảy ra");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: () => {
      toast.success("Xóa ứng viên thành công");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "candidates"],
      });
      setSelectedCandidate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Có lỗi xảy ra");
    },
  });

  if (!candidatesData || !jobPostingsData) {
    return <div>Loading...</div>;
  }

  const filteredCandidates = useMemo(() => {
    let result = candidatesData.items;
    if (selectedJobPosting && selectedJobPosting !== "all") {
      result = result.filter((c) => c.jobPostingId === selectedJobPosting);
    }
    return result;
  }, [candidatesData.items, selectedJobPosting]);

  const candidatesByStage = useMemo(() => {
    const grouped: Record<CandidateStage, CandidateBasic[]> = {
      APPLIED: [],
      SCREENING: [],
      INTERVIEW: [],
      OFFER: [],
      HIRED: [],
      REJECTED: [],
    };

    return grouped;
  }, [filteredCandidates]);

  const handleMoveToStage = (candidateId: string, newStage: CandidateStage) => {
    updateMutation.mutate({
      id: candidateId,
      data: { stage: newStage },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderCandidateCard = (candidate: CandidateBasic) => (
    <div
      key={candidate.id}
      className={`
                p-3 rounded-lg border bg-card hover:shadow-md cursor-pointer transition-all
                ${STAGE_COLORS[candidate.stage]}
            `}
      onClick={() => setSelectedCandidate(candidate)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm line-clamp-1">{candidate.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {candidate.jobPostingTitle}
            </p>
          </div>
        </div>
        {candidate.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{candidate.rating}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Mail className="h-3 w-3" />
        <span className="truncate">{candidate.email}</span>
      </div>

      {candidate.phone && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Phone className="h-3 w-3" />
          <span>{candidate.phone}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">
          {CANDIDATE_SOURCE[candidate.source as keyof typeof CANDIDATE_SOURCE]
            ?.label || candidate.source}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {formatDate(new Date(candidate.createdAt))}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Pipeline ứng viên</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={selectedJobPosting}
            onValueChange={setSelectedJobPosting}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tất cả vị trí" />
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

          <Input
            placeholder="Tìm ứng viên..."
            className="w-[200px]"
            value={filters.search || ""}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value || undefined })
            }
          />

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm ứng viên
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm ứng viên mới</DialogTitle>
                <DialogDescription>Nhập thông tin ứng viên</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    createMutation.mutate(data as any),
                  )}
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
                            <Input
                              placeholder="email@example.com"
                              type="email"
                              {...field}
                            />
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
                              <SelectItem value="REFERRAL">
                                Giới thiệu
                              </SelectItem>
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
                            <Input
                              placeholder="https://linkedin.com/in/..."
                              {...field}
                            />
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
                      {createMutation.isPending
                        ? "Đang lưu..."
                        : "Thêm ứng viên"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage} className="shrink-0 w-[280px]">
            <div
              className={`
                            p-3 rounded-t-lg border border-b-0
                            ${STAGE_COLORS[stage].replace("bg-", "bg-").replace("-100 ", "-200 ")}
                        `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {CANDIDATE_STAGE[stage]?.label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {candidatesByStage[stage].length}
                  </Badge>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="p-2 border rounded-b-lg space-y-2 bg-muted/20 min-h-[200px]">
                {candidatesByStage[stage].map((candidate) => (
                  <div key={candidate.id} className="relative group">
                    {renderCandidateCard(candidate)}

                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {stage !== "HIRED" && stage !== "REJECTED" && (
                            <>
                              {stage === "APPLIED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMoveToStage(candidate.id, "SCREENING")
                                  }
                                >
                                  Chuyển sang Sàng lọc
                                </DropdownMenuItem>
                              )}
                              {stage === "SCREENING" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMoveToStage(
                                        candidate.id,
                                        "INTERVIEW",
                                      )
                                    }
                                  >
                                    Chuyển sang Phỏng vấn
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMoveToStage(
                                        candidate.id,
                                        "REJECTED",
                                      )
                                    }
                                  >
                                    Từ chối
                                  </DropdownMenuItem>
                                </>
                              )}
                              {stage === "INTERVIEW" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMoveToStage(candidate.id, "OFFER")
                                    }
                                  >
                                    Chuyển sang Đề xuất
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMoveToStage(
                                        candidate.id,
                                        "REJECTED",
                                      )
                                    }
                                  >
                                    Từ chối
                                  </DropdownMenuItem>
                                </>
                              )}
                              {stage === "OFFER" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMoveToStage(candidate.id, "HIRED")
                                    }
                                  >
                                    Tuyển dụng
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMoveToStage(
                                        candidate.id,
                                        "REJECTED",
                                      )
                                    }
                                  >
                                    Từ chối
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(candidate.id)}
                          >
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
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

      {/* Candidate Detail Dialog */}
      <Dialog
        open={!!selectedCandidate}
        onOpenChange={() => setSelectedCandidate(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết ứng viên</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {getInitials(selectedCandidate.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedCandidate.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedCandidate.jobPostingTitle}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedCandidate.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Điện thoại
                  </label>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedCandidate.phone || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nguồn
                  </label>
                  <p>
                    {
                      CANDIDATE_SOURCE[
                        selectedCandidate.source as keyof typeof CANDIDATE_SOURCE
                      ]?.label
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ngày ứng tuyển
                  </label>
                  <p>{formatDate(new Date(selectedCandidate.createdAt))}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Trạng thái
                </label>
                <div className="mt-1">
                  <Select
                    value={selectedCandidate.stage}
                    onValueChange={(value) =>
                      updateMutation.mutate({
                        id: selectedCandidate.id,
                        data: { stage: value as CandidateStage },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {CANDIDATE_STAGE[stage]?.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCandidate.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ghi chú
                  </label>
                  <p className="text-sm">{selectedCandidate.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCandidate(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
