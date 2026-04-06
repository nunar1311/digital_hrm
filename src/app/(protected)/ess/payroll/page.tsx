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

  return (
    <ESSPayslipsClient initialPayslips={JSON.parse(JSON.stringify(payslips))} />
  );
}
