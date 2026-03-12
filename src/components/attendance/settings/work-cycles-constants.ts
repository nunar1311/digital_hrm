import * as z from "zod";

export const WEEKDAY_SHORT = [
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "CN",
];
export const WEEKDAY_FULL = [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
];

export const workCycleFormSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên chu kỳ"),
    description: z.string().optional(),
    totalDays: z
        .number()
        .min(1, "Tối thiểu 1 ngày")
        .max(90, "Tối đa 90 ngày"),
});

export type WorkCycleFormValues = z.infer<typeof workCycleFormSchema>;

export interface CycleEntryDraft {
    dayIndex: number;
    shiftId: string | null;
    isDayOff: boolean;
}
