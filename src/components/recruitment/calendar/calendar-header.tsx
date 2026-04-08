"use client";

import { format, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Grid3X3,
  List,
  CalendarDays,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { getJobPostings } from "@/app/[locale]/(protected)/recruitment/actions";
import type {
  JobPostingBasic,
  CandidateBasic,
} from "@/app/[locale]/(protected)/recruitment/types";
import { initialFormData, type InterviewFormData } from "./calendar-utils";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  searchQuery: string;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (query: string) => void;
  weekDays: Date[];
}

export function CalendarHeader({
  currentDate,
  viewMode,
  searchQuery,
  onDateChange,
  onViewModeChange,
  onSearchChange,
  weekDays,
}: CalendarHeaderProps) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<InterviewFormData>(initialFormData);

  const { data: jobPostingsData } = useQuery({
    queryKey: ["recruitment", "job-postings"],
    queryFn: () => getJobPostings({}, { limit: 100 }),
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["recruitment", "candidates"],
    queryFn: async () => {
      const { getCandidates } =
        await import("@/app/[locale]/(protected)/recruitment/actions");
      return getCandidates({}, { limit: 200 });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InterviewFormData) => {
      const { createInterview } =
        await import("@/app/[locale]/(protected)/recruitment/actions");
      return createInterview({
        candidateId: data.candidateId,
        jobPostingId: data.jobPostingId,
        round: data.round,
        type: data.type as "ONSITE" | "ONLINE" | "PHONE",
        method: data.method as "INDIVIDUAL" | "GROUP" | "PANEL",
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        duration: data.duration,
        interviewerIds: [],
        location: data.location,
        meetingLink: data.meetingLink,
      });
    },
    onSuccess: () => {
      toast.success("Interview scheduled successfully");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "interviews"],
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred");
    },
  });

  const handlePrev = () => {
    if (viewMode === "month") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      onDateChange(newDate);
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      onDateChange(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      onDateChange(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      onDateChange(newDate);
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      onDateChange(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      onDateChange(newDate);
    }
  };

  const formatDateHeader = () => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: vi });
    }
    if (viewMode === "week") {
      return `Week ${format(weekDays[0], "d")} - ${format(weekDays[6], "d MMM", { locale: vi })}`;
    }
    return format(currentDate, "d MMMM yyyy", { locale: vi });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(new Date())}
        >
          Today
        </Button>
        <Button variant="outline" size="icon-sm" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold ml-2">{formatDateHeader()}</h2>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-[200px] h-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-2"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex bg-muted rounded-lg p-0.5">
          {[
            {
              value: "month",
              icon: Grid3X3,
              label: "Month",
            },
            { value: "week", icon: List, label: "Week" },
            {
              value: "day",
              icon: CalendarDays,
              label: "Day",
            },
          ].map((item) => (
            <Button
              key={item.value}
              variant={viewMode === item.value ? "default" : "ghost"}
              size="sm"
              className={cn(
                "px-3 h-8",
                viewMode !== item.value && "text-muted-foreground",
              )}
              onClick={() => onViewModeChange(item.value as ViewMode)}
            >
              <item.icon className="h-4 w-4 mr-1" />
              {item.label}
            </Button>
          ))}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Schedule interview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule interview</DialogTitle>
              <DialogDescription>
                Create a new interview schedule for a candidate
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Candidate</Label>
                {/* <Select
                                    value={formData.candidateId}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            candidateId: value,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select candidate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {candidatesData?.items.map(
                                            (
                                                candidate: CandidateBasic,
                                            ) => (
                                                <SelectItem
                                                    key={candidate.id}
                                                    value={
                                                        candidate.id
                                                    }
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>
                                                            {
                                                                candidate.name
                                                            }
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {
                                                                candidate.jobPostingTitle
                                                            }
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select> */}
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={formData.jobPostingId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      jobPostingId: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPostingsData?.items.map((posting) => (
                      <SelectItem key={posting.id} value={posting.id}>
                        {posting.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Round</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.round}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        round: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONSITE">Onsite</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        method: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="GROUP">Group</SelectItem>
                      <SelectItem value="PANEL">Panel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Meeting room 1, Floor 3..."
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Online meeting link</Label>
                <Input
                  placeholder="https://..."
                  value={formData.meetingLink}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meetingLink: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    !formData.candidateId ||
                    !formData.jobPostingId ||
                    !formData.scheduledDate ||
                    !formData.scheduledTime
                  }
                  onClick={() => createMutation.mutate(formData)}
                >
                  {createMutation.isPending ? "Saving..." : "Schedule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

