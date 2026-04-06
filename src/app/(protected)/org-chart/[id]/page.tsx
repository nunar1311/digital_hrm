import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDepartmentTree } from "@/app/(protected)/org-chart/actions";
import { getDepartmentById } from "@/app/(protected)/departments/actions";
import type { DepartmentNode } from "@/types/org-chart";
import { DepartmentDetailPage } from "@/components/org-chart/department-detail-page";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;
    const department = await getDepartmentById(id);
    if (!department) return { title: "Phòng ban" };
    return { title: department.name };
}

export default async function OrgChartDepartmentPage({
    params,
}: PageProps) {
    const { id } = await params;

    if (!id) {
        redirect("/org-chart");
    }

    // Get department tree and find this department
    const tree = await getDepartmentTree();

    function findNode(
        nodes: DepartmentNode[],
        targetId: string,
    ): DepartmentNode | null {
        for (const node of nodes) {
            if (node.id === targetId) return node;
            const found = findNode(node.children, targetId);
            if (found) return found;
        }
        return null;
    }

    const departmentNode = findNode(tree, id);
    const allDepartments = tree;

    if (!departmentNode) {
        // Try flat fetch
        const flatDept = await getDepartmentById(id);
        if (!flatDept) notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb */}
            <div className="border-b bg-card px-6 py-3">
                <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link
                        href="/org-chart"
                        className="hover:text-foreground transition-colors"
                    >
                        Sơ đồ tổ chức
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">
                        {departmentNode?.name ?? "Chi tiết phòng ban"}
                    </span>
                </nav>
            </div>

            <DepartmentDetailPage
                department={departmentNode}
                allDepartments={allDepartments}
            />
        </div>
    );
}
