"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Briefcase,
  CalendarDays,
  Edit,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { submitProfileUpdateRequest } from "../actions";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  username?: string | null;
  avatar?: string | null;
  gender?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  personalEmail?: string | null;
  idCard?: string | null;
  taxCode?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  hireDate?: Date | null;
  employeeStatus?: string | null;
  employmentType?: string | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
}

interface ESSProfileClientProps {
  initialProfile: UserProfile | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 1);
}

const genderLabels: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    className?: string;
  }
> = {
  ACTIVE: {
    label: "Đang làm việc",
    variant: "default",
    className: "bg-emerald-100 text-emerald-800",
  },
  INACTIVE: { label: "Không hoạt động", variant: "secondary" },
  ON_LEAVE: { label: "Đang nghỉ phép", variant: "outline" },
  RESIGNED: { label: "Đã nghỉ việc", variant: "secondary" },
};

const employmentTypeLabels: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERN: "Thực tập sinh",
  REMOTE: "Từ xa",
};

const editableFieldConfig = {
  email: { label: "Email công ty", inputType: "email" },
  personalEmail: { label: "Email cá nhân", inputType: "email" },
  phone: { label: "Số điện thoại", inputType: "tel" },
  address: { label: "Địa chỉ", inputType: "textarea" },
  dateOfBirth: { label: "Ngày sinh", inputType: "date" },
  idCard: { label: "Số CCCD/CMND", inputType: "text" },
  taxCode: { label: "Mã số thuế", inputType: "text" },
  bankAccount: { label: "Số tài khoản", inputType: "text" },
  bankName: { label: "Tên ngân hàng", inputType: "text" },
  emergencyContact: { label: "Tên người liên hệ", inputType: "textarea" },
  emergencyPhone: { label: "Số điện thoại khẩn cấp", inputType: "tel" },
} as const;

type EditableField = keyof typeof editableFieldConfig;

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

function getYearsOfService(hireDate?: Date | null) {
  if (!hireDate) return 0;
  const years = Math.floor(
    (Date.now() - new Date(hireDate).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000),
  );
  return Math.max(0, years);
}

// ─── Profile Header ──────────────────────────────────────────────────────────

