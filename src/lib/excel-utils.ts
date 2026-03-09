// =============================================================================
// Excel Utilities — Client-side SheetJS helpers
// Vietnamese column mapping, validation, import/export
// =============================================================================

"use client";

import * as XLSX from 'xlsx';
import type { Employee } from '@/types';

// ─── Vietnamese Column Mapping ──────────────────────────────────────────────

export const COLUMN_MAP: Record<string, string> = {
    employeeCode: 'Mã nhân viên',
    fullName: 'Họ và tên',
    dateOfBirth: 'Ngày sinh',
    gender: 'Giới tính',
    phone: 'Số điện thoại',
    personalEmail: 'Email',
    address: 'Địa chỉ',
    department: 'Phòng ban',
    position: 'Chức vụ',
    employmentType: 'Loại hình',
    hireDate: 'Ngày vào làm',
    status: 'Trạng thái',
    bankName: 'Ngân hàng',
    bankAccount: 'Số tài khoản',
    educationLevel: 'Trình độ',
    university: 'Trường',
};

export const REVERSE_COLUMN_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(COLUMN_MAP).map(([k, v]) => [v, k]),
);

// ─── Vietnamese Display Values ──────────────────────────────────────────────

const GENDER_MAP: Record<string, string> = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác',
};

const STATUS_MAP: Record<string, string> = {
    ACTIVE: 'Đang làm',
    ON_LEAVE: 'Nghỉ phép',
    RESIGNED: 'Đã nghỉ',
    TERMINATED: 'Đã chấm dứt',
};

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
    FULL_TIME: 'Toàn thời gian',
    PART_TIME: 'Bán thời gian',
    CONTRACT: 'Hợp đồng',
    INTERN: 'Thực tập',
};

const EDUCATION_MAP: Record<string, string> = {
    HIGHSCHOOL: 'THPT',
    COLLEGE: 'Cao đẳng',
    BACHELOR: 'Đại học',
    MASTER: 'Thạc sĩ',
    PHD: 'Tiến sĩ',
};

// ─── Date Helpers ───────────────────────────────────────────────────────────

export function formatDateForExcel(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

export function parseVietnameseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    // Handle "dd/MM/yyyy" format
    const parts = str.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        if (day && month && year) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
    }
    // Try ISO fallback
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }
    return null;
}

// ─── Export ─────────────────────────────────────────────────────────────────

export function exportEmployeesToExcel(employees: Employee[], filename = 'danh-sach-nhan-vien') {
    const vietnameseData = employees.map((emp) => ({
        [COLUMN_MAP.employeeCode]: emp.employeeCode,
        [COLUMN_MAP.fullName]: emp.fullName,
        [COLUMN_MAP.dateOfBirth]: formatDateForExcel(emp.dateOfBirth),
        [COLUMN_MAP.gender]: emp.gender ? GENDER_MAP[emp.gender] || emp.gender : '',
        [COLUMN_MAP.phone]: emp.phone || '',
        [COLUMN_MAP.personalEmail]: emp.personalEmail || '',
        [COLUMN_MAP.address]: emp.address || '',
        [COLUMN_MAP.department]: emp.department?.name || '',
        [COLUMN_MAP.position]: emp.position?.name || '',
        [COLUMN_MAP.employmentType]: EMPLOYMENT_TYPE_MAP[emp.employmentType] || emp.employmentType,
        [COLUMN_MAP.hireDate]: formatDateForExcel(emp.hireDate),
        [COLUMN_MAP.status]: STATUS_MAP[emp.status] || emp.status,
        [COLUMN_MAP.bankName]: emp.bankName || '',
        [COLUMN_MAP.bankAccount]: emp.bankAccount || '',
        [COLUMN_MAP.educationLevel]: emp.educationLevel ? EDUCATION_MAP[emp.educationLevel] || emp.educationLevel : '',
        [COLUMN_MAP.university]: emp.university || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(vietnameseData);

    // Column widths
    worksheet['!cols'] = [
        { wch: 12 },  // Mã NV
        { wch: 25 },  // Họ và tên
        { wch: 14 },  // Ngày sinh
        { wch: 10 },  // Giới tính
        { wch: 14 },  // SĐT
        { wch: 25 },  // Email
        { wch: 30 },  // Địa chỉ
        { wch: 20 },  // Phòng ban
        { wch: 20 },  // Chức vụ
        { wch: 16 },  // Loại hình
        { wch: 14 },  // Ngày vào
        { wch: 14 },  // Trạng thái
        { wch: 16 },  // Ngân hàng
        { wch: 18 },  // Số TK
        { wch: 12 },  // Trình độ
        { wch: 25 },  // Trường
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách nhân viên');

    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ─── Import / Parse ─────────────────────────────────────────────────────────

export interface ParsedImportResult {
    headers: string[];
    rows: Record<string, unknown>[];
}

export function parseExcelFile(file: File): Promise<ParsedImportResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

                if (jsonData.length === 0) {
                    reject(new Error('EMPTY_FILE'));
                    return;
                }

                const headers = Object.keys(jsonData[0]);

                resolve({ headers, rows: jsonData });
            } catch {
                reject(new Error('PARSE_ERROR'));
            }
        };

        reader.onerror = () => reject(new Error('READ_ERROR'));
        reader.readAsArrayBuffer(file);
    });
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface ValidationError {
    row: number;
    field: string;
    message: string;
}

export interface ValidationResult {
    validRows: Record<string, unknown>[];
    invalidRows: Record<string, unknown>[];
    errors: ValidationError[];
}

// Required Vietnamese column headers
const REQUIRED_FIELDS = ['Mã nhân viên', 'Họ và tên'];

export function validateImportedRows(rows: Record<string, unknown>[]): ValidationResult {
    const validRows: Record<string, unknown>[] = [];
    const invalidRows: Record<string, unknown>[] = [];
    const errors: ValidationError[] = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2; // +2 for Excel header row + 0-index
        let rowIsValid = true;

        // Check required fields
        for (const field of REQUIRED_FIELDS) {
            const value = row[field];
            if (!value || String(value).trim() === '') {
                errors.push({
                    row: rowNum,
                    field,
                    message: `Dòng ${rowNum}: Thiếu "${field}"`,
                });
                rowIsValid = false;
            }
        }

        // Validate phone format if present
        const phone = row['Số điện thoại'];
        if (phone && !/^(0|\+84)\d{9,10}$/.test(String(phone).trim())) {
            errors.push({
                row: rowNum,
                field: 'Số điện thoại',
                message: `Dòng ${rowNum}: Số điện thoại không hợp lệ`,
            });
            rowIsValid = false;
        }

        // Validate email format if present
        const email = row['Email'];
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
            errors.push({
                row: rowNum,
                field: 'Email',
                message: `Dòng ${rowNum}: Email không hợp lệ`,
            });
            rowIsValid = false;
        }

        if (rowIsValid) {
            validRows.push(row);
        } else {
            invalidRows.push(row);
        }
    });

    return { validRows, invalidRows, errors };
}
