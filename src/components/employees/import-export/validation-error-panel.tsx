// =============================================================================
// ValidationErrorPanel — Collapsible list of per-row validation errors
// =============================================================================

"use client";

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ValidationError } from '@/lib/excel-utils';

interface ValidationErrorPanelProps {
    errors: ValidationError[];
}

export function ValidationErrorPanel({ errors }: ValidationErrorPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (errors.length === 0) return null;

    return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-destructive/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-sm font-medium text-destructive">
                        Phát hiện {errors.length} lỗi
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                        {errors.length}
                    </Badge>
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Error list */}
            <div
                className={cn(
                    'transition-all duration-200 overflow-hidden',
                    isExpanded ? 'max-h-[400px]' : 'max-h-0',
                )}
            >
                <div className="border-t border-destructive/20 px-4 py-2 max-h-[380px] overflow-y-auto">
                    <ul className="space-y-1">
                        {errors.map((error, idx) => (
                            <li key={idx} className="flex items-start gap-2 py-1.5 text-sm">
                                <Badge
                                    variant="outline"
                                    className="shrink-0 text-xs font-mono mt-0.5 border-destructive/40 text-destructive"
                                >
                                    Dòng {error.row}
                                </Badge>
                                <span className="text-muted-foreground">{error.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
