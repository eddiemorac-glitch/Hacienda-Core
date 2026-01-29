/**
 * TEST: Verificar autenticación con Hacienda
 * Ejecuta: npx tsx test-hacienda-auth.ts
 */

import { prisma } from "./lib/db";
import { decrypt } from "./lib/security/crypto";

async function testAuth() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║      PRUEBA DE AUTENTICACIÓN CON HACIENDA STAGING         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 1. Obtener credenciales de la DB (la organización que tiene credenciales)
    const org = await prisma.organization.findFirst({
        where: {
            haciendaUser: { not: null }
        },
        select: {
            name: true,
            haciendaUser: true,
            haciendaPass: true,
            haciendaEnv: true
        }
    });

    if (!org) {
        console.error('❌ No se encontró organización');
        process.exit(1);
    }

    console.log('📋 Credenciales encontradas:');
    console.log(`   Usuario: ${org.haciendaUser}`);
    console.log(`   Ambiente: ${org.haciendaEnv}`);

    // 2. Desencriptar contraseña
    let password: string;
    try {
        password = decrypt(org.haciendaPass!);
        console.log(`   Contraseña: ${password.substring(0, 4)}${'*'.repeat(password.length - 4)} (${password.length} caracteres)`);
    } catch (e: any) {
        console.error(`❌ Error al desencriptar contraseña: ${e.message}`);
        process.exit(1);
    }

    // 3. Intentar autenticación con Hacienda
    const idpUrl = org.haciendaEnv === 'production'
        ? "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token"
        : "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token";

    const clientId = org.haciendaEnv === 'production' ? 'api-prod' : 'api-stag';

    console.log(`\n🔐 Intentando autenticación...`);
    console.log(`   IDP URL: ${idpUrl}`);
    console.log(`   Client ID: ${clientId}`);

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('grant_type', 'password');
    params.append('username', org.haciendaUser!);
    params.append('password', password);

    try {
        const res = await fetch(idpUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        console.log(`\n📡 Respuesta HTTP: ${res.status} ${res.statusText}`);

        if (res.ok) {
            const data = await res.json();
            console.log('\n✅ ¡AUTENTICACIÓN EXITOSA!');
            console.log(`   Token recibido: ${data.access_token.substring(0, 50)}...`);
            console.log(`   Expira en: ${data.expires_in} segundos`);
        } else {
            const errorText = await res.text();
            console.log('\n❌ AUTENTICACIÓN FALLIDA');
            console.log(`   Error: ${errorText}`);

            if (res.status === 401) {
                console.log('\n💡 Posibles causas:');
                console.log('   1. Usuario incorrecto (formato debe ser cpf-01-XXXX-XXXXXX)');
                console.log('   2. Contraseña API incorrecta (la del portal ATV, no el PIN del P12)');
                console.log('   3. Usuario/contraseña vencidos o bloqueados en ATV');
            }
        }
    } catch (e: any) {
        console.error(`\n❌ Error de red: ${e.message}`);
    }

    await prisma.$disconnect();
}

testAuth();
