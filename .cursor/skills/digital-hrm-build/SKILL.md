---
name: digital-hrm-build
description: Builds complete Digital HRM system for Vietnamese enterprises with 84 features across 20 modules. Use when building employee management, attendance, contracts, leaves, payroll, onboarding/offboarding, recruitment, training, performance, rewards, assets, reports, ESS, or any HR module. Follows Next.js App Router, Prisma, shadcn/ui, TanStack Query patterns.
---

# Digital HRM Build Guide

## Project Overview

**Digital HRM** is a comprehensive HR management system for Vietnamese enterprises.

**Tổng số tính năng:** 84 features across 20 modules and 4 deployment phases.

**Tech Stack (Already Installed):**
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5+ |
| Database ORM | Prisma | 7.4.1 |
| Database | PostgreSQL | 14+ |
| Authentication | Better Auth | 1.4.18 |
| Data Fetching | TanStack Query | v5+ |
| Table/Pagination | TanStack Table + Infinite Scroll | v8.21+ |
| UI Components | shadcn/ui + Radix UI | 33 components |
| Styling | Tailwind CSS | v4 |
| Forms | react-hook-form + zod | v7 / v4 |
| Realtime | Socket.IO | v4.8 |
| Icons | Lucide React | 0.575.0 |
| Date Utils | date-fns | v4 |
| Toasts | sonner | Latest |
| Package Manager | pnpm | 9+ |
| Runtime | Node.js | 20+ |

## Quick Commands

```bash
pnpm dev          # Development server (localhost:3000)
pnpm db:push     # Sync Prisma schema
pnpm db:studio   # Open Prisma Studio
node prisma/seed.js  # Seed demo data (9 users)
pnpm build       # Production build
```

## Timezone System

Always use `useTimezone` hook for date/time display:
```typescript
const { timezone, formatDate, formatTime, formatDateTime, getTimezoneLabel } = useTimezone();

// Format with timezone
new Date().toLocaleTimeString("vi-VN", { timeZone: timezone, hour: "2-digit", minute: "2-digit" })
```

**Supported timezones:** 27 popular timezones including Asia/Ho_Chi_Minh, Asia/Singapore, Asia/Tokyo, Europe/London, America/New_York

## Current Status (Updated 13/03/2026)

### ✅ Completed Modules

**Infrastructure & Cross-Cutting:**
- Auth: Login, forgot-password, session management, middleware protection
- RBAC: 9 roles with ~60 permissions, PermissionGate component
- Middleware: Route protection + RBAC checking
- Sidebar navigation: 7 menu groups with permission-based visibility
- Layout system: Protected layout with sidebar + header + breadcrumb
- Theme system: Light/Dark mode, color presets, Shepherd.js tour
- User profile dropdown with theme customization
- Realtime (WebSocket): Socket.IO server/client, useSocketEvent hook
- 47 Prisma models with migrations
- Seed data: 9 demo users
- 33 shadcn/ui components installed
- Timezone System: useTimezone hook with localStorage sync

**Completed Business Modules:**
- **Org Chart**: Interactive canvas with zoom/pan, drag-and-drop, department CRUD, matrix reporting, 4 company templates (JSC/LLC/Partnership/Sole), WebSocket sync
- **Attendance** (44 files, ~14,200+ LOC): Check-in/out with GPS/WiFi/selfie verification, shifts management, monthly grid table, overtime requests, explanations, records, settings
- **Recruitment** (12 files): Kanban pipeline, candidate management, job postings, interview scheduling, calendar view, reports
- **Assets**: 6 component files (AssetList, MyAssets, AssetFormDialog, AssetAssignDialog, AssetReturnDialog, AssetDetailSheet)
- **Offboarding**: 7 files completing (client, table, dialog, detail, sheet, actions, types)

### ❌ Modules To Build

1. **Employees (Nhân viên)** - CRUD + 360° profile + multi-tab
2. **Contracts (Hợp đồng)** - templates, PDF, expiry alerts
3. **Leaves (Nghỉ phép)** - requests + calendar + policies
4. **Payroll (Tính lương)** - salary, payslips, tax/BHXH
5. **Onboarding (Tiếp nhận)** - checklist templates
6. **Dashboard (Tổng quan)** - KPIs, charts, approvals
7. **Training (Đào tạo)**
8. **Performance (Đánh giá)**
9. **Rewards (Khen thưởng/Kỷ luật)**
10. **Reports (Báo cáo)**
11. **ESS (Cổng nhân viên)**

## RBAC System

