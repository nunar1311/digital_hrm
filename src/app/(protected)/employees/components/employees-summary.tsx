"use client";

interface EmployeesSummaryProps {
  displayed: number;
  total: number;
  hasMore: boolean;
  loadedAll: boolean;
}

export function EmployeesSummary({ displayed, total, hasMore, loadedAll }: EmployeesSummaryProps) {
  return (
    <div className="bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
      <p className="text-xs text-muted-foreground">
        Hiển thị <strong>{displayed}</strong> / <strong>{total}</strong> nhân viên
      </p>
      {!hasMore && displayed < total && (
        <span className="text-xs text-muted-foreground">Đã tải hết</span>
      )}
    </div>
  );
}
