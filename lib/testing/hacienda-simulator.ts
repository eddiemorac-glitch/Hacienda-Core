import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

let mockMode: 'success' | 'auth_fail' | 'api_fail' | 'timeout' = 'success';

// Mock IDP (Token)
app.post('/auth/realms/rut/protocol/openid-connect/token', (req: any, res: any) => {
    console.log('[SIM] Token Request Received');
    if (mockMode === 'auth_fail') {
        return res.status(401).json({ error: 'invalid_grant' });
    }
    res.json({
        access_token: 'mock_token_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        expires_in: 3600,
        refresh_expires_in: 7200
    });
});

// Mock Reception
app.post('/recepcion-sandbox/v1/recepcion', (req: any, res: any) => {
    const { clave } = req.body;
    console.log(`[SIM] Invoice Received: ${clave}`);

    if (mockMode === 'api_fail') {
        return res.status(400).json({ mensaje: 'Error de validación estructural' });
    }

    if (mockMode === 'timeout') {
        // Just let it hang
        return;
    }

    res.status(202).header('Location', `https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion/${clave}`).send();
});

// Mock Status
app.get('/recepcion-sandbox/v1/recepcion/:clave', (req: any, res: any) => {
    const { clave } = req.params;
    console.log(`[SIM] Status Check: ${clave}`);

    res.json({
        clave,
        fecha: new Date().toISOString(),
        'ind-estado': 'aceptado',
        'respuesta-xml': 'PG1vY2s+UmVzcHVlc3RhPC9tb2NrPg=='
    });
});

const PORT = 3007;
app.listen(PORT, () => {
    console.log(`🚀 Hacienda Simulator (Rigorous Test Bench) running on http://localhost:${PORT}`);
});

export const setMockMode = (mode: typeof mockMode) => { mockMode = mode; };
