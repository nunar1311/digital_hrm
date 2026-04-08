import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { ESSPayslipsClient } from "./payslips-client";

export default async function ESSPayrollPage() {
  const session = await requireAuth();

  // Get user's payslips
  const payslips = await prisma.payslip.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  // Transform payslips to match client interface
  const transformedPayslips = payslips.map((p) => {
    const earnings = typeof p.earnings === "string" ? JSON.parse(p.earnings) : (p.earnings || []);
    const deductionsData = typeof p.deductions === "string" ? JSON.parse(p.deductions) : (p.deductions || []);
    const insuranceData = typeof p.insurance === "string" ? JSON.parse(p.insurance) : (p.insurance || {});
    const taxData = typeof p.tax === "string" ? JSON.parse(p.tax) : (p.tax || {});

    const baseSalary = Number(p.baseSalary) || 0;
    const grossSalary = Number(p.grossSalary) || 0;
    const netSalary = Number(p.netSalary) || 0;

    const allowances = earnings
      .filter((e: { name: string; amount: string | number }) =>
        ["Phụ cấp", "Allowance"].includes(e.name)
      )
      .reduce((sum: number, e: { name: string; amount: string | number }) => sum + Number(e.amount), 0);

    const bonuses = earnings
      .filter((e: { name: string; amount: string | number }) =>
        ["Thưởng", "Bonus"].includes(e.name)
      )
      .reduce((sum: number, e: { name: string; amount: string | number }) => sum + Number(e.amount), 0);

    const overtimePay = earnings
      .filter((e: { name: string; amount: string | number }) =>
        ["Tăng ca", "Overtime"].includes(e.name)
      )
      .reduce((sum: number, e: { name: string; amount: string | number }) => sum + Number(e.amount), 0);

    const otherDeductions = deductionsData.reduce(
      (sum: number, d: { name: string; amount: string | number }) => sum + Number(d.amount),
      0
    );

    const insuranceAmount =
      Number(insuranceData.BHXH || insuranceData.BHYT || insuranceData.BHTN || 0);

    const taxAmount = taxData["Thuế TNCN"] || taxData["Income Tax"] || 0;

    return {
      id: p.id,
      month: p.month,
      year: p.year,
      baseSalary,
      allowances,
      overtimePay,
      bonuses,
      deductions: otherDeductions,
      tax: Number(taxAmount),
      insurance: insuranceAmount,
      otherDeductions,
      netSalary,
      status: p.status,
      paidAt: p.downloadedAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    };
  });

  return (
    <ESSPayslipsClient initialPayslips={transformedPayslips} />
  );
}
