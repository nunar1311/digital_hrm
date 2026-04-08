import { getDepartmentTree } from "./actions";
import { DepartmentsClientWrapper } from "./departments-client-wrapper";

export default async function DepartmentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const departmentTree = await getDepartmentTree();

    return (
        <DepartmentsClientWrapper
            departmentTree={departmentTree}
        >
            {children}
        </DepartmentsClientWrapper>
    );
}
