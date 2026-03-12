// =============================================================================
// Mock Contracts — Base records + Generator
// =============================================================================

import type { Contract, ContractTemplate } from '@/types';
import { mockEmployees } from './employees';

export const mockContractTemplates: ContractTemplate[] = [
    { id: 'tmpl-001', name: 'Hợp đồng thử việc', content: '<p>HĐ thử việc...</p>', variables: ['employee_name', 'salary', 'start_date'], isActive: true, createdAt: '2023-01-01T00:00:00Z' },
    { id: 'tmpl-002', name: 'Hợp đồng lao động có thời hạn', content: '<p>HĐ có thời hạn...</p>', variables: ['employee_name', 'salary', 'start_date', 'end_date'], isActive: true, createdAt: '2023-01-01T00:00:00Z' },
    { id: 'tmpl-003', name: 'Hợp đồng lao động không thời hạn', content: '<p>HĐ không thời hạn...</p>', variables: ['employee_name', 'salary', 'start_date'], isActive: true, createdAt: '2023-01-01T00:00:00Z' },
];

const TYPES: Contract['contractType'][] = ['PROBATION', 'DEFINITE', 'INDEFINITE'];
const STATUSES: Contract['status'][] = ['ACTIVE', 'EXPIRED', 'ACTIVE', 'ACTIVE'];
const SALARIES = [8_000_000, 12_000_000, 15_000_000, 20_000_000, 25_000_000, 30_000_000, 35_000_000, 45_000_000, 60_000_000, 80_000_000];

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

export function generateMockContracts(): Contract[] {
    const contracts: Contract[] = [];
    mockEmployees.slice(0, 20).forEach((emp, i) => {
        const sal = SALARIES[Math.min(i, SALARIES.length - 1)];
        contracts.push({
            id: `con-${String(i * 2 + 1).padStart(3, '0')}`,
            contractCode: `HD-${new Date().getFullYear()}-${String(i * 2 + 1).padStart(3, '0')}`,
            employeeId: emp.id,
            contractType: 'PROBATION',
            templateId: 'tmpl-001',
            startDate: emp.hireDate || '2024-01-01',
            endDate: emp.probationEnd || '2024-03-01',
            signingDate: emp.hireDate || '2024-01-01',
            salary: Math.round(sal * 0.85),
            allowances: { lunch: 500_000, transport: 300_000 },
            status: 'EXPIRED',
            notes: null, attachmentUrl: null, createdBy: 'emp-015',
            createdAt: emp.hireDate || '2024-01-01', updatedAt: '2025-12-01T00:00:00Z',
            employeeName: emp.fullName, employeeCode: emp.employeeCode,
        });
        contracts.push({
            id: `con-${String(i * 2 + 2).padStart(3, '0')}`,
            contractCode: `HD-${new Date().getFullYear()}-${String(i * 2 + 2).padStart(3, '0')}`,
            employeeId: emp.id,
            contractType: pick(TYPES.filter(t => t !== 'PROBATION')),
            templateId: 'tmpl-002',
            startDate: emp.probationEnd || '2024-03-01',
            endDate: emp.employmentType === 'INTERN' ? '2026-03-01' : null,
            signingDate: emp.probationEnd || '2024-03-01',
            salary: sal,
            allowances: { lunch: 500_000, transport: 300_000, phone: 200_000 },
            status: pick(STATUSES),
            notes: null, attachmentUrl: null, createdBy: 'emp-015',
            createdAt: emp.probationEnd || '2024-03-01', updatedAt: '2025-12-01T00:00:00Z',
            employeeName: emp.fullName, employeeCode: emp.employeeCode,
        });
    });
    return contracts;
}

export const mockContracts: Contract[] = generateMockContracts();
