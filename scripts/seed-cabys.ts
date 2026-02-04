
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 STARTING ROBUST CABYS SEEDING...");

    // 1. Wipe existing garbage data
    console.log("🧹 Cleaning up old/partial data...");
    await prisma.cabys.deleteMany();
    console.log("✅ Database cleared.");

    // 2. Read File
    const filePath = path.join(process.cwd(), '../docs/Catalogo-de-bienes-servicios.xlsx');
    if (!fs.existsSync(filePath)) {
        console.error(`❌ ERROR: File not found at ${filePath}`);
        process.exit(1);
    }

    console.log(`📂 Reading Excel file: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`📊 Scanning ${data.length} rows for products...`);

    const batchSize = 2500; // Increased batch size for speed
    let batch: any[] = [];
    let count = 0;
    let skipped = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;

        // Dynamic Column Detection
        // Find the index of the 13-digit code
        let codeIdx = -1;

        for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').trim();
            if (cell.length === 13 && /^\d+$/.test(cell)) {
                codeIdx = j;
                break;
            }
        }

        if (codeIdx === -1) {
            skipped++;
            continue;
        }

        // Extract Data based on relative position
        const codigo = String(row[codeIdx]).trim();
        const descripcion = String(row[codeIdx + 1] || '').trim();
        const impuestoVal = row[codeIdx + 2];

        // Normalize Tax
        let impuesto = 13.0; // Default fallback
        if (impuestoVal !== undefined && impuestoVal !== null) {
            let val = parseFloat(String(impuestoVal).replace('%', ''));
            if (!isNaN(val)) {
                if (val <= 1 && val >= 0) {
                    impuesto = val * 100; // 0.13 -> 13.00
                } else {
                    impuesto = val; // 13 -> 13.00
                }
            }
        }

        // Final Validation
        if (!codigo || !descripcion) continue;

        batch.push({
            codigo,
            descripcion,
            impuesto
        });

        if (batch.length >= batchSize) {
            await prisma.cabys.createMany({
                data: batch,
                skipDuplicates: true
            });
            count += batch.length;
            process.stdout.write(`\r✅ Imported: ${count}`);
            batch = [];
        }
    }

    // Insert remaining
    if (batch.length > 0) {
        await prisma.cabys.createMany({
            data: batch,
            skipDuplicates: true
        });
        count += batch.length;
    }

    console.log(`\n\n✨ SEEDING COMPLETE!`);
    console.log(`✅ Total Products Imported: ${count}`);
    console.log(`⚠️ Skipped Rows (Headers/Categories): ${skipped}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
