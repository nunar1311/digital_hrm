"use client";

import { format } from "date-fns";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { getJobPostings } from "@/app/(protected)/recruitment/actions";
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

  const createMutation = useMutation({
    mutationFn: async (data: InterviewFormData) => {
      const { createInterview } =
        await import("@/app/(protected)/recruitment/actions");
      return createInterview(data as unknown as Parameters<typeof createInterview>[0]);
    },
    onSuccess: () => {
      toast.success("Đã lên lịch phỏng vấn thành công");
      queryClient.invalidateQueries({
        queryKey: ["recruitment", "interviews"],
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Có lỗi xảy ra");
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
      return `Tuần ${format(weekDays[0], "d")} - ${format(weekDays[6], "d MMM", { locale: vi })}`;
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
          Hôm nay
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
            placeholder="Tìm ứng viên..."
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
              label: "Tháng",
            },
            { value: "week", icon: List, label: "Tuần" },
            {
              value: "day",
              icon: CalendarDays,
              label: "Ngày",
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
              Lên lịch PV
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lên lịch phỏng vấn</DialogTitle>
              <DialogDescription>
                Tạo lịch phỏng vấn mới cho ứng viên
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ứng viên</Label>
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
                                        <SelectValue placeholder="Chọn ứng viên" />
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
                <Label>Vị trí</Label>
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
                    <SelectValue placeholder="Chọn vị trí" />
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
                  <Label>Vòng</Label>
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
                  <Label>Hình thức</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as "ONSITE" | "ONLINE" | "PHONE",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONSITE">Trực tiếp</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="PHONE">Điện thoại</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày</Label>
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
                  <Label>Giờ</Label>
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
                  <Label>Thời lượng (phút)</Label>
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
                  <Label>Phương pháp</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        method: value as "INDIVIDUAL" | "GROUP" | "PANEL",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Cá nhân</SelectItem>
                      <SelectItem value="GROUP">Nhóm</SelectItem>
                      <SelectItem value="PANEL">Hội đồng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Địa điểm</Label>
                <Input
                  placeholder="Phòng họp 1, Tầng 3..."
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
                <Label>Link họp online</Label>
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
                <Label>Ghi chú</Label>
                <Textarea
                  placeholder="Ghi chú thêm..."
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
                  Hủy
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
                  {createMutation.isPending ? "Đang lưu..." : "Lên lịch"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
