import InvoiceForm from '@/components/invoice-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewInvoicePage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1e] to-black text-white p-6 relative">

            <header className="max-w-4xl mx-auto flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Nueva Factura Electrónica
                    </h1>
                    <p className="text-sm text-muted-foreground">Emisión v4.4 • Conexión Segura</p>
                </div>
            </header>

            <main>
                <InvoiceForm />
            </main>

        </div>
    );
}
