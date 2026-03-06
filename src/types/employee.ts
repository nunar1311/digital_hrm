// =============================================================================
// Employee & Related Types
// Mirrors Prisma models: Employee, EmergencyContact, Dependent, WorkHistory
// =============================================================================

import type { Department, Position } from './department';

export interface Employee {
    id: string;
    userId: string;
    employeeCode: string;
    // Thông tin cá nhân
    fullName: string;
    dateOfBirth: string | null;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
    nationalId: string | null;
    nationalIdDate: string | null;
    nationalIdPlace: string | null;
    phone: string | null;
    personalEmail: string | null;
    address: string | null;
    permanentAddress: string | null;
    nationality: string;
    religion: string | null;
    ethnicity: string | null;
    maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | null;
    // Thông tin công việc
    departmentId: string | null;
    positionId: string | null;
    jobTitleId: string | null;
    managerId: string | null;
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
    status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
    hireDate: string | null;
    probationEnd: string | null;
    resignDate: string | null;
    // Thông tin ngân hàng
    bankName: string | null;
    bankAccount: string | null;
    bankBranch: string | null;
    // Thông tin BHXH
    socialInsuranceNo: string | null;
    healthInsuranceNo: string | null;
    taxCode: string | null;
    // Trình độ
    educationLevel: 'HIGHSCHOOL' | 'COLLEGE' | 'BACHELOR' | 'MASTER' | 'PHD' | null;
    major: string | null;
    university: string | null;
    // Metadata
    avatar: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    // Resolved relations (optional, for display)
    department?: Department;
    position?: Position;
    manager?: Pick<Employee, 'id' | 'fullName' | 'employeeCode' | 'avatar'>;
}

export interface EmergencyContact {
    id: string;
    employeeId: string;
    name: string;
    relationship: string;
    phone: string;
    address: string | null;
}

export interface Dependent {
    id: string;
    employeeId: string;
    name: string;
    relationship: 'SPOUSE' | 'CHILD' | 'PARENT';
    dateOfBirth: string | null;
    nationalId: string | null;
}

export interface WorkHistory {
    id: string;
    employeeId: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
}
