"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  BadgeCheck,
  Pencil,
  Trash2,
  ChevronRight,
  Users,
  Ruler,
  Briefcase,
  Clock,
  Shield,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PositionFormDialog } from "@/components/positions/position-form-dialog";
import { deletePosition } from "../actions";
import { getPositionRoleMapping } from "../position-role-actions";
import { POSITION_ROLE_SUGGESTIONS, AUTHORITY_ROLE_LABELS } from "../schemas";
import { ROLE_LABELS, getRoleBadgeColor, PERMISSION_GROUPS } from "@/app/[locale]/(protected)/settings/roles/constants";
import type { PositionDetail } from "../types";
import { toast } from "sonner";

const AUTHORITY_LABELS: Record<string, { labelKey: string; class: string }> = {
  EXECUTIVE: {
    labelKey: "positionsAuthorityExecutive",
    class:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  DIRECTOR: {
    labelKey: "positionsAuthorityDirector",
    class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  MANAGER: {
    labelKey: "positionsAuthorityManager",
    class:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  DEPUTY: {
    labelKey: "positionsAuthorityDeputy",
    class:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  TEAM_LEAD: {
    labelKey: "positionsAuthorityTeamLead",
    class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  STAFF: {
    labelKey: "positionsAuthorityStaff",
    class:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  INTERN: {
    labelKey: "positionsAuthorityIntern",
    class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

interface PositionDetailClientProps {
  position: PositionDetail;
}

export function PositionDetailClient({ position }: PositionDetailClientProps) {
  const t = useTranslations("ProtectedPages");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: roleMapping } = useQuery({
    queryKey: ["position-role-mapping", position.id],
    queryFn: () => getPositionRoleMapping(position.id),
  });

  const suggestedRoleKey = POSITION_ROLE_SUGGESTIONS[position.authority];

  const authInfo = AUTHORITY_LABELS[position.authority] || {
    labelKey: "positionsAuthorityLabel",
    class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  const handleDelete = async () => {
    const result = await deletePosition(position.id);
    if (result.success) {
      toast.success(t("positionsDeleteSuccess"));
      router.push("/positions");
    } else {
      toast.error(result.error);
    }
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 h-[calc(100vh-100px)] overflow-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/positions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/positions" className="hover:underline">
              Chá»©c vá»¥
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>{position.name}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          Sá»­a
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
          disabled={position.userCount > 0}
        >
          <Trash2 className="h-4 w-4" />
          XÃ³a
        </Button>
      </div>

      {/* Title */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {position.name}
            </h1>
            <Badge variant="outline" className={authInfo.class}>
              {t(authInfo.labelKey)}
            </Badge>
            <Badge
              variant={position.status === "ACTIVE" ? "default" : "secondary"}
              className={
                position.status === "ACTIVE"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-500"
              }
            >
              {position.status === "ACTIVE"
                ? t("positionsStatusActive")
                : t("positionsStatusInactive")}
            </Badge>
          </div>
          <code className="text-sm bg-muted px-3 py-1.5 rounded font-mono w-fit">
            {position.code}
          </code>
          {position.description && (
            <p className="text-muted-foreground text-sm mt-1">
              {position.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                ThÃ´ng tin chá»©c vá»¥
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Cáº¥p báº­c
                  </p>
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                      {position.level}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {position.level === 1
                        ? t("positionsLevelHighest")
                        : position.level <= 3
                          ? "(Cao)"
                          : position.level <= 6
                            ? t("positionsLevelMedium")
                            : t("positionsLevelLow")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    PhÃ²ng ban
                  </p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {position.departmentName ? (
                      <Link
                        href={`/departments/${position.departmentId}`}
                        className="text-sm hover:underline hover:text-foreground"
                      >
                        {position.departmentName}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">â€”</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Chá»©c vá»¥ cha
                  </p>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    {position.parentName ? (
                      <Link
                        href={`/positions/${position.parentId}`}
                        className="text-sm hover:underline hover:text-foreground"
                      >
                        {position.parentName}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">â€”</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />
            </CardContent>
          </Card>

          {/* Employees card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                NhÃ¢n viÃªn giá»¯ chá»©c vá»¥ ({position.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {position.users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    ChÆ°a cÃ³ nhÃ¢n viÃªn nÃ o giá»¯ chá»©c vá»¥ nÃ y
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {position.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/employees/${user.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-medium bg-primary/10 text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.employeeCode || t("positionsDash")} •{" "}
                          {user.departmentName || t("positionsNoDepartment")}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: hierarchy + meta */}
        <div className="space-y-6">
          {/* Children positions */}
          {position.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Chá»©c vá»¥ cáº¥p dÆ°á»›i ({position.children.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {position.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/positions/${child.id}`}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-sm"
                    >
                      <span className="truncate flex-1">{child.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          AUTHORITY_LABELS[child.authority]?.class ||
                          "bg-gray-100 text-gray-600"
                        }
                      >
                        {AUTHORITY_LABELS[child.authority]?.labelKey
                          ? t(AUTHORITY_LABELS[child.authority].labelKey)
                          : child.authority}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                ThÃ´ng tin há»‡ thá»‘ng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  NgÃ y táº¡o
                </p>
                <p className="text-sm">
                  {new Date(position.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Cáº­p nháº­t láº§n cuá»‘i
                </p>
                <p className="text-sm">
                  {new Date(position.updatedAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Tá»•ng nhÃ¢n viÃªn
                </p>
                <p className="text-sm font-medium">{position.userCount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Role Mapping Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vai trÃ² máº·c Ä‘á»‹nh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {roleMapping ? (
                <>
                  {/* Current mapped role */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Vai trÃ² hiá»‡n táº¡i
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(roleMapping.roleKey)}>
                        {roleMapping.roleName}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {roleMapping.roleType === "FIXED"
                          ? t("positionsRoleTypeFixed")
                          : t("positionsRoleTypeCustom")}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Permissions list */}
                  {roleMapping.permissions && roleMapping.permissions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Quyá»n háº¡n ({roleMapping.permissions.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {roleMapping.permissions.slice(0, 8).map((perm: string) => (
                          <Badge
                            key={perm}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {PERMISSION_GROUPS[perm.split(":")[0]] || perm.split(":")[0]}
                            {perm.split(":")[1] && (
                              <span className="ml-1 opacity-70">
                                {perm.split(":")[1]}
                              </span>
                            )}
                          </Badge>
                        ))}
                        {roleMapping.permissions.length > 8 && (
                          <Badge variant="secondary" className="text-xs">
                            +{roleMapping.permissions.length - 8} quyá»n khÃ¡c
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Quick link to roles page */}
                  <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                    <Link href="/settings/roles">
                      <ExternalLink className="h-3 w-3" />
                      Quáº£n lÃ½ vai trÃ²
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  {/* No mapping */}
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <Shield className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      ChÆ°a gÃ¡n vai trÃ² máº·c Ä‘á»‹nh
                    </p>
                  </div>

                  {/* Suggestion */}
                  {suggestedRoleKey && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Gá»£i Ã½ cho cáº¥p {AUTHORITY_ROLE_LABELS[position.authority] || position.authority}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getRoleBadgeColor(suggestedRoleKey)}
                        >
                          {ROLE_LABELS[suggestedRoleKey] || suggestedRoleKey}
                        </Badge>
                        <Sparkles className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Gá»£i Ã½ tá»± Ä‘á»™ng
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Vui lÃ²ng chá»‰nh sá»­a chá»©c vá»¥ Ä‘á»ƒ gÃ¡n vai trÃ² máº·c Ä‘á»‹nh.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <PositionFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        // editData={{
        //   id: position.id,
        //   name: position.name,
        //   code: position.code,
        //   authority: position.authority,
        //   departmentId: position.departmentId,
        //   level: position.level,
        //   description: position.description,
        //   parentId: position.parentId,
        //   minSalary: position.minSalary,
        //   maxSalary: position.maxSalary,
        //   status: position.status,
        //   sortOrder: position.sortOrder,
        // }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>XÃ¡c nháº­n xÃ³a chá»©c vá»¥</AlertDialogTitle>
            <AlertDialogDescription>
              Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a chá»©c vá»¥ <strong>{position.name}</strong>{" "}
              khÃ´ng? HÃ nh Ä‘á»™ng nÃ y sáº½ chuyá»ƒn chá»©c vá»¥ sang tráº¡ng thÃ¡i khÃ´ng hoáº¡t
              Ä‘á»™ng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Há»§y</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              XÃ³a
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

