import { EmployeesClientWrapper } from "./employees-client-wrapper";

export default async function EmployeesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <EmployeesClientWrapper>{children}</EmployeesClientWrapper>;
}
