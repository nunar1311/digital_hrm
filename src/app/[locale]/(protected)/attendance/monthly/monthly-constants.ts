// ─── Shared constants for monthly attendance views ───

export const STATUS_CELL: Record<
    string,
    { symbol: string; className: string; label: string }
> = {
    PRESENT: {
        symbol: "✓",
        className:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        label: "Đúng giờ",
    },
    LATE: {
        symbol: "M",
        className:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        label: "Đi muộn",
    },
    EARLY_LEAVE: {
        symbol: "S",
        className:
            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        label: "Về sớm",
    },
    LATE_AND_EARLY: {
        symbol: "MS",
        className:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        label: "Muộn & Sớm",
    },
    ABSENT: {
        symbol: "×",
        className:
            "bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        label: "Vắng mặt",
    },
    HALF_DAY: {
        symbol: "½",
        className:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        label: "Nửa ngày",
    },
    ON_LEAVE: {
        symbol: "P",
        className:
            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        label: "Nghỉ phép",
    },
    HOLIDAY: {
        symbol: "L",
        className:
            "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
        label: "Ngày lễ",
    },
};
