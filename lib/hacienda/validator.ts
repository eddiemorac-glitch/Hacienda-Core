/**
 * [SENTINEL VALIDATOR] - DGT CR v4.4 Schema Compliance
 * Prevents "Schema Validation Failed" errors from Hacienda.
 */

export class HaciendaValidator {

    static truncate(text: string | undefined | null, maxLength: number): string {
        if (!text) return "";
        return text.substring(0, maxLength);
    }

    static validateEntity(data: any) {
        return {
            ...data,
            nombre: this.truncate(data.nombre, 160),
            nombreComercial: this.truncate(data.nombreComercial, 80),
            ubicacion: data.ubicacion ? {
                ...data.ubicacion,
                senas: this.truncate(data.ubicacion.senas, 250)
            } : undefined
        };
    }

    static validateLine(line: any) {
        return {
            ...line,
            detalle: this.truncate(line.detalle, 1000)
        };
    }
}
