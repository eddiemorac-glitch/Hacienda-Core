// TIPOS DE FACTURACIÓN ELECTRÓNICA V4.4

export interface Ubicacion {
    provincia: string; // 1 digit
    canton: string;    // 2 digits
    distrito: string;  // 2 digits
    barrio?: string;   // 2 digits
    senas: string;     // Max 160 chars
}

export interface Entidad {
    nombre: string;
    tipoIdentificacion: string; // 01=Fisica, 02=Juridica, etc.
    numeroIdentificacion: string;
    codigoActividad?: string; // [v4.4 MANDATORY for Receiver if taxpayer]
    nombreComercial?: string;
    ubicacion?: Ubicacion;
    telefono?: { codigoPais: string; numero: string };
    correo?: string;
}

export interface LineaDetalle {
    numeroLinea: number;
    codigoCabys: string; // 13 digits
    codigoComercial?: { tipo: string; codigo: string };
    cantidad: number;
    unidadMedida: string; // Unid, Sp, etc.
    detalle: string;
    precioUnitario: number;
    montoTotal: number; // cant * precio
    descuento?: {
        monto: number;
        naturaleza: string; // Requerido v4.4 (Spec 4.3)
    };
    subTotal: number;
    impuesto?: {
        codigo: string; // 01=IVA
        codigoTarifa: string; // 08=13%
        tarifa: number;
        monto: number;
    };
    impuestoNeto?: number;
    montoTotalLinea: number;
    detalleSurtido?: {
        codigo: string;
        cantidad: number;
        detalle: string;
    }[];
}

export interface ResumenFactura {
    codigoMoneda: string; // CRC / USD
    tipoCambio?: number;
    totalServiciosGravados: number;
    totalServiciosExentos: number;
    totalServiciosExonerados: number;
    totalMercanciasGravadas: number;
    totalMercanciasExentas: number;
    totalMercanciasExoneradas: number;
    totalGravado: number;
    totalExento: number;
    totalExonerado: number;
    totalVenta: number;
    totalDescuentos: number;
    totalVentaNeta: number;
    totalImpuesto: number;
    totalComprobante: number;
}

export interface FacturaData {
    claveStr: string;
    consecutivoStr: string;
    fechaEmision: Date; // ISO String

    emisor: Entidad;
    receptor?: Entidad;

    condicionVenta: string; // 01=Contado
    plazoCredito?: string;
    medioPago: string[]; // 01=Efectivo, 02=Tarjeta

    detalles: LineaDetalle[];
    resumen: ResumenFactura;

    codigoActividad?: string; // v4.4 activity code
    otros?: string; // Observaciones
}

// v4.4 - Recibo Electrónico de Pago (REP)
export interface InformacionReferencia {
    tipoDoc: string; // 01=FE, 04=TE, etc.
    numero: string;  // Clave de 50 dígitos
    fechaEmision: Date;
    codigo: string;  // 01=Anula, 04=Sustituye, 00=REP Referencia
    razon: string;
}

export interface RepData {
    claveStr: string;
    consecutivoStr: string;
    fechaEmision: Date;
    emisor: Entidad;
    receptor: Entidad;
    referencia: InformacionReferencia;
    montoPago: number;
    codigoMoneda: string;
}

