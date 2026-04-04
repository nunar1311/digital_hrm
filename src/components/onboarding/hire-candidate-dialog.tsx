"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, Mail, CheckSquare, Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  hireCandidate,
  getCandidatesForHire,
} from "@/app/(protected)/onboarding/actions";
import { getDepartments } from "@/app/(protected)/departments/actions";
import { getPositions } from "@/app/(protected)/positions/actions";
import { DatePicker } from "../ui/date-picker";

const hireSchema = z.object({
  candidateId: z.string().min(1, "Vui lòng chọn ứng viên"),
  departmentId: z.string().min(1, "Vui lòng chọn phòng ban"),
  positionId: z.string().min(1, "Vui lòng chọn chức vụ"),
  hireDate: z.date({ message: "Vui lòng chọn ngày vào làm" }),
  employmentType: z.string(),
  probationEndDate: z.date().optional(),
  salary: z.number().optional(),
  sendWelcomeEmail: z.boolean(),
  startOnboarding: z.boolean(),
});

type HireForm = z.infer<typeof hireSchema>;

export interface HireCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ─── Candidate Combobox (Command + Popover) ───────────────────────────────────

interface CandidateComboboxProps {
  candidates: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    jobPosting?: {
      title?: string | null;
      department?: { name?: string | null } | null;
    } | null;
  }[];
  value: string;
  onChange: (value: string) => void;
}

export function CandidateCombobox({
  candidates,
  value,
  onChange,
}: CandidateComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = candidates.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selected ? selected.name : "Tìm và chọn ứng viên..."}
          </span>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm theo tên, email, vị trí..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy ứng viên.</CommandEmpty>
            <CommandGroup>
              {candidates.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.email}
                      {c.jobPosting?.title ? ` · ${c.jobPosting.title}` : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────

export function HireCandidateDialog({
  open,
  onOpenChange,
  onSuccess,
}: HireCandidateDialogProps) {
  const form = useForm<HireForm>({
    resolver: zodResolver(hireSchema),
    defaultValues: {
      candidateId: "",
      departmentId: "",
      positionId: "",
      employmentType: "FULL_TIME",
      sendWelcomeEmail: true,
      startOnboarding: true,
    },
  });

  // Fetch candidates ready to hire
  const { data: candidates = [] } = useQuery({
    queryKey: ["candidates-for-hire"],
    queryFn: getCandidatesForHire,
    enabled: open,
  });

  // Fetch departments
  const { data: deptResult } = useQuery({
    queryKey: ["departments-for-hire"],
    queryFn: () => getDepartments({ page: 1, pageSize: 100, status: "ACTIVE" }),
    enabled: open,
  });
  const departments = deptResult?.departments ?? [];

  // Fetch positions
  const { data: posResult } = useQuery({
    queryKey: ["positions-for-hire"],
    queryFn: () => getPositions({}),
    enabled: open,
  });
  const positions = posResult?.positions ?? [];

  // Hire mutation
  const mutation = useMutation({
    mutationFn: hireCandidate,
    onSuccess: (result) => {
      toast.success(
        <div className="space-y-1">
          <p className="font-medium">Tuyển dụng thành công!</p>
          <p className="text-xs opacity-80">
            Mã nhân viên: {result.employeeCode}
          </p>
        </div>,
      );
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Tuyển dụng thất bại");
    },
  });

  const onSubmit = (values: HireForm) => {
    mutation.mutate({
      candidateId: values.candidateId,
      departmentId: values.departmentId,
      positionId: values.positionId,
      hireDate: values.hireDate,
      employmentType: values.employmentType,
      probationEndDate: values.probationEndDate,
      salary: values.salary,
      sendWelcomeEmail: values.sendWelcomeEmail,
      startOnboarding: values.startOnboarding,
    });
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const selectedCandidateId = form.watch("candidateId");
  const selectedCandidate = candidates.find(
    (c) => c.id === selectedCandidateId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Tuyển ứng viên
          </DialogTitle>
          <DialogDescription>
            Chuyển ứng viên thành nhân viên chính thức và bắt đầu quy trình tiếp
            nhận
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Candidate Selection */}
            <FormField
              control={form.control}
              name="candidateId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ứng viên</FormLabel>
                  <FormControl>
                    <CandidateCombobox
                      candidates={candidates}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Candidate Info */}
            {selectedCandidate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 font-medium text-green-800">
                  <UserPlus className="h-4 w-4" />
                  {selectedCandidate.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedCandidate.email}
                  </div>
                  <div>
                    <span className="font-medium">SĐT:</span>{" "}
                    {selectedCandidate.phone || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Vị trí:</span>{" "}
                    {selectedCandidate.jobPosting?.title}
                  </div>
                  <div>
                    <span className="font-medium">Phòng ban:</span>{" "}
                    {selectedCandidate.jobPosting?.department?.name}
                  </div>
                </div>
              </div>
            )}

            {/* Department & Position */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phòng ban</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn phòng ban..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map(
                          (dept: { id: string; name: string }) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chức vụ</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn chức vụ..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((pos: { id: string; name: string }) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Employment Type & Salary */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại hợp đồng</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Chính thức</SelectItem>
                        <SelectItem value="PART_TIME">Bán thời gian</SelectItem>
                        <SelectItem value="CONTRACT">Hợp đồng</SelectItem>
                        <SelectItem value="INTERN">Thực tập</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lương cơ bản (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ví dụ: 15000000"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hire Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày vào làm</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="probationEndDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày hết thử việc (tùy chọn)</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Options */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium text-foreground">Tùy chọn</p>

              <FormField
                control={form.control}
                name="sendWelcomeEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <FormLabel className="text-sm cursor-pointer">
                          Gửi email chào mừng
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Gửi email kèm thông tin đăng nhập cho nhân viên mới
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startOnboarding"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <FormLabel className="text-sm cursor-pointer">
                          Bắt đầu onboarding
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Tạo checklist tiếp nhận và giao việc cho IT/Admin
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className=" animate-spin" />}
                Tuyển dụng
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
