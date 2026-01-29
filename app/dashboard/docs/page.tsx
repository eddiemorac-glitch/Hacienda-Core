"use client";

import { motion } from "framer-motion";
import {
    Book,
    Code2,
    Terminal,
    ShieldCheck,
    Zap,
    MessageSquare,
    Copy,
    Check,
    ArrowRight,
    Cpu,
    Webhook,
    ShieldAlert
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function DocsPage() {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const curlExample = `curl -X POST https://haciendacore.com/api/v1/documents \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "FE",
    "docData": {
      "emisor": { "nombre": "Empresa S.A.", "numeroIdentificacion": "3101XXXXXX" },
      "receptor": { "nombre": "Cliente Final", "numeroIdentificacion": "11234XXXXX" },
      "resumen": { "totalVenta": 1000, "totalImpuesto": 130, "totalComprobante": 1130 }
    }
  }'`;

    const nodeExample = `const response = await fetch('https://haciendacore.com/api/v1/documents', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'FE',
    docData: { /* ... */ }
  })
});

const result = await response.json();`;

    return (
        <div className="flex min-h-screen flex-col items-center p-8 sm:p-20 relative overflow-hidden bg-[#020617]">
            <main className="flex flex-col gap-12 w-full max-w-5xl z-10">
                {/* Header Section */}
                <header className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Book className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Developer Docs</h1>
                    </div>
                    <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                        Integre la facturación electrónica más avanzada de Costa Rica en minutos.
                        Nuestra API v4.4 maneja toda la complejidad criptográfica y legal por usted.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Navigation Sidebar (Local) */}
                    <div className="hidden lg:block space-y-4 sticky top-8 h-fit">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Comenzando</h4>
                        <nav className="flex flex-col gap-1">
                            <DocNavLink label="Introducción" href="#intro" />
                            <DocNavLink label="Autenticación" href="#auth" />
                            <DocNavLink label="Endpoints" href="#endpoints" />
                            <DocNavLink label="Webhooks" href="#webhooks" />
                            <DocNavLink label="Errores" href="#errors" />
                        </nav>
                    </div>

                    {/* Content Section */}
                    <div className="lg:col-span-3 space-y-16">
                        {/* Intro Section */}
                        <section id="intro" className="space-y-6 scroll-mt-20">
                            <div className="flex items-center gap-3 text-white">
                                <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                                <h2 className="text-2xl font-bold tracking-tight">Inicio Rápido</h2>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                La API de HaciendaCore permite a cualquier software (ERP, E-commerce, Mobile App) emitir Facturas, Notas de Crédito y Tiquetes Electrónicos cumpliendo con el **Anexo 4.4 de la DGT**.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DocStep num="1" title="Obtenga su API Key" desc="Genere una llave de acceso desde el panel de API Monetization." color="bg-blue-500" />
                                <DocStep num="2" title="Configure Identidad" desc="Suba su llave criptográfica .p12 en los ajustes de organización." color="bg-indigo-500" />
                            </div>
                        </section>

                        {/* Authentication */}
                        <section id="auth" className="space-y-6 scroll-mt-20">
                            <div className="flex items-center gap-3 text-white pt-8 border-t border-white/5">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <h2 className="text-2xl font-bold tracking-tight">Autenticación</h2>
                            </div>
                            <p className="text-slate-400">
                                Todas las peticiones deben incluir la cabecera <code className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">x-api-key</code>.
                            </p>
                            <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 font-mono text-sm text-slate-300">
                                x-api-key: hc_0923_a1b2c3d4e5...
                            </div>
                        </section>

                        {/* Main Endpoint */}
                        <section id="endpoints" className="space-y-6 scroll-mt-20">
                            <div className="flex items-center gap-3 text-white pt-8 border-t border-white/5">
                                <Terminal className="w-5 h-5 text-primary" />
                                <h2 className="text-2xl font-bold tracking-tight">Emitir Documento</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">POST</span>
                                <code className="text-slate-300">/api/v1/documents</code>
                            </div>

                            <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
                                <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CURL Example</span>
                                    <button
                                        onClick={() => copyToClipboard(curlExample, 'curl')}
                                        className="text-slate-500 hover:text-white transition-colors"
                                    >
                                        {copied === 'curl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <pre className="p-6 text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-black/40">
                                    {curlExample}
                                </pre>
                            </div>
                        </section>

                        {/* Webhooks Section */}
                        <section id="webhooks" className="space-y-6 pt-8 border-t border-white/5 scroll-mt-20">
                            <div className="flex items-center gap-3 text-white">
                                <Webhook className="w-5 h-5 text-purple-400" />
                                <h2 className="text-2xl font-bold tracking-tight">Webhooks (Notificaciones)</h2>
                            </div>
                            <p className="text-slate-400">
                                Configure una URL en su Dashboard para recibir notificaciones `POST` en tiempo real cuando el estado de un documento cambie.
                            </p>
                            <div className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-slate-900/40 p-6">
                                <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-4">Estructura del Payload</h4>
                                <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
                                    {`{
  "event": "document.status_changed",
  "data": {
    "clave": "506250126003101...",
    "status": "ACEPTADO",
    "timestamp": "2026-01-25T16:45:00Z"
  }
}`}
                                </pre>
                            </div>
                        </section>

                        {/* Errors Section */}
                        <section id="errors" className="space-y-6 pt-8 border-t border-white/5 scroll-mt-20">
                            <div className="flex items-center gap-3 text-white">
                                <ShieldAlert className="w-5 h-5 text-red-400" />
                                <h2 className="text-2xl font-bold tracking-tight">Resolución de Errores</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <ErrorCard code="403" title="Credential Conflict" desc="La Cédula no coincide con el certificado .p12." />
                                <ErrorCard code="VAL-001" title="CAByS Inválido" desc="El código de producto no existe en el catálogo nacional." />
                                <ErrorCard code="REC-002" title="Error de Firma" desc="El PIN de la llave criptográfica es incorrecto." />
                            </div>
                        </section>

                        {/* Support Section */}
                        <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600/20 to-primary/20 border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <Cpu className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex flex-col gap-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    ¿Necesitas ayuda con la integración?
                                </h3>
                                <p className="text-slate-400 max-w-lg">
                                    Nuestro equipo de ingeniería está disponible para revisiones de arquitectura y depuración de XMLs personalizados.
                                </p>
                                <button className="w-fit mt-4 px-6 py-3 bg-white text-slate-950 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-all">
                                    Contactar Soporte Técnico
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ErrorCard({ code, title, desc }: { code: string, title: string, desc: string }) {
    return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-4 items-center group hover:border-red-500/20 transition-all">
            <div className="px-3 py-1 rounded-md bg-red-500/10 text-red-400 font-mono text-xs font-bold border border-red-500/10">
                {code}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm">{title}</h4>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>
    );
}

function DocNavLink({ label, href, active }: { label: string, href: string, active?: boolean }) {
    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
            {label}
        </Link>
    );
}

function DocStep({ num, title, desc, color }: { num: string, title: string, desc: string, color: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-start group hover:border-white/10 transition-all">
            <div className={`w-8 h-8 rounded-lg ${color} text-white flex items-center justify-center font-black text-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {num}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
