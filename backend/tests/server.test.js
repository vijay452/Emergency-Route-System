const request = require('supertest');
const { createApp } = require('../server');
const { initDataStore } = require('../services/dataStore');

describe('Emergency Route Backend', () => {
    let app;
    let token;

    beforeAll(async () => {
        await initDataStore();
        app = createApp();
    });

    test('GET /health returns service metadata', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('OK');
    });

    test('POST /api/auth/login issues token', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });

        expect(response.statusCode).toBe(200);
        expect(typeof response.body.token).toBe('string');
        token = response.body.token;
    });

    test('POST /api/route calculates route with weather payload', async () => {
        const response = await request(app)
            .post('/api/route')
            .send({
                start: 'ISBT Dehradun',
                end: 'Clock Tower Dehradun',
                emergency_type: 'ambulance'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.start).toBe('ISBT Dehradun');
        expect(response.body.end).toBe('Clock Tower Dehradun');
        expect(response.body.weather).toBeDefined();
    });

    test('POST /api/route supports A* algorithm selection', async () => {
        const response = await request(app)
            .post('/api/route')
            .send({
                start: 'ISBT Dehradun',
                end: 'Clock Tower Dehradun',
                emergency_type: 'ambulance',
                algorithm: 'astar'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.algorithmUsed).toBe('astar');
        expect(Array.isArray(response.body.algorithmOptions)).toBe(true);
    });

    test('POST /api/route supports Bellman-Ford algorithm selection', async () => {
        const response = await request(app)
            .post('/api/route')
            .send({
                start: 'ISBT Dehradun',
                end: 'Clock Tower Dehradun',
                emergency_type: 'ambulance',
                algorithm: 'bellman-ford'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.algorithmUsed).toBe('bellman-ford');
    });

    test('GET /api/ops/analytics rejects unauthenticated calls', async () => {
        const response = await request(app).get('/api/ops/analytics');
        expect(response.statusCode).toBe(401);
    });

    test('GET /api/ops/analytics allows authenticated calls', async () => {
        const response = await request(app)
            .get('/api/ops/analytics')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.routes).toBeDefined();
    });
});
