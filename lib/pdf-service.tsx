import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image } from '@react-pdf/renderer';
import React from 'react';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 9,
        fontFamily: 'Helvetica',
        color: '#334155', // slate-700
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    brand: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a', // slate-900
        letterSpacing: -0.5,
    },
    docType: {
        fontSize: 10,
        color: '#64748b', // slate-500
        textTransform: 'uppercase',
        marginTop: 4,
    },
    invoiceMeta: {
        textAlign: 'right',
    },
    invoiceId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    section: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 20,
    },
    infoCol: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: 8,
        color: '#94a3b8', // slate-400
        textTransform: 'uppercase',
        marginBottom: 4,
        fontWeight: 'bold',
    },
    infoText: {
        lineHeight: 1.4,
    },
    claveBox: {
        backgroundColor: '#f8fafc',
        padding: 8,
        marginBottom: 25,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
    },
    claveLabel: {
        fontSize: 7,
        color: '#94a3b8',
        marginBottom: 2,
    },
    claveValue: {
        fontSize: 8,
        fontFamily: 'Courier',
        color: '#475569',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#0f172a',
        paddingBottom: 6,
        marginBottom: 6,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
    },
    totalSection: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    qr: {
        width: 65,
        height: 65,
    },
    totals: {
        width: 180,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    totalFinal: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#0f172a',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
        fontSize: 7,
        color: '#94a3b8',
        textAlign: 'center',
    }
});

const InvoicePDF = ({ data, qrCode }: { data: any, qrCode: string }) => (
    <Document title={`Factura-${data.consecutivo}`}>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.brand}>NOVA BILLING</Text>
                    <Text style={styles.docType}>Factura Electrónica v4.4</Text>
                </View>
                <View style={styles.invoiceMeta}>
                    <Text style={styles.invoiceId}>#{data.consecutivo || '0000'}</Text>
                    <Text style={{ marginTop: 2 }}>{new Date(data.fechaEmision).toLocaleDateString('es-CR')}</Text>
                </View>
            </View>

            {/* Info Sections */}
            <View style={styles.section}>
                <View style={styles.infoCol}>
                    <Text style={styles.sectionLabel}>Emisor</Text>
                    <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{data.emisor?.nombre}</Text>
                    <Text style={styles.infoText}>ID: {data.emisor?.identificacion}</Text>
                    <Text style={styles.infoText}>{data.emisor?.direccion}</Text>
                </View>
                <View style={styles.infoCol}>
                    <Text style={styles.sectionLabel}>Receptor</Text>
                    <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{data.receptor?.nombre}</Text>
                    <Text style={styles.infoText}>ID: {data.receptor?.identificacion}</Text>
                    {data.receptor?.correo && <Text style={styles.infoText}>{data.receptor?.correo}</Text>}
                </View>
            </View>

            {/* Clave Hacienda */}
            <View style={styles.claveBox}>
                <Text style={styles.claveLabel}>CLAVE NUMÉRICA HACIENDA</Text>
                <Text style={styles.claveValue}>{data.clave}</Text>
            </View>

            {/* Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={{ width: '60%' }}>DESCRIPCIÓN</Text>
                    <Text style={{ width: '20%', textAlign: 'right' }}>UNIDAD</Text>
                    <Text style={{ width: '20%', textAlign: 'right' }}>TOTAL</Text>
                </View>
                {data.items?.map((item: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={{ width: '60%', color: '#0f172a' }}>{item.detalle}</Text>
                        <Text style={{ width: '20%', textAlign: 'right' }}>{item.precioUnitario}</Text>
                        <Text style={{ width: '20%', textAlign: 'right' }}>{item.montoTotal}</Text>
                    </View>
                ))}
            </View>

            {/* Totals & QR */}
            <View style={styles.totalSection}>
                <Image src={qrCode} style={styles.qr} />
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text style={{ color: '#64748b' }}>Subtotal</Text>
                        <Text>{data.resumen?.totalVenta}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={{ color: '#64748b' }}>Impuestos (IVA)</Text>
                        <Text>{data.resumen?.totalImpuesto}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.totalFinal]}>
                        <Text>TOTAL</Text>
                        <Text>{data.resumen?.totalComprobante}</Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Autorizado mediante resolución DGT-R-033-2019 de la Dirección General de Tributación.
                Este documento es una representación gráfica de un comprobante electrónico.
            </Text>
        </Page>
    </Document>
);

export class PdfService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async generateInvoice(data: any): Promise<Buffer> {
        try {
            const qrUrl = `https://www.hacienda.go.cr/fe/detalle?clave=${data.clave}`;
            const qrCode = await QRCode.toDataURL(qrUrl);

            const buffer = await renderToBuffer(<InvoicePDF data={data} qrCode={qrCode} />);
            return Buffer.from(buffer);
        } catch (error) {
            console.error("[PdfService] Error interno:", error);
            throw error;
        }
    }
}
