import { TokenCache } from './token-cache';

export interface HaciendaConfig {
    username: string; // CPF-01-...
    password: string;
    environment: 'staging' | 'production' | 'simulator';
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
}

export class HaciendaClient {
    // [UPDATED] URLs correctas según documentación oficial de Hacienda
    private static readonly IDP_URLS = {
        staging: "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token",
        production: "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token",
        simulator: "http://localhost:3007/auth/realms/rut/protocol/openid-connect/token"
    };

    private static readonly API_URLS = {
        staging: "https://api-sandbox.comprobanteselectronicos.go.cr/recepcion/v1",
        production: "https://api.comprobanteselectronicos.go.cr/recepcion/v1",
        simulator: "http://localhost:3007/recepcion-sandbox/v1"
    };

    private config: HaciendaConfig;
    private static authLocks: Map<string, Promise<TokenResponse>> = new Map();

    constructor(config: HaciendaConfig) {
        this.config = config;
    }

    /**
     * Obtiene el token de acceso (OAuth2 Password Grant) con Cache Inteligente
     * [CRYPTO SHIELD] Implementa Mutex para evitar race conditions concurrentes.
     */
    async getToken(): Promise<TokenResponse> {
        // 1. Check Cache First
        const cached = TokenCache.get(this.config.username);
        if (cached && this.config.environment !== 'simulator') {
            return { access_token: cached, refresh_token: '', expires_in: 0, refresh_expires_in: 0 };
        }

        // 2. Manage Concurrency (Mutex)
        // Si ya hay una solicitud en curso para este usuario, esperamos a la misma promesa
        const existingLock = HaciendaClient.authLocks.get(this.config.username);
        if (existingLock) {
            console.log(`[SWARM] Re-utilizando promesa de autenticación en curso para: ${this.config.username}`);
            return existingLock;
        }

        // 3. Perform Auth and save promise in map
        const authPromise = this.performAuth();
        HaciendaClient.authLocks.set(this.config.username, authPromise);

        try {
            const result = await authPromise;
            return result;
        } finally {
            // Limpiar el lock al terminar (éxito o error)
            HaciendaClient.authLocks.delete(this.config.username);
        }
    }

    private async performAuth(): Promise<TokenResponse> {

        const idpUrl = HaciendaClient.IDP_URLS[this.config.environment];
        const clientId = this.config.environment === 'production' ? 'api-prod' : 'api-stag';

        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('grant_type', 'password');
        params.append('username', this.config.username);
        params.append('password', this.config.password);

        try {
            const res = await fetch(idpUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!res.ok) {
                throw new Error(`AUTH_FAILED: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();

            // [SWARM OPTIMIZATION] Save to Cache
            TokenCache.set(this.config.username, data.access_token, data.expires_in);

            return data;
        } catch (error: any) {
            throw new Error(`HACIENDA_AUTH_ERROR: ${error.message}`);
        }
    }

    /**
     * Renueva el token usando el refresh_token
     */
    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        const clientId = this.config.environment === 'production' ? 'api-prod' : 'api-stag';

        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);

        const idpUrl = HaciendaClient.IDP_URLS[this.config.environment];
        const res = await fetch(idpUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!res.ok) throw new Error('REFRESH_TOKEN_FAILED');
        return await res.json();
    }

    /**
     * Envía el XML firmado a Hacienda.
     * @param xmlSigned XML completo firmado (string)
     * @param token Access Token válido
     */
    async sendInvoice(xmlSigned: string, token: string, clave: string, emisorId: string, receptorId?: string) {
        const baseUrl = HaciendaClient.API_URLS[this.config.environment];

        // [FIX] Determinar tipo de identificación por longitud de cédula
        // 9 dígitos = Física (01), 10 dígitos = Jurídica (02), 11-12 dígitos = DIMEX (03)
        const getTipoId = (id: string): string => {
            const digits = id.replace(/\D/g, ''); // Solo dígitos
            if (digits.length === 9) return '01'; // Física
            if (digits.length === 10) return '02'; // Jurídica
            if (digits.length >= 11 && digits.length <= 12) return '03'; // DIMEX
            return '01'; // Default física
        };

        // Payload JSON específico de la API v1
        const payload = {
            clave: clave,
            fecha: this.getIsoDate(),
            emisor: {
                tipoIdentificacion: getTipoId(emisorId),
                numeroIdentificacion: emisorId.replace(/\D/g, '') // Solo dígitos
            },
            // Receptor es opcional en el JSON payload, pero obligatorio si está en el XML
            ...(receptorId && {
                receptor: {
                    tipoIdentificacion: getTipoId(receptorId),
                    numeroIdentificacion: receptorId.replace(/\D/g, '') // Solo dígitos
                }
            }),
            comprobanteXml: Buffer.from(xmlSigned).toString('base64')
        };

        try {
            const res = await fetch(`${baseUrl}/recepcion`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.status === 401) {
                throw new Error('TOKEN_EXPIRED'); // El manejador superior debe llamar a refreshToken
            }

            // Hacienda retorna 202 Accepted si entró a cola
            if (res.status === 202) {
                return { status: 'enviado', location: res.headers.get('Location') }; // location headers tiene la URL de consulta
            }

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`API_ERROR: ${res.status} - ${errorBody}`);
            }

            return await res.json(); // Fallback
        } catch (error: any) {
            if (error.message === 'TOKEN_EXPIRED') throw error;
            throw new Error(`SEND_ERROR: ${error.message}`);
        }
    }

    /**
     * Consulta el estado de un documento enviado a Hacienda.
     * @param clave Clave de 50 dígitos del documento
     * @param token Access Token válido
     */
    async getStatus(clave: string, token: string) {
        const baseUrl = HaciendaClient.API_URLS[this.config.environment];

        try {
            const res = await fetch(`${baseUrl}/recepcion/${clave}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 401) {
                throw new Error('TOKEN_EXPIRED');
            }

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`API_STATUS_ERROR: ${res.status} - ${errorBody}`);
            }

            return await res.json();
        } catch (error: any) {
            if (error.message === 'TOKEN_EXPIRED') throw error;
            throw new Error(`STATUS_CHECK_ERROR: ${error.message}`);
        }
    }

    private getIsoDate(): string {
        // [FIX] Robusto: Siempre obtiene la hora actual en UTC y ajusta a CR (UTC-6)
        // sin importar la zona horaria del servidor.
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const crDate = new Date(utc + (3600000 * -6));

        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${crDate.getFullYear()}-${pad(crDate.getMonth() + 1)}-${pad(crDate.getDate())}T${pad(crDate.getHours())}:${pad(crDate.getMinutes())}:${pad(crDate.getSeconds())}-06:00`;
    }
}
