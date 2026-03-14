# Module Details (84 Features)

## Module 1: Dashboard (`/`)
**Features:** KPI cards, charts, today's attendance, pending approvals, upcoming events

**UI:**
- Grid 1-2-3 columns responsive
- KPI Cards: Headcount, New hires, Turnover rate, Total salary
- Charts: Department distribution (Pie), Staffing trend (Area)
- Today's attendance table
- Pending approvals section (leaves, OT, explanations)
- Upcoming: birthdays, contract expiry, probation end

**Permissions:**
- `DASHBOARD_VIEW`: Basic (personal info)
- `DASHBOARD_VIEW_ALL`: Full stats (Manager/HR/Director)

---

## Module 2: Employees (`/employees`)
**Routes:**
- `/employees` - List with search/filter/export
- `/employees/[id]` - 360° profile
- `/employees/new` - Create form
- `/employees/[id]/edit` - Edit form

**List Features:**
- Table: Photo, Code, Name, Department, Position, Status, Join Date
- Search + Filters (department, status, contract type)
- Bulk actions: Export Excel, Import CSV
- Server-side pagination

**Profile Tabs:**
1. General: Personal info, contact, avatar
2. Job: Department, position, manager, employee type
3. Contracts: List + current contract
4. Leaves: Balance + history
5. Attendance: Monthly summary
6. Salary: History (restricted)
7. Assets: Assigned assets
8. Timeline: Work history events

**Form:**
- Multi-step or tabbed
- Validation: unique email, employee code, CCCD
- Avatar upload
- Auto-generate employee code

---

## Module 3: Contracts (`/contracts`)
**Routes:**
- `/contracts` - List with filters
- `/contracts/[id]` - Detail + timeline
- `/contracts/templates` - Template management

**Features:**
- Contract list: Employee, Type, Start/End date, Status
- Filters: type, status, expiring soon
- Create from template (fill info → preview → save)
- Contract detail with extension timeline
- Template editor (rich text)
- **Expiry alerts**: 30/60/90 days before
- PDF export/print

**Contract Types:** Probation, Fixed-term, Indefinite, Part-time, Contractor

---

## Module 4: Leaves (`/leaves`)
**Routes:**
- `/leaves` - Request list
- `/leaves/calendar` - Team calendar
- `/leaves/policies` - Policy config
- `/leaves/requests/[id]` - Request detail

**Request List:**
- Tabs: My requests | Pending approval | All (HR)
- Create: Leave type, date range, reason, attachments
- Show remaining balance per type
- Workflow: PENDING → APPROVED/REJECTED

**Team Calendar:**
- Month/Week view
- Color-coded by leave type
- Filter by department

**Policies:**
- CRUD leave types (annual, sick, unpaid, maternity, marriage)
- Config: days allowed, paid/unpaid, carry-over

---

## Module 5: Payroll (`/payroll`)
**Routes:**
- `/payroll` - Salary periods
- `/payroll/formulas` - Formula management
- `/payroll/payslips` - Individual slips
- `/payroll/tax-insurance` - Tax/BHXH config

**Salary Period:**
- Create period (month/year)
- Auto-calculate from attendance + contracts + allowances
- Summary table: Employee, base salary, work days, OT, allowances, BHXH, tax, net
- Workflow: Draft → Calculating → Review → Approved → Paid
- Export Excel

**Formulas:**
- Variables: baseSalary, workDays, standardDays, otHours, allowances
- Define: OT coefficients, allowance rules

**Payslips:**
- Individual view (password protected)
- Email payslip (HR)

**Tax & Insurance:**
- Income tax: 7-tier progressive (5-35%)
- BHXH: 8%, BHYT: 1.5%, BHTN: 1%
- Dependents: self 11M, dependent 4.4M/month

---

## Module 6: Onboarding (`/onboarding`)
**Routes:**
- `/onboarding` - List
- `/onboarding/[id]` - Detail with checklist

**Features:**
- List of new hires in onboarding
- Progress bar per employee
- Task checklist (configurable by template)
- Assign tasks by role: HR, IT, Manager
- Timeline view
- Auto-complete when all done

---

## Module 7: Training (`/training`)
**Features:**
- Course list
- Course creation (internal/external)
- Employee enrollment
- Attendance tracking, scores
- Employee training history
- Certificate tracking + expiry alerts

---

## Module 8: Performance (`/performance`)
**Features:**
- Review cycles (quarterly, semi-annual, annual)
- KPI/OKR setup (company → department → individual)
- Self-assessment → Manager review → Final result
- Review form: score, strengths, improvements, next goals
- Radar chart comparison

---

## Module 9: Rewards (`/rewards`)
**Tabs:** Rewards | Discipline

**Features:**
- Create decision: Employee, type, content, amount, date, decision number
- Approval workflow
- History in employee profile

---

## Module 10: Reports (`/reports`)
**Categories:**
- HR: Headcount by dept, type, gender, tenure
- Attendance: Monthly summary, late rate
- Leaves: Usage by dept/type
- Payroll: Salary by dept/month

**Features:**
- Charts: Bar, Line, Pie
- Filters: date range, department
- Export Excel/PDF

---

## Module 11: ESS (`/ess`)
**Routes:**
- `/ess` - Overview
- `/ess/profile` - My profile
- `/ess/requests` - My requests

**Overview:**
- Today's check-in/out
- Leave balance
- Latest payslip
- Notifications

**Profile:**
- View/edit limited fields
- Upload avatar
- Update phone, address, emergency contact

