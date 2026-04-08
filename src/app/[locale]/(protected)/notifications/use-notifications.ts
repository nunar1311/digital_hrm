"use client";

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    fetchNotifications,
    fetchUnreadCount,
    readNotification,
    readAllNotifications,
    removeNotification,
    fetchPreferences,
    savePreferences,
} from "./actions";
import { toast } from "sonner";

export function useNotifications(params: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    type?: string;
}) {
    return useQuery({
        queryKey: ["notifications", params],
        queryFn: () => fetchNotifications(params),
    });
}

export function useUnreadCount() {
    return useQuery({
        queryKey: ["notification-unread-count"],
        queryFn: fetchUnreadCount,
        refetchInterval: 30000,
    });
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (notificationId: string) =>
            readNotification(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["notifications"],
            });
            queryClient.invalidateQueries({
                queryKey: ["notification-unread-count"],
            });
        },
        onError: () => {
            toast.error("Không thể đánh dấu đã đọc");
        },
    });
}

export function useMarkAllAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => readAllNotifications(),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["notifications"],
            });
            queryClient.invalidateQueries({
                queryKey: ["notification-unread-count"],
            });
            toast.success("Đã đánh dấu tất cả là đã đọc");
        },
        onError: () => {
            toast.error("Không thể đánh dấu tất cả là đã đọc");
        },
    });
}

export function useDeleteNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (notificationId: string) =>
            removeNotification(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["notifications"],
            });
            queryClient.invalidateQueries({
                queryKey: ["notification-unread-count"],
            });
            toast.success("Đã xóa thông báo");
        },
        onError: () => {
            toast.error("Không thể xóa thông báo");
        },
    });
}

export function useNotificationPreferences() {
    return useQuery({
        queryKey: ["notification-preferences"],
        queryFn: fetchPreferences,
    });
}

export function useUpdatePreferences() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof savePreferences>[0]) =>
            savePreferences(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["notification-preferences"],
            });
            toast.success("Đã lưu cài đặt thông báo");
        },
        onError: () => {
            toast.error("Không thể lưu cài đặt");
        },
    });
}

// export function useSendTestEmail() {
//     const queryClient = useQueryClient();
//     return useMutation({
//         mutationFn: () => sendTestNotificationEmail(),
//         onSuccess: (result) => {
//             if (result.success) {
//                 toast.success(
//                     "Đã gửi thông báo thử nghiệm đến email của bạn",
//                 );
//             } else {
//                 toast.error(
//                     result.error || "Không thể gửi email thử nghiệm",
//                 );
//             }
//         },
//         onError: () => {
//             toast.error("Không thể gửi email thử nghiệm");
//         },
//     });
// }
