import { prisma } from "@/lib/prisma";
import { sendEmail, sendTemplatedEmail } from "@/lib/email";
import { browserNotification } from "@/lib/browser-notification";
import { NotificationData, NotificationType, NOTIFICATION_TYPES } from "@/lib/types/notification";

export async function createNotification(data: NotificationData) {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      content: data.content,
      link: data.link,
      priority: data.priority || "NORMAL",
      isRead: false,
    },
  });

  return notification;
}

export async function createNotificationsForUsers(
  userIds: string[],
  data: Omit<NotificationData, "userId">
) {
  const notifications = await prisma.notification.createManyAndReturn({
    data: userIds.map((userId) => ({
      userId,
      type: data.type,
      title: data.title,
      content: data.content,
      link: data.link,
      priority: data.priority || "NORMAL",
      isRead: false,
    })),
  });

  return notifications;
}

export async function getUserNotifications(params: {
  userId: string;
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  type?: NotificationType;
}) {
  const { userId, page = 1, pageSize = 20, isRead, type } = params;

  const where: Record<string, unknown> = { userId };
  if (isRead !== undefined) where.isRead = isRead;
  if (type) where.type = type;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  return await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function deleteNotification(notificationId: string, userId: string) {
  return await prisma.notification.delete({
    where: { id: notificationId, userId },
  });
}

export async function deleteOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await prisma.notification.deleteMany({
    where: {
      isRead: true,
      createdAt: { lt: cutoffDate },
    },
  });
}

export async function getNotificationPreference(userId: string) {
  let preference = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    preference = await prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        browserEnabled: true,
        notificationTypes: [],
        browserNotificationTypes: [],
        inboxNotificationTypes: [],
        emailNotificationTypes: [],
      },
    });
  }

  return preference;
}

export async function updateNotificationPreference(
  userId: string,
  data: {
    emailEnabled?: boolean;
    browserEnabled?: boolean;
    notificationTypes?: string[];
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    // Email channel - new separate fields
    emailNotificationTypes?: string[];
    emailQuietHoursEnabled?: boolean;
    emailQuietHoursStart?: string;
    emailQuietHoursEnd?: string;
    // Inbox fields
    inboxNotificationTypes?: string[];
    inboxQuietHoursEnabled?: boolean;
    inboxQuietHoursStart?: string;
    inboxQuietHoursEnd?: string;
    // Browser channel - new separate fields
    browserSoundEnabled?: boolean;
    browserNotificationTypes?: string[];
    browserQuietHoursEnabled?: boolean;
    browserQuietHoursStart?: string;
    browserQuietHoursEnd?: string;
  }
) {
  console.log("[updateNotificationPreference] userId:", userId, "data:", JSON.stringify(data));
  
  // Filter out undefined values to avoid Prisma issues
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
  console.log("[updateNotificationPreference] filtered data:", JSON.stringify(updateData));
  
  return await prisma.notificationPreference.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      emailEnabled: true,
      browserEnabled: true,
      notificationTypes: [],
      browserNotificationTypes: [],
      inboxNotificationTypes: [],
      emailNotificationTypes: [],
      ...updateData,
    },
  });
}

function isInQuietHours(start: string, end: string): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes <= endMinutes) {
    return currentTime >= startMinutes && currentTime < endMinutes;
  } else {
    return currentTime >= startMinutes || currentTime < endMinutes;
  }
}

