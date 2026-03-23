const axios = require('axios');

function parseBBox(rawBBox) {
    if (!rawBBox || typeof rawBBox !== 'string') {
        return null;
    }

    const parts = rawBBox.split(',').map((v) => Number(v.trim()));
    if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v))) {
        return null;
    }

    return {
        minLon: parts[0],
        minLat: parts[1],
        maxLon: parts[2],
        maxLat: parts[3]
    };
}

function firstCoordinateFromGeometry(geometry) {
    if (!geometry || !geometry.coordinates) {
        return null;
    }

    const { type, coordinates } = geometry;

    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        return { lng: Number(coordinates[0]), lat: Number(coordinates[1]) };
    }

    if (type === 'LineString' && Array.isArray(coordinates) && coordinates.length > 0) {
        const first = coordinates[0];
        if (Array.isArray(first) && first.length >= 2) {
            return { lng: Number(first[0]), lat: Number(first[1]) };
        }
    }

    if (type === 'MultiLineString' && Array.isArray(coordinates) && coordinates.length > 0) {
        const firstLine = coordinates[0];
        if (Array.isArray(firstLine) && firstLine.length > 0) {
            const first = firstLine[0];
            if (Array.isArray(first) && first.length >= 2) {
                return { lng: Number(first[0]), lat: Number(first[1]) };
            }
        }
    }

    return null;
}

function severityFromIconCategory(iconCategory) {
    const value = Number(iconCategory || 0);
    if (value >= 8) return 'critical';
    if (value >= 4) return 'moderate';
    return 'low';
}

function buildFallbackIncidents() {
    return [
        {
            id: 'fallback-1',
            lat: 30.2886,
            lng: 77.9984,
            severity: 'critical',
            description: 'Accident near ISBT Dehradun'
        },
        {
            id: 'fallback-2',
            lat: 30.2709,
            lng: 78.0181,
            severity: 'moderate',
            description: 'Road maintenance near Clement Town'
        }
    ];
}

async function fetchLiveTraffic(bboxQuery) {
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
        return {
            provider: 'tomtom',
            providerConfigured: false,
            incidents: buildFallbackIncidents(),
            message: 'Set TOMTOM_API_KEY to enable real-time traffic incidents.'
        };
    }

    const requestedBBox = parseBBox(bboxQuery);
    const bbox = requestedBBox || {
        minLon: 77.90,
        minLat: 30.20,
        maxLon: 78.15,
        maxLat: 30.40
    };

    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
        params: {
            key: apiKey,
            bbox: `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`,
            language: 'en-GB',
            timeValidityFilter: 'present',
            fields: '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,from,to,length,delay,startTime,endTime,events{description,code}}}}'
        },
        timeout: 10000
    });

    const rawIncidents = Array.isArray(response?.data?.incidents) ? response.data.incidents : [];

    const incidents = rawIncidents
        .map((incident) => {
            const coord = firstCoordinateFromGeometry(incident.geometry);
            const props = incident.properties || {};
            const firstEvent = Array.isArray(props.events) && props.events.length > 0 ? props.events[0] : null;

            if (!coord || !Number.isFinite(coord.lat) || !Number.isFinite(coord.lng)) {
                return null;
            }

            return {
                id: props.id || `${coord.lat}-${coord.lng}`,
                lat: coord.lat,
                lng: coord.lng,
                severity: severityFromIconCategory(props.iconCategory),
                description: firstEvent?.description || 'Traffic incident',
                from: props.from || null,
                to: props.to || null,
                delaySeconds: Number(props.delay || 0),
                lengthMeters: Number(props.length || 0),
                startTime: props.startTime || null,
                endTime: props.endTime || null
            };
        })
        .filter(Boolean);

    return {
        provider: 'tomtom',
        providerConfigured: true,
        bbox,
        incidents,
        fetchedAt: new Date().toISOString()
    };
}

module.exports = {
    fetchLiveTraffic
};
