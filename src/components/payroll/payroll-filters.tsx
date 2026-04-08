"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PayrollFiltersProps {
  filterDepartment: string;
  filterStatus: string;
  departments: { id: string; name: string }[];
  recordCount: number;
  onDepartmentChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Nháp" },
  { value: "PROCESSING", label: "Đang xử lý" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
] as const;

export function PayrollFilters({
  filterDepartment,
  filterStatus,
  departments,
  recordCount,
  onDepartmentChange,
  onStatusChange,
}: PayrollFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={filterDepartment} onValueChange={onDepartmentChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Lọc phòng ban" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả phòng ban</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Lọc trạng thái" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      <span className="text-sm text-muted-foreground">
        {recordCount} bảng lương
      </span>
    </div>
  );
}
