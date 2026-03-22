import { prisma } from "@/lib/prisma";
import { EmailData, EmailTemplateData } from "./types/notification";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@company.com";
const FROM_NAME = process.env.FROM_NAME || "Digital HRM";

export async function sendEmail(data: EmailData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const emailLog = await prisma.emailLog.create({
      data: {
        recipient: data.to,
        subject: data.subject,
        body: data.body,
        templateCode: data.templateCode,
        metadata: data.metadata,
        status: "PENDING",
      },
    });

    if (!SMTP_HOST || !SMTP_USER) {
      console.log("[Email] SMTP not configured, logging email instead:", {
        to: data.to,
        subject: data.subject,
        body: data.body,
      });

      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      return { success: true, messageId: emailLog.id };
    }

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: data.to,
      subject: data.subject,
      text: data.body,
      html: data.html || data.body,
    });

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getEmailTemplate(code: string) {
  return await prisma.emailTemplate.findUnique({
    where: { code, isActive: true },
  });
}

export async function createEmailTemplate(data: EmailTemplateData) {
  return await prisma.emailTemplate.create({
    data: {
      code: data.code,
      name: data.name,
      subject: data.subject,
      body: data.body,
      bodyHtml: data.bodyHtml,
      variables: data.variables || [],
      isActive: true,
    },
  });
}

export async function updateEmailTemplate(
  code: string,
  data: Partial<EmailTemplateData>
) {
  return await prisma.emailTemplate.update({
    where: { code },
    data: {
      ...(data.subject && { subject: data.subject }),
      ...(data.body && { body: data.body }),
      ...(data.bodyHtml && { bodyHtml: data.bodyHtml }),
      ...(data.variables && { variables: data.variables }),
      ...(data.name && { name: data.name }),
    },
  });
}

export async function sendTemplatedEmail(
  to: string,
  templateCode: string,
  variables: Record<string, string>
) {
  const template = await getEmailTemplate(templateCode);
  if (!template) {
    return { success: false, error: "Template not found" };
  }

  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replaceAll(placeholder, value);
    body = body.replaceAll(placeholder, value);
  }

  const generatedHtml = template.bodyHtml
    ? Object.entries(variables).reduce(
        (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
        template.bodyHtml
      )
    : body;

  const { render } = await import("@react-email/components");
  const NotificationEmail = (await import("@/components/emails/notification-email")).default;

  const finalHtml = await render(
    NotificationEmail({
      employeeName: variables.employeeName || "bạn",
      title: subject,
      content: generatedHtml,
    })
  );

  return sendEmail({
    to,
    subject,
    body,
    html: finalHtml,
    templateCode,
    metadata: variables,
  });
}

