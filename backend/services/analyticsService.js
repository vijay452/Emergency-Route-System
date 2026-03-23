const { getDb } = require('./dataStore');

function summarizeRoutes(routeHistory) {
    const totalRoutes = routeHistory.length;

    if (totalRoutes === 0) {
        return {
            totalRoutes: 0,
            averageDistanceKm: 0,
            averageTimeMinutes: 0,
            byEmergencyType: {}
        };
    }

    const totalDistance = routeHistory.reduce((sum, r) => sum + Number(r.distance || 0), 0);
    const totalTime = routeHistory.reduce((sum, r) => sum + Number(r.time || 0), 0);

    const byEmergencyType = routeHistory.reduce((acc, r) => {
        const key = r.emergencyType || 'ambulance';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return {
        totalRoutes,
        averageDistanceKm: Number((totalDistance / totalRoutes).toFixed(2)),
        averageTimeMinutes: Number((totalTime / totalRoutes).toFixed(2)),
        byEmergencyType
    };
}

function getAnalyticsSnapshot() {
    const db = getDb();

    return {
        routes: summarizeRoutes(db.data.routeHistory),
        trafficAlerts: db.data.trafficAlerts.length,
        fleetEvents: db.data.fleetEvents.length,
        auditEvents: db.data.auditLogs.length,
        generatedAt: new Date().toISOString()
    };
}

module.exports = {
    getAnalyticsSnapshot
};
