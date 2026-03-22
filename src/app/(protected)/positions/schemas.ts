import { z } from "zod";

export const positionAuthorityEnum = z.enum([
    "EXECUTIVE",
    "DIRECTOR",
    "MANAGER",
    "DEPUTY",
    "TEAM_LEAD",
    "STAFF",
    "INTERN",
]);

export const positionStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const createPositionSchema = z.object({
    name: z.string().min(2, "Tên chức vụ phải có ít nhất 2 ký tự"),
    code: z
        .string()
        .min(2, "Mã chức vụ phải có ít nhất 2 ký tự")
        .max(20, "Mã chức vụ tối đa 20 ký tự")
        .regex(/^[A-Z0-9_]+$/, "Mã chức vụ chỉ chứa chữ hoa, số và dấu gạch dưới"),
    authority: positionAuthorityEnum.default("STAFF"),
    departmentId: z.string().optional(),
    level: z.number().int().min(1).max(10).default(5),
    description: z.string().optional(),
    parentId: z.string().optional(),
    minSalary: z.number().optional(),
    maxSalary: z.number().optional(),
    status: positionStatusEnum.default("ACTIVE"),
    sortOrder: z.number().int().default(0),
});

export const updatePositionSchema = createPositionSchema.partial();

export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
