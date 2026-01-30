"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Layers,
  Activity,
  ChevronRight,
  Loader2,
  BookOpen,
  FileUp,
  Sparkles,
  BellRing,
  MousePointer2,
  Award,
  ZapIcon,
  Crown,
  Gem,
  Rocket
} from "lucide-react";
import { PLANS } from "@/lib/stripe-config";
import { useFrontendSwarm } from "@/hooks/use-swarm";
import { createCheckoutSession } from "./stripe-actions";

/**
 * [SWARM - LANDING PAGE REFACTOR]
 * Optimized for high-interactivity and zero hydration mismatch.
 */

export default function LandingPage() {
  const { session, isHydrated, status } = useFrontendSwarm();

  // Show a base shell while hydrating to prevent "jumpy" UI
  if (!isHydrated) {
    return <div className="min-h-screen bg-[#020617]" />;
  }

  return (
    <div className="flex-1 flex flex-col items-center bg-[#020617] relative overflow-hidden">

      {/* Background Ambience - Richer Emerald & Indigo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute top-[10%] right-[-10%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[130px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-primary/5 rounded-full blur-[180px]" />
      </div>

      {/* Floating Header */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-[100] glass-card px-8 py-4 rounded-3xl border border-white/5 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center p-1">
            <img src="/logo-hacienda-core.svg" alt="HC" className="w-full h-full" />
          </div>
          <span className="font-black text-xl text-white tracking-tighter">HaciendaCore</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="#pricing" className="text-xs font-bold text-slate-400 hover:text-white transition-colors hidden md:block">PLANES</Link>
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : session ? (
            <Link href="/dashboard" className="px-5 py-2.5 bg-white text-slate-950 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all">
              REGRESAR AL DASHBOARD
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-5 py-2.5 text-white font-bold text-xs hover:text-primary transition-colors">LOGIN</Link>
              <Link href="/register" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all">
                REGISTRO
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 animate-pulse-soft"
        >
          <Activity className="w-3 h-3" />
          Protocolo Nova v4.4 • Online
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-9xl font-black tracking-tighter text-white mb-8 leading-[0.85] italic uppercase"
        >
          FACTURA SIN <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-400">
            ESTRÉS.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-300 text-xl md:text-2xl max-w-3xl mb-12 font-medium leading-relaxed"
        >
          Sentinel se encarga de Hacienda por usted. Disfrute de la tranquilidad de un sistema que <span className="text-white border-b-2 border-emerald-500/50">simplifica su día</span> y le acompaña en cada paso de su gran proyecto.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href={session ? "/dashboard" : "/register"} className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-[0_20px_50px_-10px_rgba(59,130,246,0.5)] flex items-center justify-center gap-3 active:scale-95 group relative overflow-hidden">
            <span className="relative z-10">{session ? "Ir al Dashboard" : "COMENZAR GRATIS"}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </Link>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <Link href="/dashboard/guide" className="relative px-8 py-4 bg-slate-950 border border-white/10 text-white rounded-2xl font-black text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <span className="relative z-10 flex items-center gap-3">
                APRENDE A FACTURAR
                <BookOpen className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Proof of Value Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-4"
        >
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sin Tarjeta</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 50 Facturas Gratis / Mes</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cancelar en cualquier momento</span>
        </motion.p>
      </section>

      {/* NEW: Ruta de la Simplicidad (3 Easy Steps) */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter"
          >
            Ruta de la <span className="text-emerald-400">Simplicidad</span>
          </motion.h2>
          <p className="text-slate-500 font-medium mt-4">Facture en menos de lo que tarda en tomarse un café.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />

          <StepCard
            number="1"
            icon={<FileUp className="w-8 h-8 text-primary" />}
            title="Sube tu Firma"
            description="Sentinel valida tus credenciales de Hacienda al instante. Sin configuraciones complicadas."
          />
          <StepCard
            number="2"
            icon={<Sparkles className="w-8 h-8 text-emerald-400" />}
            title="Escribe y Listo"
            description="El Buscador de CAByS inteligente encuentra el código legal por ti mientras escribes."
          />
          <StepCard
            number="3"
            icon={<BellRing className="w-8 h-8 text-indigo-400" />}
            title="Envía y Cobra"
            description="Sentinel envía la factura y te recuerda cobrar cuando se acerque el vencimiento."
          />
        </div>
      </section>

      {/* NEW: Tus Superpoderes con Sentinel (Value Cards) */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto w-full bg-white/[0.02] rounded-[3rem] border border-white/5 my-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />

        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
            Tus <span className="text-primary italic">Superpoderes</span> Digitales
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-12 pb-12">
          <ValueCard
            icon={<MousePointer2 className="w-6 h-6" />}
            title="CAByS Mágico"
            text="Olvídate de buscar en listas interminables. Solo escribe 'Café' o 'Software' y nosotros hacemos el resto."
          />
          <ValueCard
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Escudo Legal 4.4"
            text="Cumplimiento total con Hacienda v4.4 sin que tengas que leer una sola página del manual."
          />
          <ValueCard
            icon={<Award className="w-6 h-6" />}
            title="Guardián de Pagos (REP)"
            text="¿Vendes a crédito? Sentinel te alerta para emitir el recibo de pago y evitar multas."
          />
          <ValueCard
            icon={<ZapIcon className="w-6 h-6" />}
            title="Multiproceso Alpha"
            text="Firma y envía ráfagas de facturas en milisegundos gracias a nuestra arquitectura Swarm."
          />
          <ValueCard
            icon={<Globe className="w-6 h-6" />}
            title="Caja de Seguridad (The Vault)"
            text="Tus llaves y PIN nunca tocan el disco. Procesamiento ultra-seguro en memoria volátil."
          />
          <ValueCard
            icon={<CheckCircle2 className="w-6 h-6" />}
            title="Start-Free"
            text="Empieza hoy mismo con 50 facturas de regalo cada mes. Sin tarjetas, sin compromisos."
          />
        </div>
      </section>



      {/* Plans Section */}
      <section id="pricing" className="relative py-24 px-6 max-w-7xl mx-auto w-full text-center">
        <div className="mb-20">
          <h2 className="text-3xl md:text-6xl font-black text-white italic uppercase tracking-tighter">Elija su <span className="text-primary">Nivel</span></h2>
          <p className="text-slate-500 font-medium mt-4">Planes diseñados para crecer con su gran proyecto.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard
            name="Starter"
            price="25,000"
            period="/ mes + IVA"
            icon={<Rocket className="w-6 h-6" />}
            color="from-blue-500 to-cyan-400"
            features={["Hasta 50 Facturas / mes", "Puesta en marcha asistida", "Soporte Amigable por email", "Dashboard en tiempo real"]}
            priceId={PLANS.STARTER.priceId}
          />
          <PricingCard
            name="Business"
            featured
            price="55,000"
            period="/ mes + IVA"
            icon={<Crown className="w-6 h-6" />}
            color="from-primary to-indigo-600"
            features={["Facturación Ilimitada", "The Vault Security (Security)", "Soporte Prioritario 24/7", "REP & FEC Pro", "Sincronización Swarm"]}
            priceId={PLANS.BUSINESS.priceId}
          />
          <PricingCard
            name="Enterprise"
            price="95,000"
            period="/ mes + IVA"
            icon={<Gem className="w-6 h-6" />}
            color="from-amber-400 to-orange-500"
            features={["Acceso a API Robusta", "Acompañamiento Tributario", "Control Multi-Empresa", "SLA Personalizado", "On-Premise Vault"]}
            priceId={PLANS.ENTERPRISE.priceId}
          />
        </div>
      </section>

      {/* Footer Commercial */}
      <footer className="w-full border-t border-white/5 py-12 px-8 bg-slate-950/50 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center p-1">
              <img src="/logo-hacienda-core.svg" alt="HC" className="w-full h-full" />
            </div>
            <span className="font-bold text-lg tracking-tight">HaciendaCore</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 HaciendaCore. El motor de la nueva economía digital de Costa Rica.</p>
          <div className="flex gap-6 text-xs text-slate-400 font-medium">
            <Link href="/legal/terms" className="hover:text-primary transition-colors">Términos</Link>
            <Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
            <a href="#" className="hover:text-primary transition-colors">DGT Spec</a>
          </div>
        </div>
      </footer>

    </div >
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card p-8 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col gap-4 group"
    >
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepCard({ number, icon, title, description }: { number: string, icon: any, title: string, description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center text-center space-y-6 group"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white/10 transition-all duration-500 group-hover:scale-110 shadow-xl">
          {icon}
        </div>
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white font-black flex items-center justify-center shadow-lg border-2 border-[#020617]">
          {number}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">{description}</p>
      </div>
    </motion.div>
  );
}

function ValueCard({ icon, title, text }: { icon: any, title: string, text: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all space-y-4 group"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-lg font-black text-white italic uppercase">{title}</h4>
      <p className="text-slate-500 text-xs leading-relaxed font-medium">{text}</p>
    </motion.div>
  );
}


function PricingCard({
  name,
  price,
  period,
  features,
  featured,
  priceId,
  icon,
  color
}: {
  name: string,
  price: string,
  period: string,
  features: string[],
  featured?: boolean,
  priceId?: string,
  icon: any,
  color: string
}) {
  const { session } = useFrontendSwarm();
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    if (!session) {
      window.location.href = `/register?plan=${name.toLowerCase()}`;
      return;
    }

    // [HYBRID PAYMENT SYNC] Redirigir al checkout manual de SINPE
    window.location.href = `/dashboard/billing/checkout?plan=${name.toUpperCase()}`;
  };

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className={`relative p-10 rounded-[2.5rem] flex flex-col gap-8 transition-all overflow-hidden h-full group ${featured ? 'bg-primary/5 border-2 border-primary shadow-[0_30px_60px_-15px_rgba(59,130,246,0.3)]' : 'bg-white/[0.03] border border-white/5 shadow-2xl'}`}
    >
      {featured && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 py-2 px-8 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-b-2xl shadow-lg">
          Recomendado
        </div>
      )}

      <div className="text-left space-y-6">
        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div>
          <h4 className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2 font-mono tracking-tighter">{name}</h4>
          <h2 className="text-5xl font-black text-white italic tracking-tighter">
            <span className="text-2xl align-top mr-1 font-bold text-slate-500">¢</span>
            {price}
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">{period}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-5 text-left flex-1 border-t border-white/5 pt-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-300">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${featured ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-500'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={handleSelect}
        disabled={loading || (session?.user as any)?.plan === name.toUpperCase()}
        className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${(session?.user as any)?.plan === name.toUpperCase()
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : featured
            ? 'bg-primary text-white shadow-xl hover:shadow-primary/40 hover:scale-[1.03] active:scale-95'
            : 'bg-white/5 text-white hover:bg-white/10 hover:text-white border border-white/10'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {(session?.user as any)?.plan === name.toUpperCase() ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Plan Actual
          </>
        ) : (
          <>
            Elegir {name}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </motion.div>
  );
}
