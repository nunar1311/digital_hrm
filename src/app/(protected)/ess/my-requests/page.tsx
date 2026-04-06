import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { ESSMyRequestsClient } from "./my-requests-client";

export default async function ESSMyRequestsPage() {
  const session = await requireAuth();

  // Get all leave requests with leave balance and type info
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      leaveBalance: {
        include: {
          leaveType: {
            select: { id: true, name: true, isPaidLeave: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get administrative requests
  const adminRequests = await prisma.administrativeRequest.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get overtime requests
  const overtimeRequests = await prisma.overtimeRequest.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ESSMyRequestsClient
      leaveRequests={JSON.parse(JSON.stringify(leaveRequests))}
      adminRequests={JSON.parse(JSON.stringify(adminRequests))}
      overtimeRequests={JSON.parse(JSON.stringify(overtimeRequests))}
    />
  );
}
