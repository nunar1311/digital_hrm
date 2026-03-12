// =============================================================================
// Mock Employees — 5 Base Records + Generator Function
// =============================================================================

import type { Employee, EmergencyContact, Dependent, WorkHistory } from '@/types';
import { mockDepartments, mockPositions } from './departments';

// ─── Vietnamese Data Pools ───────────────────────────────────────────────────

const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ'];
const MIDDLE_M = ['Văn', 'Đức', 'Minh', 'Hoàng', 'Thanh', 'Quốc', 'Hữu'];
const MIDDLE_F = ['Thị', 'Ngọc', 'Kim', 'Thanh', 'Phương', 'Hoàng'];
const FIRST_M = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Hùng', 'Khoa', 'Long', 'Minh', 'Nam', 'Phong', 'Quang', 'Tùng', 'Việt', 'Đạt'];
const FIRST_F = ['Anh', 'Chi', 'Dung', 'Hà', 'Hương', 'Lan', 'Linh', 'Mai', 'Ngọc', 'Phương', 'Thảo', 'Trang', 'Vy'];
const BANKS = ['Vietcombank', 'BIDV', 'VietinBank', 'Techcombank', 'MB Bank', 'ACB', 'VPBank', 'TPBank'];
const UNIVERSITIES = ['ĐH Bách Khoa TP.HCM', 'ĐH CNTT - ĐHQG TP.HCM', 'ĐH Kinh tế TP.HCM', 'ĐH Ngoại Thương', 'ĐH Bách Khoa Hà Nội', 'ĐH FPT'];

// ─── 5 Base Employees (Detailed) ────────────────────────────────────────────

