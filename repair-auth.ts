import { prisma } from './lib/db';
import bcrypt from 'bcrypt';

/**
 * [SENTINEL REPAIR CORE]
 * Resets the master admin and test profiles to a known-working state.
 */
async function repair() {
    console.log("🛠️ INICIANDO REPARACIÓN DE CREDENCIALES...");

    const passwordHash = await bcrypt.hash('sentinel2026', 12);

    // 1. Asegurar Organización Maestra
    const org = await prisma.organization.upsert({
        where: { cedula: '000000000' },
        update: { plan: 'ENTERPRISE' },
        create: {
            name: 'HaciendaCore Master Org',
            cedula: '000000000',
            plan: 'ENTERPRISE',
            haciendaEnv: 'staging'
        }
    });

    // 2. Asegurar Usuario Admin
    await prisma.user.upsert({
        where: { email: 'eddie.mora.c@gmail.com' },
        update: {
            password: passwordHash,
            role: 'ADMIN',
            orgId: org.id
        },
        create: {
            email: 'eddie.mora.c@gmail.com',
            name: 'Eddie Mora Admin',
            password: passwordHash,
            role: 'ADMIN',
            orgId: org.id
        }
    });

    console.log("✅ Admin 'eddie.mora.c@gmail.com' reparado con clave: sentinel2026");

    // 3. Otros perfiles
    const users = [
        { email: 'starter@test.com', plan: 'STARTER', cedula: '101010101' },
        { email: 'business@test.com', plan: 'BUSINESS', cedula: '3101222222' },
        { email: 'enterprise@test.com', plan: 'ENTERPRISE', cedula: '3101333333' }
    ];

    for (const u of users) {
        const uOrg = await prisma.organization.upsert({
            where: { cedula: u.cedula },
            update: { plan: u.plan },
            create: { name: `Org ${u.plan}`, cedula: u.cedula, plan: u.plan }
        });

        await prisma.user.upsert({
            where: { email: u.email },
            update: { password: passwordHash, orgId: uOrg.id },
            create: { email: u.email, name: `User ${u.plan}`, password: passwordHash, orgId: uOrg.id }
        });
        console.log(`✅ Perfil ${u.plan} reparado.`);
    }

    console.log("\n🚀 REPARACIÓN COMPLETADA. Intente loguearse nuevamente.");
    console.log("💡 TIP: Si sigue fallando, añade RECOVERY_MODE=true a tu .env y usa la clave maestra: nova_emergency_2026");
    process.exit(0);
}

repair().catch(err => {
    console.error("❌ Fallo crítico en reparación:", err);
    process.exit(1);
});
