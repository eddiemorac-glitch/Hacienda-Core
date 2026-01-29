"use client";

import { useState, useEffect } from "react";
import { Search, Check } from "lucide-react";
import { searchCabys, CabysItem } from "@/lib/hacienda/cabys-data";
import { motion, AnimatePresence } from "framer-motion";

interface CabysSearchProps {
    onSelect: (item: CabysItem) => void;
}

export function CabysSearch({ onSelect }: CabysSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CabysItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length >= 1) {
                setIsLoading(true);
                // [PREDICTIVE OPTIMIZATION] Check global cache first
                const cached = (window as any)._prefetch_cache?.catalogs;

                // Simular un pequeño delay para feedback visual si es muy rápido
                await new Promise(r => setTimeout(r, 300));

                if (cached) {
                    const lowerQuery = query.toLowerCase();
                    const filtered = cached.filter((item: CabysItem) =>
                        item.descripcion.toLowerCase().includes(lowerQuery) ||
                        item.codigo.includes(lowerQuery)
                    );
                    setResults(filtered.slice(0, 10)); // Limitar resultados para performance
                } else {
                    const data = await searchCabys(query);
                    setResults(data);
                }
                setIsOpen(true);
                setIsLoading(false);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 400); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    // Función para limpiar la búsqueda
    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div className="relative group/search w-full">
            <div className={`relative flex items-center bg-black/40 border transition-all duration-300 rounded-xl overflow-hidden
                ${isOpen ? 'border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.1)] ring-1 ring-primary/20' : 'border-white/5 hover:border-white/10'}`}>

                <div className="pl-4 text-slate-500 group-focus-within/search:text-primary transition-colors">
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>

                <input
                    type="text"
                    placeholder="Buscar producto o servicio..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 1 && setIsOpen(true)}
                    className="w-full bg-transparent border-none pl-3 pr-10 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-0 outline-none font-medium"
                />

                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-[#080C17] border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl ring-1 ring-white/5"
                    >
                        <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {isLoading ? (
                                <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-3">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Consultando Catálogo...</span>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="p-2">
                                    <div className="px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black border-b border-white/5 mb-2 flex justify-between items-center">
                                        <span>Catálogo Nacional CAByS</span>
                                        <span className="text-primary">{results.length} coincidencias</span>
                                    </div>
                                    {results.map((item) => (
                                        <button
                                            key={item.codigo}
                                            onClick={() => {
                                                onSelect(item);
                                                setQuery(item.descripcion);
                                                setIsOpen(false);
                                            }}
                                            className="w-full text-left p-4 hover:bg-primary/10 rounded-xl transition-all flex items-start gap-4 group border border-transparent hover:border-primary/20 mb-1"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <span className="font-mono text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">{item.codigo}</span>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${item.impuesto > 0 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-slate-400 bg-white/5 border-white/5'
                                                        }`}>
                                                        IVA {(item.impuesto * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-200 font-bold leading-snug group-hover:text-white transition-colors">
                                                    {item.descripcion}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center space-y-2">
                                    <p className="text-sm font-bold text-slate-300">No se encontraron resultados</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Intente con palabras clave más generales</p>
                                </div>
                            )}
                        </div>
                        {results.length > 0 && !isLoading && (
                            <div className="bg-white/5 px-4 py-2 text-[10px] text-slate-500 text-center border-t border-white/5">
                                Mostrando top resultados más relevantes
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay transparente para cerrar al hacer click fuera */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