export const baseEmployees: Employee[] = [
    {
        id: 'emp-001', userId: 'usr-001', employeeCode: 'NV-001',
        fullName: 'Nguyễn Văn An', dateOfBirth: '1980-03-15', gender: 'MALE',
        nationalId: '079080012345', nationalIdDate: '2020-06-01', nationalIdPlace: 'TP. Hồ Chí Minh',
        phone: '0901234567', personalEmail: 'an.nguyen@gmail.com',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM', permanentAddress: '456 Lê Lợi, Quận 5, TP.HCM',
        nationality: 'Việt Nam', religion: null, ethnicity: 'Kinh', maritalStatus: 'MARRIED',
        departmentId: 'dept-001', positionId: 'pos-001', jobTitleId: 'jt-001', managerId: null,
        employmentType: 'FULL_TIME', status: 'ACTIVE',
        hireDate: '2018-01-15', probationEnd: '2018-03-15', resignDate: null,
        bankName: 'Vietcombank', bankAccount: '0071000123456', bankBranch: 'CN Sài Gòn',
        socialInsuranceNo: 'SN-7908001234', healthInsuranceNo: 'HN-7908001234', taxCode: '8001234567',
        educationLevel: 'MASTER', major: 'Quản trị Kinh doanh', university: 'ĐH Kinh tế TP.HCM',
        avatar: null, notes: 'Giám đốc điều hành', createdAt: '2018-01-15T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z',
        department: mockDepartments[0], position: mockPositions[0],
    },
    {
        id: 'emp-004', userId: 'usr-004', employeeCode: 'NV-004',
        fullName: 'Phạm Đức Cường', dateOfBirth: '1988-07-22', gender: 'MALE',
        nationalId: '079088054321', nationalIdDate: '2021-02-10', nationalIdPlace: 'Hà Nội',
        phone: '0912345678', personalEmail: 'cuong.pham@gmail.com',
        address: '78 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', permanentAddress: '12 Hoàng Hoa Thám, Ba Đình, Hà Nội',
        nationality: 'Việt Nam', religion: null, ethnicity: 'Kinh', maritalStatus: 'MARRIED',
        departmentId: 'dept-002', positionId: 'pos-003', jobTitleId: 'jt-003', managerId: 'emp-001',
        employmentType: 'FULL_TIME', status: 'ACTIVE',
        hireDate: '2019-06-01', probationEnd: '2019-08-01', resignDate: null,
        bankName: 'Techcombank', bankAccount: '19033000111222', bankBranch: 'CN Bình Thạnh',
        socialInsuranceNo: 'SN-8807005432', healthInsuranceNo: 'HN-8807005432', taxCode: '8805432100',
        educationLevel: 'MASTER', major: 'Khoa học Máy tính', university: 'ĐH Bách Khoa TP.HCM',
        avatar: null, notes: 'Trưởng phòng Kỹ thuật', createdAt: '2019-06-01T00:00:00Z', updatedAt: '2025-11-15T00:00:00Z',
        department: mockDepartments[1], position: mockPositions[2],
        manager: { id: 'emp-001', fullName: 'Nguyễn Văn An', employeeCode: 'NV-001', avatar: null },
    },
    {
        id: 'emp-007', userId: 'usr-007', employeeCode: 'NV-007',
        fullName: 'Trần Thị Linh', dateOfBirth: '1995-11-08', gender: 'FEMALE',
        nationalId: '079095087654', nationalIdDate: '2021-08-20', nationalIdPlace: 'TP. Hồ Chí Minh',
        phone: '0935678901', personalEmail: 'linh.tran@gmail.com',
        address: '234 Lý Thường Kiệt, Quận Tân Bình, TP.HCM', permanentAddress: '234 Lý Thường Kiệt, Quận Tân Bình, TP.HCM',
        nationality: 'Việt Nam', religion: null, ethnicity: 'Kinh', maritalStatus: 'SINGLE',
        departmentId: 'dept-002', positionId: 'pos-005', jobTitleId: 'jt-008', managerId: 'emp-004',
        employmentType: 'FULL_TIME', status: 'ACTIVE',
        hireDate: '2023-03-01', probationEnd: '2023-05-01', resignDate: null,
        bankName: 'MB Bank', bankAccount: '0801000987654', bankBranch: 'CN Tân Bình',
        socialInsuranceNo: 'SN-9511008765', healthInsuranceNo: 'HN-9511008765', taxCode: '9508765432',
        educationLevel: 'BACHELOR', major: 'Công nghệ Phần mềm', university: 'ĐH CNTT - ĐHQG TP.HCM',
        avatar: null, notes: null, createdAt: '2023-03-01T00:00:00Z', updatedAt: '2025-10-20T00:00:00Z',
        department: mockDepartments[1], position: mockPositions[4],
        manager: { id: 'emp-004', fullName: 'Phạm Đức Cường', employeeCode: 'NV-004', avatar: null },
    },
    {
        id: 'emp-015', userId: 'usr-015', employeeCode: 'NV-015',
        fullName: 'Lê Thị Mai', dateOfBirth: '1990-04-12', gender: 'FEMALE',
        nationalId: '079090034567', nationalIdDate: '2020-12-05', nationalIdPlace: 'Đà Nẵng',
        phone: '0967890123', personalEmail: 'mai.le@gmail.com',
        address: '56 Pasteur, Quận 3, TP.HCM', permanentAddress: '89 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
        nationality: 'Việt Nam', religion: null, ethnicity: 'Kinh', maritalStatus: 'MARRIED',
        departmentId: 'dept-004', positionId: 'pos-011', jobTitleId: 'jt-003', managerId: 'emp-001',
        employmentType: 'FULL_TIME', status: 'ACTIVE',
        hireDate: '2020-02-01', probationEnd: '2020-04-01', resignDate: null,
        bankName: 'BIDV', bankAccount: '3100000456789', bankBranch: 'CN Quận 3',
        socialInsuranceNo: 'SN-9004003456', healthInsuranceNo: 'HN-9004003456', taxCode: '9003456789',
        educationLevel: 'BACHELOR', major: 'Quản trị Nhân lực', university: 'ĐH Kinh tế TP.HCM',
        avatar: null, notes: 'Trưởng phòng Nhân sự', createdAt: '2020-02-01T00:00:00Z', updatedAt: '2025-09-10T00:00:00Z',
        department: mockDepartments[3], position: mockPositions[10],
        manager: { id: 'emp-001', fullName: 'Nguyễn Văn An', employeeCode: 'NV-001', avatar: null },
    },
    {
        id: 'emp-030', userId: 'usr-030', employeeCode: 'NV-030',
        fullName: 'Hoàng Minh Đạt', dateOfBirth: '2000-09-25', gender: 'MALE',
        nationalId: '079000098765', nationalIdDate: '2022-01-10', nationalIdPlace: 'TP. Hồ Chí Minh',
        phone: '0389012345', personalEmail: 'dat.hoang@gmail.com',
        address: '90 Võ Văn Tần, Quận 3, TP.HCM', permanentAddress: '90 Võ Văn Tần, Quận 3, TP.HCM',
        nationality: 'Việt Nam', religion: null, ethnicity: 'Kinh', maritalStatus: 'SINGLE',
        departmentId: 'dept-002', positionId: 'pos-008', jobTitleId: 'jt-009', managerId: 'emp-004',
        employmentType: 'INTERN', status: 'ACTIVE',
        hireDate: '2025-09-01', probationEnd: '2025-12-01', resignDate: null,
        bankName: 'TPBank', bankAccount: '0601000012345', bankBranch: 'CN Quận 3',
        socialInsuranceNo: null, healthInsuranceNo: null, taxCode: null,
        educationLevel: 'BACHELOR', major: 'Kỹ thuật Phần mềm', university: 'ĐH FPT',
        avatar: null, notes: 'Thực tập sinh đợt 3/2025', createdAt: '2025-09-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z',
        department: mockDepartments[1], position: mockPositions[7],
        manager: { id: 'emp-004', fullName: 'Phạm Đức Cường', employeeCode: 'NV-004', avatar: null },
    },
];

