"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  AlertTriangle,
  DollarSign,
  Calendar,
  FileText,
  Award,
  ShieldAlert,
} from "lucide-react";
import { getRewards } from "@/app/(protected)/employees/actions";

interface Props {
  employeeId: string;
}

export function RewardsTab({ employeeId }: Props) {
  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["rewards", employeeId],
    queryFn: () => getRewards(employeeId),
  });

  const rewardItems = rewards.filter((r) => r.type === "REWARD");
  const disciplineItems = rewards.filter((r) => r.type === "DISCIPLINE");

  const totalRewardAmount = rewardItems.reduce(
    (sum, r) => sum + (r.amount ? Number(r.amount) : 0),
    0
  );
  const totalDisciplineAmount = disciplineItems.reduce(
    (sum, r) => sum + (r.amount ? Number(r.amount) : 0),
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {rewardItems.length}
              </div>
              <div className="text-xs text-muted-foreground">Khen thưởng</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200/50 bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {disciplineItems.length}
              </div>
              <div className="text-xs text-muted-foreground">Kỷ luật</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {totalRewardAmount > 0
                  ? `${(totalRewardAmount / 1000000).toFixed(1)}tr`
                  : "0"}
              </div>
              <div className="text-xs text-muted-foreground">
                Tổng thưởng (VNĐ)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {totalDisciplineAmount > 0
                  ? `${(totalDisciplineAmount / 1000000).toFixed(1)}tr`
                  : "0"}
              </div>
              <div className="text-xs text-muted-foreground">
                Tổng phạt (VNĐ)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reward & Discipline Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khen thưởng */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Khen thưởng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rewardItems.length > 0 ? (
              <div className="space-y-3">
                {rewardItems.map((reward) => (
                  <div
                    key={reward.id}
                    className="group p-4 rounded-xl border bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-950/10 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {reward.title}
                      </h4>
                      <Badge
                        variant={
                          reward.status === "APPROVED"
                            ? "default"
                            : reward.status === "PENDING"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs shrink-0 ml-2"
                      >
                        {reward.status === "APPROVED"
                          ? "Đã duyệt"
                          : reward.status === "PENDING"
                            ? "Chờ duyệt"
                            : "Từ chối"}
                      </Badge>
                    </div>
                    {reward.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {reward.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(reward.decisionDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                      {reward.decisionNo && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          QĐ: {reward.decisionNo}
                        </span>
                      )}
                      {reward.amount && (
                        <span className="font-mono font-medium text-emerald-600">
                          +
                          {Number(reward.amount).toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Chưa có khen thưởng nào.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kỷ luật */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Kỷ luật
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disciplineItems.length > 0 ? (
              <div className="space-y-3">
                {disciplineItems.map((item) => (
                  <div
                    key={item.id}
                    className="group p-4 rounded-xl border bg-gradient-to-r from-red-50/30 to-transparent dark:from-red-950/10 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                        {item.title}
                      </h4>
                      <Badge
                        variant={
                          item.status === "APPROVED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs shrink-0 ml-2"
                      >
                        {item.status === "APPROVED"
                          ? "Đã xử lý"
                          : item.status === "PENDING"
                            ? "Chờ xử lý"
                            : "Đã hủy"}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.decisionDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                      {item.decisionNo && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          QĐ: {item.decisionNo}
                        </span>
                      )}
                      {item.amount && (
                        <span className="font-mono font-medium text-red-600">
                          -{Number(item.amount).toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Không có kỷ luật nào.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
