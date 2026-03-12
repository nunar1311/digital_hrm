// =============================================================================
// Mock Rewards, Assets, Asset Assignments
// =============================================================================

import type { Reward, Asset, AssetAssignment } from '@/types';

export const mockRewards: Reward[] = [
    { id: 'rw-001', employeeId: 'emp-004', type: 'REWARD', title: 'Nhân viên xuất sắc Q4/2025', description: 'Hoàn thành xuất sắc dự án Digital HRM', amount: 5_000_000, decisionDate: '2026-01-15', decisionNo: 'QD-KT-001/2026', status: 'APPROVED', approvedBy: 'emp-001', createdAt: '2026-01-10T00:00:00Z', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004' },
    { id: 'rw-002', employeeId: 'emp-007', type: 'REWARD', title: 'Sáng kiến cải tiến quy trình', description: 'Đề xuất CI/CD pipeline giảm 50% thời gian deploy', amount: 3_000_000, decisionDate: '2026-02-01', decisionNo: 'QD-KT-002/2026', status: 'APPROVED', approvedBy: 'emp-001', createdAt: '2026-01-28T00:00:00Z', employeeName: 'Trần Thị Linh', employeeCode: 'NV-007' },
    { id: 'rw-003', employeeId: 'emp-015', type: 'REWARD', title: 'Tuyển dụng vượt chỉ tiêu', description: 'Tuyển dụng 15 nhân sự trong Q4, vượt 20% KPI', amount: 2_000_000, decisionDate: '2026-01-20', decisionNo: 'QD-NS-001/2026', status: 'APPROVED', approvedBy: 'emp-001', createdAt: '2026-01-18T00:00:00Z', employeeName: 'Lê Thị Mai', employeeCode: 'NV-015' },
    { id: 'rw-004', employeeId: 'emp-030', type: 'DISCIPLINE', title: 'Vi phạm quy định giờ làm việc', description: 'Đi muộn quá 3 lần trong tháng 2/2026', amount: null, decisionDate: '2026-03-01', decisionNo: 'QD-KL-001/2026', status: 'PENDING', approvedBy: null, createdAt: '2026-02-28T00:00:00Z', employeeName: 'Hoàng Minh Đạt', employeeCode: 'NV-030' },
];

export const mockAssets: Asset[] = [
    { id: 'ast-001', name: 'MacBook Pro 14"', code: 'LPT-001', category: 'LAPTOP', status: 'ASSIGNED', purchaseDate: '2024-06-01', purchasePrice: 55_000_000, serialNumber: 'C02G123HASH', description: 'M3 Pro, 18GB RAM' },
    { id: 'ast-002', name: 'MacBook Pro 16"', code: 'LPT-002', category: 'LAPTOP', status: 'ASSIGNED', purchaseDate: '2024-06-01', purchasePrice: 72_000_000, serialNumber: 'C02G456HASH', description: 'M3 Max, 36GB RAM' },
    { id: 'ast-003', name: 'Dell UltraSharp 27"', code: 'MON-001', category: 'MONITOR', status: 'ASSIGNED', purchaseDate: '2024-03-15', purchasePrice: 12_000_000, serialNumber: 'DL27U001', description: '4K IPS' },
    { id: 'ast-004', name: 'iPhone 15 Pro', code: 'PHN-001', category: 'PHONE', status: 'ASSIGNED', purchaseDate: '2024-10-01', purchasePrice: 28_000_000, serialNumber: 'IP15P001', description: '256GB' },
    { id: 'ast-005', name: 'Bàn nâng hạ', code: 'DSK-001', category: 'DESK', status: 'AVAILABLE', purchaseDate: '2024-01-10', purchasePrice: 8_000_000, serialNumber: null, description: '120x60cm' },
];

export const mockAssetAssignments: AssetAssignment[] = [
    { id: 'aa-001', assetId: 'ast-001', employeeId: 'emp-007', assignDate: '2024-06-15', returnDate: null, status: 'ASSIGNED', notes: null, assetName: 'MacBook Pro 14"', assetCode: 'LPT-001', employeeName: 'Trần Thị Linh', employeeCode: 'NV-007' },
    { id: 'aa-002', assetId: 'ast-002', employeeId: 'emp-004', assignDate: '2024-06-10', returnDate: null, status: 'ASSIGNED', notes: null, assetName: 'MacBook Pro 16"', assetCode: 'LPT-002', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004' },
    { id: 'aa-003', assetId: 'ast-003', employeeId: 'emp-004', assignDate: '2024-03-20', returnDate: null, status: 'ASSIGNED', notes: null, assetName: 'Dell UltraSharp 27"', assetCode: 'MON-001', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004' },
    { id: 'aa-004', assetId: 'ast-004', employeeId: 'emp-001', assignDate: '2024-10-05', returnDate: null, status: 'ASSIGNED', notes: null, assetName: 'iPhone 15 Pro', assetCode: 'PHN-001', employeeName: 'Nguyễn Văn An', employeeCode: 'NV-001' },
];
