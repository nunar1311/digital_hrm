// ============================================================
// Position Salary List - Tab hiển thị lương theo chức vụ
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  BadgeCheck,
  Banknote,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getPositions } from "@/app/(protected)/positions/actions";
import {
  getDepartmentPositions,
} from "@/app/(protected)/departments/actions";
import { getPositionSalaries } from "@/app/(protected)/departments/actions";
import { PositionSalaryManager } from "./position-salary-manager";
import type { PositionListItem } from "@/app/(protected)/positions/types";

interface AuthorityLabel {
  label: string;
  color: string;
}

const AUTHORITY_LABELS: Record<string, AuthorityLabel> = {
  EXECUTIVE: { label: "HĐQT", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  DIRECTOR: { label: "Giám đốc", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  MANAGER: { label: "Trưởng phòng", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  DEPUTY: { label: "Phó phòng", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
  TEAM_LEAD: { label: "Tổ trưởng", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400" },
  STAFF: { label: "Nhân viên", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
  INTERN: { label: "Thực tập sinh", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" },
};

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

interface PositionSalaryListProps {
  departmentId: string;
  departmentName: string;
}

export function PositionSalaryList({
  departmentId,
  departmentName,
}: PositionSalaryListProps) {
  const [search, setSearch] = useState("");
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions", departmentId, search],
    queryFn: () =>
      getPositions({
        page: 1,
        pageSize: 100,
        departmentId,
        search: search || undefined,
        status: "ALL",
      }),
  });

  const positionList = useMemo(
    () => positions?.positions ?? [],
    [positions?.positions],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return positionList;
    const q = search.toLowerCase();
    return positionList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.authority.toLowerCase().includes(q),
    );
  }, [positionList, search]);

  const toggleExpand = (id: string) => {
    setExpandedPosition((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-2 border-b shrink-0">
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm chức vụ..."
            className="h-7 text-xs pl-7 w-48"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} chức vụ
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BadgeCheck className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Không có chức vụ nào</p>
            <p className="text-xs mt-1">Thêm chức vụ trong tab Chức vụ để đặt lương</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((position) => {
              const isExpanded = expandedPosition === position.id;
              const authInfo = AUTHORITY_LABELS[position.authority];

              return (
                <div key={position.id} className="w-full">
                  {/* Position Row */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => toggleExpand(position.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">
                          {position.name}
                        </span>
                        {authInfo && (
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded shrink-0",
                              authInfo.color,
                            )}
                          >
                            {authInfo.label}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {position.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          Cấp {position.level}
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            position.userCount > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {position.userCount} nhân viên
                        </span>
                      </div>
                    </div>

                    {/* Current salary preview */}
                    <div className="text-right shrink-0 mr-2">
                      <p className="text-xs text-muted-foreground">
                        Lương chức vụ
                      </p>
                      <p className="text-xs font-medium">
                        {position.minSalary || position.maxSalary ? (
                          <>
                            {position.minSalary
                              ? formatCurrency(position.minSalary)
                              : "—"}
                            {" – "}
                            {position.maxSalary
                              ? formatCurrency(position.maxSalary)
                              : "—"}
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Chưa đặt
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Expand indicator */}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Expanded Salary Manager */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <PositionSalaryManager
                        positionId={position.id}
                        positionName={position.name}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
