"use client";

import { Save, Loader2, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SettingsHeaderProps {
  title: string;
  description: string;
  canEdit: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  breadcrumb?: string;
}

export function SettingsHeader({
  title,
  description,
  canEdit,
  hasChanges,
  isSaving,
  onSave,
  breadcrumb,
}: SettingsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col">
          {breadcrumb && (
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {breadcrumb}
            </p>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {!canEdit && (
              <Badge variant="outline" className="text-xs gap-1 bg-muted/50">
                <Lock className="h-3 w-3" />
                Chỉ đọc
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {canEdit ? (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={onSave}
            size={"xs"}
            disabled={isSaving || !hasChanges}
            className={cn(
              "transition-all duration-200",
              hasChanges && !isSaving && "animate-pulse",
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>Lưu thay đổi</>
            )}
          </Button>
        </div>
      ) : (
        <Badge variant="secondary" className="text-xs gap-1 shrink-0">
          <Eye className="h-3 w-3" />
          Chỉ có quyền xem
        </Badge>
      )}
    </div>
  );
}
