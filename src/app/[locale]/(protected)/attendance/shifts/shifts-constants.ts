// ─── Shift Calendar Constants & Helpers ───

export const emptyShift = {
    name: "",
    code: "",
    startTime: "08:00",
    endTime: "17:00",
    breakMinutes: 60,
    lateThreshold: 15,
    earlyThreshold: 15,
    isDefault: false,
    isActive: true,
};

export type ShiftFormData = typeof emptyShift;

export type ViewMode = "week" | "day" | "month";

export const EMPLOYEES_PER_PAGE = 5;

// Color palette for shift cards (mapped by shift index)
export const SHIFT_COLORS = [
    {
        bg: "bg-green-100 dark:bg-green-900/40",
        border: "border-green-300 dark:border-green-700",
        text: "text-green-800 dark:text-green-200",
        dot: "bg-green-500",
    },
    {
        bg: "bg-blue-100 dark:bg-blue-900/40",
        border: "border-blue-300 dark:border-blue-700",
        text: "text-blue-800 dark:text-blue-200",
        dot: "bg-blue-500",
    },
    {
        bg: "bg-purple-100 dark:bg-purple-900/40",
        border: "border-purple-300 dark:border-purple-700",
        text: "text-purple-800 dark:text-purple-200",
        dot: "bg-purple-500",
    },
    {
        bg: "bg-amber-100 dark:bg-amber-900/40",
        border: "border-amber-300 dark:border-amber-700",
        text: "text-amber-800 dark:text-amber-200",
        dot: "bg-amber-500",
    },
    {
        bg: "bg-rose-100 dark:bg-rose-900/40",
        border: "border-rose-300 dark:border-rose-700",
        text: "text-rose-800 dark:text-rose-200",
        dot: "bg-rose-500",
    },
    {
        bg: "bg-cyan-100 dark:bg-cyan-900/40",
        border: "border-cyan-300 dark:border-cyan-700",
        text: "text-cyan-800 dark:text-cyan-200",
        dot: "bg-cyan-500",
    },
    {
        bg: "bg-orange-100 dark:bg-orange-900/40",
        border: "border-orange-300 dark:border-orange-700",
        text: "text-orange-800 dark:text-orange-200",
        dot: "bg-orange-500",
    },
    {
        bg: "bg-emerald-100 dark:bg-emerald-900/40",
        border: "border-emerald-300 dark:border-emerald-700",
        text: "text-emerald-800 dark:text-emerald-200",
        dot: "bg-emerald-500",
    },
] as const;

export type ShiftColor = (typeof SHIFT_COLORS)[number];

export function getShiftColor(index: number): ShiftColor {
    return SHIFT_COLORS[index % SHIFT_COLORS.length];
}

// B-02: Hash shift ID to a stable color index independent of array order
export function hashShiftIdToColor(id: string): ShiftColor {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return SHIFT_COLORS[hash % SHIFT_COLORS.length];
}

// B-04: Handles empty names and whitespace-only strings
export function getInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    const initials = words
        .map((w) => w[0])
        .join("")
        .slice(-2)
        .toUpperCase();
    return initials || "?";
}

/** Capitalize first letter of Vietnamese day name */
export function capitalizeFirst(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
