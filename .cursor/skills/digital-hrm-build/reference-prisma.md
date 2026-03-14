# Prisma Schema Reference (47 Models)

## Auth Models
```prisma
User {
  id, name, email, emailVerified, image
  createdAt, updatedAt, employeeCode
  departmentId, position, hrmRole
}
Session { id, userId, token, expiresAt, ipAddress, userAgent }
Account { id, userId, accountId, providerId, accessToken, refreshToken }
Verification { id, identifier, value, expiresAt }
Organization { id, name, slug, logo, metadata }
Member { id, userId, organizationId, role }
```

## HR Models
```prisma
Department {
  id, name, code, logo, description
  parentId, secondaryParentIds, managerId
  status, sortOrder, createdAt, updatedAt
}
Position {
  id, name, code, departmentId, level, description
}
```

## Attendance Models
```prisma
Shift {
  id, name, code, startTime, endTime
  breakMinutes, lateThreshold, earlyThreshold
  isDefault, isActive, createdAt, updatedAt
}
ShiftAssignment {
  id, userId, shiftId, startDate, endDate
  workCycleId, cycleStartDate
}
Attendance {
  id, userId, date, shiftId
  checkIn, checkOut, checkInMethod, checkOutMethod
  workHours, overtimeHours, status, note
  isLocked, latitude, longitude, photoUrl, createdAt
}
AttendanceExplanation {
  id, attendanceId, reason, status
  approvedBy, approvedAt, createdAt
}
OvertimeRequest {
  id, userId, date, startTime, endTime
  hours, reason, status, approvedBy, approvedAt
  coefficient, createdAt
}
AttendanceConfig {
  id, organizationId
  workHoursPerDay, lateThreshold, earlyLeaveThreshold
  gpsEnabled, wifiEnabled, selfieEnabled
  maxGpsDistance, createdAt, updatedAt
}
WifiWhitelist { id, name, macAddress, isActive, createdAt }
TimekeeperDevice { id, name, type, ipAddress, location, isActive }
Holiday { id, name, date, isRecurring, createdAt }
WorkCycle { id, name, pattern, createdAt }
WorkCycleEntry { id, workCycleId, dayOfWeek, shiftId }
AttendanceSummary {
  id, userId, month, year
  totalDays, workDays, presentDays, lateDays, absentDays
  leaveDays, overtimeHours, isLocked
  createdAt, updatedAt
}
```

## Recruitment Models
```prisma
JobPosting {
  id, title, departmentId, positionId
  description, requirements, salaryMin, salaryMax
  headcount, employmentType, status, deadline
  createdBy, createdAt
}
Candidate {
  id, jobPostingId, name, email, phone
  resumeUrl, source, stage, rating, notes
  interviewDate, createdAt
}
CandidateTag { id, candidateId, tag }
Interview {
  id, candidateId, scheduledAt, duration, type
  stage, location, meetingUrl, notes, status, createdAt
}
InterviewFeedback {
  id, interviewId, rating, strengths
  weaknesses, recommendation, submittedAt
}
```

## Asset Models
```prisma
Asset {
  id, name, code, category, status
  purchaseDate, purchasePrice, serialNumber
  description, createdAt, updatedAt
}
AssetAssignment {
  id, assetId, employeeId, assignDate
  returnDate, status, notes
}
```

## Offboarding Models
```prisma
OffboardingTemplate { id, name, description, isActive, createdAt }
OffboardingTask {
  id, templateId, title, description
  assigneeRole, dueDay, sortOrder
}
Offboarding {
  id, userId, resignDate, lastWorkDate
  reason, status, exitInterview, notes
  createdAt, updatedAt
}
OffboardingChecklist {
  id, offboardingId, taskTitle, isCompleted
  completedBy, completedAt
}
OffboardingAsset {
  id, offboardingId, assetId, assetName
  assetCode, category, status, returnDate
  returnedTo, condition, notes
}
```

## System Models
```prisma
AuditLog {
  id, userId, action, entity, entityId
  oldData, newData, ipAddress, userAgent, createdAt
}
SystemSetting { id, key, value, group }
```

