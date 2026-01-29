/**
 * Script para actualizar el usuario de Hacienda con el formato correcto
 */

import { prisma } from "./lib/db";

async function updateUser() {
    console.log('\n🔧 Actualizando usuario de Hacienda...\n');

    // Buscar la organización con credenciales
    const org = await prisma.organization.findFirst({
        where: { haciendaUser: { not: null } },
        select: { id: true, name: true, haciendaUser: true, haciendaEnv: true }
    });

    if (!org) {
        console.log('❌ No se encontró organización con credenciales');
        process.exit(1);
    }

    console.log(`📋 Organización: ${org.name}`);
    console.log(`   Usuario actual: ${org.haciendaUser}`);
    console.log(`   Ambiente: ${org.haciendaEnv}`);

    // Determinar el nuevo formato
    const baseCpf = org.haciendaUser!.replace(/@.*$/, ''); // Quitar dominio si ya existe
    const newUser = org.haciendaEnv === 'staging'
        ? `${baseCpf}@stag.comprobanteselectronicos.go.cr`
        : `${baseCpf}@comprobanteselectronicos.go.cr`;

    console.log(`\n   Nuevo usuario: ${newUser}`);

    // Actualizar
    await prisma.organization.update({
        where: { id: org.id },
        data: { haciendaUser: newUser }
    });

    console.log('\n✅ Usuario actualizado correctamente!\n');

    await prisma.$disconnect();
}

updateUser();
