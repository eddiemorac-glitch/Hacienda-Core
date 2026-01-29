import { prisma } from '../db';
import bcrypt from 'bcrypt';

/**
 * [SENTINEL SEEDER] - Production Profiles Setup
 * Creates 3 distinct organization profiles to test all subscription tiers.
 */

async function main() {
    console.log("🌱 ESEMBRANDO PERFILES DE PRODUCCIÓN / TESTING...");

    // [CLEANUP] Borrar usuario existente si lo hay, para recrearlo limpio como ADMIN
    try {
        await prisma.user.deleteMany({ where: { email: 'eddie.mora.c@gmail.com' } });
        console.log("🧹 Usuario previo 'eddie.mora.c@gmail.com' eliminado (Clean Slate).");
    } catch (e) {
        console.log("ℹ️ No se requirió limpieza para el admin.");
    }

    const password = await bcrypt.hash('sentinel2026', 12);

    const profiles = [
        {
            email: 'eddie.mora.c@gmail.com',
            name: 'Eddie Mora (Master Admin)',
            orgName: 'HaciendaCore Platform',
            cedula: '000000000',
            plan: 'ENTERPRISE',
            role: 'ADMIN',
            haciendaUser: 'cpj-00-0000-0000',
            env: 'production'
        },
        {
            email: 'starter@test.com',
            name: 'Pyme Starter Node',
            orgName: 'Pequeño Contribuyente S.A.',
            cedula: '101010101',
            plan: 'STARTER',
            role: 'USER',
            haciendaUser: 'cpf-01-0000-0000',
            env: 'staging'
        },
        {
            email: 'business@test.com',
            name: 'Medium Business Swarm',
            orgName: 'Distribuidora Global S.A.',
            cedula: '3101222222',
            plan: 'BUSINESS',
            role: 'USER',
            haciendaUser: 'cpf-01-1111-1111',
            env: 'staging'
        },
        {
            email: 'enterprise@test.com',
            name: 'Corporate Enterprise Ultra',
            orgName: 'Multinacional Nova Corp',
            cedula: '3101333333',
            plan: 'ENTERPRISE',
            role: 'USER',
            haciendaUser: 'cpj-01-9999-9999',
            env: 'production'
        }
    ];

    for (const p of profiles) {
        console.log(`📦 Creando Perfil: ${p.plan} (${p.role || 'USER'})...`);

        const org = await prisma.organization.upsert({
            where: { cedula: p.cedula },
            update: { plan: p.plan, haciendaUser: p.haciendaUser, haciendaEnv: p.env },
            create: {
                name: p.orgName,
                cedula: p.cedula,
                plan: p.plan,
                haciendaUser: p.haciendaUser,
                haciendaPass: 'mock_pass',
                haciendaPin: '1234',
                haciendaP12: 'MOCK_BUFFER_BASE64',
                haciendaEnv: p.env
            }
        });

        await prisma.user.upsert({
            where: { email: p.email },
            update: { orgId: org.id, role: p.role || 'USER' },
            create: {
                email: p.email,
                name: p.name,
                password: password,
                orgId: org.id,
                role: p.role || 'USER'
            }
        });

        // Generate an API Key for the Enterprise profile
        if (p.plan === 'ENTERPRISE') {
            await prisma.apiKey.create({
                data: {
                    key: await bcrypt.hash('hc_test_enterprise_key', 8),
                    prefix: 'hc_enter',
                    name: 'Enterprise Production Key',
                    orgId: org.id,
                    isActive: true
                }
            });
        }
    }

    console.log("\n✅ PERFILES CREADOS EXITOSAMENTE.");
    console.log("1. STARTER    -> starter@test.com (50 docs, solo FE)");
    console.log("2. BUSINESS   -> business@test.com (Ilimitado, FE+REP+FEC)");
    console.log("3. ENTERPRISE -> enterprise@test.com (Ilimitado, API Access)");
    process.exit(0);
}

main().catch(e => {
    console.error("❌ Error en seeding:", e);
    process.exit(1);
});
