"use server";

import {
    requireAuth,
    requirePermission,
} from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ─── JOB POSTING ACTIONS ───

const jobPostingSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    description: z.string().min(1, "Mô tả không được để trống"),
    requirements: z.string().min(1, "Yêu cầu không được để trống"),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    headcount: z.number().int().positive().default(1),
    employmentType: z
        .enum(["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT"])
        .default("FULL_TIME"),
    priority: z
        .enum(["LOW", "NORMAL", "HIGH", "URGENT"])
        .default("NORMAL"),
    deadline: z.string().optional(),
    benefits: z.string().optional(),
    workLocation: z.string().optional(),
    interviewRounds: z.number().int().positive().default(1),
    status: z.enum(["DRAFT", "OPEN", "ON_HOLD", "CLOSED"]).optional(),
});

export async function getJobPostings(
    filters?: {
        status?: string;
        priority?: string;
        departmentId?: string;
        search?: string;
    },
    options?: { page?: number; limit?: number },
) {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    const { status, priority, departmentId, search } = filters || {};
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && status !== "") where.status = status;
    if (priority && priority !== "") where.priority = priority;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
        where.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.jobPosting.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                department: { select: { id: true, name: true } },
                position: { select: { id: true, name: true } },
                _count: {
                    select: {
                        candidates: true,
                        interviews: true,
                    },
                },
            },
        }),
        prisma.jobPosting.count({ where }),
    ]);

    const itemsWithStats = items.map((item) => ({
        id: item.id,
        title: item.title,
        departmentId: item.departmentId,
        departmentName: item.department?.name || null,
        positionId: item.positionId,
        positionName: item.position?.name || null,
        description: item.description,
        requirements: item.requirements,
        salaryMin: item.salaryMin ? Number(item.salaryMin) : null,
        salaryMax: item.salaryMax ? Number(item.salaryMax) : null,
        salaryCurrency: item.salaryCurrency,
        headcount: item.headcount,
        employmentType: item.employmentType,
        status: item.status,
        priority: item.priority,
        deadline: item.deadline?.toISOString() || null,
        benefits: item.benefits,
        workLocation: item.workLocation,
        interviewRounds: item.interviewRounds,
        createdBy: item.createdBy,
        reviewedBy: item.reviewedBy,
        reviewedAt: item.reviewedAt?.toISOString() || null,
        closedBy: item.closedBy,
        closedAt: item.closedAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        candidateCount: item._count.candidates,
        interviewCount: item._count.interviews,
        hiredCount: 0,
    }));

    return {
        items: itemsWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getJobPostingById(id: string) {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    const item = await prisma.jobPosting.findUnique({
        where: { id },
        include: {
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
            candidates: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            _count: {
                select: {
                    candidates: true,
                    interviews: true,
                },
            },
        },
    });

    if (!item) return null;

    const hiredCount = await prisma.candidate.count({
        where: { jobPostingId: id, stage: "HIRED" },
    });

    return {
        id: item.id,
        title: item.title,
        departmentId: item.departmentId,
        departmentName: item.department?.name || null,
        positionId: item.positionId,
        positionName: item.position?.name || null,
        description: item.description,
        requirements: item.requirements,
        salaryMin: item.salaryMin ? Number(item.salaryMin) : null,
        salaryMax: item.salaryMax ? Number(item.salaryMax) : null,
        salaryCurrency: item.salaryCurrency,
        headcount: item.headcount,
        employmentType: item.employmentType,
        status: item.status,
        priority: item.priority,
        deadline: item.deadline?.toISOString() || null,
        benefits: item.benefits,
        workLocation: item.workLocation,
        interviewRounds: item.interviewRounds,
        createdBy: item.createdBy,
        reviewedBy: item.reviewedBy,
        reviewedAt: item.reviewedAt?.toISOString() || null,
        closedBy: item.closedBy,
        closedAt: item.closedAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        candidateCount: item._count.candidates,
        interviewCount: item._count.interviews,
        hiredCount,
    };
}

export async function createJobPosting(data: z.infer<typeof jobPostingSchema>) {
    const session = await requirePermission(Permission.RECRUITMENT_POST_CREATE);

    const validated = jobPostingSchema.parse(data);

    const item = await prisma.jobPosting.create({
        data: {
            ...validated,
            deadline: validated.deadline
                ? new Date(validated.deadline)
                : null,
            createdBy: session.user.id,
        },
    });

    revalidatePath("/recruitment");
    return item;
}

export async function updateJobPosting(
    id: string,
    data: Partial<z.infer<typeof jobPostingSchema>> & { status?: string },
) {
    await requirePermission(Permission.RECRUITMENT_POST_EDIT);

    const validated = jobPostingSchema.partial().parse(data);

    const updateData: Record<string, unknown> = { ...validated };

    if (validated.deadline) {
        updateData.deadline = new Date(validated.deadline);
    }

    if (data.status) {
        const session = await requireAuth();
        if (data.status === "CLOSED") {
            updateData.closedBy = session.user.id;
            updateData.closedAt = new Date();
        } else if (data.status === "OPEN") {
            updateData.reviewedBy = session.user.id;
            updateData.reviewedAt = new Date();
        }
    }

    const item = await prisma.jobPosting.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/recruitment");
    return item;
}

export async function deleteJobPosting(id: string) {
    await requirePermission(Permission.RECRUITMENT_POST_DELETE);

    await prisma.jobPosting.delete({ where: { id } });

    revalidatePath("/recruitment");
    return { success: true };
}

// ─── CANDIDATE ACTIONS ───

const candidateSchema = z.object({
    jobPostingId: z.string().min(1, "Vị trí ứng tuyển không được để trống"),
    name: z.string().min(1, "Họ tên không được để trống"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    cvUrl: z.string().optional(),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    portfolioUrl: z.string().url().optional().or(z.literal("")),
    source: z
        .enum(["WEBSITE", "LINKEDIN", "FACEBOOK", "REFERRAL", "AGENCY", "OTHER"])
        .default("WEBSITE"),
    sourceDetail: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export async function getCandidates(
    filters?: {
        stage?: string;
        jobPostingId?: string;
        source?: string;
        search?: string;
    },
    options?: { page?: number; limit?: number },
) {
    await requirePermission(Permission.RECRUITMENT_CANDIDATE_VIEW);

    const { stage, jobPostingId, source, search } = filters || {};
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (stage && stage !== "") where.stage = stage;
    if (jobPostingId) where.jobPostingId = jobPostingId;
    if (source && source !== "") where.source = source;
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.candidate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                jobPosting: { select: { id: true, title: true } },
                CandidateToCandidateTag: true,
            },
        }),
        prisma.candidate.count({ where }),
    ]);

    return {
        items: items.map((item) => ({
            id: item.id,
            jobPostingId: item.jobPostingId,
            jobPostingTitle: item.jobPosting.title,
            name: item.name,
            email: item.email,
            phone: item.phone,
            gender: item.gender as "MALE" | "FEMALE" | "OTHER" | null,
            dateOfBirth: item.dateOfBirth?.toISOString() || null,
            address: item.address,
            cvUrl: item.cvUrl,
            cvFileName: item.cvFileName,
            linkedinUrl: item.linkedinUrl,
            portfolioUrl: item.portfolioUrl,
            source: item.source,
            sourceDetail: item.sourceDetail,
            stage: item.stage,
            rating: item.rating,
            rejectionReason: item.rejectionReason,
            hiredSalary: item.hiredSalary ? Number(item.hiredSalary) : null,
            hiredDate: item.hiredDate?.toISOString() || null,
            notes: item.notes,
            tags: item.tags,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
            candidateTags: item.CandidateToCandidateTag,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getCandidatesByJobPosting(jobPostingId: string) {
    await requirePermission(Permission.RECRUITMENT_CANDIDATE_VIEW);

    const items = await prisma.candidate.findMany({
        where: { jobPostingId },
        orderBy: { createdAt: "desc" },
        include: {
            jobPosting: { select: { id: true, title: true } },
            CandidateToCandidateTag: true,
        },
    });

    return items.map((item) => ({
        id: item.id,
        jobPostingId: item.jobPostingId,
        jobPostingTitle: item.jobPosting.title,
        name: item.name,
        email: item.email,
        phone: item.phone,
        gender: item.gender as "MALE" | "FEMALE" | "OTHER" | null,
        dateOfBirth: item.dateOfBirth?.toISOString() || null,
        address: item.address,
        cvUrl: item.cvUrl,
        cvFileName: item.cvFileName,
        linkedinUrl: item.linkedinUrl,
        portfolioUrl: item.portfolioUrl,
        source: item.source,
        sourceDetail: item.sourceDetail,
        stage: item.stage,
        rating: item.rating,
        rejectionReason: item.rejectionReason,
        hiredSalary: item.hiredSalary ? Number(item.hiredSalary) : null,
        hiredDate: item.hiredDate?.toISOString() || null,
        notes: item.notes,
        tags: item.tags,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        candidateTags: item.CandidateToCandidateTag,
    }));
}

export async function getInterviewsByJobPosting(jobPostingId: string) {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    const items = await prisma.interview.findMany({
        where: { jobPostingId },
        orderBy: { scheduledDate: "asc" },
        include: {
            candidate: { select: { id: true, name: true, email: true } },
            jobPosting: { select: { id: true, title: true } },
        },
    });

    return items.map((interview) => ({
        id: interview.id,
        candidateId: interview.candidateId,
        candidateName: interview.candidate.name,
        jobPostingId: interview.jobPostingId,
        jobPostingTitle: interview.jobPosting.title,
        round: interview.round,
        type: interview.type,
        method: interview.method,
        scheduledDate: interview.scheduledDate.toISOString().split("T")[0],
        scheduledTime: interview.scheduledTime,
        endTime: interview.endTime || null,
        duration: interview.duration,
        location: interview.location,
        meetingLink: interview.meetingLink,
        meetingId: interview.meetingId,
        interviewerIds: interview.interviewerIds,
        interviewerNames: interview.interviewerNames,
        status: interview.status,
        result: interview.result,
        score: interview.score,
        strengths: interview.strengths,
        weaknesses: interview.weaknesses,
        notes: interview.notes,
        googleEventId: interview.googleEventId,
        calendarSync: interview.calendarSync,
        reviewedBy: interview.reviewedBy,
        reviewedAt: interview.reviewedAt?.toISOString() || null,
        createdAt: interview.createdAt.toISOString(),
        updatedAt: interview.updatedAt.toISOString(),
    }));
}

export async function getCandidateById(id: string) {
    await requirePermission(Permission.RECRUITMENT_CANDIDATE_VIEW);

    const item = await prisma.candidate.findUnique({
        where: { id },
        include: {
            jobPosting: { select: { id: true, title: true } },
            CandidateToCandidateTag: true,
            interviews: {
                orderBy: { scheduledDate: "desc" },
                include: {
                    feedbacks: true,
                },
            },
        },
    });

    if (!item) return null;

    return {
        id: item.id,
        jobPostingId: item.jobPostingId,
        jobPostingTitle: item.jobPosting.title,
        name: item.name,
        email: item.email,
        phone: item.phone,
        gender: item.gender as "MALE" | "FEMALE" | "OTHER" | null,
        dateOfBirth: item.dateOfBirth?.toISOString() || null,
        address: item.address,
        cvUrl: item.cvUrl,
        cvFileName: item.cvFileName,
        linkedinUrl: item.linkedinUrl,
        portfolioUrl: item.portfolioUrl,
        source: item.source,
        sourceDetail: item.sourceDetail,
        stage: item.stage,
        rating: item.rating,
        rejectionReason: item.rejectionReason,
        hiredSalary: item.hiredSalary ? Number(item.hiredSalary) : null,
        hiredDate: item.hiredDate?.toISOString() || null,
        notes: item.notes,
        tags: item.tags,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        candidateTags: item.CandidateToCandidateTag,
        interviews: item.interviews.map((interview) => ({
            id: interview.id,
            candidateId: interview.candidateId,
            jobPostingId: interview.jobPostingId,
            round: interview.round,
            type: interview.type,
            method: interview.method,
            scheduledDate: interview.scheduledDate.toISOString(),
            scheduledTime: interview.scheduledTime,
            endTime: interview.endTime,
            duration: interview.duration,
            location: interview.location,
            meetingLink: interview.meetingLink,
            meetingId: interview.meetingId,
            interviewerIds: interview.interviewerIds,
            interviewerNames: interview.interviewerNames,
            status: interview.status,
            result: interview.result,
            score: interview.score,
            strengths: interview.strengths,
            weaknesses: interview.weaknesses,
            notes: interview.notes,
            googleEventId: interview.googleEventId,
            calendarSync: interview.calendarSync,
            reviewedBy: interview.reviewedBy,
            reviewedAt: interview.reviewedAt?.toISOString() || null,
            createdAt: interview.createdAt.toISOString(),
            updatedAt: interview.updatedAt.toISOString(),
            feedbacks: interview.feedbacks,
        })),
    };
}

export async function createCandidate(data: z.infer<typeof candidateSchema>) {
    await requirePermission(Permission.RECRUITMENT_CANDIDATE_CREATE);

    const validated = candidateSchema.parse(data);

    const candidate = await prisma.candidate.create({
        data: {
            ...validated,
            dateOfBirth: validated.dateOfBirth
                ? new Date(validated.dateOfBirth)
                : undefined,
        },
    });

    revalidatePath("/recruitment");
    return candidate;
}

export async function updateCandidate(
    id: string,
    data: Partial<z.infer<typeof candidateSchema>> & {
        stage?: string;
        rating?: number;
        rejectionReason?: string;
        hiredSalary?: number;
        hiredDate?: string;
    },
) {
    await requirePermission(Permission.RECRUITMENT_CANDIDATE_EDIT);

    const validated = candidateSchema.partial().parse(data);
    const updateData: Record<string, unknown> = { ...validated };

    if (validated.dateOfBirth) {
        updateData.dateOfBirth = new Date(validated.dateOfBirth);
    }

    if (data.hiredDate) {
        updateData.hiredDate = new Date(data.hiredDate);
    }

    const candidate = await prisma.candidate.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/recruitment");
    return candidate;
}

export async function deleteCandidate(id: string) {
    await requirePermission(Permission.RECRUITMENT_CANDIDATE_DELETE);

    await prisma.candidate.delete({ where: { id } });

    revalidatePath("/recruitment");
    return { success: true };
}

// ─── INTERVIEW ACTIONS ───

const interviewSchema = z.object({
    candidateId: z.string().min(1, "Ứng viên không được để trống"),
    jobPostingId: z.string().min(1, "Vị trí không được để trống"),
    round: z.number().int().positive().default(1),
    type: z
        .enum(["ONSITE", "ONLINE", "PHONE"])
        .default("ONSITE"),
    method: z
        .enum(["INDIVIDUAL", "GROUP", "PANEL"])
        .default("INDIVIDUAL"),
    scheduledDate: z.string().min(1, "Ngày phỏng vấn không được để trống"),
    scheduledTime: z.string().min(1, "Giờ phỏng vấn không được để trống"),
    endTime: z.string().optional(),
    duration: z.number().int().positive().default(60),
    location: z.string().optional(),
    meetingLink: z.string().optional(),
    meetingId: z.string().optional(),
    interviewerIds: z.array(z.string()).default([]),
});

export async function getInterviews(
    filters?: {
        status?: string;
        jobPostingId?: string;
        candidateId?: string;
        fromDate?: string;
        toDate?: string;
    },
    options?: { page?: number; limit?: number },
) {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    const { status, jobPostingId, candidateId, fromDate, toDate } = filters || {};
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && status !== "") where.status = status;
    if (jobPostingId) where.jobPostingId = jobPostingId;
    if (candidateId) where.candidateId = candidateId;
    if (fromDate) {
        where.scheduledDate = {
            ...(where.scheduledDate as object),
            gte: new Date(fromDate),
        };
    }
    if (toDate) {
        where.scheduledDate = {
            ...(where.scheduledDate as object),
            lte: new Date(toDate),
        };
    }

    const [items, total] = await Promise.all([
        prisma.interview.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
            include: {
                candidate: { select: { id: true, name: true, email: true } },
                jobPosting: { select: { id: true, title: true } },
                feedbacks: true,
            },
        }),
        prisma.interview.count({ where }),
    ]);

    return {
        items: items.map((item) => ({
            id: item.id,
            candidateId: item.candidateId,
            candidateName: item.candidate.name,
            jobPostingId: item.jobPostingId,
            jobPostingTitle: item.jobPosting.title,
            round: item.round,
            type: item.type,
            method: item.method,
            scheduledDate: item.scheduledDate.toISOString(),
            scheduledTime: item.scheduledTime,
            endTime: item.endTime,
            duration: item.duration,
            location: item.location,
            meetingLink: item.meetingLink,
            meetingId: item.meetingId,
            interviewerIds: item.interviewerIds,
            interviewerNames: item.interviewerNames,
            status: item.status,
            result: item.result,
            score: item.score,
            strengths: item.strengths,
            weaknesses: item.weaknesses,
            notes: item.notes,
            googleEventId: item.googleEventId,
            calendarSync: item.calendarSync,
            reviewedBy: item.reviewedBy,
            reviewedAt: item.reviewedAt?.toISOString() || null,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
            feedbacks: item.feedbacks,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getUpcomingInterviews(limit = 10) {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    const now = new Date();

    const items = await prisma.interview.findMany({
        where: {
            status: "SCHEDULED",
            scheduledDate: { gte: now },
        },
        take: limit,
        orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
        include: {
            candidate: { select: { id: true, name: true, email: true } },
            jobPosting: { select: { id: true, title: true } },
        },
    });

    return items.map((item) => ({
        id: item.id,
        candidateId: item.candidateId,
        candidateName: item.candidate.name,
        jobPostingId: item.jobPostingId,
        jobPostingTitle: item.jobPosting.title,
        round: item.round,
        type: item.type,
        scheduledDate: item.scheduledDate.toISOString(),
        scheduledTime: item.scheduledTime,
        duration: item.duration,
        location: item.location,
        meetingLink: item.meetingLink,
        status: item.status,
    }));
}

export async function createInterview(data: z.infer<typeof interviewSchema>) {
    await requirePermission(Permission.RECRUITMENT_INTERVIEW_SCHEDULE);

    const validated = interviewSchema.parse(data);

    // Get interviewer names
    const interviewers = await prisma.user.findMany({
        where: { id: { in: validated.interviewerIds } },
        select: { id: true, name: true },
    });

    const interview = await prisma.interview.create({
        data: {
            ...validated,
            scheduledDate: new Date(validated.scheduledDate),
            interviewerNames: interviewers.map((i) => i.name || i.id),
        },
    });

    revalidatePath("/recruitment");
    return interview;
}

export async function updateInterview(
    id: string,
    data: Partial<z.infer<typeof interviewSchema>> & {
        status?: string;
        result?: string;
        score?: number;
        strengths?: string;
        weaknesses?: string;
        notes?: string;
    },
) {
    await requirePermission(Permission.RECRUITMENT_INTERVIEW_MANAGE);

    const validated = interviewSchema.partial().parse(data);
    const updateData: Record<string, unknown> = { ...validated };

    if (validated.scheduledDate) {
        updateData.scheduledDate = new Date(validated.scheduledDate);
    }

    if (validated.interviewerIds) {
        const interviewers = await prisma.user.findMany({
            where: { id: { in: validated.interviewerIds } },
            select: { id: true, name: true },
        });
            updateData.interviewerNames = interviewers.map((i) => i.name || i.id);
    }

    const interview = await prisma.interview.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/recruitment");
    return interview;
}

export async function deleteInterview(id: string) {
    await requirePermission(Permission.RECRUITMENT_INTERVIEW_MANAGE);

    await prisma.interview.delete({ where: { id } });

    revalidatePath("/recruitment");
    return { success: true };
}

// ─── INTERVIEW FEEDBACK ACTIONS ───

const feedbackSchema = z.object({
    interviewId: z.string(),
    score: z.number().int().min(1).max(10).optional(),
    result: z.enum(["PASS", "FAIL", "PENDING"]).optional(),
    technicalSkill: z.number().int().min(1).max(5).optional(),
    communication: z.number().int().min(1).max(5).optional(),
    problemSolving: z.number().int().min(1).max(5).optional(),
    cultureFit: z.number().int().min(1).max(5).optional(),
    strengths: z.string().optional(),
    improvements: z.string().optional(),
    notes: z.string().optional(),
});

export async function submitFeedback(data: z.infer<typeof feedbackSchema>) {
    const session = await requirePermission(
        Permission.RECRUITMENT_INTERVIEW_MANAGE,
    );

    const validated = feedbackSchema.parse(data);

    const feedback = await prisma.interviewFeedback.upsert({
        where: {
            interviewId_userId: {
                interviewId: validated.interviewId,
                userId: session.user.id,
            },
        },
        create: {
            interviewId: validated.interviewId,
            userId: session.user.id,
            userName: session.user.name || session.user.id,
            score: validated.score,
            result: validated.result,
            technicalSkill: validated.technicalSkill,
            communication: validated.communication,
            problemSolving: validated.problemSolving,
            cultureFit: validated.cultureFit,
            strengths: validated.strengths,
            improvements: validated.improvements,
            notes: validated.notes,
        },
        update: {
            score: validated.score,
            result: validated.result,
            technicalSkill: validated.technicalSkill,
            communication: validated.communication,
            problemSolving: validated.problemSolving,
            cultureFit: validated.cultureFit,
            strengths: validated.strengths,
            improvements: validated.improvements,
            notes: validated.notes,
        },
    });

    // Update interview with average score
    const allFeedbacks = await prisma.interviewFeedback.findMany({
        where: { interviewId: validated.interviewId },
        select: { score: true },
    });

    if (allFeedbacks.length > 0) {
        const avgScore =
            allFeedbacks.reduce((sum, f) => sum + (f.score || 0), 0) /
            allFeedbacks.length;
        await prisma.interview.update({
            where: { id: validated.interviewId },
            data: { score: Math.round(avgScore) },
        });
    }

    revalidatePath("/recruitment");
    return feedback;
}

// ─── STATS ACTIONS ───

export async function getRecruitmentStats() {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
        totalJobPostings,
        openJobPostings,
        totalCandidates,
        activeCandidates,
        totalInterviews,
        upcomingInterviews,
        hiredThisMonth,
    ] = await Promise.all([
        prisma.jobPosting.count(),
        prisma.jobPosting.count({ where: { status: "OPEN" } }),
        prisma.candidate.count(),
        prisma.candidate.count({
            where: {
                stage: { notIn: ["HIRED", "REJECTED"] },
            },
        }),
        prisma.interview.count(),
        prisma.interview.count({
            where: {
                status: "SCHEDULED",
                scheduledDate: { gte: now },
            },
        }),
        prisma.candidate.count({
            where: {
                stage: "HIRED",
                hiredDate: {
                    gte: startOfMonth,
                    lt: startOfNextMonth,
                },
            },
        }),
    ]);

    return {
        totalJobPostings,
        openJobPostings,
        totalCandidates,
        activeCandidates,
        totalInterviews,
        upcomingInterviews,
        hiredThisMonth,
        averageHiringTime: null,
    };
}

// ─── LOOKUP ACTIONS ───

export async function getDepartments() {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    return prisma.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
}

export async function getPositions() {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    return prisma.position.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
    });
}

export async function getCandidateTags() {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    return prisma.candidateTag.findMany({
        orderBy: { name: "asc" },
    });
}

export async function getUsersForInterviewer() {
    await requirePermission(Permission.RECRUITMENT_VIEW);

    return prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
    });
}
