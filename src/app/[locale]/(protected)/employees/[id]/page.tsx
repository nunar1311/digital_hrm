import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Printer,
  ChevronLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { getEmployeeById } from "../actions";
import { Link } from "@/i18n/routing";
import { EditEmployeeButton } from "@/components/employees/edit-employee-button";

// Profile Tabs
import { GeneralTab } from "@/components/employees/profile-tabs/general-tab";
import { WorkTab } from "@/components/employees/profile-tabs/work-tab";
import { ContractsTab } from "@/components/employees/profile-tabs/contracts-tab";
import { TimelineTab } from "@/components/employees/profile-tabs/timeline-tab";
import { RewardsTab } from "@/components/employees/profile-tabs/rewards-tab";
import { FamilyTab } from "@/components/employees/profile-tabs/family-tab";

interface EmployeeProfilePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: EmployeeProfilePageProps) {
  const resolvedParams = await params;
  const employee = await getEmployeeById(resolvedParams.id);
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "ProtectedPages",
  });

  if (!employee) return { title: `${t("employeeNotFoundTitle")} - Digital HRM` };
  return {
    title: `${employee.fullName || employee.name} - ${t("employeeProfileMetadataTitle")} | Digital HRM`,
  };
}

function formatSeniority(
  hireDate: Date | null,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  if (!hireDate) return "---";
  const now = new Date();
  const hire = new Date(hireDate);
  const diffMs = now.getTime() - hire.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor(
    (diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000),
  );

  if (years > 0) {
    return `${years} ${t("year")} ${months} ${t("month")}`;
  }

  return `${months} ${t("month")}`;
}

export default async function EmployeeProfilePage({
  params,
}: EmployeeProfilePageProps) {
  const resolvedParams = await params;
  const employee = await getEmployeeById(resolvedParams.id);

  if (!employee) {
    notFound();
  }

  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "ProtectedPages",
  });

  const displayName = employee.fullName || employee.name;
  const displayPosition =
    (employee.position as { name?: string } | null)?.name ||
    t("employeePositionNotUpdated");
  const displayDepartment = employee.department?.name || t("employeeNotUpdated");

  return (
    <div>
      {/* Breadcrumb + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 h-10 border-b">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="ghost" size="icon-xs" tooltip={t("back")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>

          <h1 className="font-bold">{t("employeeProfilePageTitle")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs">
            <Printer className="h-3.5 w-3.5" />
            {t("printProfile")}
          </Button>

          <EditEmployeeButton
            employee={{
              id: employee.id,
              employeeCode: employee.employeeCode,
              fullName: employee.name,
              nationalId: employee.nationalId,
              nationalIdDate: employee.nationalIdDate,
              nationalIdPlace: employee.nationalIdPlace,
              dateOfBirth: employee.dateOfBirth,
              gender: employee.gender,
              nationality: employee.nationality,
              ethnicity: employee.ethnicity,
              religion: employee.religion,
              maritalStatus: employee.maritalStatus,
              departmentId: employee.departmentId,
              positionId:
                (employee.position as { id?: string } | null)?.id || null,
              employmentType: employee.employmentType,
              hireDate: employee.hireDate,
              probationEnd: employee.probationEnd,
              employeeStatus: employee.employeeStatus,
              phone: employee.phone,
              personalEmail: employee.personalEmail,
              address: employee.address,
              educationLevel: employee.educationLevel,
              university: employee.university,
              major: employee.major,
              bankName: employee.bankName,
              bankAccount: employee.bankAccount,
              taxCode: employee.taxCode,
            }}
          />
        </div>
      </div>

      <div className="overflow-auto h-[calc(100vh-5rem)] p-4">
        {/* Hero Card with gradient */}
        <Card className="overflow-hidden py-0 ">
          <CardContent className="relative p-4">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Avatar */}
              <div className="relative group">
                <div className="h-40 w-40 sm:h-40 sm:w-40 rounded-2xl border-4 border-background bg-linear-to-br from-primary/20 to-primary/5 flex shrink-0 items-center justify-center text-primary font-bold text-3xl sm:text-4xl shadow-lg ring-2 ring-primary/10">
                  {employee.avatar ? (
                    <Image
                      src={employee.avatar}
                      alt={displayName}
                      width={128}
                      height={128}
                      className="rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="select-none">
                      {displayName.split(" ").pop()?.[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {displayName}
                      </h2>
                      <EmployeeStatusBadge status={employee.employeeStatus} />
                      <Badge className=" font-mono">
                        {employee.employeeCode || "---"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {displayPosition}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Quick info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-muted-foreground/70">
                        {t("department")}
                      </div>
                      <div className="font-medium text-foreground">
                        {displayDepartment}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <div className=" uppercase tracking-wider text-muted-foreground/70">
                        {t("employmentType")}
                      </div>
                      <div className="font-medium text-foreground">
                        {employee.employmentType === "FULL_TIME"
                          ? t("employmentTypeFullTime")
                          : employee.employmentType === "INTERN"
                            ? t("employmentTypeIntern")
                            : employee.employmentType === "PART_TIME"
                              ? t("employmentTypePartTime")
                              : employee.employmentType || t("unknown")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-muted-foreground/70">
                        Email
                      </div>
                      <a
                        href={`mailto:${employee.personalEmail || employee.email}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {employee.personalEmail || employee.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-muted-foreground/70">
                        {t("phone")}
                      </div>
                      <a
                        href={`tel:${employee.phone}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {employee.phone || "---"}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Calendar className="h-3 w-3" />
                    {t("seniority")}: {formatSeniority(employee.hireDate, t)}
                  </div>
                  {employee.hireDate && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      <Clock className="h-3 w-3" />
                      {t("hireDate")}:{" "}
                      {new Date(employee.hireDate).toLocaleDateString(
                        resolvedParams.locale === "vi" ? "vi-VN" : "en-US",
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Tabs */}
        <Tabs defaultValue="general" className=" mt-4">
          <TabsList>
            <TabsTrigger value="general">{t("tabGeneral")}</TabsTrigger>
            <TabsTrigger value="work">{t("tabWork")}</TabsTrigger>
            <TabsTrigger value="contracts">{t("tabContracts")}</TabsTrigger>
            <TabsTrigger value="rewards">{t("tabRewards")}</TabsTrigger>
            <TabsTrigger value="family">{t("tabFamily")}</TabsTrigger>
            <TabsTrigger value="timeline">{t("tabTimeline")}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralTab employee={employee} />
          </TabsContent>

          <TabsContent value="work">
            <WorkTab employee={employee} />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractsTab employeeId={resolvedParams.id} />
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsTab employeeId={resolvedParams.id} />
          </TabsContent>

          <TabsContent value="family">
            <FamilyTab employeeId={resolvedParams.id} />
          </TabsContent>

          <TabsContent value="timeline">
            <TimelineTab employeeId={resolvedParams.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
