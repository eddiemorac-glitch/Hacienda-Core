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
  Loader2
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

      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none opacity-50">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Floating Header */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-[100] glass-card px-8 py-4 rounded-3xl border border-white/5 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
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
          className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-[0.9]"
        >
          EL FUTURO DE LA <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
            FACTURACIÓN
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 font-medium"
        >
          HaciendaCore es el motor de facturación más avanzado de Costa Rica.
          Arquitectura Swarm, cumplimiento DGT v4.4 y seguridad de grado militar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href={session ? "/dashboard" : "/register"} className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 active:scale-95 group">
            {session ? "Ir al Dashboard" : "Comenzar Ahora"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3">
            Explorar API
            <Zap className="w-5 h-5 text-amber-400" />
          </button>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<ShieldCheck className="text-emerald-400" />}
            title="Cumplimiento Estricto"
            description="Adaptado al Master Spec v4.4 de Hacienda. Soporte nativo para REP y FEC."
          />
          <FeatureCard
            icon={<Lock className="text-blue-400" />}
            title="The Vault (Security)"
            description="Tus llaves criptográficas nunca tocan el disco. Procesamiento en memoria volátil de alta seguridad."
          />
          <FeatureCard
            icon={<Cpu className="text-indigo-400" />}
            title="Swarm Intelligence"
            description="Algoritmos de reintento inteligente y cola de contingencia local para operación 24/7 sin conexión."
          />
        </div>
      </section>

      {/* Plans Section */}
      <section id="pricing" className="relative py-20 px-6 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-3xl md:text-5xl font-black mb-16 underline decoration-primary decoration-4 underline-offset-8">Elija su Plan</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard
            name="Starter"
            price="¢25,000"
            period="/mes"
            features={["50 Documentos/mes", "Firma XAdES-EPES", "Soporte Standard", "Dashboard Básico"]}
            priceId={PLANS.STARTER.priceId}
          />
          <PricingCard
            name="Business"
            featured
            price="¢55,000"
            period="/mes"
            features={["Documentos Ilimitados", "The Vault Security", "Soporte 24/7", "REP & FEC Full", "API Access"]}
            priceId={PLANS.BUSINESS.priceId}
          />
          <PricingCard
            name="Enterprise"
            price="¢95,000"
            period="/mes"
            features={["Multi-Tenant Admin", "White Label", "VPC Deployment", "SLA Personalizado", "On-Premise Vault"]}
            priceId={PLANS.ENTERPRISE.priceId}
          />
        </div>
      </section>

      {/* Footer Commercial */}
      <footer className="w-full border-t border-white/5 py-12 px-8 bg-slate-950/50 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
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

    </div>
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


function PricingCard({
  name,
  price,
  period,
  features,
  featured,
  priceId
}: {
  name: string,
  price: string,
  period: string,
  features: string[],
  featured?: boolean,
  priceId?: string
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
      whileHover={{ scale: 1.02 }}
      className={`relative p-8 rounded-[2.5rem] flex flex-col gap-8 transition-all overflow-hidden ${featured ? 'bg-primary/10 border-2 border-primary shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)]' : 'bg-slate-900/40 border border-white/5'}`}
    >
      {featured && (
        <div className="absolute top-0 right-0 py-2 px-6 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
          RECOMENDADO
        </div>
      )}
      <div className="text-left">
        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{name}</h4>
        <h2 className="text-4xl font-black text-white">{price}<span className="text-lg text-slate-500 font-medium">{period}</span></h2>
      </div>
      <ul className="flex flex-col gap-4 text-left flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
            <CheckCircle2 className={`w-4 h-4 ${featured ? 'text-primary' : 'text-slate-500'}`} />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={handleSelect}
        disabled={loading || (session?.user as any)?.plan === name.toUpperCase()}
        className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${(session?.user as any)?.plan === name.toUpperCase()
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : featured
              ? 'bg-primary text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]'
              : 'bg-white/5 text-white hover:bg-white/10'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {(session?.user as any)?.plan === name.toUpperCase() ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Plan Actual
          </>
        ) : (
          priceId ? 'SELECCIONAR PLAN' : 'CONTACTAR VENTAS'
        )}
      </button>
    </motion.div>
  );
}
