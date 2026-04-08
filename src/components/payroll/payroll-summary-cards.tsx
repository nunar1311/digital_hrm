"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Wallet, Receipt, Shield } from "lucide-react";
import { formatCurrency, type PayrollSummary } from "./payroll-utils";

interface SummaryCardsProps {
  summary: PayrollSummary;
}

const STAT_CONFIGS = [
  {
    key: "totalEmployees" as const,
    label: "Tổng nhân viên",
    icon: Users,
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    key: "totalGross" as const,
    label: "Tổng lương Gross",
    icon: TrendingUp,
    bgLight: "bg-violet-50",
    textColor: "text-violet-600",
    gradient: "from-violet-500 to-violet-600",
  },
  {
    key: "totalNet" as const,
    label: "Tổng lương Net",
    icon: Wallet,
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    key: "totalTax" as const,
    label: "Tổng thuế TNCN",
    icon: Receipt,
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
    gradient: "from-amber-500 to-amber-600",
  },
  {
    key: "totalInsurance" as const,
    label: "Tổng BH",
    icon: Shield,
    bgLight: "bg-rose-50",
    textColor: "text-rose-600",
    gradient: "from-rose-500 to-rose-600",
  },
];

function formatValue(
  key: keyof PayrollSummary,
  summary: PayrollSummary,
): string {
  if (key === "totalEmployees") return summary.totalEmployees.toString();
  return formatCurrency(summary[key]);
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 p-2">
      {STAT_CONFIGS.map((config) => (
        <Card key={config.key} className="group p-2">
          <CardContent className="px-2 py-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl ${config.bgLight} group-hover:scale-110 transition-transform duration-200`}
              >
                <config.icon className={`h-5 w-5 ${config.textColor}`} />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {config.label}
                </p>
                <p
                  className={`text-lg font-bold ${config.textColor} truncate`}
                  title={formatValue(config.key, summary)}
                >
                  {formatValue(config.key, summary)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
