"use client";

import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { COMPANY_FIELDS } from "./constants";

interface CompanyInfoCardProps {
    settings: Record<string, string>;
    canEdit: boolean;
    onFieldChange: (key: string, value: string) => void;
}

export function CompanyInfoCard({
    settings,
    canEdit,
    onFieldChange,
}: CompanyInfoCardProps) {
    const firstRowFields = COMPANY_FIELDS.filter((f) => !f.fullWidth);
    const secondRowFields = COMPANY_FIELDS.filter((f) => !f.fullWidth).slice(2);
    const fullWidthFields = COMPANY_FIELDS.filter((f) => f.fullWidth);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Thông tin công ty
                </CardTitle>
                <CardDescription>
                    Cấu hình thông tin cơ bản của công ty
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    {firstRowFields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key}>{field.label}</Label>
                            <Input
                                id={field.key}
                                type={field.type}
                                value={settings[field.key] ?? ""}
                                onChange={(e) =>
                                    onFieldChange(field.key, e.target.value)
                                }
                                placeholder={field.placeholder}
                                disabled={!canEdit}
                            />
                        </div>
                    ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {secondRowFields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key}>{field.label}</Label>
                            <Input
                                id={field.key}
                                type={field.type}
                                value={settings[field.key] ?? ""}
                                onChange={(e) =>
                                    onFieldChange(field.key, e.target.value)
                                }
                                placeholder={field.placeholder}
                                disabled={!canEdit}
                            />
                        </div>
                    ))}
                </div>
                {fullWidthFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                            id={field.key}
                            type={field.type}
                            value={settings[field.key] ?? ""}
                            onChange={(e) =>
                                onFieldChange(field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            disabled={!canEdit}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
