
import path from 'path';
import * as xlsx from 'xlsx';

async function main() {
    const filePath = path.join(process.cwd(), '../docs/Catalogo-de-bienes-servicios.xlsx');
    console.log(`📂 Reading Excel file: ${filePath}`);

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON with header:1 (array of arrays)
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    console.log("🔍 HEADER ROW (Index 0):", JSON.stringify(data[0]));

    // Find first row with ANY 13 digit code in ANY column
    let found = false;
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row) continue;

        for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').trim();
            if (cell.length === 13 && /^\d+$/.test(cell)) {
                console.log(`✅ FOUND 13-DIGIT CODE AT ROW ${i}, COL ${j}`);
                console.log("   CONTENT:", cell);
                console.log("   FULL ROW:", JSON.stringify(row));
                found = true;
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        console.log("❌ NO 13-DIGIT CODE FOUND ANYWHERE IN THE SHEET");
        console.log("   First 5 rows:", JSON.stringify(data.slice(0, 5)));
    }
}

main();
