// =============================================================================
// Mock Departments, Positions & Job Titles
// 7 Departments · 18 Positions · 10 Job Titles
// =============================================================================

import type { Department, Position, JobTitle } from '@/types';

// ─── Departments ─────────────────────────────────────────────────────────────

export const mockDepartments: Department[] = [
    {
        id: 'dept-001',
        name: 'Ban Giám đốc',
        code: 'BGD',
        description: 'Ban lãnh đạo công ty',
        parentId: null,
        managerId: 'emp-001',
        status: 'ACTIVE',
        sortOrder: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        employeeCount: 3,
        managerName: 'Nguyễn Văn An',
    },
    {
        id: 'dept-002',
        name: 'Phòng Công nghệ Thông tin (IT)',
        code: 'IT',
        description: 'Phòng hạ tầng, phát triển phần mềm và công nghệ',
        parentId: null,
        managerId: 'emp-004',
        status: 'ACTIVE',
        sortOrder: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        employeeCount: 12,
        managerName: 'Phạm Đức Cường',
    },
    {
        id: 'dept-003',
        name: 'Phòng Kinh doanh',
        code: 'KD',
        description: 'Phòng bán hàng và phát triển khách hàng',
        parentId: null,
        managerId: 'emp-010',
        status: 'ACTIVE',
        sortOrder: 2,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        employeeCount: 8,
        managerName: 'Trần Thị Hương',
    },
    {
        id: 'dept-004',
        name: 'Phòng Nhân sự',
        code: 'NS',
        description: 'Phòng quản lý nhân sự và tuyển dụng',
        parentId: null,
        managerId: 'emp-015',
        status: 'ACTIVE',
        sortOrder: 3,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        employeeCount: 4,
        managerName: 'Lê Thị Mai',
    },
    {
        id: 'dept-005',
        name: 'Phòng Kế toán - Tài chính',
        code: 'KTTC',
        description: 'Phòng tài chính và kế toán',
        parentId: null,
        managerId: 'emp-019',
        status: 'ACTIVE',
        sortOrder: 4,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        employeeCount: 3,
        managerName: 'Hoàng Văn Tài',
    },
    {
        id: 'dept-006',
        name: 'Phòng Marketing',
        code: 'MKT',
        description: 'Phòng tiếp thị và truyền thông',
        parentId: null,
        managerId: 'emp-022',
        status: 'ACTIVE',
        sortOrder: 5,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        employeeCount: 3,
        managerName: 'Vũ Ngọc Linh',
    },
    {
        id: 'dept-007',
        name: 'Phòng Hành chính tổng hợp',
        code: 'HCTH',
        description: 'Phòng hành chính, quản trị văn phòng và mua sắm',
        parentId: null,
        managerId: 'emp-025',
        status: 'ACTIVE',
        sortOrder: 6,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        employeeCount: 2,
        managerName: 'Đặng Thị Ngọc',
    },
];

// ─── Positions ───────────────────────────────────────────────────────────────

export const mockPositions: Position[] = [
    // Ban Giám đốc
    { id: 'pos-001', name: 'Giám đốc', code: 'GD', departmentId: 'dept-001', level: 1, description: 'Giám đốc điều hành' },
    { id: 'pos-002', name: 'Phó Giám đốc', code: 'PGD', departmentId: 'dept-001', level: 2, description: 'Phó Giám đốc' },
    // Phòng Công nghệ Thông tin (IT)
    { id: 'pos-003', name: 'Trưởng phòng IT', code: 'TP-IT', departmentId: 'dept-002', level: 3, description: null },
    { id: 'pos-004', name: 'Senior Developer', code: 'SR-DEV', departmentId: 'dept-002', level: 4, description: null },
    { id: 'pos-005', name: 'Junior Developer', code: 'JR-DEV', departmentId: 'dept-002', level: 5, description: null },
    { id: 'pos-006', name: 'QA Engineer', code: 'QA', departmentId: 'dept-002', level: 5, description: null },
    { id: 'pos-007', name: 'DevOps Engineer', code: 'DEVOPS', departmentId: 'dept-002', level: 4, description: null },
    { id: 'pos-008', name: 'Thực tập sinh Kỹ thuật', code: 'INT-KT', departmentId: 'dept-002', level: 6, description: null },
    // Phòng Kinh doanh
    { id: 'pos-009', name: 'Trưởng phòng Kinh doanh', code: 'TP-KD', departmentId: 'dept-003', level: 3, description: null },
    { id: 'pos-010', name: 'Nhân viên Kinh doanh', code: 'NV-KD', departmentId: 'dept-003', level: 5, description: null },
    // Phòng Nhân sự
    { id: 'pos-011', name: 'Trưởng phòng Nhân sự', code: 'TP-NS', departmentId: 'dept-004', level: 3, description: null },
    { id: 'pos-012', name: 'Nhân viên Nhân sự', code: 'NV-NS', departmentId: 'dept-004', level: 5, description: null },
    { id: 'pos-013', name: 'Chuyên viên Tuyển dụng', code: 'CV-TD', departmentId: 'dept-004', level: 5, description: null },
    // Phòng Kế toán - Tài chính
    { id: 'pos-014', name: 'Kế toán trưởng', code: 'KTT', departmentId: 'dept-005', level: 3, description: null },
    { id: 'pos-015', name: 'Nhân viên Kế toán', code: 'NV-KToan', departmentId: 'dept-005', level: 5, description: null },
    // Phòng Marketing
    { id: 'pos-016', name: 'Trưởng phòng Marketing', code: 'TP-MKT', departmentId: 'dept-006', level: 3, description: null },
    { id: 'pos-017', name: 'Chuyên viên Marketing', code: 'CV-MKT', departmentId: 'dept-006', level: 5, description: null },
    // Phòng Hành chính tổng hợp
    { id: 'pos-018', name: 'Trưởng phòng Hành chính', code: 'TP-HC', departmentId: 'dept-007', level: 3, description: null },
];

// ─── Job Titles ──────────────────────────────────────────────────────────────

export const mockJobTitles: JobTitle[] = [
    { id: 'jt-001', name: 'Giám đốc điều hành', code: 'CEO', description: null },
    { id: 'jt-002', name: 'Phó Giám đốc', code: 'VP', description: null },
    { id: 'jt-003', name: 'Trưởng phòng', code: 'MGR', description: null },
    { id: 'jt-004', name: 'Phó phòng', code: 'DMGR', description: null },
    { id: 'jt-005', name: 'Trưởng nhóm', code: 'TL', description: null },
    { id: 'jt-006', name: 'Chuyên viên cao cấp', code: 'SR', description: null },
    { id: 'jt-007', name: 'Chuyên viên', code: 'SP', description: null },
    { id: 'jt-008', name: 'Nhân viên', code: 'STAFF', description: null },
    { id: 'jt-009', name: 'Thực tập sinh', code: 'INTERN', description: null },
    { id: 'jt-010', name: 'Cộng tác viên', code: 'CTV', description: null },
];
