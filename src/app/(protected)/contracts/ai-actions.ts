"use server";

/**
 * Contracts AI Server Actions
 * AI-powered contract analysis, risk detection, and compliance checking
 */

import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

type AIServicePayload = Record<string, unknown>;

async function callAIService(endpoint: string, data: AIServicePayload): Promise<Record<string, unknown>> {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

  const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`AI Service error: ${response.status}`);
  }

  return response.json();
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "An unexpected error occurred";
}

/**
 * Analyze contract risks
 */
export async function analyzeContractRisks(data: { contractId: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        user: {
          include: {
            position: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        contractType: { select: { name: true } },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Phân tích rủi ro hợp đồng",
      context: {
        contract_type: contract.contractType?.name || "Không xác định",
        contract_number: contract.contractNumber,
        title: contract.title,
        start_date: contract.startDate?.toISOString(),
        end_date: contract.endDate?.toISOString(),
        salary: contract.salary,
        employee_position: contract.user.position?.name,
        department: contract.user.department?.name,
        notes: contract.notes,
      },
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Risk Analysis error:", err);
    return { success: false, error: message };
  }
}

/**
 * Suggest contract terms
 */
export async function suggestContractTerms(data: {
  employeeId: string;
  contractType: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      select: {
        id: true,
        name: true,
        username: true,
        hireDate: true,
        nationalId: true,
        address: true,
        dateOfBirth: true,
        position: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Gợi ý điều khoản hợp đồng",
      context: {
        employee_name: employee.name,
        username: employee.username,
        position: employee.position?.name,
        department: employee.department?.name,
        contract_type: data.contractType,
        hire_date: employee.hireDate?.toISOString(),
      },
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Terms Suggestion error:", err);
    return { success: false, error: message };
  }
}

/**
 * Check contract compliance with labor law
 */
export async function checkContractCompliance(data: { contractId: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        user: { select: { name: true } },
        contractType: { select: { name: true } },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const durationMonths =
      contract.endDate && contract.startDate
        ? Math.round(
            (contract.endDate.getTime() - contract.startDate.getTime()) /
              (30 * 24 * 60 * 60 * 1000)
          )
        : null;

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Kiểm tra tuân thủ Bộ luật Lao động Việt Nam 2019",
      context: {
        contract_type: contract.contractType?.name || "Không xác định",
        contract_number: contract.contractNumber,
        duration_months: durationMonths,
        start_date: contract.startDate?.toISOString(),
        salary: contract.salary,
        probation_salary: contract.probationSalary,
        notes: contract.notes,
      },
    });

    return {
      success: true,
      content: result.content,
      compliance: result.compliance,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Compliance error:", err);
    return { success: false, error: message };
  }
}

/**
 * Generate contract draft
 */
export async function generateContractDraft(data: {
  employeeId: string;
  contractType: string;
  customTerms?: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: {
        position: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: `Tạo dự thảo hợp đồng lao động theo mẫu công ty.\n${data.customTerms || ""}`,
      context: {
        employee_name: employee.name,
        date_of_birth: employee.dateOfBirth?.toISOString(),
        id_card: employee.nationalId,
        address: employee.address,
        position: employee.position?.name,
        department: employee.department?.name,
        contract_type: data.contractType,
      },
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Draft error:", err);
    return { success: false, error: message };
  }
}

/**
 * Predict contract renewal needed
 */
export async function predictRenewalNeeded(data: { contractId: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        user: { include: { position: { select: { name: true } } } },
        contractType: { select: { name: true } },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const tenure = contract.startDate
      ? Math.round(
          (new Date().getTime() - contract.startDate.getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 0;

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Dự đoán cần gia hạn hợp đồng",
      context: {
        contract_type: contract.contractType?.name,
        contract_number: contract.contractNumber,
        end_date: contract.endDate?.toISOString(),
        position: contract.user.position?.name,
        tenure_years: tenure,
        salary: contract.salary,
      },
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Renewal Prediction error:", err);
    return { success: false, error: message };
  }
}

/**
 * Summarize contract changes
 */
export async function summarizeContractChanges(data: {
  oldContractId: string;
  newContractId: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [oldContract, newContract] = await Promise.all([
      prisma.contract.findUnique({
        where: { id: data.oldContractId },
        include: { contractType: { select: { name: true } } },
      }),
      prisma.contract.findUnique({
        where: { id: data.newContractId },
        include: { contractType: { select: { name: true } } },
      }),
    ]);

    if (!oldContract || !newContract) {
      return { success: false, error: "Contract not found" };
    }

    const summaryContent = [
      "Thay đổi hợp đồng:",
      `Loại: ${oldContract.contractType?.name} → ${newContract.contractType?.name}`,
      `Lương: ${oldContract.salary} → ${newContract.salary}`,
      `Ngày bắt đầu: ${oldContract.startDate?.toISOString()} → ${newContract.startDate?.toISOString()}`,
      `Ngày kết thúc: ${oldContract.endDate?.toISOString()} → ${newContract.endDate?.toISOString()}`,
      oldContract.notes || newContract.notes
        ? `Ghi chú trước: ${oldContract.notes}\nGhi chú sau: ${newContract.notes}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await callAIService("/api/ai/summarize/content", {
      content: summaryContent,
      summary_type: "detailed",
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Changes Summary error:", err);
    return { success: false, error: message };
  }
}

import { buildContractDocxBuffer } from "@/lib/contracts/document-export";

/**
 * AI-powered contract DOCX generation
 */
export async function exportContractWithAI(data: { contractId: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        user: {
          include: {
            position: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        contractType: { select: { name: true } },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Tạo dự thảo hợp đồng lao động chuẩn xác nhất dưới dạng plain text chuyên nghiệp. Không sử dụng markdown (**), (#) vì nó sẽ được ghi thẳng vào docx.",
      context: {
        contract_number: contract.contractNumber,
        employee_name: contract.user.name,
        date_of_birth: contract.user.dateOfBirth?.toLocaleDateString("vi-VN"),
        id_card: contract.user.nationalId,
        address: contract.user.address,
        position: contract.user.position?.name,
        department: contract.user.department?.name,
        contract_type: contract.contractType?.name,
        start_date: contract.startDate.toLocaleDateString("vi-VN"),
        end_date: contract.endDate?.toLocaleDateString("vi-VN"),
        salary: contract.salary,
      },
    });

    const fileBuffer = await buildContractDocxBuffer({
      title: `${contract.title} (${contract.contractNumber})`,
      mergedContent: typeof result.content === "string" ? result.content : String(result.content || ""),
    });
    
    return {
      success: true,
      base64Content: fileBuffer.toString("base64"),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileName: `AI_Contract_${contract.contractNumber}.docx`,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("AI Export DOCX error:", err);
    return { success: false, error: message };
  }
}

/**
 * Auto generate contract template with AI
 */
export async function generateContractTemplateWithAI(prompt: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const systemPrompt = `Bạn là một chuyên gia nhân sự và luật lao động Việt Nam. Nhiệm vụ của bạn là tạo ra một mẫu hợp đồng lao động hoàn chỉnh dựa trên yêu cầu của người dùng.
Trong mẫu hợp đồng, hãy tự động thay thế các thông tin bằng các biến (placeholder) sau để hệ thống có thể mail-merge:
- {{companyName}}: Tên công ty
- {{companyAddress}}: Địa chỉ công ty
- {{employeeName}}: Tên nhân viên
- {{contractNumber}}: Số hợp đồng
- {{startDate}}: Ngày bắt đầu
- {{endDate}}: Ngày kết thúc
- {{salary}}: Mức lương
- {{probationSalary}}: Lương thử việc
- {{employeeDepartment}}: Bộ phận
- {{employeePosition}}: Chức vụ

Quan trọng: Vui lòng định dạng phần "content" dưới dạng MÃ HTML CHUẨN với inline style (KHÔNG dùng class), cụ thể:
1. Quốc hiệu, tiêu ngữ phải được căn giữa và in đậm:
<p style="text-align:center"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
<p style="text-align:center">---------</p>
<br>
<h2 style="text-align:center"><strong>HỢP ĐỒNG LAO ĐỘNG</strong></h2>
<p style="text-align:center"><strong>(Có thời hạn)</strong></p>
<br>
2. Các phần "Căn cứ", "Hôm nay, ngày... tháng... năm..." nên được định dạng <p> và có thể in nghiêng (<em>) nếu cần.
3. Thông tin các bên (Bên A, Bên B) phải rõ ràng, in đậm gạch chân tiêu đề: <p><strong><u>Bên A: Người sử dụng lao động</u></strong></p>
4. Các nội dung công việc, tiền lương, bảo hiểm phải được căn đều 2 bên (style="text-align:justify").
5. Sử dụng <p>, <strong>, <em>, <u> để trình bày đẹp và chuẩn mẫu của Việt Nam.
6. **PHẦN KÝ TÊN CUỐI HỢP ĐỒNG**: BẮT BUỘC dùng bảng HTML 2 cột KHÔNG VIỀN:
<table style="width:100%;border-collapse:collapse;margin-top:24px"><tbody><tr><td style="width:50%;text-align:center;vertical-align:top;border:none;padding:8px"><p style="text-align:center"><strong>NGƯỜI LAO ĐỘNG</strong></p><p style="text-align:center"><em>(Ký và ghi rõ Họ và Tên)</em></p><br><br><br></td><td style="width:50%;text-align:center;vertical-align:top;border:none;padding:8px"><p style="text-align:center"><strong>NGƯỜI SỬ DỤNG LAO ĐỘNG</strong></p><p style="text-align:center"><em>(Ký tên, đóng dấu)</em></p><br><br><br></td></tr></tbody></table>

Yêu cầu người dùng: ${prompt}

Vui lòng TRẢ VỀ DUY NHẤT một chuỗi JSON hợp lệ (không chứa markdown block \`\`\`json) với định dạng sau:
{
  "code": "ma-hop-dong-viet-thuong-khong-dau",
  "name": "Tên mẫu hợp đồng",
  "description": "Mô tả ngắn gọn về mẫu hợp đồng",
  "content": "Mã HTML chứa nội dung chi tiết của mẫu hợp đồng như hướng dẫn"
}
`;

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: systemPrompt,
      context: {},
    });

    let jsonResponse;
    try {
      const contentStr = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
      const cleanedStr = contentStr.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResponse = JSON.parse(cleanedStr);
    } catch (e) {
      console.error("Failed to parse AI JSON response:", result.content);
      return { success: false, error: "Lỗi định dạng phản hồi từ AI." };
    }

    return {
      success: true,
      data: {
        code: jsonResponse.code,
        name: jsonResponse.name,
        description: jsonResponse.description,
        content: jsonResponse.content,
      }
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("AI Template Generation error:", err);
    return { success: false, error: message };
  }
}

/**
 * Format imported contract content with AI
 * Takes raw extracted text/HTML from a document import and formats it into
 * professional HTML with mail-merge placeholders for preview rendering.
 */
export async function formatImportedContractWithAI(rawContent: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Strip HTML tags to get plain text for AI processing
    const plainText = rawContent
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!plainText || plainText.length < 20) {
      return { success: false, error: "Nội dung trích xuất quá ngắn, không đủ để format." };
    }

    const systemPrompt = `Bạn là một chuyên gia nhân sự và định dạng văn bản pháp lý Việt Nam. Nhiệm vụ của bạn là nhận một đoạn văn bản hợp đồng lao động đã được trích xuất từ file (có thể mất định dạng) và FORMAT lại thành HTML chuẩn đẹp.

## QUAN TRỌNG - QUY TẮC:
1. GIỮ NGUYÊN toàn bộ nội dung gốc, KHÔNG thêm bớt hay thay đổi ý nghĩa.
2. Chỉ FORMAT lại cấu trúc HTML cho đẹp và chuẩn.
3. Thay thế các thông tin cụ thể của công ty/nhân viên bằng các placeholder {{...}} phù hợp NẾU nhận diện được (ví dụ: tên nhân viên → {{employeeName}}, tên công ty → {{companyName}}, số hợp đồng → {{contractNumber}}, ngày bắt đầu → {{startDate}}, ngày kết thúc → {{endDate}}, mức lương → {{salary}}, lương thử việc → {{probationSalary}}, chức vụ → {{employeePosition}}, bộ phận → {{employeeDepartment}}, CMND/CCCD → {{employeeIdCard}}, ngày sinh → {{employeeDateOfBirth}}, địa chỉ NV → {{employeeAddress}}, địa chỉ công ty → {{companyAddress}}, đại diện → {{companyRepresentative}}, chức vụ đại diện → {{companyRepRole}}).
4. Nếu KHÔNG chắc chắn một giá trị là gì, GIỮ NGUYÊN nó, không thay bằng placeholder.

## QUY TẮC ĐỊNH DẠNG HTML (dùng inline style, KHÔNG dùng class):
- Quốc hiệu, tiêu ngữ: căn giữa, in đậm
  <p style="text-align:center"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
  <p style="text-align:center"><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
  <p style="text-align:center">---------</p>
- Tên công ty (header trái): in đậm, in hoa
  <p><strong>CÔNG TY ...</strong></p>
- Tiêu đề hợp đồng: căn giữa, in đậm, cỡ lớn
  <h2 style="text-align:center"><strong>HỢP ĐỒNG LAO ĐỘNG</strong></h2>
- Số hợp đồng: căn giữa, in nghiêng
  <p style="text-align:center"><em>Số: {{contractNumber}}</em></p>
- Các "Điều X:" phải in đậm: <p><strong>Điều 1: ...</strong></p>
- Nội dung thường: <p>...</p> hoặc <p style="text-align:justify">...</p>
- Danh sách con: dùng <p>- Nội dung</p>
- Dùng <br> cho dòng trống giữa các phần
- **PHẦN KÝ TÊN CUỐI HỢP ĐỒNG**: BẮT BUỘC dùng bảng HTML 2 cột KHÔNG VIỀN. Mẫu CHÍNH XÁC:
<table style="width:100%;border-collapse:collapse;margin-top:24px"><tbody><tr><td style="width:50%;text-align:center;vertical-align:top;border:none;padding:8px"><p style="text-align:center"><strong>NGƯỜI LAO ĐỘNG</strong></p><p style="text-align:center"><em>(Ký và ghi rõ Họ và Tên)</em></p><br><br><br></td><td style="width:50%;text-align:center;vertical-align:top;border:none;padding:8px"><p style="text-align:center"><strong>NGƯỜI SỬ DỤNG LAO ĐỘNG</strong></p><p style="text-align:center"><em>(Ký tên, đóng dấu)</em></p><br><br><br></td></tr></tbody></table>

## VĂN BẢN GỐC CẦN FORMAT:
${plainText}

## YÊU CẦU OUTPUT:
Trả về DUY NHẤT một chuỗi JSON hợp lệ (KHÔNG chứa markdown block \`\`\`json):
{
  "content": "Mã HTML đã được format đẹp",
  "detectedName": "Tên loại hợp đồng nếu nhận diện được (VD: Hợp đồng lao động có thời hạn)",
  "detectedCode": "ma-hop-dong-viet-thuong (VD: hdld-co-thoi-han)"
}`;

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: systemPrompt,
      context: {},
    });

    let jsonResponse;
    try {
      const contentStr = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
      const cleanedStr = contentStr.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResponse = JSON.parse(cleanedStr);
    } catch (e) {
      console.error("Failed to parse AI format response:", result.content);
      return { success: false, error: "Lỗi định dạng phản hồi từ AI." };
    }

    return {
      success: true,
      data: {
        content: jsonResponse.content,
        detectedName: jsonResponse.detectedName || null,
        detectedCode: jsonResponse.detectedCode || null,
      }
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("AI Format Import error:", err);
    return { success: false, error: message };
  }
}

/**
 * Auto fill contract variables with AI
 * Replaces '...', '______', and similar placeholders with appropriate mail-merge variables
 */
export async function autoFillContractVariablesWithAI(htmlContent: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!htmlContent || htmlContent.length < 20) {
      return { success: false, error: "Nội dung quá ngắn để điền biến." };
    }

    const systemPrompt = `Bạn là một chuyên gia nhân sự và hệ thống quản trị nhân sự. Nhiệm vụ của bạn là nhận một đoạn mã HTML của hợp đồng lao động và TỰ ĐỘNG thay thế các chỗ trống (như ....., _____, trống) thành các biến (placeholder) tương ứng để hệ thống có thể mail-merge.

## DANH SÁCH CÁC BIẾN HỢP LỆ (CHỈ sử dụng các biến này):
- {{companyName}}: Tên công ty
- {{companyTaxCode}}: Mã số thuế công ty
- {{companyAddress}}: Địa chỉ công ty
- {{companyPhone}}: SĐT công ty
- {{companyEmail}}: Email công ty
- {{companyRepresentative}}: Đại diện công ty (Ví dụ: Ông/Bà Trần Văn A đại diện)
- {{companyRepRole}}: Chức vụ đại diện (Ví dụ: Giám đốc)
- {{companyRepNationality}}: Quốc tịch đại diện công ty
- {{companyRepIdCard}}: CMND/CCCD đại diện công ty
- {{employeeName}}: Họ và tên người lao động
- {{employeeGender}}: Giới tính
- {{employeeDateOfBirth}}: Ngày sinh
- {{employeeNationality}}: Quốc tịch người lao động
- {{employeeIdCard}}: Số CMND/CCCD/Hộ chiếu người lao động
- {{employeeIdCardDate}}: Ngày cấp CMND/CCCD
- {{employeeIdCardPlace}}: Nơi cấp CMND/CCCD
- {{employeeAddress}}: Địa chỉ thường trú
- {{employeeCurrentAddress}}: Chỗ ở hiện tại / Địa chỉ liên hệ
- {{employeePhone}}: SĐT người lao động
- {{employeeEmail}}: Email người lao động
- {{contractNumber}}: Số hợp đồng
- {{contractType}}: Loại hợp đồng
- {{employeeDepartment}}: Phòng ban/Bộ phận làm việc
- {{employeePosition}}: Chức vụ/Chức danh
- {{employeeJobTitle}}: Chức danh chuyên môn / Nghề nghiệp
- {{workingLocation}}: Địa điểm làm việc
- {{workingHours}}: Thời giờ làm việc
- {{startDate}}: Ngày bắt đầu làm việc / Ngày hợp đồng có hiệu lực
- {{endDate}}: Ngày kết thúc hợp đồng
- {{probationStartDate}}: Ngày bắt đầu thử việc
- {{probationEndDate}}: Ngày kết thúc thử việc
- {{salary}}: Mức lương chính / Lương cơ bản
- {{probationSalary}}: Mức lương thử việc (thường là 85% lương chính)
- {{allowance}}: Phụ cấp
- {{bankAccountNumber}}: Số tài khoản ngân hàng người lao động
- {{bankName}}: Tên ngân hàng

## YÊU CẦU:
1. Đọc kỹ văn bản HTML, tìm những chỗ trống như "..................", "_________", hoặc "................" bên cạnh các nhãn (label).
2. Dựa vào nhãn (ví dụ: "Ông/Bà: ...............", "Sinh ngày: ........", "Mức lương: ........") để ĐIỀN ĐÚNG biến từ danh sách trên. Ví dụ: thay "Ông/Bà: ..............." thành "Ông/Bà: {{employeeName}}".
3. KHÔNG THAY ĐỔI bất kỳ nội dung, cấu trúc HTML hay từ ngữ nào khác ngoài việc thay chỗ trống thành biến.
4. Nếu có chỗ trống nhưng không rõ là biến nào trong danh sách trên, HÃY GIỮ NGUYÊN chỗ trống đó.
5. Nếu trong văn bản đã có sẵn một số thông tin cứng (ví dụ: "Bên A: Công ty TNHH ABC"), TỰ ĐỘNG THAY THẾ bằng biến tương ứng ("Bên A: {{companyName}}") để hợp đồng thành mẫu chung.

## VĂN BẢN HTML GỐC:
${htmlContent}

## YÊU CẦU OUTPUT:
Trả về DUY NHẤT một chuỗi JSON hợp lệ (KHÔNG chứa markdown block \`\`\`json, KHÔNG có text nào khác ngoài JSON):
{
  "content": "Mã HTML sau khi đã được thay thế chỗ trống bằng các biến thích hợp"
}`;

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: systemPrompt,
      context: {},
    });

    let jsonResponse;
    try {
      const contentStr = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
      const cleanedStr = contentStr.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResponse = JSON.parse(cleanedStr);
    } catch (e) {
      console.error("Failed to parse AI variables auto-fill response:", result.content);
      return { success: false, error: "Lỗi định dạng phản hồi từ AI khi điền biến." };
    }

    return {
      success: true,
      data: {
        content: jsonResponse.content,
      }
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("AI Auto Fill Variables error:", err);
    return { success: false, error: message };
  }
}

