export interface CabysItem {
    codigo: string;
    descripcion: string;
    impuesto: number; // 0.13, 0.02, etc.
}

// Mock Data - En producción esto vendría de una DB PostgreSQL indexada con Trigrams
export const CABYS_MOCK: CabysItem[] = [
    { codigo: "1234567890123", descripcion: "Servicios de consultoría en tecnología de la información", impuesto: 0.13 },
    { codigo: "8314100000000", descripcion: "Servicios de desarrollo de software y aplicaciones", impuesto: 0.13 },
    { codigo: "6423000000000", descripcion: "Servicios bancarios y facturación", impuesto: 0.13 },
    { codigo: "0111100000000", descripcion: "Cultivo de cereales (excepto arroz), legumbres y semillas", impuesto: 0.01 },
    { codigo: "5322100000000", descripcion: "Servicios de mensajería y entrega de paquetes", impuesto: 0.13 },
    { codigo: "8311100000100", descripcion: "Servicios de consultoría empresarial y gestión", impuesto: 0.13 },
    { codigo: "4610100000101", descripcion: "Comercio al por mayor de productos alimenticios", impuesto: 0.13 },
    { codigo: "5610100000000", descripcion: "Servicios de restaurantes y cafeterías", impuesto: 0.13 },
    { codigo: "4711100000000", descripcion: "Venta al por menor en supermercados", impuesto: 0.13 },
    { codigo: "6201000000000", descripcion: "Servicios de programación informática", impuesto: 0.13 },
    { codigo: "7110100000000", descripcion: "Servicios de arquitectura e ingeniería", impuesto: 0.13 },
    { codigo: "6920100000000", descripcion: "Servicios de contabilidad y auditoría", impuesto: 0.13 },
    { codigo: "8559000000000", descripcion: "Servicios de educación y capacitación", impuesto: 0.13 },
    { codigo: "8621000000000", descripcion: "Servicios médicos y de salud", impuesto: 0.04 },
    { codigo: "9609000000000", descripcion: "Servicios personales diversos", impuesto: 0.13 },
    { codigo: "4520100000000", descripcion: "Servicios de mantenimiento y reparación de vehículos", impuesto: 0.13 },
    { codigo: "4330100000000", descripcion: "Servicios de acabado de edificios", impuesto: 0.13 },
    { codigo: "7311000000000", descripcion: "Servicios de publicidad y marketing", impuesto: 0.13 },
    { codigo: "6311000000000", descripcion: "Servicios de procesamiento de datos y hosting", impuesto: 0.13 },
    { codigo: "7410000000000", descripcion: "Servicios de diseño gráfico y visual", impuesto: 0.13 },
];

export async function searchCabys(query: string): Promise<CabysItem[]> {
    // Simulando latencia de red
    await new Promise(resolve => setTimeout(resolve, 300));

    const lowerQuery = query.toLowerCase();
    return CABYS_MOCK.filter(item =>
        item.descripcion.toLowerCase().includes(lowerQuery) ||
        item.codigo.includes(lowerQuery)
    );
}
