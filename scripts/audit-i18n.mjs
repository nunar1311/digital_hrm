import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src/app", "src/components"];
const SKIP_DIRS = new Set(["api", "node_modules", "messages", ".next", ".git"]);
const TARGET_EXT = ".tsx";

// Bộ ký tự tiếng Việt có dấu (bao gồm Đ/đ)
const VIETNAMESE_CHARS =
  "ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ" +
  "àáảãạăằắẳẵặâầấẩẫậ" +
  "ÈÉẺẼẸÊỀẾỂỄỆèéẻẽẹêềếểễệ" +
  "ÌÍỈĨỊìíỉĩị" +
  "ÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ" +
  "òóỏõọôồốổỗộơờớởỡợ" +
  "ÙÚỦŨỤƯỪỨỬỮỰùúủũụưừứửữự" +
  "ỲÝỶỸỴỳýỷỹỵ" +
  "Đđ";

const escapedChars = VIETNAMESE_CHARS.replace(/[\\\]^-]/g, "\\$&");
const VI_CLASS = `[${escapedChars}]`;

// Match string literals ("...", '...', `...`) có chứa ít nhất 1 ký tự tiếng Việt có dấu
const STRING_WITH_VIETNAMESE_REGEX = new RegExp(
  `(["'\`])(?:(?!\\1)[^\\\\]|\\\\.)*${VI_CLASS}(?:(?!\\1)[^\\\\]|\\\\.)*\\1`,
  "u"
);

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(fullPath, out);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(TARGET_EXT)) {
      out.push(fullPath);
    }
  }

  return out;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (STRING_WITH_VIETNAMESE_REGEX.test(line)) {
      findings.push({ filePath, lineNumber: i + 1, line: line.trim() });
    }
  }

  return findings;
}

function main() {
  const files = ROOTS.flatMap((root) => walk(root));
  const allFindings = files.flatMap((filePath) => scanFile(filePath));

  if (allFindings.length === 0) {
    console.log("CLEAN");
    return;
  }

  for (const item of allFindings) {
    console.log(`${toPosix(item.filePath)}:${item.lineNumber} | ${item.line}`);
  }
}

main();
