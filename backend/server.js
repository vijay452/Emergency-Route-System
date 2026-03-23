require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const { applySecurity } = require('./middleware/security');
const { optionalAuth } = require('./middleware/auth');
const { initDataStore } = require('./services/dataStore');
const realtime = require('./services/realtimeService');

const routeRouter = require('./routes/route');
const authRouter = require('./routes/auth');
const opsRouter = require('./routes/ops');
const opsController = require('./controllers/opsController');

const BASE_PORT = Number(process.env.PORT || 3000);

function createApp() {
    const app = express();

    app.use(cors());
    app.use(bodyParser.json({ limit: '2mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(optionalAuth);
    applySecurity(app);

    app.use(express.static(path.join(__dirname, '../frontend')));

    app.use('/api', routeRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/ops', opsRouter);
    app.get('/api/live-traffic', opsController.liveTraffic);
    app.get('/api/weather', opsController.weatherAt);

    app.get('/health', (_req, res) => {
        res.json({
            status: 'OK',
            service: 'Emergency Route System',
            realtime: true,
            timestamp: new Date().toISOString()
        });
    });

    app.get('/', (_req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });

    app.use((err, _req, res, _next) => {
        console.error('Unhandled application error:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    });

    app.use((_req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    return app;
}

function startHttpServer(app, preferredPort, maxRetries = 10) {
    return new Promise((resolve, reject) => {
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        realtime.initializeRealtime(io);

        let attempts = 0;

        const tryListen = (port) => {
            server.once('error', (error) => {
                if (error.code === 'EADDRINUSE' && attempts < maxRetries) {
                    attempts += 1;
                    const nextPort = port + 1;
                    console.warn(`Port ${port} busy, retrying on ${nextPort}...`);
                    setTimeout(() => tryListen(nextPort), 100);
                    return;
                }

                reject(error);
            });

            server.listen(port, () => {
                resolve({ server, io, port });
            });
        };

        tryListen(preferredPort);
    });
}

async function startServer() {
    await initDataStore();

    const app = createApp();
    const { port } = await startHttpServer(app, BASE_PORT);

    console.log('\nEmergency Route System Server');
    console.log('--------------------------------');
    console.log(`HTTP   : http://localhost:${port}`);
    console.log(`API    : http://localhost:${port}/api`);
    console.log(`Health : http://localhost:${port}/health`);
    console.log(`Socket : ws://localhost:${port}`);
    console.log('--------------------------------\n');

    return { app, port };
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error('Server failed to start:', error.message);
        process.exit(1);
    });
}

module.exports = {
    createApp,
    startServer
};