function ProfileHeader({ profile }: { profile: UserProfile }) {
  const statusConfig = profile.employeeStatus
    ? statusLabels[profile.employeeStatus] || {
        label: profile.employeeStatus,
        variant: "secondary" as const,
      }
    : { label: "Không xác định", variant: "secondary" as const };

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
      <div className="relative px-1">
        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-4 border-background shadow-lg ring-2 ring-primary/10">
                <AvatarImage
                  src={profile.avatar || undefined}
                  alt={profile.name}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg sm:text-xl font-bold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 ">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                    {profile.name}
                  </h1>
                  -
                  <Badge variant="outline" className="px-2">
                    {profile.username || ""}
                  </Badge>
                </div>
                <Badge
                  variant={statusConfig.variant}
                  className={cn("text-xs", statusConfig.className)}
                >
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="hidden sm:block " />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
              {profile.department && (
                <span className="flex items-center gap-1">
                  <strong>Phòng ban:</strong>
                  {profile.department.name}
                </span>
              )}
              {profile.position && (
                <span className="flex items-center gap-1">
                  <strong>Chức vụ:</strong>
                  {profile.position.name}
                </span>
              )}
              {profile.manager && (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  TL: {profile.manager.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 text-xs sm:text-sm min-w-0">
                <span className="truncate font-medium">{profile.email}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 text-xs sm:text-sm min-w-0">
                <span className="truncate font-medium">
                  {profile.phone || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Cards ────────────────────────────────────────────────────────────

function StatsCards({ profile }: { profile: UserProfile }) {
  const yearsOfService = getYearsOfService(profile.hireDate);

  const profileFields = [
    profile.phone,
    profile.personalEmail,
    profile.address,
    profile.dateOfBirth,
    profile.idCard,
    profile.taxCode,
    profile.bankAccount,
    profile.bankName,
    profile.emergencyContact,
    profile.emergencyPhone,
  ];
  const profileCompleteness = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="p-2">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-sky-100 text-sky-600 shrink-0">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Thâm niên</p>
              <p className="text-lg sm:text-xl font-bold text-sky-700">
                {yearsOfService}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  năm
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-violet-100 text-violet-600 shrink-0">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Ngày vào làm</p>
              <p className="text-sm sm:text-base font-semibold truncate">
                {formatDate(profile.hireDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 text-amber-600 shrink-0">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Quản lý</p>
              <p className="text-sm sm:text-base font-semibold truncate">
                {profile.manager?.name || "Chưa cập nhật"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-2 border-emerald-200">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Hoàn chỉnh</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-700">
                {profileCompleteness}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Info Card ───────────────────────────────────────────────────────────────

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-2">
      <CardHeader className="px-2 sm:px-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-3 space-y-0">{children}</CardContent>
    </Card>
  );
}

// ─── Info Row ───────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  editable,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  editable?: boolean;
  onEdit?: () => void;
}) {
  const displayValue = value ?? "-";

  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground truncate mt-0.5">
          {displayValue}
        </div>
      </div>
      {editable && onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-7 w-7 shrink-0 ml-2"
          aria-label={`Chỉnh sửa ${label}`}
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ESSProfileClient({ initialProfile }: ESSProfileClientProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editField, setEditField] = useState<EditableField | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<{ value: string }>({
    defaultValues: { value: "" },
  });

  if (!initialProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Không thể tải thông tin hồ sơ</p>
      </div>
    );
  }

  const handleEditField = (field: EditableField, currentValue: string) => {
    setEditField(field);
    form.reset({ value: currentValue || "" });
    setEditDialogOpen(true);
  };

  const editFieldMeta = editField ? editableFieldConfig[editField] : null;

  const handleSaveEdit = async (data: { value: string }) => {
    if (!editField) return;

    setIsSubmitting(true);
    try {
      await submitProfileUpdateRequest({ field: editField, value: data.value });
      toast.success("Đã gửi yêu cầu cập nhật");
      window.location.reload();
      setEditDialogOpen(false);
      setEditField(null);
    } catch {
      toast.error("Không thể gửi yêu cầu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="px-2 flex items-center sm:px-4 h-10 border-b">
        <h1 className="font-bold text-sm sm:text-base">Hồ sơ cá nhân</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2 space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <ProfileHeader profile={initialProfile} />

        {/* Stats Cards */}
        <StatsCards profile={initialProfile} />

        {/* Info Cards Grid */}
        <div className="grid gap-4 lg:gap-6 xl:grid-cols-2">
          {/* Work Information */}
          <InfoCard title="Thông tin công việc">
            <InfoRow
              label="Phòng ban"
              value={initialProfile.department?.name || "-"}
            />
            <InfoRow
              label="Vị trí/Chức vụ"
              value={initialProfile.position?.name || "-"}
            />
            <InfoRow
              label="Quản lý trực tiếp"
              value={
                initialProfile.manager?.name
                  ? `${initialProfile.manager.name}`
                  : "-"
              }
            />
            <InfoRow
              label="Loại hình lao động"
              value={
                employmentTypeLabels[initialProfile.employmentType || ""] ||
                initialProfile.employmentType ||
                "-"
              }
            />
            <InfoRow
              label="Ngày vào làm"
              value={formatDate(initialProfile.hireDate)}
            />
          </InfoCard>

          {/* Contact Information */}
          <InfoCard title="Thông tin liên hệ">
            <InfoRow
              label="Email công ty"
              value={initialProfile.email}
              editable
              onEdit={() => handleEditField("email", initialProfile.email)}
            />
            <InfoRow
              label="Email cá nhân"
              value={initialProfile.personalEmail || "-"}
              editable
              onEdit={() =>
                handleEditField(
                  "personalEmail",
                  initialProfile.personalEmail || "",
                )
              }
            />
            <InfoRow
              label="Số điện thoại"
              value={initialProfile.phone || "-"}
              editable
              onEdit={() =>
                handleEditField("phone", initialProfile.phone || "")
              }
            />
            <InfoRow
              label="Địa chỉ"
              value={initialProfile.address || "-"}
              editable
              onEdit={() =>
                handleEditField("address", initialProfile.address || "")
              }
            />
          </InfoCard>

          {/* Personal Information */}
          <InfoCard title="Thông tin cá nhân">
            <InfoRow
              label="Giới tính"
              value={
                genderLabels[initialProfile.gender || ""] ||
                initialProfile.gender ||
                "-"
              }
            />
            <InfoRow
              label="Ngày sinh"
              value={formatDate(initialProfile.dateOfBirth)}
              editable
              onEdit={() =>
                handleEditField(
                  "dateOfBirth",
                  initialProfile.dateOfBirth
                    ? new Date(initialProfile.dateOfBirth)
                        .toISOString()
                        .split("T")[0]
                    : "",
                )
              }
            />
            <InfoRow
              label="Số CCCD/CMND"
              value={initialProfile.idCard || "-"}
              editable
              onEdit={() =>
                handleEditField("idCard", initialProfile.idCard || "")
              }
            />
          </InfoCard>

          {/* Banking & Tax */}
          <InfoCard title="Thông tin ngân hàng & thuế">
            <InfoRow
              label="Mã số thuế"
              value={initialProfile.taxCode || "-"}
              editable
              onEdit={() =>
                handleEditField("taxCode", initialProfile.taxCode || "")
              }
            />
            <InfoRow
              label="Số tài khoản"
              value={initialProfile.bankAccount || "-"}
              editable
              onEdit={() =>
                handleEditField("bankAccount", initialProfile.bankAccount || "")
              }
            />
            <InfoRow
              label="Ngân hàng"
              value={initialProfile.bankName || "-"}
              editable
              onEdit={() =>
                handleEditField("bankName", initialProfile.bankName || "")
              }
            />
          </InfoCard>

          {/* Emergency Contact */}
          <InfoCard title="Liên hệ khẩn cấp">
            <InfoRow
              label="Tên người liên hệ"
              value={initialProfile.emergencyContact || "-"}
              editable
              onEdit={() =>
                handleEditField(
                  "emergencyContact",
                  initialProfile.emergencyContact || "",
                )
              }
            />
            <InfoRow
              label="Số điện thoại"
              value={initialProfile.emergencyPhone || "-"}
              editable
              onEdit={() =>
                handleEditField(
                  "emergencyPhone",
                  initialProfile.emergencyPhone || "",
                )
              }
            />
          </InfoCard>
        </div>

        {/* Request Update Hint */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-sm">Cần cập nhật thông tin?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nhấn biểu tượng chỉnh sửa bên cạnh từng mục hoặc liên hệ bộ
                  phận HCNS.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleEditField("phone", initialProfile.phone || "")
                }
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Cập nhật nhanh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditField(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin</DialogTitle>
            <DialogDescription>
              Nhập thông tin mới và gửi yêu cầu cập nhật đến HCNS để xác nhận.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSaveEdit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {editFieldMeta?.label || "Thông tin cần cập nhật"}
                    </FormLabel>
                    <FormControl>
                      {editFieldMeta?.inputType === "textarea" ? (
                        <Textarea
                          {...field}
                          placeholder="Nhập thông tin mới..."
                          rows={3}
                        />
                      ) : (
                        <Input
                          {...field}
                          type={editFieldMeta?.inputType || "text"}
                          placeholder="Nhập thông tin mới..."
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting || !editField}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>Gửi yêu cầu</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
