"use client";

import { parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Users,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateInterview } from "@/app/(protected)/recruitment/actions";
import {
  INTERVIEW_STATUS,
  INTERVIEW_RESULT,
  INTERVIEW_TYPE,
} from "@/app/(protected)/recruitment/constants";
import type {
  InterviewResponse,
  InterviewStatus,
  InterviewType,
  UpdateInterviewForm,
} from "@/app/(protected)/recruitment/types";
import { getInterviewTypeIcon } from "./calendar-utils";
import { useTimezone } from "@/hooks/use-timezone";

interface InterviewDetailDialogProps {
  interview: InterviewResponse;
  onClose: () => void;
}

export function InterviewDetailDialog({
  interview,
  onClose,
}: InterviewDetailDialogProps) {
  const queryClient = useQueryClient();
  const { formatDate } = useTimezone();

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<UpdateInterviewForm, "id">;
    }) => updateInterview(id, data),
    onSuccess: () => {
      toast.success("Cập nhật phỏng vấn thành công");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "interviews"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Có lỗi xảy ra");
    },
  });

  if (!interview) return null;

  return (
    <Dialog open={!!interview} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chi tiết phỏng vấn
            <Badge
              variant={
                interview.status === "SCHEDULED"
                  ? "default"
                  : interview.status === "COMPLETED"
                    ? "secondary"
                    : "destructive"
              }
            >
              {INTERVIEW_STATUS[interview.status as InterviewStatus]?.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Ứng viên
              </label>
              <p className="font-semibold text-lg">{interview.candidateName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Vị trí
              </label>
              <p className="font-medium">{interview.jobPostingTitle}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Ngày giờ
              </label>
              <p className="font-medium">
                {formatDate(parseISO(interview.scheduledDate))} lúc{" "}
                {interview.scheduledTime}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Thời lượng
              </label>
              <p className="font-medium">{interview.duration} phút</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Hình thức
              </label>
              <div className="flex items-center gap-2 mt-1">
                {getInterviewTypeIcon(interview.type)}
                <span>
                  {INTERVIEW_TYPE[interview.type as InterviewType]?.label}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Vòng
              </label>
              <p className="font-medium">Vòng {interview.round}</p>
            </div>
          </div>
          {interview.location && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Địa điểm
              </label>
              <p className="font-medium">{interview.location}</p>
            </div>
          )}
          {interview.meetingLink && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Video className="h-3 w-3" />
                Link họp
              </label>
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center gap-1"
              >
                {interview.meetingLink}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {interview.interviewerNames &&
            interview.interviewerNames.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Người phỏng vấn
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {interview.interviewerNames.map((name, idx) => (
                    <Badge key={idx} variant="outline">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          <Separator />
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Cập nhật trạng thái
            </label>
            <div className="mt-2">
              {/* <Select
                value={interview.status as string}
                onValueChange={(value) =>
                  updateMutation.mutate({
                    id: interview.id,
                    data: { status: value as InterviewStatus },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang diễn ra</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  <SelectItem value="NO_SHOW">Không đến</SelectItem>
                </SelectContent>
              </Select> */}
            </div>
          </div>
          {interview.result && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Kết quả
              </label>
              <div className="mt-1">
                <Badge
                  variant={
                    interview.result === "PASS" ? "default" : "destructive"
                  }
                >
                  {
                    INTERVIEW_RESULT[
                      interview.result as keyof typeof INTERVIEW_RESULT
                    ]?.label
                  }
                </Badge>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
