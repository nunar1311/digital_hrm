import {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    TextRun,
} from "docx";
import {
    PDFDocument,
    StandardFonts,
    rgb,
    type PDFFont,
} from "pdf-lib";

export type MergeVariables = Record<string, string | number | null | undefined>;

export function extractTemplateVariables(templateContent: string): string[] {
    const matches = templateContent.matchAll(/{{\s*([\w.]+)\s*}}/g);
    const keys = new Set<string>();
    for (const match of matches) {
        if (match[1]) {
            keys.add(match[1]);
        }
    }
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

export function mergeTemplateContent(
    templateContent: string,
    variables: MergeVariables,
): string {
    return templateContent.replace(/{{\s*([\w.]+)\s*}}/g, (_, key: string) => {
        const value = variables[key];
        if (value === null || value === undefined) {
            return "";
        }
        return String(value);
    });
}

function toPlainText(content: string): string {
    return content
        .replace(/<br\s*\/?\s*>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export async function buildContractDocxBuffer(params: {
    title: string;
    mergedContent: string;
}): Promise<Buffer> {
    const plainText = toPlainText(params.mergedContent);
    const bodyParagraphs = plainText
        .split("\n")
        .map((line) => line.trim())
        .map((line) =>
            new Paragraph({
                children: [
                    new TextRun({
                        text: line.length > 0 ? line : " ",
                    }),
                ],
                spacing: {
                    after: 200,
                },
            }),
        );

    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        text: params.title,
                        heading: HeadingLevel.HEADING_1,
                        spacing: { after: 300 },
                    }),
                    ...bodyParagraphs,
                ],
            },
        ],
    });

    const blob = await Packer.toBuffer(doc);
    return Buffer.from(blob);
}

function splitTextForPdf(params: {
    text: string;
    font: PDFFont;
    fontSize: number;
    maxWidth: number;
}): string[] {
    const { text, font, fontSize, maxWidth } = params;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return [""];
    }

    const lines: string[] = [];
    let current = words[0] ?? "";

    for (let i = 1; i < words.length; i += 1) {
        const word = words[i] ?? "";
        const candidate = `${current} ${word}`;
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    }

    lines.push(current);
    return lines;
}

export async function buildContractPdfBuffer(params: {
    title: string;
    mergedContent: string;
}): Promise<Buffer> {
    const plainText = toPlainText(params.mergedContent);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    let cursorY = 800;

    page.drawText(params.title, {
        x: 50,
        y: cursorY,
        size: 16,
        font,
        color: rgb(0, 0, 0),
    });

    cursorY -= 32;

    const paragraphs = plainText.split("\n");

    for (const paragraph of paragraphs) {
        const lines = splitTextForPdf({
            text: paragraph,
            font,
            fontSize: 11,
            maxWidth: 495,
        });

        for (const line of lines) {
            if (cursorY < 60) {
                page = pdfDoc.addPage([595.28, 841.89]);
                cursorY = 800;
            }

            page.drawText(line, {
                x: 50,
                y: cursorY,
                size: 11,
                font,
                color: rgb(0.1, 0.1, 0.1),
            });

            cursorY -= 16;
        }

        cursorY -= 4;
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
}
