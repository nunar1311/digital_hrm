"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Users, Briefcase, Calendar, TrendingUp } from "lucide-react";

import { getRecruitmentStats } from "./actions";
import { JobPostingList } from "@/components/recruitment/job-posting-list";
import { CandidateList } from "@/components/recruitment/candidate-list";
import { InterviewList } from "@/components/recruitment/interview-list";
import type { RecruitmentStats } from "./types";

export function RecruitmentClient() {
    const t = useTranslations("ProtectedPages");

    const { data: stats } = useQuery<RecruitmentStats>({
        queryKey: ["recruitment", "stats"],
        queryFn: getRecruitmentStats,
    });

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold">{t("recruitmentTitle")}</h1>
                <p className="text-sm text-muted-foreground">
                    {t("recruitmentDescription")}
                </p>
            </div>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            {t("recruitmentStatsJobPostings")}
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalJobPostings || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("recruitmentStatsOpenJobPostings", {
                                count: stats?.openJobPostings || 0,
                            })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            {t("recruitmentStatsCandidates")}
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalCandidates || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("recruitmentStatsActiveCandidates", {
                                count: stats?.activeCandidates || 0,
                            })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            {t("recruitmentStatsInterviews")}
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalInterviews || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("recruitmentStatsUpcomingInterviews", {
                                count: stats?.upcomingInterviews || 0,
                            })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            {t("recruitmentStatsHired")}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.hiredThisMonth || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("recruitmentStatsThisMonth")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="job-postings" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="job-postings">
                        {t("recruitmentTabJobPostings")}
                    </TabsTrigger>
                    <TabsTrigger value="candidates">
                        {t("recruitmentTabCandidates")}
                    </TabsTrigger>
                    <TabsTrigger value="interviews">
                        {t("recruitmentTabInterviews")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="job-postings">
                    <JobPostingList />
                </TabsContent>

                <TabsContent value="candidates">
                    <CandidateList />
                </TabsContent>

                <TabsContent value="interviews">
                    <InterviewList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
