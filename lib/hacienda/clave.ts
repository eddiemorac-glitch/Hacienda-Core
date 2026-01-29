/**
 * GENERADOR DE CLAVES v4.4
 * 
 * Implementa la lógica estándar para la generación de la Clave Numérica de 50 dígitos
 * requerida por la DGT (Dirección General de Tributación).
 */

export enum TipoDocumento {
    FacturaElectronica = "01",
    NotaDebito = "02",
    NotaCredito = "03",
    TiqueteElectronico = "04",
    ConfirmacionAceptacion = "05",
    ConfirmacionAceptacionParcial = "06",
    ConfirmacionRechazo = "07",
    FacturaElectronicaCompra = "08",
    FacturaElectronicaExportacion = "09",
    ReciboElectronicoPago = "11",
}

export enum SituacionComprobante {
    Normal = "1",
    Contingencia = "2",
    SinInternet = "3",
}

export interface ClaveParams {
    sucursal: string;      // 3 dígitos (ej: 001)
    terminal: string;      // 5 dígitos (ej: 00001)
    tipo: TipoDocumento;   // 2 dígitos
    consecutivo: string;   // 10 dígitos (secuencial)
    cedulaEmisor: string;  // 12 dígitos máx (sin guiones)
    situacion: SituacionComprobante;
    codigoSeguridad: string; // 8 dígitos (random o hash)
}

export class ClaveHacienda {

    /**
     * Genera la Clave de 50 dígitos.
     */
    static generar(params: ClaveParams, fecha: Date = new Date()): string {
        const pais = "506";
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear().toString().substring(2, 4);

        const emisor = params.cedulaEmisor.padStart(12, '0').substring(0, 12);

        // Armar consecutivo de 20 dígitos: SSS(3) + TTTTT(5) + TT(2) + NNNNNNNNNN(10)
        const consecutivoFull =
            params.sucursal.padStart(3, '0') +
            params.terminal.padStart(5, '0') +
            params.tipo +
            params.consecutivo.padStart(10, '0');

        const situacion = params.situacion;
        const seguridad = params.codigoSeguridad.padStart(8, '0');

        const clave = `${pais}${dia}${mes}${anio}${emisor}${consecutivoFull}${situacion}${seguridad}`;

        if (clave.length !== 50) {
            throw new Error(`CLAVE_LENGTH_ERROR: Generated key is ${clave.length} digits, expected 50.`);
        }

        return clave;
    }

    /**
     * Genera solo el consecutivo de 20 dígitos (para el nodo NumeroConsecutivo del XML)
     */
    static generarConsecutivo(params: Pick<ClaveParams, 'sucursal' | 'terminal' | 'tipo' | 'consecutivo'>): string {
        return params.sucursal.padStart(3, '0') +
            params.terminal.padStart(5, '0') +
            params.tipo +
            params.consecutivo.padStart(10, '0');
    }
}