export async function getEmailLogs(params: {
  userId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { userId, status, page = 1, pageSize = 20 } = params;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.emailLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateData[] = [
  {
    code: "ATTENDANCE_REMINDER",
    name: "Nhắc nhở chấm công",
    subject: "Nhắc nhở: Bạn chưa chấm công hôm nay",
    body: `Xin chào {{employeeName}},

Bạn chưa thực hiện chấm công hôm nay ({{date}}). Vui lòng chấm công đúng giờ để đảm bảo quyền lợi của bạn.

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
<p>Bạn chưa thực hiện chấm công hôm nay ({{date}}).</p>
<p>Vui lòng chấm công đúng giờ để đảm bảo quyền lợi của bạn.</p>
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName", "date"],
  },
  {
    code: "LEAVE_APPROVED",
    name: "Đơn nghỉ phép được duyệt",
    subject: "Đơn nghỉ phép của bạn đã được duyệt",
    body: `Xin chào {{employeeName}},

Đơn nghỉ phép của bạn từ ngày {{startDate}} đến {{endDate}} đã được duyệt.

Loại nghỉ: {{leaveType}}
Lý do: {{reason}}

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
<p>Đơn nghỉ phép của bạn đã được duyệt:</p>
<ul>
<li>Ngày nghỉ: {{startDate}} - {{endDate}}</li>
<li>Loại nghỉ: {{leaveType}}</li>
<li>Lý do: {{reason}}</li>
</ul>
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName", "startDate", "endDate", "leaveType", "reason"],
  },
  {
    code: "LEAVE_REJECTED",
    name: "Đơn nghỉ phép bị từ chối",
    subject: "Đơn nghỉ phép của bạn bị từ chối",
    body: `Xin chào {{employeeName}},

Đơn nghỉ phép của bạn từ ngày {{startDate}} đến {{endDate}} đã bị từ chối.

Lý do từ chối: {{rejectionReason}}

Vui lòng liên hệ quản lý để biết thêm chi tiết.

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
<p>Đơn nghỉ phép của bạn đã bị từ chối:</p>
<ul>
<li>Ngày nghỉ: {{startDate}} - {{endDate}}</li>
<li>Lý do từ chối: {{rejectionReason}}</li>
</ul>
<p>Vui lòng liên hệ quản lý để biết thêm chi tiết.</p>
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName", "startDate", "endDate", "rejectionReason"],
  },
  {
    code: "OVERTIME_APPROVED",
    name: "Đơn tăng ca được duyệt",
    subject: "Đơn tăng ca của bạn đã được duyệt",
    body: `Xin chào {{employeeName}},

Đơn tăng ca của bạn ngày {{date}} từ {{startTime}} đến {{endTime}} đã được duyệt.

Số giờ: {{hours}} giờ
Hệ số: {{coefficient}}x

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
<p>Đơn tăng ca của bạn đã được duyệt:</p>
<ul>
<li>Ngày: {{date}}</li>
<li>Thời gian: {{startTime}} - {{endTime}}</li>
<li>Số giờ: {{hours}} giờ</li>
<li>Hệ số: {{coefficient}}x</li>
</ul>
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName", "date", "startTime", "endTime", "hours", "coefficient"],
  },
  {
    code: "PAYSLIP_READY",
    name: "Phiếu lương sẵn sàng",
    subject: "Phiếu lương tháng {{month}}/{{year}} đã sẵn sàng",
    body: `Xin chào {{employeeName}},

Phiếu lương tháng {{month}}/{{year}} của bạn đã sẵn sàng.

Vui lòng đăng nhập hệ thống HR để xem chi tiết.

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
<p>Phiếu lương tháng {{month}}/{{year}} của bạn đã sẵn sàng.</p>
<p>Vui lòng đăng nhập hệ thống HR để xem chi tiết.</p>
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName", "month", "year"],
  },
  {
    code: "CONTRACT_EXPIRY",
    name: "Cảnh báo hợp đồng sắp hết hạn",
    subject: "Cảnh báo: Hợp đồng lao động sắp hết hạn",
    body: `Xin chào {{employeeName}},

Hợp đồng lao động của bạn sẽ hết hạn vào ngày {{expiryDate}}.

Vui liên hệ phòng Nhân sự để làm thủ tục gia hạn hoặc ký hợp đồng mới.

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
<p>Hợp đồng lao động của bạn sẽ hết hạn vào ngày <strong>{{expiryDate}}</strong>.</p>
<p>Vui liên hệ phòng Nhân sự để làm thủ tục gia hạn hoặc ký hợp đồng mới.</p>
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName", "expiryDate"],
  },
  {
    code: "BIRTHDAY",
    name: "Chúc mừng sinh nhật",
    subject: "Chúc mừng sinh nhật {{employeeName}}!",
    body: `Xin chào {{employeeName}},

Chúc mừng sinh nhật bạn! Chúc bạn có một ngày sinh nhật vui vẻ, hạnh phúc và thành công!

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
<p>🎉 Chúc mừng sinh nhật bạn! 🎉</p>
<p>Chúc bạn có một ngày sinh nhật vui vẻ, hạnh phúc và thành công!</p>
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName"],
  },
  {
    code: "WELCOME",
    name: "Chào mừng nhân viên mới",
    subject: "Chào mừng {{employeeName}} đến với công ty!",
    body: `Xin chào {{employeeName}},

Chào mừng bạn đến với {{companyName}}!

Thông tin đăng nhập:
- Email: {{email}}
- Mật khẩu: {{password}}

Vui lòng đăng nhập và đổi mật khẩu ngay lần đầu sử dụng.

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
<p>Chào mừng bạn đến với <strong>{{companyName}}</strong>!</p>
<h3>Thông tin đăng nhập:</h3>
<ul>
<li>Email: {{email}}</li>
<li>Mật khẩu: {{password}}</li>
</ul>
<p>Vui lòng đăng nhập và đổi mật khẩu ngay lần đầu sử dụng.</p>
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName", "companyName", "email", "password"],
  },
  {
    code: "SYSTEM_ANNOUNCEMENT",
    name: "Thông báo hệ thống",
    subject: "{{title}}",
    body: `Xin chào {{employeeName}},

{{content}}

Trân trọng,
Ban Quản lý HR`,
    bodyHtml: `<h2>Xin chào {{employeeName}},</h2>
{{content}}
<p>Trân trọng,<br>Ban Quản lý HR</p>`,
    variables: ["employeeName", "title", "content"],
  },
];

export async function seedEmailTemplates() {
  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { code: template.code },
      update: {},
      create: template,
    });
  }
}
