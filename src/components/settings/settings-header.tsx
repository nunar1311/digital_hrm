"use client";

import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  title: string;
  description: string;
  canEdit: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function SettingsHeader({
  title,
  description,
  canEdit,
  hasChanges,
  isSaving,
  onSave,
}: SettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>

      {canEdit && (
        <Button onClick={onSave} size={"sm"} disabled={isSaving || !hasChanges}>
          {isSaving && <Loader2 className="animate-spin" />}
          Lưu thay đổi
        </Button>
      )}
    </div>
  );
}