## Permission Enums (Full List)
```typescript
// Dashboard
Permission.DASHBOARD_VIEW = "dashboard:view"
Permission.DASHBOARD_VIEW_ALL = "dashboard:view_all"

// Employee
Permission.EMPLOYEE_VIEW_SELF = "employee:view_self"
Permission.EMPLOYEE_VIEW_TEAM = "employee:view_team"
Permission.EMPLOYEE_VIEW_ALL = "employee:view_all"
Permission.EMPLOYEE_CREATE = "employee:create"
Permission.EMPLOYEE_EDIT = "employee:edit"
Permission.EMPLOYEE_DELETE = "employee:delete"
Permission.EMPLOYEE_EXPORT = "employee:export"
Permission.EMPLOYEE_IMPORT = "employee:import"

// Contract
Permission.CONTRACT_VIEW_SELF = "contract:view_self"
Permission.CONTRACT_VIEW_TEAM = "contract:view_team"
Permission.CONTRACT_VIEW_ALL = "contract:view_all"
Permission.CONTRACT_CREATE = "contract:create"
Permission.CONTRACT_EDIT = "contract:edit"
Permission.CONTRACT_DELETE = "contract:delete"
Permission.CONTRACT_SIGN = "contract:sign"
Permission.CONTRACT_EXPORT = "contract:export"

// Attendance
Permission.ATTENDANCE_VIEW_SELF = "attendance:view_self"
Permission.ATTENDANCE_VIEW_TEAM = "attendance:view_team"
Permission.ATTENDANCE_VIEW_ALL = "attendance:view_all"
Permission.ATTENDANCE_CHECK_IN = "attendance:check_in"
Permission.ATTENDANCE_MANAGE = "attendance:manage"
Permission.ATTENDANCE_EDIT = "attendance:edit"
Permission.ATTENDANCE_LOCK = "attendance:lock"

// Leave
Permission.LEAVE_VIEW_SELF = "leave:view_self"
Permission.LEAVE_VIEW_TEAM = "leave:view_team"
Permission.LEAVE_VIEW_ALL = "leave:view_all"
Permission.LEAVE_CREATE = "leave:create"
Permission.LEAVE_EDIT = "leave:edit"
Permission.LEAVE_DELETE = "leave:delete"
Permission.LEAVE_APPROVE = "leave:approve"
Permission.LEAVE_MANAGE = "leave:manage"

// Payroll
Permission.PAYROLL_VIEW_SELF = "payroll:view_self"
Permission.PAYROLL_VIEW_TEAM = "payroll:view_team"
Permission.PAYROLL_VIEW_ALL = "payroll:view_all"
Permission.PAYROLL_CREATE = "payroll:create"
Permission.PAYROLL_EDIT = "payroll:edit"
Permission.PAYROLL_APPROVE = "payroll:approve"
Permission.PAYROLL_EXPORT = "payroll:export"
Permission.PAYROLL_MANAGE = "payroll:manage"

// More modules...
Permission.ORG_CHART_VIEW = "org_chart:view"
Permission.ORG_CHART_EDIT = "org_chart:edit"
Permission.RECRUITMENT_VIEW = "recruitment:view"
Permission.RECRUITMENT_MANAGE = "recruitment:manage"
Permission.ASSET_VIEW = "asset:view"
Permission.ASSET_MANAGE = "asset:manage"
Permission.ONBOARDING_VIEW = "onboarding:view"
Permission.ONBOARDING_MANAGE = "onboarding:manage"
Permission.OFFBOARDING_VIEW = "offboarding:view"
Permission.OFFBOARDING_MANAGE = "offboarding:manage"
Permission.TRAINING_VIEW = "training:view"
Permission.TRAINING_MANAGE = "training:manage"
Permission.PERFORMANCE_VIEW = "performance:view"
Permission.PERFORMANCE_MANAGE = "performance:manage"
Permission.REWARDS_VIEW = "rewards:view"
Permission.REWARDS_MANAGE = "rewards:manage"
Permission.REPORTS_VIEW = "reports:view"
Permission.REPORTS_EXPORT = "reports:export"
Permission.SETTINGS_VIEW = "settings:view"
Permission.SETTINGS_EDIT = "settings:edit"
```

## Future Models (Phase 2-3)
If needed, these models may be added:
- LeaveType, LeaveBalance, LeaveRequest
- PayrollPeriod, PayrollItem, SalaryComponent
- TrainingCourse, TrainingEnrollment, TrainingCertificate
- PerformanceReview, PerformanceCycle, KPI
- Reward, Discipline
- BusinessTrip, ExpenseClaim
- Notification
- Announcement
