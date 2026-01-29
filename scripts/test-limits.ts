
import { prisma } from "../lib/db";
import { executeDocumentWorkflow } from "../app/actions";
import { PLANS } from "../lib/stripe-config";
import { ApiKeyService } from "../lib/api-key";

// Mock para evitar llamadas reales a Hacienda/Stripe
process.env.HACIENDA_ENV = 'simulator';

async function runLimitTests() {
    console.log("🛡️ INICIANDO PRUEBAS DE LÍMITES Y CUOTAS (SENTINEL ASSERTION) 🛡️");

    // 0. Limpieza Preventiva
    try {
        const oldOrg = await prisma.organization.findFirst({ where: { cedula: { startsWith: 'TEST-STARTER-' } } });
        if (oldOrg) {
            await prisma.invoice.deleteMany({ where: { orgId: oldOrg.id } });
            await prisma.organization.delete({ where: { id: oldOrg.id } });
        }
    } catch (e) { }

    // 1. Crear Organización STARTER
    const starterOrg = await prisma.organization.create({
        data: {
            name: "Starter Limit Tester Corp",
            cedula: `TEST-STARTER-${Date.now()}`,
            plan: "STARTER",
            subscriptionStatus: "active",
            haciendaUser: "cpf-01-0000",
            haciendaPass: "encrypted_mock",
            haciendaPin: "encrypted_pin",
            haciendaP12: Buffer.from("mock").toString('base64')
        }
    });
    console.log(`✅ Org Starter creada: ${starterOrg.id}`);

    // 2. Llenar la cuota artificialmente (50 documentos)
    console.log("⚠️ Llenando cuota de 50 documentos...");
    const uniqueSuffix = Math.floor(Math.random() * 10000);
    const dummyDocs = Array(50).fill(0).map((_, i) => ({
        orgId: starterOrg.id,
        clave: `506${Date.now()}${i}${uniqueSuffix}`, // Clave ultra única
        consecutivo: `0010000101${Date.now().toString().slice(-8)}${i.toString().padStart(2, '0')}${uniqueSuffix}`, // Consecutivo ultra único
        estado: 'ACEPTADO',
        tipoDocumento: 'FE',
        totalVenta: 1000,
        totalImpuesto: 130,
        totalComprobante: 1130,
        xmlFirmado: '<xml>dummy</xml>',
        emisorNombre: 'Test',
        emisorCedula: starterOrg.cedula,
        moneda: 'CRC',
        fechaEmision: new Date(),
        docData: {}
    }));

    await prisma.invoice.createMany({ data: dummyDocs });
    console.log(`✅ 50 documentos insertados. Cuota al límite.`);

    // 3. INTENTO DE EMISIÓN #51 (Debe fallar)
    console.log("⚡ Intentando emitir documento #51 (Debe ser bloqueado)...");

    const docDataMock: any = {
        emisor: { numeroIdentificacion: starterOrg.cedula, nombre: "Test" },
        receptor: { numeroIdentificacion: "222222222", nombre: "Cliente Final" }
    };

    const securityMock = {
        pin: "1234",
        haciendaUser: "user",
        haciendaPass: "pass",
        p12Buffer: Buffer.from("mock")
    };

    try {
        await executeDocumentWorkflow({
            orgId: starterOrg.id,
            docData: docDataMock,
            type: 'FE',
            security: securityMock
        });
        console.error("❌ FALLO CRÍTICO: El sistema permitió emitir la factura #51 en plan STARTER.");
    } catch (e: any) {
        if (e.message.includes("QUOTA_EXCEEDED")) {
            console.log("✅ ÉXITO: Bloqueo de cuota activado correctamente.");
            console.log(`   Mensaje capturado: "${e.message}"`);
        } else {
            console.error(`❌ ERROR INESPERADO: ${e.message}`);
        }
    }

    // 4. PRUEBA DE BLOQUEO DE API (Starter no debe tener acceso)
    console.log("\n⚡ Verificando Bloqueo de API Pública para Starter...");
    // Simulamos la lógica del endpoint API
    const plan = PLANS[starterOrg.plan as keyof typeof PLANS];
    if (!plan.hasApiAccess) {
        console.log("✅ ÉXITO: Plan STARTER tiene 'hasApiAccess: false' configurado.");
    } else {
        console.error("❌ ERROR: Plan STARTER tiene acceso a API habilitado incorrectamente.");
    }

    // Limpieza
    await prisma.invoice.deleteMany({ where: { orgId: starterOrg.id } });
    await prisma.organization.delete({ where: { id: starterOrg.id } });
    console.log("\n🧹 Limpieza completada.");
}

runLimitTests()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
