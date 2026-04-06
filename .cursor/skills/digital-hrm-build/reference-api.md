# API Patterns

## Server Actions Pattern

### Basic CRUD Pattern
```typescript
// src/app/(protected)/employees/actions.ts
"use server";

import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Zod Schema
export const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  employeeCode: z.string().min(3),
  departmentId: z.string().optional(),
  position: z.string().optional(),
});

// Get with Pagination
export async function getEmployees(params: {
  page: number;
  pageSize: number;
  search?: string;
  departmentId?: string;
  status?: string;
}) {
  await requirePermission(Permission.EMPLOYEE_VIEW_ALL);
  
  const { page, pageSize, search, departmentId, status } = params;
  const skip = (page - 1) * pageSize;
  
  const where: any = {};
  if (search) where.OR = [
    { name: { contains: search } },
    { employeeCode: { contains: search } },
    { email: { contains: search } },
  ];
  if (departmentId) where.departmentId = departmentId;
  if (status) where.status = status;
  
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { department: true },
    }),
    prisma.user.count({ where }),
  ]);
  
  return { items, total, page, pageSize };
}

// Create
export async function createEmployee(data: z.infer<typeof employeeSchema>) {
  const session = await requirePermission(Permission.EMPLOYEE_CREATE);
  
  const validated = employeeSchema.parse(data);
  
  // Check uniqueness
  const exists = await prisma.user.findFirst({
    where: {
      OR: [
        { email: validated.email },
        { employeeCode: validated.employeeCode },
      ],
    },
  });
  if (exists) throw new Error("Email or employee code already exists");
  
  const employee = await prisma.user.create({
    data: validated,
  });
  
  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entity: "Employee",
      entityId: employee.id,
      newData: employee,
    },
  });
  
  revalidatePath("/employees");
  return employee;
}

// Update
export async function updateEmployee(id: string, data: Partial<z.infer<typeof employeeSchema>>) {
  const session = await requirePermission(Permission.EMPLOYEE_EDIT);
  
  const employee = await prisma.user.update({
    where: { id },
    data,
  });
  
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "Employee",
      entityId: id,
      newData: employee,
    },
  });
  
  revalidatePath("/employees");
  return employee;
}

// Delete
export async function deleteEmployee(id: string) {
  await requirePermission(Permission.EMPLOYEE_DELETE);
  
  await prisma.user.delete({ where: { id } });
  
  revalidatePath("/employees");
}
```

---

## TanStack Query Pattern

```typescript
// src/components/employees/employee-table.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmployees, createEmployee, deleteEmployee } from "./actions";
import { useState } from "react";
import { toast } from "sonner";

export function EmployeeTable({ initialData }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ["employees", page],
    queryFn: () => getEmployees({ page, pageSize: 20 }),
    initialData,
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Render table...
}
```

---

## WebSocket Real-time Pattern

```typescript
// In client component
"use client";

import { useSocketEvent } from "@/hooks/use-socket-event";

export function ModuleClient({ initialData }) {
  const queryClient = useQueryClient();
  
  // Listen for real-time updates
  useSocketEvent("employee:created", () => {
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  });
  
  useSocketEvent("employee:updated", (data) => {
    queryClient.setQueryData(["employees", data.id], data);
  });
  
  useSocketEvent("employee:deleted", () => {
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  });
}
```

---

## Form with Zod + React Hook Form

```typescript
// src/components/employees/employee-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createEmployee } from "./actions";
import { toast } from "sonner";

export function EmployeeForm({ onSuccess }) {
  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      employeeCode: "",
    },
  });
  
  async function onSubmit(data) {
    try {
      await createEmployee(data);
      toast.success("Created successfully");
      onSuccess?.();
    } catch (error) {
      toast.error(error.message);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ tên</FormLabel>
              <FormControl>
                <Input placeholder="Nguyễn Văn A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit">Lưu</Button>
      </form>
    </Form>
  );
}
```

---

## Infinite Scroll Pattern

