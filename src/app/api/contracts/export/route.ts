import { NextResponse } from "next/server";
import { z } from "zod";
import { exportContractDocument } from "@/app/(protected)/contracts/actions";

const exportSchema = z.object({
  contractId: z.string().min(1),
  format: z.enum(["DOCX", "PDF"]),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = exportSchema.parse(body);

    const result = await exportContractDocument({
      contractId: parsed.contractId,
      format: parsed.format,
      templateId: parsed.templateId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
