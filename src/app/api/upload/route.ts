import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Không có file được gửi lên" },
                { status: 400 },
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    error: "Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)",
                },
                { status: 400 },
            );
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File không được vượt quá 5MB" },
                { status: 400 },
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = path.extname(file.name) || ".jpg";
        const safeName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

        const uploadDir = path.join(
            process.cwd(),
            "public",
            "uploads",
        );
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, safeName);
        await writeFile(filePath, buffer);

        const url = `/uploads/${safeName}`;

        return NextResponse.json({ url });
    } catch {
        return NextResponse.json(
            { error: "Lỗi khi upload file" },
            { status: 500 },
        );
    }
}
