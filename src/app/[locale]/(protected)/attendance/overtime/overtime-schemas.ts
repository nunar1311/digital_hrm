import { z } from "zod";

export const createOvertimeSchema = z
    .object({
        date: z.string().min(1, "Vui lòng chọn ngày làm OT"),
        startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
        endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
        reason: z.string().min(1, "Vui lòng nhập lý do"),
    })
    .refine((data) => data.startTime < data.endTime, {
        message: "Giờ kết thúc phải sau giờ bắt đầu",
        path: ["endTime"],
    });

export type CreateOvertimeValues = z.infer<
    typeof createOvertimeSchema
>;

export const approveNoteSchema = z.object({
    note: z.string().optional(),
});

export type ApproveNoteValues = z.infer<typeof approveNoteSchema>;

export const rejectSchema = z.object({
    reason: z.string().optional(),
});

export type RejectValues = z.infer<typeof rejectSchema>;

export const confirmHoursSchema = z
    .object({
        actualStartTime: z
            .string()
            .min(1, "Vui lòng chọn giờ bắt đầu thực tế"),
        actualEndTime: z
            .string()
            .min(1, "Vui lòng chọn giờ kết thúc thực tế"),
    })
    .refine((data) => data.actualStartTime < data.actualEndTime, {
        message: "Giờ kết thúc phải sau giờ bắt đầu",
        path: ["actualEndTime"],
    });

export type ConfirmHoursValues = z.infer<typeof confirmHoursSchema>;
