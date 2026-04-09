"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmployeesEmptyStateProps {
  search: string;
  onClearSearch: () => void;
}

export function EmployeesEmptyState({ search, onClearSearch }: EmployeesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Users className="h-8 w-8 text-muted-foreground/50" />
      <p>Không tìm thấy nhân viên nào.</p>
      {search && (
        <Button variant="link" onClick={onClearSearch}>
          Xóa tìm kiếm
        </Button>
      )}
    </div>
  );
}
