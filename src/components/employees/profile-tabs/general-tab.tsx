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
import { useTranslations } from "next-intl";

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
}) => {
  const t = useTranslations("ProtectedPages");

  return (
  <div className="grid grid-cols-1 sm:grid-cols-3 py-3 border-b last:border-0 border-border/50 gap-1 sm:gap-4 group hover:bg-muted/20 px-1 rounded-sm transition-colors">
    <div className="text-sm font-semibold flex items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </div>
    <div className="sm:col-span-2 text-sm text-foreground">
      {value || (
        <span className="text-muted-foreground italic">{t("employeesGeneralNotUpdated")}</span>
      )}
    </div>
  </div>
  );
};

export function GeneralTab({ employee }: Props) {
  const t = useTranslations("ProtectedPages");

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
    <div className="space-y-4">
      {/* Profile completeness */}
      <Card className="border-primary/20 py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t("employeesGeneralProfileCompleteness")}</span>
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
            {t("employeesGeneralUpdatedInfoCount", {
              filled: filledFields,
              total: fields.length,
            })}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("employeesGeneralCardPersonalTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label={t("employeesAddFieldDateOfBirth")}
              icon={Calendar}
              value={
                employee.dateOfBirth
                  ? new Date(employee.dateOfBirth).toLocaleDateString()
                  : null
              }
            />
            <InfoRow
              label={t("employeesAddFieldGender")}
              icon={User}
              value={
                employee.gender === "MALE"
                  ? t("employeesExportGenderMale")
                  : employee.gender === "FEMALE"
                    ? t("employeesExportGenderFemale")
                    : employee.gender === "OTHER"
                      ? t("employeesExportGenderOther")
                      : null
              }
            />
            <InfoRow
              label={t("employeesExportFieldNationalId")}
              icon={CreditCard}
              value={
                employee.nationalId && (
                  <span className="font-mono">{employee.nationalId}</span>
                )
              }
            />
            <InfoRow
              label={t("employeesExportFieldNationalIdDate")}
              icon={Calendar}
              value={
                employee.nationalIdDate
                  ? new Date(employee.nationalIdDate).toLocaleDateString(
                      undefined,
                    )
                  : null
              }
            />
            <InfoRow
              label={t("employeesExportFieldNationalIdPlace")}
              icon={MapPin}
              value={employee.nationalIdPlace}
            />
            <InfoRow
              label={t("employeesExportFieldNationality")}
              icon={Globe}
              value={employee.nationality}
            />
            <InfoRow
              label={t("employeesExportFieldEthnicity")}
              icon={User}
              value={employee.ethnicity}
            />
            <InfoRow
              label={t("employeesExportFieldReligion")}
              icon={Heart}
              value={employee.religion}
            />
            <InfoRow
              label={t("employeesExportFieldMaritalStatus")}
              icon={Heart}
              value={
                employee.maritalStatus === "MARRIED"
                  ? t("employeesExportMaritalMarried")
                  : employee.maritalStatus === "SINGLE"
                    ? t("employeesExportMaritalSingle")
                    : employee.maritalStatus === "DIVORCED"
                      ? t("employeesExportMaritalDivorced")
                      : null
              }
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Contact information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("employeesGeneralCardContactTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label={t("employeesExportFieldPhone")}
                icon={Phone}
                value={employee.phone}
              />
              <InfoRow
                label={t("employeesExportFieldPersonalEmail")}
                icon={Mail}
                value={employee.personalEmail}
              />
              <InfoRow
                label={t("employeesGeneralLabelCurrentAddress")}
                icon={MapPin}
                value={employee.address}
              />
              <InfoRow
                label={t("employeesGeneralLabelPermanentAddress")}
                icon={MapPin}
                value={employee.permanentAddress}
              />
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>{t("employeesGeneralCardEducationTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label={t("employeesGeneralLabelHighestEducation")}
                icon={GraduationCap}
                value={
                  employee.educationLevel && (
                    <Badge>
                      {employee.educationLevel === "BACHELOR"
                        ? t("employeesGeneralEducationBachelor")
                        : employee.educationLevel === "MASTER"
                          ? t("employeesExportEducationMaster")
                          : employee.educationLevel === "PHD"
                            ? t("employeesExportEducationPhd")
                            : employee.educationLevel === "COLLEGE"
                              ? t("employeesExportEducationCollege")
                              : t("employeesExportEducationHighSchool")}
                    </Badge>
                  )
                }
              />
              <InfoRow
                label={t("employeesExportFieldMajor")}
                icon={BookOpen}
                value={employee.major}
              />
              <InfoRow
                label={t("employeesGeneralLabelEducationInstitution")}
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
