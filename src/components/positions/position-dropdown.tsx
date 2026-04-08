"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getAllPositions } from "@/app/[locale]/(protected)/positions/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PositionDropdownProps {
  value?: string | null;
  onValueChange?: (value: string) => void;
  departmentId?: string | null;
  placeholder?: string;
  disabled?: boolean;
}


export function PositionDropdown({
  value,
  onValueChange,
  departmentId,
  placeholder,
  disabled = false,
}: PositionDropdownProps) {
  const t = useTranslations("ProtectedPages");

  const AUTHORITY_LABELS: Record<string, string> = {
    EXECUTIVE: t("positionsAuthorityExecutive"),
    DIRECTOR: t("positionsAuthorityDirector"),
    MANAGER: t("positionsAuthorityManager"),
    DEPUTY: t("positionsAuthorityDeputy"),
    TEAM_LEAD: t("positionsAuthorityTeamLead"),
    STAFF: t("positionsAuthorityStaff"),
    INTERN: t("positionsAuthorityIntern"),
  };

  const resolvedPlaceholder =
    placeholder && placeholder.trim().length > 0
      ? placeholder
      : t("recruitmentPipelineSelectPosition");

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["positions", "dropdown", departmentId],
    queryFn: () =>
      getAllPositions({
        departmentId: departmentId || undefined,
      }),
  });

  return (
    <Select
      value={value || ""}
      onValueChange={onValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={"w-full"}>
        <SelectValue
          placeholder={isLoading ? t("attendanceShiftsLoading") : resolvedPlaceholder}
        />
      </SelectTrigger>
      <SelectContent>
        {positions.map((pos) => (
          <SelectItem key={pos.id} value={pos.id}>
            <span className="flex items-center gap-2">
              <span>{pos.name}</span>
              <span className="text-xs text-muted-foreground">
                ({AUTHORITY_LABELS[pos.authority] || pos.authority})
              </span>
            </span>
          </SelectItem>
        ))}
        {positions.length === 0 && !isLoading && (
          <div className="py-2 px-2 text-sm text-muted-foreground text-center">
            {t("positionsTableEmpty")}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

