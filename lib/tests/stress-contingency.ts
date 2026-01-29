import { executeDocumentWorkflow } from '../../app/actions';
import { prisma } from '../db';
import { ContingenciaService } from '../hacienda/contingencia';

/**
 * [SWARM STRESS TEST - CONTINGENCY PROTOCOL]
 * Simulates extreme network failure and verifies the resilience queue.
 */

async function stressTest() {
    console.log("🚀 INICIANDO PROTOCOLO DE ESTRÉS: MODO CONTINGENCIA...");

    // 1. Force environment to fail (Pointing to an unactive port)
    process.env.HACIENDA_ENV = 'simulator';
    // Simulator usually looks at localhost:3007 in api-client.ts

    // 2. Mock Document Data (v4.4 Spec)
    const mockDoc = {
        emisor: {
            nombre: "SENTINEL STRESS NODE",
            numeroIdentificacion: "3101000000",
            tipoIdentificacion: "02",
            ubicacion: { provincia: "1", canton: "01", distrito: "01", senas: "Core Swarm Labs" }
        },
        receptor: {
            nombre: "QA TARGET",
            numeroIdentificacion: "111111111",
            tipoIdentificacion: "01",
            correo: "qa@sentinel.com"
        },
        condicionVenta: "01",
        medioPago: ["01"],
        detalles: [
            {
                numeroLinea: 1,
                codigoCabys: "1234567890123",
                detalle: "Prueba de Estrés Swarm",
                cantidad: 1,
                unidadMedida: "Sp",
                precioUnitario: 1000,
                montoTotal: 1000,
                subTotal: 1000,
                montoTotalLinea: 1130,
                impuesto: {
                    codigo: "01",
                    codigoTarifa: "08",
                    tarifa: 13,
                    monto: 130
                }
            }
        ],
        resumen: {
            codigoMoneda: "CRC",
            totalVenta: 1000,
            totalDescuentos: 0,
            totalVentaNeta: 1000,
            totalImpuesto: 130,
            totalComprobante: 1130
        }
    };

    const mockSecurity = {
        pin: "1234",
        haciendaUser: "cpf-01-0000-0000",
        haciendaPass: "test_pass"
    };

    // Find a valid org to associate with the test
    const org = await prisma.organization.findFirst();
    if (!org) {
        console.error("❌ No existe ninguna organización en la DB para correr el test.");
        return;
    }

    // [FIX] Ensure the org is in simulator mode so TransmissionService bypasses credentials
    await prisma.organization.update({
        where: { id: org.id },
        data: { haciendaEnv: 'simulator' }
    });

    console.log(`\n📦 Disparando ráfaga de 3 documentos (Org: ${org.name})...`);

    const results = [];
    results.push(await executeDocumentWorkflow({
        orgId: org.id,
        docData: { ...mockDoc, emisor: { ...mockDoc.emisor, nombre: "STRESS DOC 1" } } as any,
        type: 'FE',
        security: { ...mockSecurity, p12Buffer: Buffer.from("MOCK") }
    }));

    await new Promise(r => setTimeout(r, 2000)); // Longer delay

    results.push(await executeDocumentWorkflow({
        orgId: org.id,
        docData: { ...mockDoc, emisor: { ...mockDoc.emisor, nombre: "STRESS DOC 2" } } as any,
        type: 'FE',
        security: { ...mockSecurity, p12Buffer: Buffer.from("MOCK") }
    }));

    await new Promise(r => setTimeout(r, 2000));

    results.push(await executeDocumentWorkflow({
        orgId: org.id,
        docData: { ...mockDoc, emisor: { ...mockDoc.emisor, nombre: "STRESS DOC 3" } } as any,
        type: 'FE',
        security: { ...mockSecurity, p12Buffer: Buffer.from("MOCK") }
    }));

    // 3. Evaluate results
    let successCount = 0;
    results.forEach((res, i) => {
        console.log(`   [DOC ${i + 1}] Estado Final: ${res.status} | Msg: ${res.message}`);
        if (res.status === 'warning' && res.message.includes('Encolado')) {
            successCount++;
        }
    });

    if (successCount === 3) {
        console.log("\n✅ PRUEBA DE ESTRÉS EXITOSA: Todos los documentos fueron rescatados por el Sentinel.");
    } else {
        console.log(`\n❌ PRUEBA PARCIAL: Solo ${successCount}/3 fueron rescatados.`);
    }

    // 4. Verify DB Queue
    const pending = await prisma.contingencyQueue.count({ where: { status: 'PENDING', orgId: org.id } });
    console.log(`📊 Documentos PENDIENTES en Bóveda DB: ${pending}`);

    process.exit(0);
}

stressTest().catch(e => {
    console.error("💥 SYSTEM COLLAPSE DURING TEST:", e);
    process.exit(1);
});
