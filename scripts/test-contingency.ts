
import { prisma } from "../lib/db";
import { ContingenciaService } from "../lib/hacienda/contingencia";

async function runStressTest() {
    console.log("🔥 INICIANDO PRUEBA DE ESTRÉS DE CONTINGENCIA 🔥");

    // 1. Crear una organización temporal para pruebas
    const org = await prisma.organization.create({
        data: {
            name: "Stress Test Corp",
            cedula: `STRESS-${Date.now()}`,
            plan: "ENTERPRISE",
            stripeCustomerId: `cus_stress_${Date.now()}`
        }
    });

    console.log(`✅ Organización de prueba creada: ${org.id}`);

    // 2. Inyectar masivamente facturas fallidas en la cola (Simulando caída de Hacienda)
    const BATCH_SIZE = 50;
    console.log(`⚠️ Inyectando ${BATCH_SIZE} facturas simuladas en la cola de contingencia...`);

    const promises = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        const clave = `506${Date.now()}${i.toString().padStart(10, '0')}`;
        promises.push(ContingenciaService.encolar(
            "<xml>dummy_signed_content</xml>",
            clave,
            "SIMULATED_TIMEOUT: Hacienda no responde",
            org.id
        ));
    }

    await Promise.all(promises);
    console.log(`✅ ${BATCH_SIZE} facturas encoladas correctamente.`);

    // 3. Verificar estado de la base de datos
    const pendientes = await prisma.contingencyQueue.count({
        where: { orgId: org.id, status: 'PENDING' }
    });
    console.log(`📊 Estado DB: ${pendientes} documentos pendientes de procesar.`);

    if (pendientes !== BATCH_SIZE) {
        console.error("❌ ERROR: La cantidad persistida no coincide con la inyectada.");
        return;
    }

    // 4. Simular procesamiento del Worker (Recuperación del servicio)
    console.log("🔄 Iniciando Worker de Recuperación (Simulación)...");

    // Función mock de envío que simula éxito aleatorio (pero 100% éxito para esta prueba de flujo)
    const mockSender = async (xml: string, clave: string) => {
        // Simular latencia de red real (50ms - 200ms)
        await new Promise(r => setTimeout(r, Math.random() * 150 + 50));
        return true;
    };

    const startTime = Date.now();
    await ContingenciaService.procesarCola(org.id, mockSender);
    const duration = (Date.now() - startTime) / 1000;

    // 5. Verificación Final
    const finalPendientes = await prisma.contingencyQueue.count({
        where: { orgId: org.id, status: 'PENDING' }
    });
    const procesados = await prisma.contingencyQueue.count({
        where: { orgId: org.id, status: 'PROCESSED' }
    });

    console.log("\n📈 RESULTADOS DE LA PRUEBA:");
    console.log(`⏱️ Tiempo total de procesamiento: ${duration.toFixed(2)} segundos`);
    console.log(`🚀 Velocidad promedio: ${(BATCH_SIZE / duration).toFixed(2)} docs/seg`);
    console.log(`✅ Procesados exitosamente: ${procesados}`);
    console.log(`❌ Pendientes / Fallidos: ${finalPendientes}`);

    if (finalPendientes === 0 && procesados === BATCH_SIZE) {
        console.log("\n✨ CONCLUSIÓN: El mecanismo de contingencia es SÓLIDO y RESILIENTE.");
    } else {
        console.log("\n⚠️ CONCLUSIÓN: Se detectaron anomalías en el procesamiento.");
    }

    // Limpieza
    await prisma.contingencyQueue.deleteMany({ where: { orgId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    console.log("🧹 Datos de prueba limpiados.");
}

runStressTest()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
