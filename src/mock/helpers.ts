// =============================================================================
// Mock Data Helper Utilities — Filter, Paginate, Sort, Format
// =============================================================================

import type { Employee, PaginatedResult, FilterParams } from '@/types';

// ─── Format Helpers ──────────────────────────────────────────────────────────

/** Format number as VND currency: 15000000 → "15.000.000 ₫" */
export function formatVND(amount: number): string {
    return amount.toLocaleString('vi-VN') + ' ₫';
}

/** Format date to dd/MM/yyyy */
export function formatDate(date: Date | string | null): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
}

/** Format date to dd/MM/yyyy HH:mm */
export function formatDateTime(date: Date | string | null): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()} ${hours}:${mins}`;
}

// ─── Filter ──────────────────────────────────────────────────────────────────

/** Filter employees by search text, department, status, employment type */
export function filterEmployees(
    employees: Employee[],
    filters: FilterParams,
): Employee[] {
    return employees.filter(emp => {
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const match =
                emp.fullName.toLowerCase().includes(q) ||
                emp.employeeCode.toLowerCase().includes(q) ||
                (emp.phone && emp.phone.includes(q)) ||
                (emp.personalEmail && emp.personalEmail.toLowerCase().includes(q));
            if (!match) return false;
        }
        if (filters.departmentId && emp.departmentId !== filters.departmentId) return false;
        if (filters.status && emp.status !== filters.status) return false;
        if (filters.employmentType && emp.employmentType !== filters.employmentType) return false;
        return true;
    });
}

// ─── Paginate ────────────────────────────────────────────────────────────────

/** Generic client-side pagination */
export function paginate<T>(
    items: T[],
    page: number = 1,
    pageSize: number = 10,
): PaginatedResult<T> {
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const data = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return { data, total, totalPages, currentPage, pageSize };
}

// ─── Sort ────────────────────────────────────────────────────────────────────

/** Generic sort by key */
export function sortBy<T>(
    items: T[],
    key: keyof T,
    order: 'asc' | 'desc' = 'asc',
): T[] {
    return [...items].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const cmp = aVal < bVal ? -1 : 1;
        return order === 'asc' ? cmp : -cmp;
    });
}

// ─── Status Label Mapping ────────────────────────────────────────────────────

export const EMPLOYEE_STATUS_LABELS: Record<Employee['status'], string> = {
    ACTIVE: 'Đang làm việc',
    ON_LEAVE: 'Đang nghỉ',
    RESIGNED: 'Đã nghỉ việc',
    TERMINATED: 'Đã chấm dứt',
};

export const EMPLOYMENT_TYPE_LABELS: Record<Employee['employmentType'], string> = {
    FULL_TIME: 'Toàn thời gian',
    PART_TIME: 'Bán thời gian',
    CONTRACT: 'Hợp đồng',
    INTERN: 'Thực tập sinh',
};

export const GENDER_LABELS: Record<string, string> = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác',
};

export const EDUCATION_LABELS: Record<string, string> = {
    HIGHSCHOOL: 'Trung học',
    COLLEGE: 'Cao đẳng',
    BACHELOR: 'Cử nhân',
    MASTER: 'Thạc sĩ',
    PHD: 'Tiến sĩ',
};
