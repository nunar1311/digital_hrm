"use client";

import { Save, Loader2, CheckCircle2, Circle, Undo2 } from "lucide-react";
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
        <div className="flex flex-col gap-1">
          {breadcrumb && (
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {breadcrumb}
            </p>
          )}
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {/* Status indicator */}
        {canEdit && (
          <div className="mt-1 shrink-0">
            {hasChanges ? (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200 gap-1"
              >
                <Circle className="h-2 w-2 fill-amber-400 text-amber-400" />
                Có thay đổi
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 h-5 bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Đã lưu
              </Badge>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={onSave}
            size={"sm"}
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
              <>
                <Save className="h-3.5 w-3.5" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