### 9 Roles (Priority Order)
```
SUPER_ADMIN      → Full system access
DIRECTOR        → Approve high-level requests
HR_MANAGER      → Full HR CRUD
HR_STAFF        → HR support tasks
DEPT_MANAGER    → View/approve within department
TEAM_LEADER     → View/approve within team
EMPLOYEE        → Self-service only
ACCOUNTANT      → Payroll access only
IT_ADMIN        → System + assets management
```

### Permission Scopes
Each module has scopes: `view_self`, `view_team`, `view_all`, `create`, `edit`, `delete`, `approve`, `manage`, `export`

### Permission Enum Examples
```typescript
enum Permission {
  DASHBOARD_VIEW = "dashboard:view",
  DASHBOARD_VIEW_ALL = "dashboard:view_all",
  EMPLOYEE_VIEW_SELF = "employee:view_self",
  EMPLOYEE_VIEW_TEAM = "employee:view_team",
  EMPLOYEE_VIEW_ALL = "employee:view_all",
  EMPLOYEE_CREATE = "employee:create",
  EMPLOYEE_EDIT = "employee:edit",
  EMPLOYEE_DELETE = "employee:delete",
  ATTENDANCE_VIEW_SELF = "attendance:view_self",
  ATTENDANCE_CHECK_IN = "attendance:check_in",
  LEAVE_CREATE = "leave:create",
  LEAVE_APPROVE = "leave:approve",
  PAYROLL_VIEW_ALL = "payroll:view_all",
  // ... more
}
```

## Code Patterns

### Server Actions Pattern
```typescript
// src/app/(protected)/[module]/actions.ts
"use server";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  // ...
});

export async function getData(params: { page: number; pageSize: number; search?: string }) {
  await requirePermission(Permission.VIEW_ALL);
  // ... query with pagination
}

export async function createItem(data: z.infer<typeof schema>) {
  const session = await requirePermission(Permission.CREATE);
  const validated = schema.parse(data);
  // ... create logic
  // ... audit log
  revalidatePath("/module");
  return result;
}
```

### Client Component Pattern
```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { toast } from "sonner";

export function ModuleClient({ initialData }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ 
    queryKey: ["module"], 
    queryFn: fetchData, 
    initialData 
  });
  
  useSocketEvent("module:updated", () => {
    queryClient.invalidateQueries({ queryKey: ["module"] });
  });
  
  // ...
}
```

### Infinite Scroll Pattern (PAGE_SIZE=20)
```typescript
const PAGE_SIZE = 20;
const sentinelRef = useRef<HTMLDivElement>(null);
const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && hasMore) setVisibleCount(c => c + PAGE_SIZE);
    },
    { rootMargin: "200px" }
  );
  if (sentinelRef.current) observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasMore]);

// JSX:
<div ref={sentinelRef} className="h-1" />
<p className="text-xs text-muted-foreground">Hiển thị {rows.length} / {total} bản ghi</p>
```

## Project Structure

```
digital_hrm/
├── prisma/
│   ├── schema.prisma          # 47 models
│   ├── seed.ts                # Seed data
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Forgot Password
│   │   ├── (protected)/       # 18+ business modules
│   │   │   ├── (dashboard)/   # Dashboard overview
│   │   │   ├── employees/     # Employee management
│   │   │   ├── contracts/     # Labor contracts
│   │   │   ├── departments/   # Departments
│   │   │   ├── attendance/   # Attendance (COMPLETE)
│   │   │   ├── leaves/       # Leave management
│   │   │   ├── payroll/      # Payroll
│   │   │   ├── onboarding/   # Onboarding
│   │   │   ├── offboarding/  # Offboarding (COMPLETE)
│   │   │   ├── recruitment/  # Recruitment (COMPLETE)
│   │   │   ├── training/     # Training
│   │   │   ├── performance/  # Performance
│   │   │   ├── rewards/      # Rewards & Discipline
│   │   │   ├── assets/       # Assets (COMPLETE)
│   │   │   ├── reports/      # Reports
│   │   │   ├── ess/          # Employee Self-Service
│   │   │   ├── org-chart/    # Org Chart (COMPLETE)
│   │   │   └── settings/     # System settings
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── ui/               # 33 shadcn/ui components
│   │   ├── attendance/       # 8 shared components
│   │   ├── org-chart/        # 8 components
│   │   ├── recruitment/       # Components
│   │   ├── assets/           # 6 components
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts           # Better Auth config
│   │   ├── prisma.ts         # Prisma client
│   │   ├── rbac.ts           # Permissions
│   │   └── socket/           # Socket.IO
│   ├── hooks/                # Custom hooks
│   ├── contexts/             # React contexts
│   └── types/                # TypeScript types
└── package.json
```

