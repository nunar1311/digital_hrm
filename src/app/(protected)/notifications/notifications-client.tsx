"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "./actions";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, Clock } from "lucide-react";
import {
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
} from "./use-notifications";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const NOTIFICATION_TYPES = [
    { value: "", label: "Tất cả" },
    { value: "ATTENDANCE", label: "Chấm công" },
    { value: "LEAVE", label: "Nghỉ phép" },
    { value: "PAYROLL", label: "Lương" },
    { value: "OVERTIME", label: "Tăng ca" },
    { value: "CONTRACT", label: "Hợp đồng" },
    { value: "SYSTEM", label: "Hệ thống" },
];

const PRIORITY_COLORS = {
    LOW: "bg-gray-100 text-gray-600",
    NORMAL: "bg-blue-100 text-blue-600",
    HIGH: "bg-orange-100 text-orange-600",
    URGENT: "bg-red-100 text-red-600",
};

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    content: string;
    link?: string | null;
    priority: string;
    isRead: boolean;
    createdAt: Date | string;
}

interface NotificationsPageProps {
    initialData?: NotificationsData;
}

interface NotificationData {
    id: string;
    type: string;
    title: string;
    content: string;
    link?: string | null;
    priority: string;
    isRead: boolean;
    createdAt: Date | string;
}

interface NotificationsData {
    notifications: NotificationData[];
    total: number;
    unreadCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export function NotificationsPage({
    initialData,
}: NotificationsPageProps) {
    const router = useRouter();
    const [filter, setFilter] = useState<string>("");
    const [tab, setTab] = useState<string>("all");
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();

    const { data, isLoading } = useQuery<NotificationsData>({
        queryKey: [
            "notifications",
            {
                isRead:
                    tab === "read"
                        ? true
                        : tab === "unread"
                          ? false
                          : undefined,
                type: filter,
            },
        ],
        queryFn: () =>
            fetchNotifications({
                page: 1,
                pageSize: 50,
                isRead:
                    tab === "read"
                        ? true
                        : tab === "unread"
                          ? false
                          : undefined,
                type: filter || undefined,
            }) as Promise<NotificationsData>,
        initialData: initialData
            ? {
                  notifications: initialData.notifications,
                  total: initialData.total,
                  unreadCount: initialData.unreadCount,
                  page: initialData.page,
                  pageSize: initialData.pageSize,
                  totalPages: initialData.totalPages,
              }
            : undefined,
    });

    const handleNotificationClick = async (notification: {
        id: string;
        isRead: boolean;
        link?: string | null;
    }) => {
        if (!notification.isRead) {
            await markAsRead.mutateAsync(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            ATTENDANCE: "📊",
            LEAVE: "🏖️",
            PAYROLL: "💰",
            OVERTIME: "⏰",
            CONTRACT: "📄",
            ASSET: "📦",
            RECRUITMENT: "👥",
            TRAINING: "📚",
            PERFORMANCE: "📈",
            SYSTEM: "⚙️",
            REMINDER: "🔔",
            APPROVAL: "✅",
        };
        return icons[type] || "📌";
    };

    return (
        <div className="container mx-auto max-w-4xl space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Thông báo</h1>
                    <p className="text-muted-foreground">
                        Quản lý tất cả thông báo của bạn
                    </p>
                </div>
                {data?.unreadCount && data.unreadCount > 0 && (
                    <Button
                        onClick={() => markAllAsRead.mutate()}
                        disabled={markAllAsRead.isPending}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                <Tabs
                    defaultValue="all"
                    value={tab}
                    onValueChange={setTab}
                >
                    <TabsList>
                        <TabsTrigger value="all">
                            Tất cả ({data?.total || 0})
                        </TabsTrigger>
                        <TabsTrigger value="unread">
                            Chưa đọc ({data?.unreadCount || 0})
                        </TabsTrigger>
                        <TabsTrigger value="read">Đã đọc</TabsTrigger>
                    </TabsList>
                </Tabs>
                <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    {NOTIFICATION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                        {tab === "unread"
                            ? "Thông báo chưa đọc"
                            : tab === "read"
                              ? "Thông báo đã đọc"
                              : "Tất cả thông báo"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3"
                                    >
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : data?.notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    Không có thông báo nào
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data?.notifications.map(
                                    (notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "group relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                                                !notification.isRead &&
                                                    "border-l-4 border-l-primary bg-muted/30",
                                            )}
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification,
                                                )
                                            }
                                        >
                                            <span className="text-2xl">
                                                {getTypeIcon(
                                                    notification.type,
                                                )}
                                            </span>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p
                                                        className={cn(
                                                            "font-medium",
                                                            !notification.isRead &&
                                                                "font-semibold",
                                                        )}
                                                    >
                                                        {
                                                            notification.title
                                                        }
                                                    </p>
                                                    <Badge
                                                        className={cn(
                                                            "text-xs",
                                                            PRIORITY_COLORS[
                                                                notification.priority as keyof typeof PRIORITY_COLORS
                                                            ],
                                                        )}
                                                    >
                                                        {
                                                            notification.priority
                                                        }
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {
                                                        notification.content
                                                    }
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(
                                                            new Date(
                                                                notification.createdAt,
                                                            ),
                                                            {
                                                                addSuffix: true,
                                                                locale: vi,
                                                            },
                                                        )}
                                                    </span>
                                                    <span>
                                                        {
                                                            NOTIFICATION_TYPES.find(
                                                                (t) =>
                                                                    t.value ===
                                                                    notification.type,
                                                            )?.label
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(
                                                            e,
                                                        ) => {
                                                            e.stopPropagation();
                                                            markAsRead.mutate(
                                                                notification.id,
                                                            );
                                                        }}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification.mutate(
                                                            notification.id,
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
