"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllPositions } from "@/app/(protected)/positions/actions";
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

const AUTHORITY_LABELS: Record<string, string> = {
  EXECUTIVE: "HĐQT",
  DIRECTOR: "Giám đốc",
  MANAGER: "Trưởng phòng",
  DEPUTY: "Phó phòng",
  TEAM_LEAD: "Tổ trưởng",
  STAFF: "Nhân viên",
  INTERN: "Thực tập sinh",
};

export function PositionDropdown({
  value,
  onValueChange,
  departmentId,
  placeholder = "Chọn chức vụ",
  disabled = false,
}: PositionDropdownProps) {
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
        <SelectValue placeholder={isLoading ? "Đang tải..." : placeholder} />
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
            Không có chức vụ nào
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