export async function sendNotificationToUser(
  userId: string,
  data: {
    type: NotificationType;
    title: string;
    content: string;
    link?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    sendEmail?: boolean;
    sendBrowser?: boolean;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPreference: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const preference = user.notificationPreference || {
    emailEnabled: true,
    browserEnabled: true,
    notificationTypes: [],
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    emailNotificationTypes: [],
    emailQuietHoursEnabled: false,
    emailQuietHoursStart: null,
    emailQuietHoursEnd: null,
    browserNotificationTypes: [],
    browserQuietHoursEnabled: false,
    browserQuietHoursStart: null,
    browserQuietHoursEnd: null,
  };

  // Check browser quiet hours using new fields
  let shouldSendBrowserNotification = true;
  if (
    preference.browserQuietHoursEnabled &&
    preference.browserQuietHoursStart &&
    preference.browserQuietHoursEnd
  ) {
    if (isInQuietHours(
      preference.browserQuietHoursStart,
      preference.browserQuietHoursEnd
    )) {
      shouldSendBrowserNotification = false;
      console.log(`[Notification] Skipping browser notification during quiet hours for user ${userId}`);
    }
  }

  // Check email quiet hours using new fields
  if (
    preference.emailQuietHoursEnabled &&
    preference.emailQuietHoursStart &&
    preference.emailQuietHoursEnd
  ) {
    if (isInQuietHours(
      preference.emailQuietHoursStart,
      preference.emailQuietHoursEnd
    )) {
      console.log(`[Notification] Skipping email notification during quiet hours for user ${userId}`);
    }
  }

  const notification = await createNotification({
    userId,
    type: data.type,
    title: data.title,
    content: data.content,
    link: data.link,
    priority: data.priority,
  });

  if (data.sendBrowser !== false && preference.browserEnabled && shouldSendBrowserNotification) {
    // Check browser notification types using browserNotificationTypes
    const browserTypes = (preference.browserNotificationTypes || []) as string[];
    const shouldSendBrowser =
      browserTypes.length === 0 ||
      browserTypes.includes(data.type);

    if (shouldSendBrowser && typeof window !== "undefined") {
      const { browserNotification } = await import("@/lib/browser-notification");
      browserNotification.showNotification(
        data.title,
        data.content,
        data.priority || "NORMAL",
        data.link
      );
    }
  }

  if (data.sendEmail !== false && preference.emailEnabled && user.email) {
    // Use emailNotificationTypes (new field), fallback to notificationTypes (legacy)
    const emailTypes = (preference.emailNotificationTypes || preference.notificationTypes || []) as string[];
    const shouldSendEmail =
      emailTypes.length === 0 ||
      emailTypes.includes(data.type);

    if (shouldSendEmail) {
      await sendEmail({
        to: user.email,
        subject: data.title,
        body: data.content,
      });
    }
  }

  return notification;
}

export async function notifyLeaveApproved(
  userId: string,
  data: {
    employeeName: string;
    startDate: string;
    endDate: string;
    leaveType: string;
  }
) {
  const notification = await sendNotificationToUser(userId, {
    type: NOTIFICATION_TYPES.LEAVE,
    title: "Đơn nghỉ phép đã được duyệt",
    content: `Đơn nghỉ ${data.leaveType} từ ${data.startDate} đến ${data.endDate} đã được duyệt.`,
    link: "/leaves/requests",
    sendEmail: true,
    sendBrowser: true,
  });

  await sendTemplatedEmail(
    (await prisma.user.findUnique({ where: { id: userId } }))?.email || "",
    "LEAVE_APPROVED",
    {
      employeeName: data.employeeName,
      startDate: data.startDate,
      endDate: data.endDate,
      leaveType: data.leaveType,
      reason: "",
    }
  );

  return notification;
}

export async function notifyOvertimeApproved(
  userId: string,
  data: {
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
    hours: string;
  }
) {
  const notification = await sendNotificationToUser(userId, {
    type: NOTIFICATION_TYPES.OVERTIME,
    title: "Đơn tăng ca đã được duyệt",
    content: `Đơn tăng ca ngày ${data.date} từ ${data.startTime} đến ${data.endTime} đã được duyệt.`,
    link: "/attendance/overtime",
    sendEmail: true,
    sendBrowser: true,
  });

  await sendTemplatedEmail(
    (await prisma.user.findUnique({ where: { id: userId } }))?.email || "",
    "OVERTIME_APPROVED",
    {
      employeeName: data.employeeName,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      hours: data.hours,
      coefficient: "1.5",
    }
  );

  return notification;
}

export async function notifyPayslipReady(
  userId: string,
  data: {
    employeeName: string;
    month: string;
    year: string;
  }
) {
  const notification = await sendNotificationToUser(userId, {
    type: NOTIFICATION_TYPES.PAYROLL,
    title: "Phiếu lương đã sẵn sàng",
    content: `Phiếu lương tháng ${data.month}/${data.year} đã sẵn sàng. Vui lòng đăng nhập để xem chi tiết.`,
    link: "/payroll/payslips",
    sendEmail: true,
    sendBrowser: true,
  });

  await sendTemplatedEmail(
    (await prisma.user.findUnique({ where: { id: userId } }))?.email || "",
    "PAYSLIP_READY",
    {
      employeeName: data.employeeName,
      month: data.month,
      year: data.year,
    }
  );

  return notification;
}

export async function notifyAttendanceReminder(
  userId: string,
  data: {
    employeeName: string;
    date: string;
  }
) {
  return await sendNotificationToUser(userId, {
    type: NOTIFICATION_TYPES.ATTENDANCE,
    title: "Nhắc nhở chấm công",
    content: `Bạn chưa chấm công hôm nay (${data.date}). Vui lòng chấm công đúng giờ.`,
    link: "/attendance",
    priority: "HIGH",
    sendEmail: false,
    sendBrowser: true,
  });
}
