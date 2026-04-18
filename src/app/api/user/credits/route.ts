"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        aiCredits: true,
        aiTotalTokensUsed: true,
        aiLastResetAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        credits: user.aiCredits,
        totalTokensUsed: user.aiTotalTokensUsed,
        lastResetAt: user.aiLastResetAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching AI credits:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
