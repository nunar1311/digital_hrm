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
import { updateInterview } from "@/app/[locale]/(protected)/recruitment/actions";
import {
  INTERVIEW_STATUS,
  INTERVIEW_RESULT,
  INTERVIEW_TYPE,
} from "@/app/[locale]/(protected)/recruitment/constants";
import type {
  InterviewResponse,
  InterviewStatus,
  InterviewType,
  UpdateInterviewForm,
} from "@/app/[locale]/(protected)/recruitment/types";
import { getInterviewTypeIcon } from "./calendar-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("ProtectedPages");

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<UpdateInterviewForm, "id">;
    }) => updateInterview(id, data),
    onSuccess: () => {
      toast.success(t("recruitmentInterviewUpdateSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "interviews"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("recruitmentInterviewUpdateError"));
    },
  });

  if (!interview) return null;

  return (
    <Dialog open={!!interview} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chi tiáº¿t phá»ng váº¥n
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
                á»¨ng viÃªn
              </label>
              <p className="font-semibold text-lg">{interview.candidateName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Vá»‹ trÃ­
              </label>
              <p className="font-medium">{interview.jobPostingTitle}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                NgÃ y giá»
              </label>
              <p className="font-medium">
                {formatDate(parseISO(interview.scheduledDate))} lÃºc{" "}
                {interview.scheduledTime}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Thá»i lÆ°á»£ng
              </label>
              <p className="font-medium">{interview.duration} phÃºt</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                HÃ¬nh thá»©c
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
                VÃ²ng
              </label>
              <p className="font-medium">VÃ²ng {interview.round}</p>
            </div>
          </div>
          {interview.location && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Äá»‹a Ä‘iá»ƒm
              </label>
              <p className="font-medium">{interview.location}</p>
            </div>
          )}
          {interview.meetingLink && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Video className="h-3 w-3" />
                Link há»p
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
                  NgÆ°á»i phá»ng váº¥n
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
              Cáº­p nháº­t tráº¡ng thÃ¡i
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
                  <SelectItem value="SCHEDULED">ÄÃ£ lÃªn lá»‹ch</SelectItem>
                  <SelectItem value="IN_PROGRESS">Äang diá»…n ra</SelectItem>
                  <SelectItem value="COMPLETED">HoÃ n thÃ nh</SelectItem>
                  <SelectItem value="CANCELLED">ÄÃ£ há»§y</SelectItem>
                  <SelectItem value="NO_SHOW">KhÃ´ng Ä‘áº¿n</SelectItem>
                </SelectContent>
              </Select> */}
            </div>
          </div>
          {interview.result && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Káº¿t quáº£
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
              ÄÃ³ng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

