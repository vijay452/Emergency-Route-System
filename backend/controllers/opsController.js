const { v4: uuidv4 } = require('uuid');
const { getDb, persist } = require('../services/dataStore');
const { getAnalyticsSnapshot } = require('../services/analyticsService');
const { fetchLiveTraffic } = require('../services/trafficService');
const { getWeather } = require('../services/weatherService');
const realtime = require('../services/realtimeService');

exports.getAnalytics = (req, res) => {
    return res.json(getAnalyticsSnapshot());
};

exports.getAuditLogs = (req, res) => {
    const db = getDb();
    return res.json({ logs: db.data.auditLogs.slice(-500) });
};

exports.addFleetEvent = async (req, res) => {
    const { vehicleId, action, details } = req.body || {};

    if (!vehicleId || !action) {
        return res.status(400).json({ error: 'vehicleId and action are required' });
    }

    const db = getDb();

    const event = {
        id: uuidv4(),
        vehicleId,
        action,
        details: details || null,
        actor: req.user ? req.user.username : 'system',
        timestamp: new Date().toISOString()
    };

    db.data.fleetEvents.push(event);
    db.data.auditLogs.push({
        id: uuidv4(),
        eventType: 'fleet_event',
        actor: event.actor,
        payload: event,
        timestamp: event.timestamp
    });

    await persist();

    realtime.broadcast('fleet:event', event);

    return res.status(201).json({ message: 'Fleet event recorded', event });
};

exports.liveTraffic = async (req, res) => {
    try {
        const payload = await fetchLiveTraffic(req.query.bbox);
        realtime.broadcast('traffic:update', { incidents: payload.incidents || [] });
        return res.json(payload);
    } catch (_error) {
        return res.status(502).json({
            provider: 'tomtom',
            providerConfigured: true,
            incidents: [],
            error: 'Failed to fetch real-time traffic data'
        });
    }
};

exports.weatherAt = async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ error: 'lat and lng query params are required' });
    }

    const weather = await getWeather(lat, lng);
    return res.json(weather);
};
