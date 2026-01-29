const { Client } = require('pg');

const connectionString = 'postgresql://postgres.pijhzcxpiowwtjvgxcbp:yDRgfg2ggET9ArPM@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect()
    .then(() => {
        console.log('✅ ¡CONEXIÓN EXITOSA! El problema es de Prisma.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ FALLO DE CONEXIÓN REAL:', err.message);
        process.exit(1);
    });