// ─── Generator Function ─────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockEmployees(count: number): Employee[] {
    const result = [...baseEmployees];
    const depts = mockDepartments;
    const statuses: Employee['status'][] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ON_LEAVE', 'RESIGNED'];
    const empTypes: Employee['employmentType'][] = ['FULL_TIME', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
    const eduLevels: NonNullable<Employee['educationLevel']>[] = ['BACHELOR', 'BACHELOR', 'MASTER', 'COLLEGE', 'PHD'];

    for (let i = result.length; i < count; i++) {
        const isFemale = Math.random() > 0.55;
        const lastName = pick(LAST_NAMES);
        const middleName = isFemale ? pick(MIDDLE_F) : pick(MIDDLE_M);
        const firstName = isFemale ? pick(FIRST_F) : pick(FIRST_M);
        const dept = pick(depts);
        const empIndex = i + 100; // Offset by 100 to avoid conflicts with base employees (which are under 100)
        const code = `NV-${String(empIndex).padStart(3, '0')}`;
        const year = 1985 + Math.floor(Math.random() * 15);
        const hireYear = 2019 + Math.floor(Math.random() * 6);

        result.push({
            id: `emp-${String(empIndex).padStart(3, '0')}`,
            userId: `usr-${String(empIndex).padStart(3, '0')}`,
            employeeCode: code,
            fullName: `${lastName} ${middleName} ${firstName}`,
            dateOfBirth: `${year}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
            gender: isFemale ? 'FEMALE' : 'MALE',
            nationalId: `0790${year % 100}0${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
            nationalIdDate: '2021-05-15', nationalIdPlace: 'TP. Hồ Chí Minh',
            phone: `${pick(['090', '091', '093', '098', '032', '033', '086', '079', '058'])}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
            personalEmail: `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@gmail.com`,
            address: `${Math.floor(Math.random() * 300)} Đường ${pick(['Nguyễn Huệ', 'Lê Lợi', 'Pasteur', 'Hai Bà Trưng', 'Võ Văn Tần'])}, TP.HCM`,
            permanentAddress: null, nationality: 'Việt Nam', religion: null, ethnicity: 'Kinh',
            maritalStatus: Math.random() > 0.5 ? 'MARRIED' : 'SINGLE',
            departmentId: dept.id, positionId: null, jobTitleId: null, managerId: dept.managerId,
            employmentType: pick(empTypes), status: pick(statuses),
            hireDate: `${hireYear}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-01`,
            probationEnd: `${hireYear}-${String(3 + Math.floor(Math.random() * 3)).padStart(2, '0')}-01`,
            resignDate: null,
            bankName: pick(BANKS), bankAccount: String(Math.floor(Math.random() * 9999999999999)), bankBranch: 'CN TP.HCM',
            socialInsuranceNo: `SN-${Math.floor(Math.random() * 9999999999)}`,
            healthInsuranceNo: `HN-${Math.floor(Math.random() * 9999999999)}`,
            taxCode: String(Math.floor(Math.random() * 9999999999)),
            educationLevel: pick(eduLevels), major: pick(['CNTT', 'QTKD', 'Kế toán', 'Marketing', 'Luật']),
            university: pick(UNIVERSITIES),
            avatar: null, notes: null,
            createdAt: `${hireYear}-01-01T00:00:00Z`, updatedAt: '2025-12-01T00:00:00Z',
            department: dept,
        });
    }
    return result;
}

// Default export: 35 employees
export const mockEmployees: Employee[] = generateMockEmployees(35);

// ─── Related Data ────────────────────────────────────────────────────────────

export const mockEmergencyContacts: EmergencyContact[] = [
    { id: 'ec-001', employeeId: 'emp-001', name: 'Trần Thị Bích', relationship: 'Vợ', phone: '0918111222', address: '123 Nguyễn Huệ, Q.1' },
    { id: 'ec-002', employeeId: 'emp-004', name: 'Nguyễn Thị Hoa', relationship: 'Vợ', phone: '0928222333', address: '78 Điện Biên Phủ, Q.BT' },
    { id: 'ec-003', employeeId: 'emp-007', name: 'Trần Văn Hùng', relationship: 'Bố', phone: '0938333444', address: '234 Lý Thường Kiệt, Q.TB' },
    { id: 'ec-004', employeeId: 'emp-015', name: 'Lê Văn Sơn', relationship: 'Chồng', phone: '0948444555', address: '56 Pasteur, Q.3' },
    { id: 'ec-005', employeeId: 'emp-030', name: 'Hoàng Văn Tuấn', relationship: 'Bố', phone: '0958555666', address: '90 Võ Văn Tần, Q.3' },
];

export const mockDependents: Dependent[] = [
    { id: 'dep-001', employeeId: 'emp-001', name: 'Trần Thị Bích', relationship: 'SPOUSE', dateOfBirth: '1982-08-20', nationalId: '079082012345' },
    { id: 'dep-002', employeeId: 'emp-001', name: 'Nguyễn Gia Bảo', relationship: 'CHILD', dateOfBirth: '2015-03-10', nationalId: null },
    { id: 'dep-003', employeeId: 'emp-004', name: 'Nguyễn Thị Hoa', relationship: 'SPOUSE', dateOfBirth: '1990-12-05', nationalId: '079090098765' },
    { id: 'dep-004', employeeId: 'emp-015', name: 'Lê Văn Sơn', relationship: 'SPOUSE', dateOfBirth: '1988-07-15', nationalId: '079088054000' },
];

export const mockWorkHistory: WorkHistory[] = [
    { id: 'wh-001', employeeId: 'emp-001', company: 'FPT Software', position: 'Project Manager', startDate: '2012-06-01', endDate: '2017-12-31', description: 'Quản lý dự án phần mềm quy mô lớn' },
    { id: 'wh-002', employeeId: 'emp-004', company: 'VNG Corporation', position: 'Senior Developer', startDate: '2014-03-01', endDate: '2019-05-30', description: 'Phát triển nền tảng game và chat' },
    { id: 'wh-003', employeeId: 'emp-015', company: 'Masan Group', position: 'HR Specialist', startDate: '2016-01-01', endDate: '2020-01-15', description: 'Tuyển dụng và đào tạo nhân sự' },
];
