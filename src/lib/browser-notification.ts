"use client";

import { NotificationPriority } from "@/lib/types/notification";

export interface BrowserNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  priority?: NotificationPriority;
}

export interface NotificationAction {
  action: string;
  title: string;
}

class BrowserNotificationService {
  private permission: NotificationPermission = "default";
  private notificationCache: Map<string, Notification> = new Map();

  constructor() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    if (this.permission === "denied") {
      console.warn("Notification permission denied");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "Notification" in window;
  }

  isGranted(): boolean {
    return this.permission === "granted";
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  async show(options: BrowserNotificationOptions): Promise<string | null> {
    if (!this.isSupported()) {
      console.warn("Browser notifications not supported");
      return null;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn("Notification permission not granted");
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/favicon.ico",
        badge: options.badge,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
      });

      const id = options.tag || `notification-${Date.now()}`;
      this.notificationCache.set(id, notification);

      notification.onclick = () => {
        window.focus();
        notification.close();

        if (options.data?.link) {
          window.location.href = options.data.link as string;
        }

        this.notificationCache.delete(id);
      };

      notification.onclose = () => {
        this.notificationCache.delete(id);
      };

      notification.onerror = (error) => {
        console.error("Notification error:", error);
        this.notificationCache.delete(id);
      };

      const autoCloseTime = 5000;
      if (options.priority !== "URGENT") {
        setTimeout(() => {
          notification.close();
        }, autoCloseTime);
      }

      return id;
    } catch (error) {
      console.error("Failed to show notification:", error);
      return null;
    }
  }

  close(id: string): void {
    const notification = this.notificationCache.get(id);
    if (notification) {
      notification.close();
      this.notificationCache.delete(id);
    }
  }

  closeAll(): void {
    this.notificationCache.forEach((notification) => {
      notification.close();
    });
    this.notificationCache.clear();
  }

  showNotification(
    title: string,
    body: string,
    priority: NotificationPriority = "NORMAL",
    link?: string,
    type?: string
  ): Promise<string | null> {
    return this.show({
      title,
      body,
      priority,
      tag: `hrm-${priority.toLowerCase()}-${Date.now()}`,
      data: { link, priority, type },
    });
  }
}

export const browserNotification = new BrowserNotificationService();

export function useBrowserNotification() {
  return browserNotification;
}