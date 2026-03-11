const xlsx = require('xlsx');

const filePath = 'c:\\Users\\OOO\\Documents\\digital_hrm\\generated\\prisma\\internal\\Bảng tính không có tiêu đề.xlsx';

try {
  const workbook = xlsx.readFile(filePath);
  console.log("Sheet Names:", workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log(`Total rows: ${data.length}`);
    console.log("First 5 rows:");
    console.dir(data.slice(0, 5), { depth: null });
  }
} catch (e) {
  console.error("Error reading file:", e.message);
}
