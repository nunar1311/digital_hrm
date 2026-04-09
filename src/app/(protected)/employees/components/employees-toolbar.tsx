"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  ListFilter,
  Settings,
  Plus,
  Search,
  BadgeCheck,
  User,
  Phone,
  CircleDot,
  VenusAndMars,
  IdCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";

type EmployeeStatus = "ALL" | "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang làm việc" },
  { value: "ON_LEAVE", label: "Nghỉ phép" },
  { value: "RESIGNED", label: "Đã nghỉ việc" },
  { value: "TERMINATED", label: "Sa thải" },
];

interface EmployeesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: EmployeeStatus;
  onStatusFilterChange: (value: EmployeeStatus) => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (value: Record<string, boolean>) => void;
  showEmptyDepartments: boolean;
  onShowEmptyDepartmentsChange: (value: boolean) => void;
  wrapText: boolean;
  onWrapTextChange: (value: boolean) => void;
  settingsOpen: boolean;
  onSettingsOpenChange: (value: boolean) => void;
  onAddEmployee: () => void;
  onExport: () => void;
}

export function EmployeesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  columnVisibility,
  onColumnVisibilityChange,
  showEmptyDepartments,
  onShowEmptyDepartmentsChange,
  wrapText,
  onWrapTextChange,
  settingsOpen,
  onSettingsOpenChange,
  onAddEmployee,
  onExport,
}: EmployeesToolbarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) {
        onSearchChange("");
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (search.trim()) {
        onSearchChange("");
      }
      setSearchExpanded(false);
    }
  }, [searchExpanded, search, onSearchChange]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        onSearchChange("");
        setSearchExpanded(false);
      }
    },
    [onSearchChange],
  );

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <Button
          variant={"outline"}
          size={"xs"}
          onClick={onExport}
        >
          Xuất file Excel
        </Button>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={statusFilter !== "ALL" ? "outline" : "ghost"}
                size="xs"
                className={cn(
                  statusFilter !== "ALL" &&
                    "bg-primary/10 border-primary text-primary hover:text-primary",
                )}
              >
                <ListFilter />
                {statusFilter !== "ALL" && (
                  <span className="ml-1 text-xs">
                    {
                      STATUS_OPTIONS.find((s) => s.value === statusFilter)
                        ?.label
                    }
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Trạng thái
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(value) =>
                  onStatusFilterChange(value as EmployeeStatus)
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={statusFilter === option.value}
                    onCheckedChange={() =>
                      onStatusFilterChange(option.value as EmployeeStatus)
                    }
                    className="text-sm"
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          <div className="relative flex items-center" ref={mergedSearchRef}>
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm kiếm nhân viên..."
              className={cn(
                "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                searchExpanded
                  ? "w-50 opacity-100 pl-3"
                  : "w-0 opacity-0 pl-0",
              )}
            />
            <Button
              size={"icon-xs"}
              variant={"ghost"}
              onClick={handleSearchToggle}
              className={cn(
                "absolute right-0.5 z-10",
                searchExpanded && "[&_svg]:text-primary",
              )}
            >
              <Search />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4!" />

          <Button
            variant={"outline"}
            size={"xs"}
            onClick={() => onSettingsOpenChange(true)}
          >
            <Settings />
          </Button>
          <Button size={"xs"} onClick={onAddEmployee}>
            <Plus />
            Nhân viên
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      <TableSettingsPanel
        className="top-10"
        open={settingsOpen}
        onClose={() => onSettingsOpenChange(false)}
        columnVisibility={columnVisibility}
        setColumnVisibility={onColumnVisibilityChange}
        defaultVisibleColumns={{
          username: false,
          fullName: true,
          positionName: false,
          phone: false,
          employeeStatus: false,
          gender: false,
          nationalId: false,
        }}
        columnOptions={[
          { key: "username", label: "Mã nhân viên", icon: BadgeCheck },
          { key: "fullName", label: "Họ và tên", icon: User },
          { key: "positionName", label: "Chức vụ / Phòng ban", icon: BadgeCheck },
          { key: "phone", label: "SĐT / Email", icon: Phone },
          { key: "employeeStatus", label: "Trạng thái", icon: CircleDot },
          { key: "gender", label: "Giới tính", icon: VenusAndMars },
          { key: "nationalId", label: "Số CCCD", icon: IdCard },
        ]}
        showEmptyDepartments={showEmptyDepartments}
        setShowEmptyDepartments={onShowEmptyDepartmentsChange}
        wrapText={wrapText}
        setWrapText={onWrapTextChange}
        disabledColumnIndices={[1]}
        hiddenColumnIndices={[]}
      />
    </>
  );
}
