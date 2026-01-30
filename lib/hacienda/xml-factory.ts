import { FacturaData, LineaDetalle, Entidad, RepData, InformacionReferencia } from "../types/factura";
import { HaciendaValidator } from "./validator";

export class XmlFactory {

    /**
     * [SECURITY FIX] Escapa caracteres especiales y TRUNCA según v4.4
     */
    private static escapeXml(text: string | undefined | null, maxLength: number = 250): string {
        if (!text) return '';
        const truncated = HaciendaValidator.truncate(text, maxLength);
        return truncated
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    private static formatDate(date: Date): string {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const yyyy = date.getFullYear();
        const MM = pad(date.getMonth() + 1);
        const dd = pad(date.getDate());
        const hh = pad(date.getHours());
        const mm = pad(date.getMinutes());
        const ss = pad(date.getSeconds());
        return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}-06:00`;
    }

    private static formatNum(num: number, decimals: number = 5): string {
        return (num || 0).toFixed(decimals);
    }

    private static buildUbicacion(ubicacion: Entidad['ubicacion']): string {
        if (!ubicacion) return '';
        return `
    <Ubicacion>
        <Provincia>${ubicacion.provincia}</Provincia>
        <Canton>${ubicacion.canton}</Canton>
        <Distrito>${ubicacion.distrito}</Distrito>
        ${ubicacion.barrio ? `<Barrio>${ubicacion.barrio}</Barrio>` : ''}
        <OtrasSenas>${this.escapeXml(ubicacion.senas)}</OtrasSenas>
    </Ubicacion>`;
    }

    private static buildEntidad(tag: string, data: Entidad): string {
        return `<${tag}>
    <Nombre>${this.escapeXml(data.nombre)}</Nombre>
    <Identificacion>
        <Tipo>${data.tipoIdentificacion}</Tipo>
        <Numero>${data.numeroIdentificacion}</Numero>
    </Identificacion>
    ${data.codigoActividad ? `<CodigoActividad>${data.codigoActividad}</CodigoActividad>` : ''}
    ${data.nombreComercial ? `<NombreComercial>${this.escapeXml(data.nombreComercial)}</NombreComercial>` : ''}
    ${this.buildUbicacion(data.ubicacion)}
    ${data.telefono ? `<Telefono>
        <CodigoPais>${data.telefono.codigoPais}</CodigoPais>
        <NumTelefono>${data.telefono.numero}</NumTelefono>
    </Telefono>` : ''}
    <CorreoElectronico>${this.escapeXml(data.correo) || 'sin_correo@sin_correo.com'}</CorreoElectronico>
</${tag}>`;
    }

    private static buildInformacionReferencia(ref: InformacionReferencia): string {
        return `
    <InformacionReferencia>
        <TipoDoc>${ref.tipoDoc}</TipoDoc>
        <Numero>${ref.numero}</Numero>
        <FechaEmision>${this.formatDate(ref.fechaEmision)}</FechaEmision>
        <Codigo>${ref.codigo}</Codigo>
        <Razon>${this.escapeXml(ref.razon)}</Razon>
    </InformacionReferencia>`;
    }

    static buildFactura(data: FacturaData): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<FacturaElectronica xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica https://www.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2016/v4.4/FacturaElectronica_V4.4.xsd">
    <Clave>${data.claveStr}</Clave>
    <CodigoActividad>${data.codigoActividad || '000000'}</CodigoActividad>
    <NumeroConsecutivo>${data.consecutivoStr}</NumeroConsecutivo>
    <FechaEmision>${this.formatDate(data.fechaEmision)}</FechaEmision>
    ${this.buildEntidad('Emisor', data.emisor)}
    ${data.receptor ? this.buildEntidad('Receptor', data.receptor) : ''}
    <CondicionVenta>${data.condicionVenta}</CondicionVenta>
    ${data.plazoCredito ? `<PlazoCredito>${data.plazoCredito}</PlazoCredito>` : ''}
    ${(data.medioPago || ['01']).map(m => `<MedioPago>${m}</MedioPago>`).join('\n    ')}
    <DetalleServicio>
        ${data.detalles.map(linea => `
        <LineaDetalle>
            <NumeroLinea>${linea.numeroLinea}</NumeroLinea>
            <Codigo>${linea.codigoCabys}</Codigo>
            <Cantidad>${this.formatNum(linea.cantidad, 3)}</Cantidad>
            <UnidadMedida>${linea.unidadMedida}</UnidadMedida>
            <Detalle>${linea.detalle}</Detalle>
            <PrecioUnitario>${this.formatNum(linea.precioUnitario)}</PrecioUnitario>
            <MontoTotal>${this.formatNum(linea.montoTotal)}</MontoTotal>
            ${linea.descuento ? `
            <Descuento>
                <MontoDescuento>${this.formatNum(linea.descuento.monto)}</MontoDescuento>
                <NaturalezaDescuento>${linea.descuento.naturaleza}</NaturalezaDescuento>
            </Descuento>` : ''}
            <SubTotal>${this.formatNum(linea.subTotal)}</SubTotal>
            ${linea.impuesto ? `
            <Impuesto>
                <Codigo>${linea.impuesto.codigo}</Codigo>
                <CodigoTarifa>${linea.impuesto.codigoTarifa}</CodigoTarifa>
                <Tarifa>${this.formatNum(linea.impuesto.tarifa, 2)}</Tarifa>
                <Monto>${this.formatNum(linea.impuesto.monto)}</Monto>
            </Impuesto>` : ''}
            <MontoTotalLinea>${this.formatNum(linea.montoTotalLinea)}</MontoTotalLinea>
        </LineaDetalle>`).join('')}
    </DetalleServicio>
    <ResumenFactura>
        <CodigoTipoMoneda>
            <CodigoMoneda>${data.resumen.codigoMoneda}</CodigoMoneda>
            ${data.resumen.tipoCambio ? `<TipoCambio>${this.formatNum(data.resumen.tipoCambio, 5)}</TipoCambio>` : ''}
        </CodigoTipoMoneda>
        <TotalServiciosGravados>${this.formatNum(data.resumen.totalServiciosGravados || 0)}</TotalServiciosGravados>
        <TotalServiciosExentos>${this.formatNum(data.resumen.totalServiciosExentos || 0)}</TotalServiciosExentos>
        <TotalServiciosExonerados>${this.formatNum(data.resumen.totalServiciosExonerados || 0)}</TotalServiciosExonerados>
        <TotalMercanciasGravadas>${this.formatNum(data.resumen.totalMercanciasGravadas || 0)}</TotalMercanciasGravadas>
        <TotalMercanciasExentas>${this.formatNum(data.resumen.totalMercanciasExentas || 0)}</TotalMercanciasExentas>
        <TotalMercanciasExoneradas>${this.formatNum(data.resumen.totalMercanciasExoneradas || 0)}</TotalMercanciasExoneradas>
        <TotalGravado>${this.formatNum(data.resumen.totalGravado || 0)}</TotalGravado>
        <TotalExento>${this.formatNum(data.resumen.totalExento || 0)}</TotalExento>
        <TotalExonerado>${this.formatNum(data.resumen.totalExonerado || 0)}</TotalExonerado>
        <TotalVenta>${this.formatNum(data.resumen.totalVenta)}</TotalVenta>
        <TotalDescuentos>${this.formatNum(data.resumen.totalDescuentos)}</TotalDescuentos>
        <TotalVentaNeta>${this.formatNum(data.resumen.totalVentaNeta)}</TotalVentaNeta>
        <TotalImpuesto>${this.formatNum(data.resumen.totalImpuesto)}</TotalImpuesto>
        <TotalComprobante>${this.formatNum(data.resumen.totalComprobante)}</TotalComprobante>
    </ResumenFactura>
</FacturaElectronica>`;
    }



