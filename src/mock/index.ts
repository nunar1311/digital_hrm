// =============================================================================
// Barrel Export — All Mock Data
// =============================================================================

// Organization
export { mockDepartments, mockPositions, mockJobTitles } from './departments';

// Employees
export { baseEmployees, mockEmployees, generateMockEmployees, mockEmergencyContacts, mockDependents, mockWorkHistory } from './employees';

// Contracts
export { mockContractTemplates, mockContracts, generateMockContracts } from './contracts';

// Leave
export { mockLeaveTypes, mockLeaveBalances, mockLeaveRequests, generateLeaveBalances } from './leaves';

// Attendance
export { mockShifts, mockAttendance, mockOvertimeRequests, generateMonthlyAttendance } from './attendance';

// Payroll
export { mockPayrollPeriods, mockPayrollRecords, mockTaxBrackets, generatePayrollRecords } from './payroll';

// Rewards & Assets
export { mockRewards, mockAssets, mockAssetAssignments } from './rewards';

// Recruitment
export { mockJobPostings, mockCandidates } from './recruitment';

// Training & Performance
export { mockTrainingCourses, mockTrainingParticipants, mockPerformanceCycles, mockPerformanceReviews } from './training';

// Timeline
export { mockTimelineEvents, getEmployeeTimeline } from './timeline';

// Dashboard
export { kpiData, departmentDistribution, monthlyHeadcount, payrollSummary, todayAttendance, pendingApprovals, upcomingEvents, genderDistribution, employmentTypeDistribution } from './dashboard';

// Helpers
export { formatVND, formatDate, formatDateTime, filterEmployees, paginate, sortBy, EMPLOYEE_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, EDUCATION_LABELS } from './helpers';
