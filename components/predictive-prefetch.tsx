"use client";

import { useEffect, useCallback } from "react";
import { getCabysCatalog, getClientHistory } from "@/app/dashboard/actions/predictive";

/**
 * [SENTINEL - PREDICTIVE UI]
 * Observer component that pre-loads data based on user intent (hovers).
 */

export function PredictivePrefetch() {
    const handlePrefetch = useCallback(async (type: 'catalogs' | 'clients') => {
        // Check if data is already cached in window to avoid redundant calls
        if ((window as any)._prefetch_cache?.[type]) return;

        console.log(`[PREDICTIVE] Pre-fetching ${type}...`);

        if (!(window as any)._prefetch_cache) (window as any)._prefetch_cache = {};

        try {
            if (type === 'catalogs') {
                const data = await getCabysCatalog();
                (window as any)._prefetch_cache.catalogs = data;
            } else if (type === 'clients') {
                const data = await getClientHistory();
                (window as any)._prefetch_cache.clients = data;
            }
            console.log(`[PREDICTIVE] ${type} pre-fetched successfully.`);
        } catch (e) {
            console.error(`[PREDICTIVE] Failed to pre-fetch ${type}`, e);
        }
    }, []);

    useEffect(() => {
        const observer = new MouseEvent('mouseenter'); // Just for typing reference

        const attachObservers = () => {
            // Select buttons or links that lead to invoice creation
            const newInvoiceButtons = document.querySelectorAll('a[href="/new"], button[data-prefetch="invoice"]');

            newInvoiceButtons.forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    handlePrefetch('catalogs');
                    handlePrefetch('clients');
                }, { once: true }); // Only once per session or until cleared
            });
        };

        // MutationObserver to watch for dynamic content
        const domObserver = new MutationObserver(attachObservers);
        domObserver.observe(document.body, { childList: true, subtree: true });

        attachObservers();

        return () => domObserver.disconnect();
    }, [handlePrefetch]);

    return null; // This component doesn't render anything
}