    static buildFacturaCompra(data: FacturaData): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<FacturaElectronicaCompra xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronicaCompra" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronicaCompra https://www.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2016/v4.4/FacturaElectronicaCompra_V4.4.xsd">
    <Clave>${data.claveStr}</Clave>
    <CodigoActividad>${data.codigoActividad || '000000'}</CodigoActividad>
    <NumeroConsecutivo>${data.consecutivoStr}</NumeroConsecutivo>
    <FechaEmision>${this.formatDate(data.fechaEmision)}</FechaEmision>
    ${this.buildEntidad('Emisor', data.emisor)}
    ${data.receptor ? this.buildEntidad('Receptor', data.receptor) : ''}
    <CondicionVenta>${data.condicionVenta}</CondicionVenta>
    ${data.plazoCredito ? `<PlazoCredito>${data.plazoCredito}</PlazoCredito>` : ''}
    ${(data.medioPago || ['01']).map(m => `<MedioPago>${m}</MedioPago>`).join('\n    ')}
    <DetalleServicio>
        ${data.detalles.map(linea => `
        <LineaDetalle>
            <NumeroLinea>${linea.numeroLinea}</NumeroLinea>
            <Codigo>${linea.codigoCabys}</Codigo>
            <Cantidad>${this.formatNum(linea.cantidad, 3)}</Cantidad>
            <UnidadMedida>${linea.unidadMedida}</UnidadMedida>
            <Detalle>${linea.detalle}</Detalle>
            <PrecioUnitario>${this.formatNum(linea.precioUnitario)}</PrecioUnitario>
            <MontoTotal>${this.formatNum(linea.montoTotal)}</MontoTotal>
            ${linea.descuento ? `
            <Descuento>
                <MontoDescuento>${this.formatNum(linea.descuento.monto)}</MontoDescuento>
                <NaturalezaDescuento>${linea.descuento.naturaleza}</NaturalezaDescuento>
            </Descuento>` : ''}
            <SubTotal>${this.formatNum(linea.subTotal)}</SubTotal>
            ${linea.impuesto ? `
            <Impuesto>
                <Codigo>${linea.impuesto.codigo}</Codigo>
                <CodigoTarifa>${linea.impuesto.codigoTarifa}</CodigoTarifa>
                <Tarifa>${this.formatNum(linea.impuesto.tarifa, 2)}</Tarifa>
                <Monto>${this.formatNum(linea.impuesto.monto)}</Monto>
            </Impuesto>` : ''}
            <MontoTotalLinea>${this.formatNum(linea.montoTotalLinea)}</MontoTotalLinea>
        </LineaDetalle>`).join('')}
    </DetalleServicio>
    <ResumenFactura>
        <CodigoTipoMoneda>
            <CodigoMoneda>${data.resumen.codigoMoneda}</CodigoMoneda>
            ${data.resumen.tipoCambio ? `<TipoCambio>${this.formatNum(data.resumen.tipoCambio, 5)}</TipoCambio>` : ''}
        </CodigoTipoMoneda>
        <TotalServiciosGravados>${this.formatNum(data.resumen.totalServiciosGravados || 0)}</TotalServiciosGravados>
        <TotalServiciosExentos>${this.formatNum(data.resumen.totalServiciosExentos || 0)}</TotalServiciosExentos>
        <TotalServiciosExonerados>${this.formatNum(data.resumen.totalServiciosExonerados || 0)}</TotalServiciosExonerados>
        <TotalMercanciasGravadas>${this.formatNum(data.resumen.totalMercanciasGravadas || 0)}</TotalMercanciasGravadas>
        <TotalMercanciasExentas>${this.formatNum(data.resumen.totalMercanciasExentas || 0)}</TotalMercanciasExentas>
        <TotalMercanciasExoneradas>${this.formatNum(data.resumen.totalMercanciasExoneradas || 0)}</TotalMercanciasExoneradas>
        <TotalGravado>${this.formatNum(data.resumen.totalGravado || 0)}</TotalGravado>
        <TotalExento>${this.formatNum(data.resumen.totalExento || 0)}</TotalExento>
        <TotalExonerado>${this.formatNum(data.resumen.totalExonerado || 0)}</TotalExonerado>
        <TotalVenta>${this.formatNum(data.resumen.totalVenta)}</TotalVenta>
        <TotalDescuentos>${this.formatNum(data.resumen.totalDescuentos)}</TotalDescuentos>
        <TotalVentaNeta>${this.formatNum(data.resumen.totalVentaNeta)}</TotalVentaNeta>
        <TotalImpuesto>${this.formatNum(data.resumen.totalImpuesto)}</TotalImpuesto>
        <TotalComprobante>${this.formatNum(data.resumen.totalComprobante)}</TotalComprobante>
    </ResumenFactura>
</FacturaElectronicaCompra>`;
    }

    private static buildResumen(resumen: any): string {
        return `
    <ResumenFactura>
        <CodigoMoneda>${resumen.codigoMoneda}</CodigoMoneda>
        <TotalVenta>${this.formatNum(resumen.totalVenta)}</TotalVenta>
        <TotalImpuesto>${this.formatNum(resumen.totalImpuesto)}</TotalImpuesto>
        <TotalComprobante>${this.formatNum(resumen.totalComprobante)}</TotalComprobante>
    </ResumenFactura>`;
    }

    private static buildReferencia(ref: InformacionReferencia): string {
        return `
    <InformacionReferencia>
        <TipoDoc>${ref.tipoDoc}</TipoDoc>
        <Numero>${ref.numero}</Numero>
        <FechaEmision>${this.formatDate(ref.fechaEmision)}</FechaEmision>
        <Codigo>${ref.codigo}</Codigo>
        <Razon>${this.escapeXml(ref.razon, 180)}</Razon>
    </InformacionReferencia>`;
    }

    static buildRep(data: RepData): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<ReciboElectronicoPago xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/reciboElectronicoPago" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/reciboElectronicoPago https://www.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2016/v4.4/ReciboElectronicoPago_V4.4.xsd">
    <Clave>${data.claveStr}</Clave>
    <NumeroConsecutivo>${data.consecutivoStr}</NumeroConsecutivo>
    <FechaEmision>${this.formatDate(data.fechaEmision)}</FechaEmision>
    ${this.buildEntidad('Emisor', data.emisor)}
    ${this.buildEntidad('Receptor', data.receptor)}
    ${this.buildReferencia(data.referencia)}
    <MontoPago>${this.formatNum(data.montoPago)}</MontoPago>
</ReciboElectronicoPago>`;
    }
}