## Mandatory Rules

1. **UI Language**: Vietnamese (labels, messages, tooltips, placeholders)
2. **Currency**: VND, format `1.234.567 ₫` (no cents)
3. **Date Format**: `dd/MM/yyyy` or `dd/MM/yyyy HH:mm`
4. **RBAC**: Every server action must call `requirePermission()` or `requireAuth()`
5. **Audit Log**: Log all CUD (Create/Update/Delete) operations
6. **Components**: Use shadcn/ui only (Button, Dialog, Sheet, Card, Form, Table, etc.)
7. **Forms**: react-hook-form + zod only (via shadcn `<Form>` component)
8. **State**: TanStack Query for API calls (client-side)
9. **Dark Mode**: All UI must work in light/dark mode
10. **Error Handling**: Use sonner for toasts
11. **Loading States**: Skeleton/Spinner for async operations
12. **Empty States**: Show message when no data
13. **Confirmation**: Dialog before delete/cancel actions
14. **TypeScript**: Strict typing, NO `any` type
15. **Code Organization**: 1 file `actions.ts` per module for Server Actions
16. **Timezone**: MUST use `useTimezone` hook and add `timeZone` to all `toLocaleDateString`/`toLocaleTimeString` calls
17. **Responsive**: Desktop + Tablet minimum

## shadcn/ui Components (33 Installed)

`alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `checkbox`, `collapsible`, `command`, `date-picker`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle-group`, `toggle`, `tooltip`

## Module Routes

| Route | Module | Status |
|-------|--------|--------|
| `/` | Dashboard | To build |
| `/org-chart` | Org Chart | ✅ Complete |
| `/departments` | Departments | |
| `/employees` | Employees | To build |
| `/contracts` | Contracts | To build |
| `/attendance` | Attendance | ✅ Complete |
| `/leaves` | Leaves | To build |
| `/payroll` | Payroll | To build |
| `/onboarding` | Onboarding | To build |
| `/offboarding` | Offboarding | ✅ Complete |
| `/recruitment` | Recruitment | ✅ Complete |
| `/training` | Training | To build |
| `/performance` | Performance | To build |
| `/rewards` | Rewards | To build |
| `/assets` | Assets | ✅ Complete |
| `/reports` | Reports | To build |
| `/ess` | ESS | To build |
| `/settings` | Settings | Partial |

## Feature List (84 Features)

### Phase 1 - Core Platform (~25 features)
1. Org Chart visualization (zoom/pan, search)
2. Drag & Drop employee transfer
3. Department CRUD
4. Employee 360° profile
5. Employee timeline
6. Import/Export Excel
7. Advanced search
8. Contract expiry alerts
9. Contract PDF/Print
10. Contract appendices
11. Leave approval workflow
12. Auto leave balance calculation
13. Team calendar
14. Leave policies
15. Attendance anti-fraud (GPS/WiFi/selfie)
16. Attendance explanation workflow
17. Device integration
18. Monthly attendance summary
19. Overtime management
20. Shift management
21. Payroll salary calculation
22. Payslip security
23. Payroll summary
24. RBAC
25. Audit log

### Phase 2 - Business Expansion (~30 features)
- Job postings management
- ATS pipeline
- Training courses
- Training certificates
- Performance KPI/OKR
- Performance cycles
- Asset allocation
- Asset recovery
- ESS self-service
- Contract templates
- Leave reports
- Headcount reports
- Salary analysis
- Rewards management
- Discipline management
- Holiday config
- Benefits management
- Auto notifications
- Birthday reminders
- 2FA

### Phase 3 - Advanced (~25 features)
- Custom reports
- 360 feedback
- Business trip requests
- Expense claims
- Engagement surveys
- Leaderboard
- Supplementary insurance
- Mobile responsive (PWA)
- Document management
- Email integration
- API RESTful
- Backup & recovery

### Phase 4 - Enterprise (~1 feature)
- Multi-tenant

## Detailed Module Requirements

For detailed requirements per module, see [reference-modules.md](reference-modules.md)

## Prisma Schema Reference

For complete 47-model schema, see [reference-prisma.md](reference-prisma.md)

## Extended API Patterns

For CRUD, forms, infinite scroll, workflows, export examples, see [reference-api.md](reference-api.md)

## Deployment Order

1. **Phase 1 (Next):** Employees → Contracts → Leaves → Payroll → Onboarding → Dashboard
2. **Phase 2:** Training → Performance → Rewards → ESS Advanced → Reports
3. **Phase 3:** Custom reports → 360° feedback → Business trip → Surveys
4. **Phase 4:** Multi-tenant
