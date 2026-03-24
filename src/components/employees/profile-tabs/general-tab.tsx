import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Globe,
  Heart,
  GraduationCap,
  BookOpen,
  Building2,
} from "lucide-react";

interface EmployeeData {
  id: string;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  nationalId?: string | null;
  nationalIdDate?: Date | string | null;
  nationalIdPlace?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  religion?: string | null;
  maritalStatus?: string | null;
  phone?: string | null;
  personalEmail?: string | null;
  address?: string | null;
  permanentAddress?: string | null;
  educationLevel?: string | null;
  major?: string | null;
  university?: string | null;
}

interface Props {
  employee: EmployeeData;
}

const InfoRow = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 py-3 border-b last:border-0 border-border/50 gap-1 sm:gap-4 group hover:bg-muted/20 px-1 rounded-sm transition-colors">
    <div className="text-sm font-semibold flex items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </div>
    <div className="sm:col-span-2 text-sm text-foreground">
      {value || (
        <span className="text-muted-foreground italic">Chưa cập nhật</span>
      )}
    </div>
  </div>
);

export function GeneralTab({ employee }: Props) {
  // Calculate profile completeness
  const fields = [
    employee.dateOfBirth,
    employee.gender,
    employee.nationalId,
    employee.phone,
    employee.personalEmail,
    employee.address,
    employee.permanentAddress,
    employee.educationLevel,
    employee.major,
    employee.university,
  ];
  const filledFields = fields.filter((f) => f != null && f !== "").length;
  const completeness = Math.round((filledFields / fields.length) * 100);

  return (
    <div className="space-y-6">
      {/* Profile completeness */}
      <Card className="border-primary/20 py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Mức độ hoàn thiện hồ sơ</span>
            <span className="text-sm font-bold text-primary">
              {completeness}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {filledFields}/{fields.length} thông tin đã được cập nhật
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin cá nhân */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label="Ngày sinh"
              icon={Calendar}
              value={
                employee.dateOfBirth
                  ? new Date(employee.dateOfBirth).toLocaleDateString("vi-VN")
                  : null
              }
            />
            <InfoRow
              label="Giới tính"
              icon={User}
              value={
                employee.gender === "MALE"
                  ? "Nam"
                  : employee.gender === "FEMALE"
                    ? "Nữ"
                    : employee.gender === "OTHER"
                      ? "Khác"
                      : null
              }
            />
            <InfoRow
              label="Số CCCD/CMND"
              icon={CreditCard}
              value={
                employee.nationalId && (
                  <span className="font-mono">{employee.nationalId}</span>
                )
              }
            />
            <InfoRow
              label="Ngày cấp"
              icon={Calendar}
              value={
                employee.nationalIdDate
                  ? new Date(employee.nationalIdDate).toLocaleDateString(
                      "vi-VN",
                    )
                  : null
              }
            />
            <InfoRow
              label="Nơi cấp"
              icon={MapPin}
              value={employee.nationalIdPlace}
            />
            <InfoRow
              label="Quốc tịch"
              icon={Globe}
              value={employee.nationality}
            />
            <InfoRow label="Dân tộc" icon={User} value={employee.ethnicity} />
            <InfoRow label="Tôn giáo" icon={Heart} value={employee.religion} />
            <InfoRow
              label="Tình trạng hôn nhân"
              icon={Heart}
              value={
                employee.maritalStatus === "MARRIED"
                  ? "Đã kết hôn"
                  : employee.maritalStatus === "SINGLE"
                    ? "Độc thân"
                    : employee.maritalStatus === "DIVORCED"
                      ? "Ly hôn"
                      : null
              }
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Thông tin liên hệ */}
          <Card>
            <CardHeader>
              <CardTitle>Liên hệ & Địa chỉ</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label="Số điện thoại"
                icon={Phone}
                value={employee.phone}
              />
              <InfoRow
                label="Email cá nhân"
                icon={Mail}
                value={employee.personalEmail}
              />
              <InfoRow
                label="Nơi ở hiện nay"
                icon={MapPin}
                value={employee.address}
              />
              <InfoRow
                label="Hộ khẩu thường trú"
                icon={MapPin}
                value={employee.permanentAddress}
              />
            </CardContent>
          </Card>

          {/* Học vấn */}
          <Card>
            <CardHeader>
              <CardTitle>Học vấn & Bằng cấp</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label="Trình độ cao nhất"
                icon={GraduationCap}
                value={
                  employee.educationLevel && (
                    <Badge>
                      {employee.educationLevel === "BACHELOR"
                        ? "Cử nhân / Kỹ sư"
                        : employee.educationLevel === "MASTER"
                          ? "Thạc sĩ"
                          : employee.educationLevel === "PHD"
                            ? "Tiến sĩ"
                            : employee.educationLevel === "COLLEGE"
                              ? "Cao đẳng"
                              : "Trung học"}
                    </Badge>
                  )
                }
              />
              <InfoRow
                label="Chuyên ngành"
                icon={BookOpen}
                value={employee.major}
              />
              <InfoRow
                label="Nơi đào tạo"
                icon={Building2}
                value={employee.university}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
