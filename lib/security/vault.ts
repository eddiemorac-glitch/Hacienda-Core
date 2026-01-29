import forge from 'node-forge';

/**
 * THE VAULT: Security Core
 * 
 * Principios:
 * 1. Zero-Trust: La llave privada nunca toca el disco desencriptada.
 * 2. Ephemeral: Se mantiene en memoria solo lo necesario.
 * 3. Strict Typing: Evita errores de manipulación de buffers.
 */

export interface VaultCredentials {
    p12Buffer: Buffer; // El archivo binario crudo
    pin: string;       // El PIN de 4 dígitos (normalmente)
}

export interface SigningKey {
    key: forge.pki.PrivateKey;
    certificate: forge.pki.Certificate;
    notAfter: Date;
    notBefore: Date;
}

export class VaultService {
    /**
     * Abre el contenedor .p12 y extrae la llave privada y el certificado.
     * IMPORTANTE: Esta operación es bloqueante y debe hacerse con cuidado de no
     * loguear la llave privada.
     */
    static unlock(credentials: VaultCredentials): SigningKey {
        try {
            // 1. Decodificar el buffer p12
            const p12Asn1 = forge.asn1.fromDer(credentials.p12Buffer.toString('binary'));

            // 2. Desencriptar usando el PIN
            // Nota: forge.pkcs12.pkcs12FromAsn1 puede lanzar excepción si el PIN es incorrecto
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, credentials.pin);

            // 3. Buscar el certificado y la llave en las bolsas seguras (SafeBags)
            // Normalmente en CR, la llave viene en el keyBag y el cert en certBag
            let key: forge.pki.PrivateKey | null = null;
            let certificate: forge.pki.Certificate | null = null;

            // Iterar sobre las bolsas para encontrar la llave (friendlyName suele variar, ignoramos eso)
            const pkcs8Bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
            const keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
            const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });

            // Extraer Llave Privada (intentar primero pkcs8ShroudedKeyBag, luego keyBag)
            if (pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag] && pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag]!.length > 0) {
                key = pkcs8Bags[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key as forge.pki.PrivateKey;
            } else if (keyBags[forge.pki.oids.keyBag] && keyBags[forge.pki.oids.keyBag]!.length > 0) {
                key = keyBags[forge.pki.oids.keyBag]![0].key as forge.pki.PrivateKey;
            }

            // Extraer Certificado
            if (certBags[forge.pki.oids.certBag] && certBags[forge.pki.oids.certBag]!.length > 0) {
                certificate = certBags[forge.pki.oids.certBag]![0].cert as forge.pki.Certificate;
            }

            if (!key || !certificate) {
                throw new Error('CORRUPT_P12: No private key or certificate found in the container.');
            }

            // 4. Validar vigencia
            const now = new Date();
            if (now > certificate.validity.notAfter) {
                throw new Error(`EXPIRED_CERT: Certificate expired on ${certificate.validity.notAfter.toISOString()}`);
            }

            console.log(`[VAULT] Unlocked certificate for: ${certificate.subject.getField('CN')?.value}`);

            return {
                key,
                certificate,
                notAfter: certificate.validity.notAfter,
                notBefore: certificate.validity.notBefore
            };

        } catch (error: any) {
            // Sanitizar error para no leakear el PIN en logs
            const msg = error.message || 'Unknown error';
            if (msg.includes('Invalid execution')) { // Forge a veces tira esto por password
                throw new Error('INVALID_PIN: Access denied to the cryptographic container.');
            }
            throw new Error(`VAULT_FAILURE: ${msg}`);
        }
    }

    /**
     * Limpieza de memoria (Best Effort en JS)
     * Ayuda al GC a marcar los objetos sensibles.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static scrub(obj: any) {
        if (obj) {
            for (const key in obj) {
                obj[key] = null;
            }
        }
    }
}
