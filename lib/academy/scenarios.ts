export interface TrainingMission {
    id: string;
    title: string;
    description: string;
    difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
    steps: string[];
    context: string;
    targetFields: string[]; // Fields that should be highlighted in the form
}

export const TRAINING_MISSIONS: TrainingMission[] = [
    {
        id: 'first-invoice',
        title: 'Mi Primera Factura',
        description: 'Aprenda a emitir un comprobante legal básico por servicios profesionales.',
        difficulty: 'Básico',
        context: 'Supongamos que acaba de terminar un trabajo y necesita cobrarlo por primera vez.',
        targetFields: ['client-name', 'client-id', 'product-desc', 'unit-price'],
        steps: [
            'Escriba el nombre o empresa de su cliente.',
            'Ingrese el número de cédula (9 dígitos para personas, 10 para empresas).',
            'Busque el producto legal (CABYS) que mejor describa su trabajo.',
            'Defina el precio y presione "Firmar y Enviar".'
        ]
    },
    {
        id: 'credit-rep',
        title: 'Ventas a Crédito y el REP',
        description: 'Venda a plazos y aprenda cuándo usar el Recibo Electrónico de Pago.',
        difficulty: 'Intermedio',
        context: 'Hacienda permite pagar el IVA hasta 90 días después si la venta es a crédito.',
        targetFields: ['payment-terms', 'credit-days'],
        steps: [
            'Cambie el método de pago a "Crédito".',
            'Defina el plazo (ej: 30 días).',
            'Note que Sentinel le avisará un mes después para emitir el REP.',
            'Emita la factura normalmente.'
        ]
    },
    {
        id: 'simplificado',
        title: 'Régimen Simplificado',
        description: 'Guía para pequeños comercios y artesanos.',
        difficulty: 'Básico',
        context: 'Si usted está en este régimen, solo emite factura electrónica si el cliente se la pide.',
        targetFields: ['invoice-type'],
        steps: [
            'Seleccione "Factura Electrónica" solo si el cliente requiere crédito fiscal.',
            'De lo contrario, Sentinel le permite llevar un control interno sin reportar a Hacienda.',
            'Aprenda a diferenciar entre compra y venta en este régimen.'
        ]
    }
];
