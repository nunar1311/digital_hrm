export type NotificationType =
  | "ATTENDANCE"
  | "LEAVE"
  | "PAYROLL"
  | "OVERTIME"
  | "CONTRACT"
  | "ASSET"
  | "RECRUITMENT"
  | "TRAINING"
  | "PERFORMANCE"
  | "SYSTEM"
  | "REMINDER"
  | "APPROVAL"
  | "SETTINGS"
  | "ONBOARDING";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type EmailStatus = "PENDING" | "SENT" | "FAILED" | "BOUNCED";

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  priority?: NotificationPriority;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  html?: string;
  templateCode?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailTemplateData {
  code: string;
  name: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  variables?: string[];
}

export const NOTIFICATION_TYPES = {
  ATTENDANCE: "ATTENDANCE",
  LEAVE: "LEAVE",
  PAYROLL: "PAYROLL",
  OVERTIME: "OVERTIME",
  CONTRACT: "CONTRACT",
  ASSET: "ASSET",
  RECRUITMENT: "RECRUITMENT",
  TRAINING: "TRAINING",
  PERFORMANCE: "PERFORMANCE",
  SYSTEM: "SYSTEM",
  REMINDER: "REMINDER",
  APPROVAL: "APPROVAL",
  SETTINGS: "SETTINGS",
  ONBOARDING: "ONBOARDING",
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export const EMAIL_TEMPLATE_CODES = {
  ATTENDANCE_REMINDER: "ATTENDANCE_REMINDER",
  LEAVE_APPROVED: "LEAVE_APPROVED",
  LEAVE_REJECTED: "LEAVE_REJECTED",
  OVERTIME_APPROVED: "OVERTIME_APPROVED",
  OVERTIME_REJECTED: "OVERTIME_REJECTED",
  PAYSLIP_READY: "PAYSLIP_READY",
  CONTRACT_EXPIRY: "CONTRACT_EXPIRY",
  BIRTHDAY: "BIRTHDAY",
  SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT",
  WELCOME: "WELCOME",
} as const;
