"use client";

interface EmployeesClientWrapperProps {
    children: React.ReactNode;
}

export function EmployeesClientWrapper({
    children,
}: EmployeesClientWrapperProps) {
    return (
        <div className="flex flex-col flex-1 min-w-0 h-full relative overflow-hidden">
            {children}
        </div>
    );
}
