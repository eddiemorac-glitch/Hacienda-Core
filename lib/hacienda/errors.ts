/**
 * [DGT ERROR DICTIONARY]
 * Comprehensive mapping of Hacienda CR Error Codes for v4.4 Specification.
 */

export const HACIENDA_ERRORS: Record<string, { title: string, description: string, recommendation: string }> = {
    "400": {
        title: "Bad Request (Schema Error)",
        description: "El XML no cumple con la estructura XSD del Anexo 4.4.",
        recommendation: "Verifique que todos los campos obligatorios estén presentes y sigan el formato correcto."
    },
    "401": {
        title: "Unauthorized (Token Expired)",
        description: "El token de acceso OAuth2 ha expirado o es inválido.",
        recommendation: "El sistema renovará el token automáticamente. Si persiste, revise sus credenciales de API en el Dashboard."
    },
    "403": {
        title: "Forbidden (Credential Conflict)",
        description: "La Cédula del emisor no coincide con la llave criptográfica suministrada.",
        recommendation: "Asegúrese de subir el certificado (.p12) que corresponde exactamente al número de identificación registrado."
    },
    "429": {
        title: "Too Many Requests (Rate Limit)",
        description: "Se ha excedido el límite de peticiones por segundo a los servidores de Hacienda.",
        recommendation: "El Sentinel manejará el reintento automáticamente siguiendo un algoritmo de backoff exponencial."
    },
    "REC-001": {
        title: "Clave Duplicada",
        description: "La Clave Numérica de 50 dígitos ya fue enviada previamente.",
        recommendation: "No reenvíe este documento. Consulte el estado original utilizando la misma clave."
    },
    "REC-002": {
        title: "Error de Firma",
        description: "La firma XAdES-EPES no pudo ser validada por la infraestructura de Hacienda.",
        recommendation: "Verifique que el PIN de su llave criptográfica sea el correcto en la sección de Ajustes."
    },
    "VAL-001": {
        title: "CAByS Inválido",
        description: "El código de producto CAByS de 13 dígitos no existe en el catálogo nacional.",
        recommendation: "Utilice nuestro buscador inteligente de CAByS para seleccionar un código vigente de la base de datos del BCCR."
    },
    "VAL-005": {
        title: "Fecha de Emisión Desfasada",
        description: "La fecha del documento supera el límite de 3 horas de diferencia con la hora de Hacienda.",
        recommendation: "Sincronice la hora de su servidor o envíe el documento bajo el protocolo de Contingencia (02)."
    }
};

export function getFriendlyError(code: string) {
    return HACIENDA_ERRORS[code] || {
        title: `Error Desconocido (${code})`,
        description: "Se ha detectado una respuesta no estándar de los servidores fiscales.",
        recommendation: "Consulte el historial de mensajes en el dashboard o contacte a soporte técnico Nova."
    };
}
