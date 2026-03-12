const xlsx = require('xlsx');
const fs = require('fs');
try {
  const wb = xlsx.readFile('Bảng tính không có tiêu đề.xlsx');
  const result = {};
  wb.SheetNames.forEach(n => {
    result[n] = xlsx.utils.sheet_to_json(wb.Sheets[n]);
  });
  fs.writeFileSync('excel_data.json', JSON.stringify(result, null, 2), 'utf-8');
} catch (e) {
  console.error(e.message);
}
