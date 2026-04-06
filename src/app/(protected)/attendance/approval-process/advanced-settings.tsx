"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AdvancedSettings } from "../types";

interface AdvancedSettingsPanelProps {
    settings: AdvancedSettings;
    onChange: (settings: AdvancedSettings) => void;
    canEdit: boolean;
}

export function AdvancedSettingsPanel({
    settings,
    onChange,
    canEdit,
}: AdvancedSettingsPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = (key: keyof AdvancedSettings, value: boolean) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto"
                    disabled={!canEdit}
                >
                    <span className="font-medium text-sm">Cài đặt nâng cao</span>
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="space-y-4 p-4 border rounded-lg mt-1 bg-card">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="sendEmailReminder"
                            checked={settings.sendEmailReminder}
                            onCheckedChange={(checked) =>
                                handleChange("sendEmailReminder", !!checked)
                            }
                            disabled={!canEdit}
                        />
                        <div className="space-y-0.5 leading-none">
                            <Label
                                htmlFor="sendEmailReminder"
                                className="text-sm cursor-pointer font-normal"
                            >
                                Gửi email nhắc người duyệt khi có yêu cầu mới
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Người duyệt sẽ nhận email thông báo khi có yêu
                                cầu điều chỉnh chấm công mới
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="skipDuplicateApprover"
                            checked={settings.skipDuplicateApprover}
                            onCheckedChange={(checked) =>
                                handleChange("skipDuplicateApprover", !!checked)
                            }
                            disabled={!canEdit}
                        />
                        <div className="space-y-0.5 leading-none">
                            <Label
                                htmlFor="skipDuplicateApprover"
                                className="text-sm cursor-pointer font-normal"
                            >
                                Bỏ qua người duyệt trùng kế tiếp
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Nếu một người đã duyệt ở bước trước, họ sẽ được
                                bỏ qua ở các bước tiếp theo
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="skipSelfApprover"
                            checked={settings.skipSelfApprover}
                            onCheckedChange={(checked) =>
                                handleChange("skipSelfApprover", !!checked)
                            }
                            disabled={!canEdit}
                        />
                        <div className="space-y-0.5 leading-none">
                            <Label
                                htmlFor="skipSelfApprover"
                                className="text-sm cursor-pointer font-normal"
                            >
                                Bỏ qua phê duyệt nếu người duyệt và người yêu cầu
                                là một
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Nếu người được chỉ định duyệt trùng với người
                                gửi yêu cầu, bước duyệt sẽ được bỏ qua
                            </p>
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