**Requests:**
- Submit requests (confirmation letters, document support)
- Track status

---

## Feature Summary (84 Features)

| # | Module | Feature | Priority | Phase |
|---|--------|---------|----------|-------|
| 1 | Org Chart | Tree visualization with zoom/pan | High | 1 |
| 2 | Org Chart | Drag & drop employee transfer | High | 1 |
| 3 | Org Chart | Department CRUD | High | 1 |
| 4 | Org Chart | Organization change history | Medium | 2 |
| 5 | Employee | 360° profile | High | 1 |
| 6 | Employee | Timeline | High | 1 |
| 7 | Employee | Import/Export Excel | High | 1 |
| 8 | Employee | Advanced search | Medium | 1 |
| 9 | Employee | Employee photo management | Low | 2 |
| 10 | Employee | Dependent management | Medium | 2 |
| 11 | Contract | Expiry alerts | High | 1 |
| 12 | Contract | Print contract (PDF) | High | 1 |
| 13 | Contract | Contract appendices | High | 1 |
| 14 | Contract | Contract templates | Medium | 1 |
| 15 | Contract | Digital signature | Low | 3 |
| 16 | Leave | Approval workflow | High | 1 |
| 17 | Leave | Auto balance calculation | High | 1 |
| 18 | Leave | Team calendar | High | 1 |
| 19 | Leave | Leave policies | Medium | 1 |
| 20 | Leave | Leave reports | Medium | 2 |
| 21 | Attendance | Anti-fraud (GPS/WiFi/selfie) | High | 1 |
| 22 | Attendance | Flexible processing | High | 1 |
| 23 | Attendance | Device integration | High | 1 |
| 24 | Attendance | Monthly summary | High | 1 |
| 25 | Attendance | Overtime management | High | 1 |
| 26 | Attendance | Shift management | Medium | 2 |
| 27 | Payroll | Dynamic formulas | High | 2 |
| 28 | Payroll | Payslip security | High | 1 |
| 29 | Payroll | Salary summary | High | 1 |
| 30 | Payroll | Tax & BHXH | High | 1 |
| 31 | Payroll | Allowances/Bonuses | Medium | 2 |
| 32 | Payroll | Salary advance | Low | 3 |
| 33 | Onboarding | Auto checklist | High | 1 |
| 34 | Onboarding | Welcome portal | Medium | 2 |
| 35 | Onboarding | Probation evaluation | Medium | 2 |
| 36 | Onboarding | Mentor/Buddy program | Low | 3 |
| 37 | Offboarding | Asset handover | High | 1 |
| 38 | Offboarding | Exit interview | Medium | 2 |
| 39 | Offboarding | Final settlement | High | 1 |
| 40 | Offboarding | Work certificate | Low | 2 |
| 41 | ESS | Self-service | High | 1 |
| 42 | ESS | View payslip | High | 1 |
| 43 | ESS | Administrative requests | Medium | 2 |
| 44 | ESS | Internal news | Low | 3 |
| 45 | Reports | Turnover charts | High | 1 |
| 46 | Reports | Headcount reports | Medium | 1 |
| 47 | Reports | Dashboard overview | High | 1 |
| 48 | Reports | Salary analysis | High | 2 |
| 49 | Reports | Custom reports | Low | 3 |
| 50 | Recruitment | Job postings | Medium | 2 |
| 51 | Recruitment | ATS pipeline | Medium | 2 |
| 52 | Recruitment | Interview calendar | Low | 3 |
| 53 | Recruitment | Candidate pool | Low | 3 |
| 54 | Recruitment | Recruitment reports | Low | 3 |
| 55 | Training | Training plan | Medium | 2 |
| 56 | Training | Course management | Medium | 2 |
| 57 | Training | Certificate management | Medium | 2 |
| 58 | Training | Post-training evaluation | Low | 3 |
| 59 | Performance | KPI/OKR setup | Medium | 2 |
| 60 | Performance | Review cycles | Medium | 2 |
| 61 | Performance | 360° feedback | Medium | 3 |
| 62 | Performance | Development plan | Low | 3 |
| 63 | Assets | Asset allocation | Medium | 2 |
| 64 | Assets | Asset recovery | Medium | 2 |
| 65 | Assets | Asset inventory | Low | 3 |
| 66 | Security | RBAC | High | 1 |
| 67 | Security | Audit log | High | 1 |
| 68 | Security | Data encryption | High | 1 |
| 69 | Security | 2FA | Medium | 2 |
| 70 | Notifications | Push notifications | High | 1 |
| 71 | Notifications | Auto reminders | Medium | 2 |
| 72 | Notifications | Surveys | Low | 3 |
| 73 | Business Trip | Trip requests | Medium | 2 |
| 74 | Business Trip | Expense claims | Medium | 3 |
| 75 | Business Trip | Expense reports | Low | 3 |
| 76 | Benefits | Benefits management | Medium | 2 |
| 77 | Benefits | Supplementary insurance | Low | 3 |
| 78 | Benefits | Holiday calendar | Medium | 1 |
| 79 | Integration | REST API | High | 1 |
| 80 | Integration | Email integration | High | 1 |
| 81 | Integration | Backup & recovery | High | 1 |
| 82 | Integration | Mobile responsive | High | 1 |
| 83 | Integration | Multi-tenant | Low | 4 |
| 84 | Rewards | Rewards management | Medium | 2 |
| 85 | Rewards | Discipline management | Medium | 2 |
| 86 | Rewards | Leaderboard | Low | 3 |
