"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ArrowUpCircle,
  ScrollText,
  DollarSign,
  Plane,
  Gift,
  AlertTriangle,
  GraduationCap,
  Clock,
  Filter,
  LogOut,
} from "lucide-react";
import { getEmployeeTimeline } from "@/app/[locale]/(protected)/employees/actions";
import { useState, useMemo } from "react";
import Loading from "@/app/[locale]/(protected)/loading";
import { useTranslations } from "next-intl";

interface Props {
  employeeId: string;
}

const EVENT_TYPES = [
  { value: "ALL", labelKey: "employeesTimelineEventAll", icon: Clock },
  { value: "HIRED", labelKey: "employeesTimelineEventHired", icon: Building2 },
  {
    value: "PROMOTED",
    labelKey: "employeesTimelineEventPromoted",
    icon: ArrowUpCircle,
  },
  {
    value: "CONTRACT_RENEWED",
    labelKey: "employeesTimelineEventContractRenewed",
    icon: ScrollText,
  },
  {
    value: "SALARY_CHANGE",
    labelKey: "employeesTimelineEventSalaryChange",
    icon: DollarSign,
  },
  { value: "LEAVE", labelKey: "employeesTimelineEventLeave", icon: Plane },
  { value: "REWARD", labelKey: "employeesTimelineEventReward", icon: Gift },
  {
    value: "DISCIPLINE",
    labelKey: "employeesTimelineEventDiscipline",
    icon: AlertTriangle,
  },
  {
    value: "TRAINING",
    labelKey: "employeesTimelineEventTraining",
    icon: GraduationCap,
  },
  {
    value: "DEPARTMENT_CHANGE",
    labelKey: "employeesTimelineEventDepartmentChange",
    icon: Building2,
  },
  {
    value: "RESIGNED",
    labelKey: "employeesTimelineEventResigned",
    icon: LogOut,
  },
] as const;

export function TimelineTab({ employeeId }: Props) {
  const t = useTranslations("ProtectedPages");
  const [filterType, setFilterType] = useState("ALL");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["employeeTimeline", employeeId],
    queryFn: () => getEmployeeTimeline(employeeId),
  });

  const filteredEvents = useMemo(() => {
    if (filterType === "ALL") return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  // Group by year
  const groupedByYear = useMemo(() => {
    const groups: Record<string, typeof filteredEvents> = {};
    filteredEvents.forEach((event) => {
      const year = new Date(event.date).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(event);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [filteredEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "HIRED":
        return <Building2 className="h-4 w-4 text-emerald-600" />;
      case "PROMOTED":
        return <ArrowUpCircle className="h-4 w-4 text-primary" />;
      case "CONTRACT_RENEWED":
        return <ScrollText className="h-4 w-4 text-blue-600" />;
      case "SALARY_CHANGE":
        return <DollarSign className="h-4 w-4 text-amber-600" />;
      case "LEAVE":
        return <Plane className="h-4 w-4 text-purple-600" />;
      case "REWARD":
        return <Gift className="h-4 w-4 text-pink-600" />;
      case "DISCIPLINE":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "TRAINING":
        return <GraduationCap className="h-4 w-4 text-indigo-600" />;
      case "DEPARTMENT_CHANGE":
        return <Building2 className="h-4 w-4 text-cyan-600" />;
      case "RESIGNED":
        return <LogOut className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-slate-400" />;
    }
  };

  const getEventBg = (type: string) => {
    switch (type) {
      case "HIRED":
        return "bg-emerald-100 ring-emerald-200/50 dark:bg-emerald-900/40 dark:ring-emerald-800/50";
      case "PROMOTED":
        return "bg-primary/20 ring-primary/10";
      case "CONTRACT_RENEWED":
        return "bg-blue-100 ring-blue-200/50 dark:bg-blue-900/40 dark:ring-blue-800/50";
      case "SALARY_CHANGE":
        return "bg-amber-100 ring-amber-200/50 dark:bg-amber-900/40 dark:ring-amber-800/50";
      case "LEAVE":
        return "bg-purple-100 ring-purple-200/50 dark:bg-purple-900/40 dark:ring-purple-800/50";
      case "REWARD":
        return "bg-pink-100 ring-pink-200/50 dark:bg-pink-900/40 dark:ring-pink-800/50";
      case "DISCIPLINE":
        return "bg-red-100 ring-red-200/50 dark:bg-red-900/40 dark:ring-red-800/50";
      case "TRAINING":
        return "bg-indigo-100 ring-indigo-200/50 dark:bg-indigo-900/40 dark:ring-indigo-800/50";
      case "DEPARTMENT_CHANGE":
        return "bg-cyan-100 ring-cyan-200/50 dark:bg-cyan-900/40 dark:ring-cyan-800/50";
      case "RESIGNED":
        return "bg-red-100 ring-red-200/50 dark:bg-red-900/40 dark:ring-red-800/50";
      default:
        return "bg-slate-100 ring-slate-200/50 dark:bg-slate-800/40";
    }
  };

  const getEventTypeLabel = (type: string) => {
    const found = EVENT_TYPES.find((t) => t.value === type);
    return found ? t(found.labelKey) : type;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {t("employeesTimelineTitle")}
            <Badge variant="secondary" className="ml-1 text-xs">
              {t("employeesTimelineCount", { count: filteredEvents.length })}
            </Badge>
          </CardTitle>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Filter className="h-4 w-4 text-muted-foreground mr-1 mt-0.5" />
          {EVENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                filterType === type.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t(type.labelKey)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length > 0 ? (
          <div className="space-y-8">
            {groupedByYear.map(([year, yearEvents]) => (
              <div key={year}>
                {/* Year separator */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {year}
                  </div>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="relative border-l-2 border-border/50 ml-6 space-y-6 pb-2">
                  {yearEvents.map((event) => (
                    <div key={event.id} className="relative pl-8 group">
                      {/* Timeline Icon */}
                      <span
                        className={`absolute -left-4 top-1 h-8 w-8 rounded-full flex items-center justify-center ring-4 shadow-sm transition-transform duration-200 group-hover:scale-110 ${getEventBg(event.type)}`}
                      >
                        {getEventIcon(event.type)}
                      </span>

                      <div className="p-3 rounded-xl border bg-card hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1">
                          <h3 className="text-sm font-semibold text-foreground">
                            {event.title}
                          </h3>
                          <time className="text-xs text-muted-foreground font-mono">
                            {new Date(event.date).toLocaleDateString()}
                          </time>
                        </div>

                        <Badge
                          variant="outline"
                          className="mb-2 text-xs font-normal"
                        >
                          {getEventTypeLabel(event.type)}
                        </Badge>

                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}

                        {/* Metadata */}
                        {event.metadata &&
                          typeof event.metadata === "object" &&
                          Object.keys(event.metadata as Record<string, unknown>)
                            .length > 0 && (
                            <div className="mt-2 text-xs font-mono text-muted-foreground bg-muted/30 p-2 rounded-lg border border-dashed flex gap-2 flex-wrap">
                              {Object.entries(
                                event.metadata as Record<string, unknown>,
                              ).map(([key, val]) => (
                                <span
                                  key={key}
                                  className="bg-background px-1.5 py-0.5 rounded border"
                                >
                                  <span className="opacity-60">{key}:</span>{" "}
                                  {String(val)}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              {filterType === "ALL"
                ? t("employeesTimelineEmptyAll")
                : t("employeesTimelineEmptyFiltered")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

