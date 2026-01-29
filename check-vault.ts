import { prisma } from "./lib/db";

async function checkVault() {
    const user = await prisma.user.findFirst({
        where: {
            email: {
                contains: 'eddie.mora',
                mode: 'insensitive'
            }
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    haciendaUser: true,
                    haciendaPass: true,
                    haciendaPin: true,
                    haciendaP12: true,
                    haciendaEnv: true
                }
            }
        }
    });

    if (!user) {
        console.log('❌ Usuario no encontrado');
        return;
    }

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          VERIFICACIÓN DE BÓVEDA CRIPTOGRÁFICA              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('👤 Usuario:', user.email);
    console.log('🏢 Organización:', user.organization?.name || 'N/A');
    console.log('🆔 Org ID:', user.organization?.id || 'N/A');
    console.log('');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('                    ESTADO DE CREDENCIALES                   ');
    console.log('─────────────────────────────────────────────────────────────');

    const org = user.organization;

    // Usuario Hacienda
    if (org?.haciendaUser) {
        console.log('✅ haciendaUser: CONFIGURADO');
        console.log('   └─ Valor:', org.haciendaUser.substring(0, 10) + '...');
    } else {
        console.log('❌ haciendaUser: NO CONFIGURADO');
    }

    // Password (debe estar encriptado)
    if (org?.haciendaPass) {
        const isEncrypted = org.haciendaPass.includes(':');
        console.log('✅ haciendaPass:', isEncrypted ? 'ENCRIPTADO (AES-256-GCM)' : '⚠️ TEXTO PLANO');
        console.log('   └─ Prefijo:', org.haciendaPass.substring(0, 16) + '...');
    } else {
        console.log('❌ haciendaPass: NO CONFIGURADO');
    }

    // PIN (debe estar encriptado)
    if (org?.haciendaPin) {
        const isEncrypted = org.haciendaPin.includes(':');
        console.log('✅ haciendaPin:', isEncrypted ? 'ENCRIPTADO (AES-256-GCM)' : '⚠️ TEXTO PLANO');
        console.log('   └─ Prefijo:', org.haciendaPin.substring(0, 16) + '...');
    } else {
        console.log('❌ haciendaPin: NO CONFIGURADO');
    }

    // Certificado P12
    if (org?.haciendaP12) {
        const sizeKB = Math.round(org.haciendaP12.length / 1024);
        console.log('✅ haciendaP12: CERTIFICADO GUARDADO');
        console.log('   └─ Tamaño:', sizeKB, 'KB (Base64)');
        console.log('   └─ Prefijo:', org.haciendaP12.substring(0, 20) + '...');
    } else {
        console.log('❌ haciendaP12: NO CONFIGURADO');
    }

    // Ambiente
    console.log('');
    console.log('🌐 Ambiente:', org?.haciendaEnv || 'staging');

    console.log('');
    console.log('─────────────────────────────────────────────────────────────');

    // Resumen
    const allConfigured = org?.haciendaUser && org?.haciendaPass && org?.haciendaPin && org?.haciendaP12;
    if (allConfigured) {
        console.log('🎉 ESTADO: BÓVEDA COMPLETAMENTE CONFIGURADA');
        console.log('   El sistema está listo para emitir facturas electrónicas.');
    } else {
        console.log('⚠️ ESTADO: CONFIGURACIÓN INCOMPLETA');
        console.log('   Faltan credenciales por configurar.');
    }

    console.log('─────────────────────────────────────────────────────────────');
}

checkVault().catch(console.error);
