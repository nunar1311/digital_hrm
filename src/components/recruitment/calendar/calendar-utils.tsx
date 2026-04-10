"use client";

import {
    MapPin,
    Video,
    Phone,
    Calendar as CalendarIcon,
} from "lucide-react";
import type { InterviewType, InterviewStatus } from "@/app/(protected)/recruitment/types";
import {
    INTERVIEW_TYPE,
    INTERVIEW_STATUS,
} from "@/app/(protected)/recruitment/constants";

export const getInterviewTypeIcon = (type: string) => {
    switch (type) {
        case "ONSITE":
            return <MapPin className="h-3 w-3" />;
        case "ONLINE":
            return <Video className="h-3 w-3" />;
        case "PHONE":
            return <Phone className="h-3 w-3" />;
        default:
            return <CalendarIcon className="h-3 w-3" />;
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case "SCHEDULED":
            return "bg-blue-500";
        case "IN_PROGRESS":
            return "bg-amber-500";
        case "COMPLETED":
            return "bg-green-500";
        case "CANCELLED":
        case "NO_SHOW":
            return "bg-red-500";
        default:
            return "bg-gray-500";
    }
};

export const getInterviewTypeLabel = (type: InterviewType) => {
    return INTERVIEW_TYPE[type]?.label || type;
};

export const getInterviewStatusLabel = (status: InterviewStatus) => {
    return INTERVIEW_STATUS[status]?.label || status;
};

export const WEEKDAY_LABELS = [
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "CN",
] as const;

export const DAY_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

export interface InterviewFormData {
    candidateId: string;
    jobPostingId: string;
    round: number;
    type: "ONSITE" | "ONLINE" | "PHONE";
    method: "INDIVIDUAL" | "GROUP" | "PANEL";
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    location: string;
    meetingLink: string;
    notes: string;
    interviewerIds: string[];
}

export const initialFormData: InterviewFormData = {
    candidateId: "",
    jobPostingId: "",
    round: 1,
    type: "ONSITE",
    method: "INDIVIDUAL",
    scheduledDate: "",
    scheduledTime: "",
    duration: 60,
    location: "",
    meetingLink: "",
    notes: "",
    interviewerIds: [],
};