```typescript
const PAGE_SIZE = 20;

function EmployeeList({ initialData }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  const { data, hasMore, loadMore, isFetching } = useInfiniteQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    initialData,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
  
  const rows = data?.pages?.flatMap(p => p.items) || [];
  const visibleRows = rows.slice(0, visibleCount);
  
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore && !isFetching) {
          setVisibleCount(c => c + PAGE_SIZE);
        }
      },
      { rootMargin: "200px" }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);
  
  return (
    <div>
      {visibleRows.map(employee => <EmployeeRow key={employee.id} data={employee} />)}
      <div ref={sentinelRef} className="h-1" />
      <p className="text-xs text-muted-foreground">
        Hiển thị {visibleRows.length} / {data?.total || 0} nhân viên
      </p>
    </div>
  );
}
```

---

## Approval Workflow Pattern

```typescript
export async function approveRequest(id: string) {
  const session = await requirePermission(Permission.LEAVE_APPROVE);
  
  const request = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Request not found");
  
  // Update status
  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  });
  
  // Notify requester via WebSocket
  emitToUser(request.userId, "leave:approved", updated);
  
  revalidatePath("/leaves");
  return updated;
}
```

---

## Export Excel Pattern

```typescript
import * as XLSX from "xlsx";

export async function exportEmployees(filters) {
  const employees = await getEmployeesRaw(filters); // without pagination
  
  const data = employees.map(e => ({
    "Mã NV": e.employeeCode,
    "Họ tên": e.name,
    "Email": e.email,
    "Phòng ban": e.department?.name,
    "Chức vụ": e.position,
    "Ngày vào": e.startDate,
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nhân viên");
  
  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
}
```

---

## Timezone-Aware Date Handling

```typescript
import { useTimezone } from "@/hooks/use-timezone";

export function DisplayComponent() {
  const { timezone, formatDate, formatTime, formatDateTime } = useTimezone();
  
  // Correct: Always pass timeZone
  const dateStr = formatDate(new Date());
  const timeStr = formatTime(new Date());
  const dateTimeStr = formatDateTime(new Date());
  
  // Manual format with timezone
  const manualDate = new Date().toLocaleDateString("vi-VN", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  
  const manualTime = new Date().toLocaleTimeString("vi-VN", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit"
  });
  
  return (
    <div>
      <p>Ngày: {dateStr}</p>
      <p>Giờ: {timeStr}</p>
      <p>Ngày giờ: {dateTimeStr}</p>
    </div>
  );
}
```

---

## Filter + Search Pattern

```typescript
export async function getFilteredData(params: {
  page: number;
  pageSize: number;
  filters: {
    search?: string;
    departmentId?: string;
    status?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  };
}) {
  await requirePermission(Permission.VIEW_ALL);
  
  const { page, pageSize, filters } = params;
  const skip = (page - 1) * pageSize;
  
  const where: any = {};
  
  // Search
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { employeeCode: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  
  // Exact matches
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }
  
  // Array filter
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }
  
  // Date range
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }
  
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { department: true, position: true },
    }),
    prisma.user.count({ where }),
  ]);
  
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
```

---

## Bulk Actions Pattern

```typescript
export async function bulkUpdateStatus(ids: string[], status: string) {
  await requirePermission(Permission.EDIT);
  
  const results = await Promise.all(
    ids.map(id => 
      prisma.user.update({
        where: { id },
        data: { status },
      })
    )
  );
  
  // Audit log for bulk action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "BULK_UPDATE",
      entity: "Employee",
      newData: { ids, status },
    },
  });
  
  revalidatePath("/employees");
  return results;
}

export async function bulkDelete(ids: string[]) {
  await requirePermission(Permission.DELETE);
  
  await prisma.user.deleteMany({
    where: { id: { in: ids } },
  });
  
  revalidatePath("/employees");
}
```

---

## Paginated API Response Pattern

```typescript
// Standard response format
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Usage
export async function getEmployees(...): Promise<PaginatedResponse<Employee>> {
  // ... implementation
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
```

---

## Error Handling Pattern

```typescript
import { toast } from "sonner";

export async function safeAction<T>(
  action: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  try {
    const data = await action();
    if (options?.successMessage) {
      toast.success(options.successMessage);
    }
    options?.onSuccess?.(data);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred";
    if (options?.errorMessage || options?.onError) {
      toast.error(options.errorMessage || message);
    }
    options?.onError?.(error instanceof Error ? error : new Error(message));
    return { success: false, error: message };
  }
}

// Usage
const { success, error } = await safeAction(
  () => createEmployee(data),
  {
    successMessage: "Tạo nhân viên thành công",
    errorMessage: "Không thể tạo nhân viên",
  }
);
```
