/**
 * Motor de Cálculo Fiscal v4.4
 * 
 * Reglas:
 * 1. Base Imponible = Precio / (1 + TasaIVA) siempre que sea I.V.I.
 * 2. Redondeo: Hacienda exige 5 decimales en unitarios y 2 en totales.
 */

export const TASA_IVA_DEFAULT = 0.13;

export function calcularLinea(
    cantidad: number,
    precioUnitario: number,
    isIvi: boolean = false,
    tasaImpuesto: number = TASA_IVA_DEFAULT,
    descuentoMonto: number = 0
) {
    let precioBase = precioUnitario;

    if (isIvi) {
        precioBase = precioUnitario / (1 + tasaImpuesto);
    }

    const subTotal = cantidad * precioBase;
    const subTotalNeto = subTotal - descuentoMonto;
    const montoImpuesto = subTotalNeto * tasaImpuesto;
    const montoTotalLinea = subTotalNeto + montoImpuesto;

    return {
        precioUnitarioBase: Number(precioBase.toFixed(5)),
        subTotal: Number(subTotal.toFixed(5)),
        descuento: Number(descuentoMonto.toFixed(5)),
        subTotalNeto: Number(subTotalNeto.toFixed(5)),
        montoImpuesto: Number(montoImpuesto.toFixed(5)),
        montoTotalLinea: Number(montoTotalLinea.toFixed(5))
    };
}

export function redondear(num: number, decimales: number = 2): number {
    return Number(Math.round(Number(num + "e" + decimales)) + "e-" + decimales);
}
