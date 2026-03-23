const path = require('path');
const fs = require('fs');

let db = null;
let dbPath = null;

const defaultData = {
    users: [
        { id: 'u-admin', username: 'admin', password: 'admin123', role: 'admin' },
        { id: 'u-operator', username: 'operator', password: 'operator123', role: 'operator' },
        { id: 'u-viewer', username: 'viewer', password: 'viewer123', role: 'viewer' }
    ],
    routeHistory: [],
    trafficAlerts: [
        {
            id: 'alert-seed-1',
            type: 'Accident',
            message: 'Traffic slowdown near ISBT flyover',
            location: 'ISBT Dehradun',
            severity: 'critical',
            timestamp: new Date().toISOString()
        },
        {
            id: 'alert-seed-2',
            type: 'Construction',
            message: 'Road construction near Clement Town Market',
            location: 'Clement Town Market',
            severity: 'moderate',
            timestamp: new Date().toISOString()
        }
    ],
    fleetEvents: [],
    auditLogs: []
};

async function initDataStore() {
    if (!db) {
        dbPath = path.join(__dirname, '../data/runtime-db.json');
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });

        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
        }

        let fileData = {};
        try {
            const raw = fs.readFileSync(dbPath, 'utf8');
            fileData = raw ? JSON.parse(raw) : {};
        } catch (_error) {
            fileData = {};
        }

        db = {
            data: {
                ...defaultData,
                ...fileData,
                users: Array.isArray(fileData.users) && fileData.users.length > 0 ? fileData.users : defaultData.users,
                routeHistory: Array.isArray(fileData.routeHistory) ? fileData.routeHistory : [],
                trafficAlerts: Array.isArray(fileData.trafficAlerts) && fileData.trafficAlerts.length > 0
                    ? fileData.trafficAlerts
                    : defaultData.trafficAlerts,
                fleetEvents: Array.isArray(fileData.fleetEvents) ? fileData.fleetEvents : [],
                auditLogs: Array.isArray(fileData.auditLogs) ? fileData.auditLogs : []
            }
        };
    }

    return db;
}

function getDb() {
    if (!db) {
        throw new Error('Data store not initialized. Call initDataStore() first.');
    }

    return db;
}

async function persist() {
    const currentDb = getDb();
    fs.writeFileSync(dbPath, JSON.stringify(currentDb.data, null, 2), 'utf8');
}

module.exports = {
    initDataStore,
    getDb,
    persist
};
