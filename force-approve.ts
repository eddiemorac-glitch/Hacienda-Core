import { prisma } from './lib/db';

async function forceApprove() {
    console.log("🚀 Iniciando aprobación forzada...");
    try {
        const req = await prisma.upgradeRequest.findFirst({
            where: { status: 'PENDING' }
        });

        if (!req) {
            console.log("ℹ️ No hay registros pendientes en este momento.");
            return;
        }

        console.log(`📡 Procesando solicitud ${req.id} para la empresa ${req.orgId}...`);

        // 1. Subir el plan de la organización
        await prisma.organization.update({
            where: { id: req.orgId },
            data: {
                plan: req.requestedPlan,
                subscriptionStatus: 'active'
            }
        });

        // 2. Marcar solicitud como aprobada
        await prisma.upgradeRequest.update({
            where: { id: req.id },
            data: {
                status: 'APPROVED',
                adminNotes: 'Aprobación manual forzada por sistema',
                processedAt: new Date()
            }
        });

        console.log("✅ ¡Aprobado con éxito! El usuario ya debería ver su nuevo plan.");
    } catch (e) {
        console.error("❌ Error fatal durante el proceso:", e);
    } finally {
        process.exit();
    }
}

forceApprove();
