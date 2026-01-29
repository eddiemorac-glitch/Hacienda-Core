import forge from 'node-forge';
import { SigningKey } from './vault';

/**
 * SERVICIO DE FIRMA XAdES-EPES
 * 
 * Este módulo inyecta el nodo de firma digital en el XML.
 * Implementa las referencias y transformadas requeridas por Hacienda.
 */

export class SignerService {

    private static readonly POLICY_HASH = "Ohixl6upD6av8N7pEvDABhEL6hM=";
    private static readonly POLICY_URI = "https://cdn.comprobanteselectronicos.go.cr/xmlschemas/Resoluci%C3%B3n_General_sobre_disposiciones_t%C3%A9cnicas_comprobantes_electr%C3%B3nicos_para_efectos_tributarios.pdf";

    /**
     * Firma el XML usando la llave privada desbloqueada.
     */
    static signXml(xmlString: string, keyData: SigningKey): string {
        // 1. Calcular Digest del Documento
        const md = forge.md.sha256.create();
        md.update(xmlString, 'utf8');
        const docDigest = forge.util.encode64(md.digest().getBytes());

        // 2. Generar ID únicos
        const signatureId = `Signature-${this.genId()}`;
        const signedPropsId = `SignedProperties-${this.genId()}`;
        const keyInfoId = `KeyInfo-${this.genId()}`;
        const refId = `Reference-${this.genId()}`;

        // 3. Construir KeyInfo
        const certB64 = forge.util.encode64(
            forge.asn1.toDer(forge.pki.certificateToAsn1(keyData.certificate)).getBytes()
        );

        // Cast to any to access RSA specific properties
        const rsaKey = keyData.key as any;
        const x509Issuer = keyData.certificate.issuer.attributes.map(a => `${a.shortName}=${a.value}`).join(', ');

        // 4. Construir SignedInfo
        const signedInfo = `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <ds:Reference Id="${refId}" URI="">
        <ds:Transforms>
            <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>${docDigest}</ds:DigestValue>
    </ds:Reference>
    <ds:Reference URI="#${keyInfoId}">
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>CALCULATED_LATER_KEYINFO</ds:DigestValue>
    </ds:Reference>
    <ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropsId}">
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>CALCULATED_LATER</ds:DigestValue>
    </ds:Reference>
</ds:SignedInfo>`;

        // 5. Construir SignedProperties (XAdES)
        const isoNow = new Date().toISOString();
        const signedProperties = `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="${signedPropsId}">
    <xades:SignedSignatureProperties>
        <xades:SigningTime>${isoNow}</xades:SigningTime>
        <xades:SigningCertificate>
            <xades:Cert>
                <xades:CertDigest>
                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                    <ds:DigestValue>${this.getCertDigest(keyData.certificate)}</ds:DigestValue>
                </xades:CertDigest>
                <xades:IssuerSerial>
                    <ds:X509IssuerName>${x509Issuer}</ds:X509IssuerName>
                    <ds:X509SerialNumber>${keyData.certificate.serialNumber}</ds:X509SerialNumber>
                </xades:IssuerSerial>
            </xades:Cert>
        </xades:SigningCertificate>
        <xades:SignaturePolicyIdentifier>
            <xades:SignaturePolicyId>
                <xades:SigPolicyId>
                    <xades:Identifier>${this.POLICY_URI}</xades:Identifier>
                    <xades:Description />
                </xades:SigPolicyId>
                <xades:SigPolicyHash>
                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                    <ds:DigestValue>${this.POLICY_HASH}</ds:DigestValue>
                </xades:SigPolicyHash>
            </xades:SignaturePolicyId>
        </xades:SignaturePolicyIdentifier>
    </xades:SignedSignatureProperties>
</xades:SignedProperties>`;

        // 6. Calcular hash de SignedProperties (Normalizando espacios para mayor robustez)
        const normalizedSp = signedProperties.replace(/>\s+</g, '><').trim();
        const spMd = forge.md.sha256.create();
        spMd.update(normalizedSp, 'utf8');
        const spDigest = forge.util.encode64(spMd.digest().getBytes());

        // [SECURITY-FIX] Calcular hash de KeyInfo
        // Reconstruimos KeyInfo como string aislado para el hash, asegurando consistencia
        const keyInfoBlock = `<ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${keyInfoId}">
        <ds:X509Data>
            <ds:X509Certificate>${certB64}</ds:X509Certificate>
        </ds:X509Data>
    </ds:KeyInfo>`;
        const normalizedKi = keyInfoBlock.replace(/>\s+</g, '><').trim();
        const kiMd = forge.md.sha256.create();
        kiMd.update(normalizedKi, 'utf8');
        const kiDigest = forge.util.encode64(kiMd.digest().getBytes());

        // 7. Actualizar SignedInfo con los hashes reales
        const finalSignedInfo = signedInfo
            .replace('CALCULATED_LATER', spDigest)
            .replace('CALCULATED_LATER_KEYINFO', kiDigest);

        // 8. Firmar el SignedInfo (También normalizado)
        const normalizedSi = finalSignedInfo.replace(/>\s+</g, '><').trim();
        const siMd = forge.md.sha256.create();
        siMd.update(normalizedSi, 'utf8');
        const signature = rsaKey.sign(siMd);
        const signatureValue = forge.util.encode64(signature);

        // 9. Ensamblar todo el bloque <ds:Signature>
        const signatureBlock = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${signatureId}">
    ${finalSignedInfo}
    <ds:SignatureValue Id="SignatureValue-${this.genId()}">${signatureValue}</ds:SignatureValue>
    <ds:KeyInfo Id="${keyInfoId}">
        <ds:X509Data>
            <ds:X509Certificate>${certB64}</ds:X509Certificate>
        </ds:X509Data>
    </ds:KeyInfo>
    <ds:Object Id="XadesObject-${this.genId()}">
        <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#${signatureId}">
            ${signedProperties}
        </xades:QualifyingProperties>
    </ds:Object>
</ds:Signature>`;

        // 10. Inyectar en el XML original (Envelope)
        const match = xmlString.match(/<\/(FacturaElectronica|ReciboElectronicoPago|FacturaElectronicaCompra)>/);
        if (!match) throw new Error("No se encontró una etiqueta de cierre válida para firmar.");

        return xmlString.replace(match[0], `${signatureBlock}${match[0]}`);
    }

    private static genId(): string {
        return Math.random().toString(36).substring(2, 10);
    }

    private static getCertDigest(cert: forge.pki.Certificate): string {
        const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
        const md = forge.md.sha256.create();
        md.update(der);
        return forge.util.encode64(md.digest().getBytes());
    }
}
