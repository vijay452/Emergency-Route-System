let selectedStart = null;
let selectedEnd = null;
let emergencyType = 'ambulance';
window.currentEmergencyType = emergencyType;
window.emergencyType = emergencyType;
let currentRoute = null;
let startMarker = null;
let endMarker = null;
let stepFocusMarker = null;
let selectedRouteIndex = 0;
let alternativeLayers = [];
let routeArrowLayers = [];
let routeCasingLayer = null;
let trafficOverlayLayers = [];
let trafficLegendControl = null;
let liveTrafficIncidentLayers = [];
let liveTrafficPollerId = null;
let latestLiveIncidents = [];
let trafficKeyFilters = {
    heavy: true,
    moderate: true,
    smooth: true
};
let greenCorridorEnabled = true;
let signalControlLayers = [];
let currentSignalPlan = [];
let signalOverrideActive = false;
let mapSelectionMode = null;
let userLocationMarker = null;
let userLocationAccuracyCircle = null;
let locationWatchId = null;

const dehradunBounds = {
    west: 77.90,
    east: 78.15,
    north: 30.40,
    south: 30.20
};

document.addEventListener('DOMContentLoaded', () => {
    // On mobile/touch devices, force-remove keyboard hint if stale cached script injects it.
    const isMobileLike = window.matchMedia('(max-width: 768px)').matches
        || window.matchMedia('(pointer: coarse)').matches
        || ('ontouchstart' in window)
        || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    if (isMobileLike) {
        const removeKeyboardHint = () => {
            const hint = document.getElementById('keyboard-hint');
            if (hint) {
                hint.remove();
            }
        };

        removeKeyboardHint();
        setTimeout(removeKeyboardHint, 2500);
        setTimeout(removeKeyboardHint, 5000);

        const observer = new MutationObserver(() => removeKeyboardHint());
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 8000);
    }

    // Initialize map first
    initializeMap();
    
    // Wait for map to be ready before initializing other components
    if (window.mapReady) {
        startAppInitialization();
    } else {
        window.addEventListener('mapReady', startAppInitialization);
    }
});

function startAppInitialization() {
    try {
        initializeEventListeners();
        setupMapControls();
        setupMapSelectionTools();
        loadTrafficAlerts();
        startLiveTrafficPolling();
        
        // Ensure map is properly sized after all initialization
        if (window.map) {
            setTimeout(() => {
                window.map.invalidateSize();
            }, 100);
        }
    } catch (error) {
        console.error('App initialization error:', error);
    }
}

function isRouteAnalyticsEnabled() {
    const toggle = document.getElementById('enable-analytics');
    if (toggle) {
        return toggle.checked;
    }

    try {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        return settings.enableAnalytics !== false;
    } catch (_error) {
        return true;
    }
}

function initializeEventListeners() {
    try {
        const findRouteBtn = document.getElementById('find-route-btn');
        const clearRouteBtn = document.getElementById('clear-route-btn');
        const emergencyTypeSelect = document.getElementById('emergency-type');
        const alternativesEl = document.getElementById('route-alternatives');
        const routePathEl = document.getElementById('route-path');
        const fromInput = document.getElementById('location-from');
        const toInput = document.getElementById('location-to');
        const greenCorridorToggle = document.getElementById('green-corridor-toggle');
        const optimizeCorridorBtn = document.getElementById('optimize-corridor-btn');
        const applyCorridorBtn = document.getElementById('apply-corridor-btn');
        const releaseCorridorBtn = document.getElementById('release-corridor-btn');

        // Validate elements exist
        if (!findRouteBtn || !clearRouteBtn) {
            console.error('Critical UI elements not found');
            return;
        }

        findRouteBtn.addEventListener('click', findRoute);
        clearRouteBtn.addEventListener('click', clearRoute);

        if (fromInput) {
            fromInput.addEventListener('input', () => {
                delete fromInput.dataset.lat;
                delete fromInput.dataset.lng;
            });
        }

        if (toInput) {
            toInput.addEventListener('input', () => {
                delete toInput.dataset.lat;
                delete toInput.dataset.lng;
            });
        }

        if (emergencyTypeSelect) {
            emergencyTypeSelect.addEventListener('change', (e) => {
                emergencyType = e.target.value;
                window.currentEmergencyType = emergencyType;
                window.emergencyType = emergencyType;

                if (currentRoute && greenCorridorEnabled) {
                    applyGreenCorridorToCurrentRoute();
                }
            });
        }

        if (greenCorridorToggle) {
            greenCorridorEnabled = greenCorridorToggle.checked;
            greenCorridorToggle.addEventListener('change', (e) => {
                greenCorridorEnabled = e.target.checked;

                if (!greenCorridorEnabled) {
                    renderSignalControlPlan([], 'Green corridor disabled. Route will use normal traffic behavior.');
                    clearSignalControlLayers();
                    currentSignalPlan = [];
                    signalOverrideActive = false;
                    return;
                }

                if (currentRoute) {
                    applyGreenCorridorToCurrentRoute();
                }
            });
        }

        if (optimizeCorridorBtn) {
            optimizeCorridorBtn.addEventListener('click', () => {
                if (!currentRoute) {
                    renderSignalControlPlan([], 'Find a route first to generate emergency signal actions.');
                    return;
                }
                applyGreenCorridorToCurrentRoute();
            });
        }

        if (applyCorridorBtn) {
            applyCorridorBtn.addEventListener('click', () => {
                applySignalOverrides();
            });
        }

        if (releaseCorridorBtn) {
            releaseCorridorBtn.addEventListener('click', () => {
                releaseSignalOverrides();
            });
        }

        document.addEventListener('keydown', (e) => {
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target && e.target.tagName) || '');
            if (isTyping) return;

            const key = String(e.key || '').toLowerCase();

            if (key === 'g') {
                if (currentRoute) applyGreenCorridorToCurrentRoute();
            }

            if (key === 'a') {
                applySignalOverrides();
            }

            if (key === 'r') {
                releaseSignalOverrides();
            }

            if (key === 'l' && greenCorridorToggle) {
                greenCorridorToggle.checked = !greenCorridorToggle.checked;
                greenCorridorToggle.dispatchEvent(new Event('change'));
            }
        });

        if (alternativesEl) {
            alternativesEl.addEventListener('click', (e) => {
                const button = e.target.closest('.alt-route-btn');
                if (!button || !currentRoute) return;

                const idx = Number(button.dataset.routeIndex);
                if (Number.isNaN(idx)) return;

                selectedRouteIndex = idx;
                const picked = currentRoute.routes[idx];
                displayRoute(picked, currentRoute.routes);
                updateMapWithRoute(picked, currentRoute.routes);
                updateSignalControlForRoute(picked);
            });
        }

        if (routePathEl) {
            routePathEl.addEventListener('click', (e) => {
                const row = e.target.closest('.route-path-item');
                if (!row || !currentRoute) return;

                const idx = Number(row.dataset.stepIndex);
                if (Number.isNaN(idx)) return;

                const picked = currentRoute.routes[selectedRouteIndex];
                if (!picked || !picked.steps || !picked.steps[idx] || !window.map) return;

                const step = picked.steps[idx];
                focusStepOnMap(step);
            });
        }

        // Panel interactions (Dashboard/History/Settings) are managed in panels.js
    } catch (error) {
        console.error('Error initializing event listeners:', error);
    }
}

async function findRoute() {
    const fromInput = document.getElementById('location-from');
    const toInput = document.getElementById('location-to');
    const locationFrom = fromInput.value.trim();
    const locationTo = toInput.value.trim();

    if (!locationFrom || !locationTo) {
        alert('Please enter both starting location and destination.');
        return;
    }

    if (locationFrom.toLowerCase() === locationTo.toLowerCase()) {
        alert('Starting and destination locations cannot be the same.');
        return;
    }

    selectedStart = locationFrom;
    selectedEnd = locationTo;

    showLoader();
    hideResults();

    try {
        const [startPoint, endPoint] = await Promise.all([
            resolvePoint(fromInput, locationFrom),
            resolvePoint(toInput, locationTo)
        ]);

        const routeBundle = await fetchRoadRoutes(startPoint, endPoint);
        const allRoutes = routeBundle.routes.map((r, idx) => buildRouteFromRaw(startPoint, endPoint, r, idx));

        if (allRoutes.length === 0) {
            throw new Error('No drivable route found between these places.');
        }

        selectedRouteIndex = 0;
        currentRoute = {
            startCoord: { lat: startPoint.lat, lng: startPoint.lng },
            endCoord: { lat: endPoint.lat, lng: endPoint.lng },
            routes: allRoutes
        };

        if (greenCorridorEnabled && allRoutes.length > 1) {
            selectedRouteIndex = selectBestEmergencyRouteIndex(allRoutes, latestLiveIncidents);
        }

        const primary = allRoutes[selectedRouteIndex];
        hideLoader();
        displayRoute(primary, allRoutes);
        updateMapWithRoute(primary, allRoutes);
        updateSignalControlForRoute(primary);

        // Track analytics
        if (isRouteAnalyticsEnabled() && typeof trackRouteAnalytics === 'function' && primary) {
            trackRouteAnalytics({
                start: locationFrom,
                end: locationTo,
                distance: primary.distance || 0,
                time: primary.time || 0,
                emergencyType: emergencyType || 'ambulance'
            });
        }

        // Add to history
        if (typeof addToHistory === 'function' && primary) {
            addToHistory({
                start: locationFrom,
                end: locationTo,
                distance: primary.distance || 0,
                time: primary.time || 0,
                rawTime: primary.rawTime || primary.time || 0
            });
        }
    } catch (error) {
        hideLoader();
        console.error('Route error:', error);
        alert(error.message || 'Error calculating route. Please try again.');
    }
}

async function resolvePoint(inputEl, label) {
    const lat = Number(inputEl?.dataset?.lat);
    const lng = Number(inputEl?.dataset?.lng);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
            label: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lng,
            displayName: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        };
    }

    return geocodePlace(label);
}

async function geocodePlace(query) {
    const coordMatch = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordMatch) {
        return {
            label: query,
            lat: Number(coordMatch[1]),
            lng: Number(coordMatch[2]),
            displayName: query
        };
    }

    const compact = query
        .replace(/\bprem\s+nagar\b/gi, 'Premnagar')
        .replace(/\bclement\s+town\b/gi, 'Clementtown')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizedKey = compact.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const localLandmarkMap = {
        'graphic era university clementtown': { lat: 30.2835, lng: 78.0139, displayName: 'Graphic Era University, Clement Town, Dehradun' },
        'graphic era university clement town': { lat: 30.2835, lng: 78.0139, displayName: 'Graphic Era University, Clement Town, Dehradun' },
        'graphic era university': { lat: 30.2835, lng: 78.0139, displayName: 'Graphic Era University, Clement Town, Dehradun' },
        // Backward-compatible aliases
        'graphic era hospital clementtown': { lat: 30.2835, lng: 78.0139, displayName: 'Graphic Era University, Clement Town, Dehradun' },
        'graphic era hospital clement town': { lat: 30.2835, lng: 78.0139, displayName: 'Graphic Era University, Clement Town, Dehradun' },
        'graphic era hospital': { lat: 30.2835, lng: 78.0139, displayName: 'Graphic Era University, Clement Town, Dehradun' },
        'isbt dehradun': { lat: 30.2886, lng: 77.9984, displayName: 'ISBT Dehradun' },
        'clock tower dehradun': { lat: 30.3256, lng: 78.0419, displayName: 'Clock Tower, Dehradun' },
        'forest research institute dehradun': { lat: 30.338, lng: 77.9994, displayName: 'Forest Research Institute, Dehradun' },
        'clement town market': { lat: 30.2709, lng: 78.0181, displayName: 'Clement Town Market, Dehradun' }
    };

    if (localLandmarkMap[normalizedKey]) {
        const local = localLandmarkMap[normalizedKey];
        return {
            label: query,
            lat: local.lat,
            lng: local.lng,
            displayName: local.displayName
        };
    }

    const lower = compact.toLowerCase();
    let aliased = compact;

    if (lower.includes('graphic era') && (lower.includes('hospital') || lower.includes('university')) && (lower.includes('clement town') || lower.includes('clementtown'))) {
        aliased = 'Graphic Era University, Clement Town';
    }

    const queryCandidates = Array.from(new Set([
        query,
        compact,
        aliased,
        `${aliased}, Dehradun`,
        `${aliased}, Dehradun, Uttarakhand`,
        `${compact}, Dehradun`,
        `${compact}, Uttarakhand, India`
    ]));

    const searchUrls = [];
    queryCandidates.forEach((candidate) => {
        searchUrls.push(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(candidate)}&limit=5&countrycodes=in&viewbox=${dehradunBounds.west},${dehradunBounds.north},${dehradunBounds.east},${dehradunBounds.south}&bounded=1`);
        searchUrls.push(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(candidate)}&limit=5&countrycodes=in`);
    });

    let rows = [];

    for (const url of searchUrls) {
        const response = await fetch(url);
        if (!response.ok) continue;

        const results = await response.json();
        if (results && results.length > 0) {
            rows = results;
            break;
        }
    }

    if (!rows || rows.length === 0) {
        throw new Error(`Place not found: ${query}. Try variants like "Premnagar" or a nearby landmark.`);
    }

    const preferredTokens = compact.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const prioritized = rows
        .slice()
        .sort((a, b) => {
            const aName = (a.display_name || '').toLowerCase();
            const bName = (b.display_name || '').toLowerCase();
            const aScore = preferredTokens.reduce((sum, t) => sum + (aName.includes(t) ? 1 : 0), aName.includes('dehradun') ? 2 : 0);
            const bScore = preferredTokens.reduce((sum, t) => sum + (bName.includes(t) ? 1 : 0), bName.includes('dehradun') ? 2 : 0);
            return bScore - aScore;
        })[0] || rows[0];

    return {
        label: query,
        lat: Number(prioritized.lat),
        lng: Number(prioritized.lon),
        displayName: prioritized.display_name
    };
}

async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const response = await fetch(url);

    if (!response.ok) {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }

    const payload = await response.json();
    return payload?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function setupMapSelectionTools() {
    if (!window.map) return;

    const pickSourceBtn = document.getElementById('pick-source-map-btn');
    const pickDestinationBtn = document.getElementById('pick-destination-map-btn');
    const useMyLocationBtn = document.getElementById('use-my-location-btn');
    const showMyLocationBtn = document.getElementById('show-my-location-btn');

    if (pickSourceBtn) {
        pickSourceBtn.addEventListener('click', () => {
            activateMapSelection('source');
        });
    }

    if (pickDestinationBtn) {
        pickDestinationBtn.addEventListener('click', () => {
            activateMapSelection('destination');
        });
    }

    if (useMyLocationBtn) {
        useMyLocationBtn.addEventListener('click', async () => {
            try {
                const { lat, lng } = await getUserLocation();
                const fromInput = document.getElementById('location-from');
                const label = 'My current location';
                fromInput.value = label;
                fromInput.dataset.lat = String(lat);
                fromInput.dataset.lng = String(lng);
                updatePickStatus('Source set to your current location.');
                updateUserLocationOnMap(lat, lng, true);
            } catch (error) {
                alert('Unable to get your live location. Please allow location permission in your browser.');
            }
        });
    }

    if (showMyLocationBtn) {
        showMyLocationBtn.addEventListener('click', () => {
            startLiveLocationTracking();
        });
    }

    window.map.on('click', handleMapClickSelection);
}

function activateMapSelection(mode) {
    mapSelectionMode = mode;
    const label = mode === 'source' ? 'source' : 'destination';
    updatePickStatus(`Click on the map to set ${label}.`);

    if (window.map?.getContainer) {
        window.map.getContainer().style.cursor = 'crosshair';
    }
}

async function handleMapClickSelection(event) {
    if (!mapSelectionMode) return;

    const lat = event.latlng.lat;
    const lng = event.latlng.lng;

    try {
        const placeName = await reverseGeocode(lat, lng);
        const shortLabel = placeName.split(',').slice(0, 3).join(',').trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        if (mapSelectionMode === 'source') {
            const fromInput = document.getElementById('location-from');
            fromInput.value = shortLabel;
            fromInput.dataset.lat = String(lat);
            fromInput.dataset.lng = String(lng);
            selectedStart = shortLabel;
            updatePickStatus('Source selected from map.');
        } else {
            const toInput = document.getElementById('location-to');
            toInput.value = shortLabel;
            toInput.dataset.lat = String(lat);
            toInput.dataset.lng = String(lng);
            selectedEnd = shortLabel;
            updatePickStatus('Destination selected from map.');
        }
    } catch (error) {
        updatePickStatus('Map point selected.');
    } finally {
        mapSelectionMode = null;
        if (window.map?.getContainer) {
            window.map.getContainer().style.cursor = '';
        }
    }
}

function updatePickStatus(message) {
    const statusEl = document.getElementById('map-pick-status');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => reject(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 15000
            }
        );
    });
}

function updateUserLocationOnMap(lat, lng, center = false, accuracy = 30) {
    if (!window.map) return;

    if (!userLocationMarker) {
        userLocationMarker = L.circleMarker([lat, lng], {
            radius: 8,
            color: '#ffffff',
            weight: 2,
            fillColor: '#1f73e8',
            fillOpacity: 1
        }).addTo(window.map);
    } else {
        userLocationMarker.setLatLng([lat, lng]);
    }

    userLocationMarker.bindPopup('You are here');

    if (!userLocationAccuracyCircle) {
        userLocationAccuracyCircle = L.circle([lat, lng], {
            radius: Math.max(accuracy, 15),
            color: '#1f73e8',
            weight: 1,
            fillColor: '#4a9eff',
            fillOpacity: 0.15
        }).addTo(window.map);
    } else {
        userLocationAccuracyCircle.setLatLng([lat, lng]);
        userLocationAccuracyCircle.setRadius(Math.max(accuracy, 15));
    }

    if (center) {
        window.map.setView([lat, lng], Math.max(window.map.getZoom(), 15));
    }
}

function startLiveLocationTracking() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    if (locationWatchId !== null) {
        updatePickStatus('Live location tracking already active.');
        if (userLocationMarker) {
            window.map.panTo(userLocationMarker.getLatLng());
        }
        return;
    }

    locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            updateUserLocationOnMap(latitude, longitude, true, accuracy);
            updatePickStatus('Live location tracking is active.');
        },
        () => {
            updatePickStatus('Could not access live location. Check permission settings.');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 10000
        }
    );
}

async function fetchRoadRoutes(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Road routing service is unavailable right now.');
    }

    const payload = await response.json();
    if (!payload.routes || payload.routes.length === 0) {
        throw new Error('No drivable route found between these places.');
    }

    return payload;
}

function buildRouteFromRaw(startPoint, endPoint, rawRoute, index) {
    const emergencyTimeFactor = {
        ambulance: 0.9,
        fire: 0.85,
        police: 0.8
    };

    const factor = emergencyTimeFactor[emergencyType] || 1;
    const rawRouteMinutes = rawRoute.duration / 60;
    const routeMinutes = rawRouteMinutes * factor;
    const routeKm = rawRoute.distance / 1000;
    const routeGeometry = rawRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    const steps = (rawRoute.legs?.[0]?.steps || []).map((step) => ({
        road: step.name && step.name.trim() ? step.name : 'Continue',
        instruction: buildStepInstruction(step),
        distanceKm: (step.distance || 0) / 1000,
        durationMin: (step.duration || 0) / 60,
        lat: step.maneuver?.location ? step.maneuver.location[1] : null,
        lng: step.maneuver?.location ? step.maneuver.location[0] : null,
        geometry: (step.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng])
    }));

    return {
        id: index,
        start: startPoint.label,
        end: endPoint.label,
        distance: routeKm,
        time: routeMinutes,
        rawTime: rawRouteMinutes,
        status: 'Live OSM Route',
        path: steps.map((s) => s.road).filter((x) => x).slice(0, 8),
        steps,
        routeGeometry
    };
}

function buildStepInstruction(step) {
    const type = step.maneuver?.type || 'continue';
    const modifier = step.maneuver?.modifier || '';
    const road = step.name || 'the road';

    if (type === 'depart') return `Start on ${road}`;
    if (type === 'arrive') return 'Arrive at destination';
    if (modifier) return `${capitalize(modifier)} onto ${road}`;
    return `Continue on ${road}`;
}

function capitalize(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function displayRoute(data, allRoutes) {
    const distanceEl = document.getElementById('distance');
    const timeEl = document.getElementById('time');
    const statusEl = document.getElementById('status');
    const routePathEl = document.getElementById('route-path');
    const alternativesEl = document.getElementById('route-alternatives');
    const resultsSection = document.getElementById('results-section');

    distanceEl.textContent = data.distance ? `${data.distance.toFixed(2)} km` : '-- km';
    timeEl.textContent = data.time ? `${data.time.toFixed(0)} min` : '-- min';

    statusEl.textContent = data.status || 'Live OSM Route';
    statusEl.className = `value status-badge ${getStatusClass(data.status)}`;

    alternativesEl.innerHTML = allRoutes
        .map((route, idx) => {
            const active = idx === selectedRouteIndex ? 'active' : '';
            return `<button class="alt-route-btn ${active}" data-route-index="${idx}">Route ${idx + 1} • ${route.time.toFixed(0)} min</button>`;
        })
        .join('');

    if (data.steps && data.steps.length > 0) {
        routePathEl.innerHTML = data.steps
            .slice(0, 16)
            .map((step, idx) => `<div class="route-path-item" data-step-index="${idx}">→ ${step.instruction} (${step.distanceKm.toFixed(2)} km)</div>`)
            .join('');
    } else {
        routePathEl.innerHTML = '<div class="route-path-item">Direct route</div>';
    }

    resultsSection.style.display = 'block';
}

function updateMapWithRoute(data, allRoutes) {
    try {
        if (!window.map || !window.mapReady) {
            console.warn('Map not ready, will retry in 100ms');
            setTimeout(() => updateMapWithRoute(data, allRoutes), 100);
            return;
        }
        
        if (!data.routeGeometry || data.routeGeometry.length === 0) {
            console.warn('No route geometry available');
            return;
        }

        clearRouteLayers();

        allRoutes.forEach((route, idx) => {
            if (idx === selectedRouteIndex) return;
            const layer = L.polyline(route.routeGeometry, {
                color: '#8a8d91',
                weight: 5,
                opacity: 0.55,
                lineJoin: 'round'
            }).addTo(window.map);
            alternativeLayers.push(layer);
        });

        routeCasingLayer = L.polyline(data.routeGeometry, {
            color: '#ffffff',
            weight: 12,
            opacity: 0.95,
            lineJoin: 'round',
            className: 'route-casing'
        }).addTo(window.map);

        window.routeLayer = L.polyline(data.routeGeometry, {
            color: '#4285F4',
            weight: 6,
            opacity: 0.7,
            lineJoin: 'round',
            className: 'route-main'
        }).addTo(window.map);

        routeCasingLayer.bringToFront();
        window.routeLayer.bringToFront();

        drawTrafficOverlay(data);

        drawRouteDirectionArrows(data.routeGeometry);

        if (startMarker) window.map.removeLayer(startMarker);
        if (endMarker) window.map.removeLayer(endMarker);

        startMarker = L.marker(data.routeGeometry[0]).addTo(window.map)
            .bindPopup(`<strong>Start</strong><br>${selectedStart}`);

        endMarker = L.marker(data.routeGeometry[data.routeGeometry.length - 1]).addTo(window.map)
            .bindPopup(`<strong>Destination</strong><br>${selectedEnd}`);

        window.map.invalidateSize();
        
        // Safely fit bounds with error handling
        if (window.routeLayer && window.routeLayer.getBounds) {
            try {
                const bounds = window.routeLayer.getBounds();
                if (bounds && bounds.isValid && bounds.isValid()) {
                    window.map.fitBounds(bounds.pad(0.08));
                }
            } catch (error) {
                console.warn('Could not fit bounds:', error);
            }
        }
    } catch (error) {
        console.error('Error updating map with route:', error);
    }
}

function drawRouteDirectionArrows(coords) {
    if (!window.map || coords.length < 2) return;

    const stride = Math.max(14, Math.floor(coords.length / 10));

    for (let i = stride; i < coords.length - 1; i += stride) {
        const current = coords[i];
        const next = coords[i + 1];
        const angle = Math.atan2(next[1] - current[1], next[0] - current[0]) * (180 / Math.PI);

        const arrowIcon = L.divIcon({
            className: '',
            html: `<div class="route-arrow" style="transform: rotate(${angle}deg);">➤</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        const arrowMarker = L.marker(current, {
            icon: arrowIcon,
            interactive: false,
            keyboard: false,
            zIndexOffset: 500
        }).addTo(window.map);

        routeArrowLayers.push(arrowMarker);
    }
}

function focusStepOnMap(step) {
    if (!window.map || step.lat == null || step.lng == null) return;

    if (stepFocusMarker) {
        window.map.removeLayer(stepFocusMarker);
    }

    stepFocusMarker = L.circleMarker([step.lat, step.lng], {
        radius: 7,
        color: '#1f73e8',
        weight: 2,
        fillColor: '#ffffff',
        fillOpacity: 1
    }).addTo(window.map).bindPopup(step.instruction);

    stepFocusMarker.openPopup();
    window.map.flyTo([step.lat, step.lng], Math.max(window.map.getZoom(), 14), {
        duration: 0.7
    });
}

function clearRouteLayers() {
    if (window.map && window.routeLayer) {
        window.map.removeLayer(window.routeLayer);
        window.routeLayer = null;
    }

    if (window.map && routeCasingLayer) {
        window.map.removeLayer(routeCasingLayer);
        routeCasingLayer = null;
    }

    alternativeLayers.forEach((layer) => {
        if (window.map) window.map.removeLayer(layer);
    });
    alternativeLayers = [];

    routeArrowLayers.forEach((layer) => {
        if (window.map) window.map.removeLayer(layer);
    });
    routeArrowLayers = [];

    trafficOverlayLayers.forEach((layer) => {
        if (window.map) window.map.removeLayer(layer);
    });
    trafficOverlayLayers = [];

    clearSignalControlLayers();
}

function clearSignalControlLayers() {
    signalControlLayers.forEach((layer) => {
        if (window.map) window.map.removeLayer(layer);
    });
    signalControlLayers = [];
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function routeTrafficRiskScore(route, incidents) {
    if (!route || !Array.isArray(route.routeGeometry) || incidents.length === 0) return 0;

    let score = 0;

    incidents.forEach((incident) => {
        const severityWeight = incident.severity === 'critical' ? 30 : incident.severity === 'moderate' ? 16 : 8;
        let minDist = Number.POSITIVE_INFINITY;

        for (let i = 0; i < route.routeGeometry.length; i += 8) {
            const [lat, lng] = route.routeGeometry[i];
            const d = haversineKm(lat, lng, incident.lat, incident.lng);
            if (d < minDist) minDist = d;
        }

        if (minDist < 0.9) {
            const delayPenalty = (incident.delaySeconds || 0) / 60;
            const distancePenalty = (0.9 - minDist) * 10;
            score += severityWeight + delayPenalty + distancePenalty;
        }
    });

    return score;
}

function selectBestEmergencyRouteIndex(routes, incidents) {
    if (!Array.isArray(routes) || routes.length === 0) return 0;

    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    routes.forEach((route, idx) => {
        const baseTime = Number(route.time || 0);
        const trafficRisk = routeTrafficRiskScore(route, incidents || []);
        const score = baseTime + (trafficRisk * 0.35);

        if (score < bestScore) {
            bestScore = score;
            bestIndex = idx;
        }
    });

    return bestIndex;
}

function incidentNearPoint(lat, lng, incidents) {
    for (const incident of incidents) {
        const d = haversineKm(lat, lng, incident.lat, incident.lng);
        if (d < 0.8) {
            return incident;
        }
    }
    return null;
}

function buildSignalControlPlan(route, incidents) {
    if (!route || !Array.isArray(route.steps) || route.steps.length === 0) return [];

    const plan = [];
    const stride = Math.max(1, Math.floor(route.steps.length / 6));

    for (let i = 0; i < route.steps.length; i += stride) {
        const step = route.steps[i];
        if (step.lat == null || step.lng == null) continue;

        const nearbyIncident = incidentNearPoint(step.lat, step.lng, incidents);
        const phaseSeconds = nearbyIncident ? 120 : 75;

        plan.push({
            id: `sig-${i}`,
            lat: step.lat,
            lng: step.lng,
            title: step.road || `Intersection ${i + 1}`,
            action: `Set GREEN phase for ${emergencyType.toUpperCase()} corridor`,
            durationSeconds: phaseSeconds,
            reason: nearbyIncident
                ? `Congestion bypass near incident: ${nearbyIncident.description}`
                : 'Keep emergency progression smooth through intersection'
        });
    }

    return plan.slice(0, 8);
}

function renderSignalControlPlan(plan, statusText) {
    const planListEl = document.getElementById('signal-plan-list');
    const statusEl = document.getElementById('corridor-status');
    if (!planListEl || !statusEl) return;

    statusEl.textContent = statusText;

    if (!Array.isArray(plan) || plan.length === 0) {
        planListEl.innerHTML = '<div class="alert-empty">No signal overrides required for this route.</div>';
        return;
    }

    planListEl.innerHTML = plan
        .map((item, idx) => `
            <div class="signal-plan-item ${item.active ? 'active' : ''}">
                <div class="signal-plan-title">Junction ${idx + 1}: ${item.title}</div>
                <div class="signal-plan-body">${item.action} for ${item.durationSeconds}s</div>
                <div class="signal-plan-body">Reason: ${item.reason}</div>
            </div>
        `)
        .join('');
}

function drawSignalControlPoints(plan) {
    if (!window.map) return;

    clearSignalControlLayers();

    plan.forEach((item) => {
        const marker = L.circleMarker([item.lat, item.lng], {
            radius: 6,
            color: '#5d4600',
            weight: 1,
            fillColor: item.active ? '#2e7d32' : '#ffd54f',
            fillOpacity: 0.95
        }).addTo(window.map);

        marker.bindPopup(`
            <div class="popup-title">Signal Override</div>
            <div class="popup-info">
                <p><strong>${item.title}</strong></p>
                <p>${item.action}</p>
                <p>${item.durationSeconds}s</p>
            </div>
        `);

        signalControlLayers.push(marker);
    });
}

function applySignalOverrides() {
    if (!greenCorridorEnabled) {
        renderSignalControlPlan([], 'Enable Green Corridor Mode first.');
        return;
    }

    if (!Array.isArray(currentSignalPlan) || currentSignalPlan.length === 0) {
        renderSignalControlPlan([], 'No signal actions available. Compute route and optimize first.');
        return;
    }

    signalOverrideActive = true;
    currentSignalPlan = currentSignalPlan.map((item) => ({ ...item, active: true }));
    drawSignalControlPoints(currentSignalPlan);
    renderSignalControlPlan(currentSignalPlan, `Signal overrides applied at ${currentSignalPlan.length} junctions. Emergency corridor is now GREEN.`);
}

function releaseSignalOverrides() {
    if (!Array.isArray(currentSignalPlan) || currentSignalPlan.length === 0) {
        renderSignalControlPlan([], 'No active corridor to release.');
        return;
    }

    signalOverrideActive = false;
    currentSignalPlan = currentSignalPlan.map((item) => ({ ...item, active: false }));
    drawSignalControlPoints(currentSignalPlan);
    renderSignalControlPlan(currentSignalPlan, 'Corridor released. Signals returned to normal cycle (simulation).');
}

function updateSignalControlForRoute(route) {
    if (!greenCorridorEnabled) {
        renderSignalControlPlan([], 'Green corridor disabled. Route will use normal traffic behavior.');
        clearSignalControlLayers();
        currentSignalPlan = [];
        signalOverrideActive = false;
        return;
    }

    const incidents = latestLiveIncidents || [];
    const plan = buildSignalControlPlan(route, incidents).map((item) => ({ ...item, active: signalOverrideActive }));
    currentSignalPlan = plan;
    drawSignalControlPoints(currentSignalPlan);

    const risk = routeTrafficRiskScore(route, incidents);
    const estimatedSavedMin = Math.max(1, Math.round(plan.length * 0.6));

    renderSignalControlPlan(
        currentSignalPlan,
        `Green corridor active: ${plan.length} junction overrides prepared. Traffic risk score ${risk.toFixed(1)}. Estimated delay reduction ~${estimatedSavedMin} min.`
    );
}

function applyGreenCorridorToCurrentRoute() {
    if (!currentRoute || !Array.isArray(currentRoute.routes) || currentRoute.routes.length === 0) return;

    selectedRouteIndex = selectBestEmergencyRouteIndex(currentRoute.routes, latestLiveIncidents || []);
    const optimizedRoute = currentRoute.routes[selectedRouteIndex];

    displayRoute(optimizedRoute, currentRoute.routes);
    updateMapWithRoute(optimizedRoute, currentRoute.routes);
    updateSignalControlForRoute(optimizedRoute);
}

function getTrafficCategoryBySpeed(speedKmh) {
    if (!Number.isFinite(speedKmh)) return 'moderate';
    if (speedKmh < 18) return 'heavy';
    if (speedKmh < 30) return 'moderate';
    return 'smooth';
}

function getTrafficColorBySpeed(speedKmh) {
    const category = getTrafficCategoryBySpeed(speedKmh);
    if (category === 'heavy') return '#d32f2f';
    if (category === 'moderate') return '#f57c00';
    return '#2e7d32';
}

function getTrafficLabelBySpeed(speedKmh) {
    const category = getTrafficCategoryBySpeed(speedKmh);
    if (category === 'heavy') return 'Heavy traffic';
    if (category === 'moderate') return 'Moderate traffic';
    return 'Smooth traffic';
}

function shouldShowTrafficCategory(category) {
    if (!category || !trafficKeyFilters) return true;
    return trafficKeyFilters[category] !== false;
}

function applyTrafficKeyFilters() {
    if (!window.map) return;

    trafficOverlayLayers.forEach((layer) => {
        const category = layer.trafficCategory || 'moderate';
        const visible = shouldShowTrafficCategory(category);

        if (visible && !window.map.hasLayer(layer)) {
            layer.addTo(window.map);
        }

        if (!visible && window.map.hasLayer(layer)) {
            window.map.removeLayer(layer);
        }
    });

    liveTrafficIncidentLayers.forEach((layer) => {
        const category = layer.trafficCategory || 'moderate';
        const visible = shouldShowTrafficCategory(category);

        if (visible && !window.map.hasLayer(layer)) {
            layer.addTo(window.map);
        }

        if (!visible && window.map.hasLayer(layer)) {
            window.map.removeLayer(layer);
        }
    });
}

function drawTrafficOverlay(routeData) {
    if (!window.map) return;

    trafficOverlayLayers.forEach((layer) => window.map.removeLayer(layer));
    trafficOverlayLayers = [];

    let drewStepSegments = false;

    (routeData.steps || []).forEach((step) => {
        if (!step.geometry || step.geometry.length < 2) return;

        const speedKmh = step.durationMin > 0 ? (step.distanceKm / (step.durationMin / 60)) : NaN;
        const color = getTrafficColorBySpeed(speedKmh);
        const label = getTrafficLabelBySpeed(speedKmh);
        const category = getTrafficCategoryBySpeed(speedKmh);

        const trafficLayer = L.polyline(step.geometry, {
            color,
            weight: 5,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(window.map);

        trafficLayer.trafficCategory = category;

        trafficLayer.bindTooltip(`${label} (${Number.isFinite(speedKmh) ? speedKmh.toFixed(0) : '--'} km/h)`, {
            sticky: true,
            direction: 'top'
        });

        trafficOverlayLayers.push(trafficLayer);
        drewStepSegments = true;
    });

    if (!drewStepSegments && routeData.routeGeometry && routeData.routeGeometry.length > 1) {
        const avgSpeed = routeData.time > 0 ? (routeData.distance / (routeData.time / 60)) : NaN;
        const color = getTrafficColorBySpeed(avgSpeed);
        const label = getTrafficLabelBySpeed(avgSpeed);
        const category = getTrafficCategoryBySpeed(avgSpeed);

        const fallbackLayer = L.polyline(routeData.routeGeometry, {
            color,
            weight: 5,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(window.map);

        fallbackLayer.trafficCategory = category;

        fallbackLayer.bindTooltip(`${label} (${Number.isFinite(avgSpeed) ? avgSpeed.toFixed(0) : '--'} km/h)`, {
            sticky: true,
            direction: 'top'
        });

        trafficOverlayLayers.push(fallbackLayer);
    }

    trafficOverlayLayers.forEach((layer) => layer.bringToFront());
    createTrafficLegend();
    applyTrafficKeyFilters();
}

function createTrafficLegend() {
    if (!window.map || trafficLegendControl) return;

    trafficLegendControl = L.control({ position: 'bottomright' });

    trafficLegendControl.onAdd = function () {
        const div = L.DomUtil.create('div', 'traffic-legend');
        div.innerHTML = `
            <div class="traffic-legend-title">Traffic Key (toggle)</div>
            <label class="traffic-legend-row"><input type="checkbox" id="traffic-filter-heavy" checked> <span class="traffic-dot traffic-red"></span> Heavy</label>
            <label class="traffic-legend-row"><input type="checkbox" id="traffic-filter-moderate" checked> <span class="traffic-dot traffic-orange"></span> Moderate</label>
            <label class="traffic-legend-row"><input type="checkbox" id="traffic-filter-smooth" checked> <span class="traffic-dot traffic-green"></span> Smooth</label>
        `;

        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        setTimeout(() => {
            const heavyToggle = div.querySelector('#traffic-filter-heavy');
            const moderateToggle = div.querySelector('#traffic-filter-moderate');
            const smoothToggle = div.querySelector('#traffic-filter-smooth');

            if (!heavyToggle || !moderateToggle || !smoothToggle) return;

            heavyToggle.checked = trafficKeyFilters.heavy;
            moderateToggle.checked = trafficKeyFilters.moderate;
            smoothToggle.checked = trafficKeyFilters.smooth;

            const onChange = () => {
                trafficKeyFilters.heavy = heavyToggle.checked;
                trafficKeyFilters.moderate = moderateToggle.checked;
                trafficKeyFilters.smooth = smoothToggle.checked;
                applyTrafficKeyFilters();
            };

            heavyToggle.addEventListener('change', onChange);
            moderateToggle.addEventListener('change', onChange);
            smoothToggle.addEventListener('change', onChange);
        }, 0);

        return div;
    };

    trafficLegendControl.addTo(window.map);
}

function clearRoute() {
    const fromInput = document.getElementById('location-from');
    const toInput = document.getElementById('location-to');

    fromInput.value = '';
    toInput.value = '';
    delete fromInput.dataset.lat;
    delete fromInput.dataset.lng;
    delete toInput.dataset.lat;
    delete toInput.dataset.lng;
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('route-alternatives').innerHTML = '';
    document.getElementById('route-path').innerHTML = '';

    clearRouteLayers();

    if (window.map && startMarker) {
        window.map.removeLayer(startMarker);
        startMarker = null;
    }

    if (window.map && endMarker) {
        window.map.removeLayer(endMarker);
        endMarker = null;
    }

    if (window.map && stepFocusMarker) {
        window.map.removeLayer(stepFocusMarker);
        stepFocusMarker = null;
    }

    selectedStart = null;
    selectedEnd = null;
    currentRoute = null;
    selectedRouteIndex = 0;
    currentSignalPlan = [];
    signalOverrideActive = false;
    mapSelectionMode = null;
    updatePickStatus('Cleared. Pick source/destination again or type a place name.');
    renderSignalControlPlan([], 'Green corridor ready. Compute a route to generate traffic-light actions.');

    if (window.map?.getContainer) {
        window.map.getContainer().style.cursor = '';
    }
}

function showLoader() {
    try {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'block';
    } catch (error) {
        console.warn('Error showing loader:', error);
    }
}

function hideLoader() {
    try {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    } catch (error) {
        console.warn('Error hiding loader:', error);
    }
}

function hideResults() {
    try {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) resultsSection.style.display = 'none';
    } catch (error) {
        console.warn('Error hiding results:', error);
    }
}

function getStatusClass(status) {
    if (!status) return 'optimal';
    const lower = status.toLowerCase();
    if (lower.includes('live')) return 'optimal';
    if (lower.includes('optimal')) return 'optimal';
    if (lower.includes('moderate') || lower.includes('medium')) return 'moderate';
    return 'congested';
}

async function loadTrafficAlerts() {
    try {
        const liveData = await fetchLiveTrafficData();
        const incidents = Array.isArray(liveData?.incidents) ? liveData.incidents : [];
        latestLiveIncidents = incidents;
        const alertsContainer = document.getElementById('traffic-alerts');
        const fetchedAt = liveData?.fetchedAt ? new Date(liveData.fetchedAt) : new Date();

        // If provider is not configured, show useful estimated alerts instead of setup warnings.
        if (liveData && liveData.providerConfigured === false) {
            setTrafficDataMode('estimated', `Mode: Estimated • ${fetchedAt.toLocaleTimeString()}`);
            renderFallbackTrafficAlerts('Estimated traffic for your selected route.');
            return;
        }

        setTrafficDataMode('live', `Mode: Live • ${fetchedAt.toLocaleTimeString()}`);

        if (incidents.length === 0) {
            alertsContainer.innerHTML = '<div class="alert-empty">No major incidents detected in this map area.</div>';
            clearLiveTrafficMarkers();

            if (currentRoute && currentRoute.routes && currentRoute.routes[selectedRouteIndex]) {
                updateSignalControlForRoute(currentRoute.routes[selectedRouteIndex]);
            }
            return;
        }

        alertsContainer.innerHTML = incidents
            .slice(0, 8)
            .map((incident) => {
                const delayMin = incident.delaySeconds > 0 ? `${Math.round(incident.delaySeconds / 60)} min delay` : 'Live incident';
                const locationLabel = [incident.from, incident.to].filter(Boolean).join(' to ') || 'Road segment';
                return `
                    <div class="alert-item ${incident.severity}">
                        <strong>${incident.description}</strong>
                        <br><small>${locationLabel} • ${delayMin}</small>
                    </div>
                `;
            })
            .join('');

        drawLiveTrafficMarkers(incidents);

        if (currentRoute && currentRoute.routes && currentRoute.routes[selectedRouteIndex]) {
            updateSignalControlForRoute(currentRoute.routes[selectedRouteIndex]);
        }
    } catch (error) {
        console.error('Error loading traffic alerts:', error);
        setTrafficDataMode('offline', `Mode: Offline • ${new Date().toLocaleTimeString()}`);
        renderFallbackTrafficAlerts('Live provider unreachable. Showing estimated route traffic.');
        latestLiveIncidents = [];
    }
}

function setTrafficDataMode(mode, text) {
    const modeEl = document.getElementById('traffic-data-mode');
    if (!modeEl) return;

    modeEl.classList.remove('mode-live', 'mode-estimated', 'mode-offline');

    if (mode === 'live') {
        modeEl.classList.add('mode-live');
    } else if (mode === 'offline') {
        modeEl.classList.add('mode-offline');
    } else {
        modeEl.classList.add('mode-estimated');
    }

    modeEl.textContent = text || 'Mode: Estimated';
}

function buildEstimatedTrafficAlertsFromRoute() {
    if (!currentRoute || !currentRoute.routes || !currentRoute.routes[selectedRouteIndex]) {
        return [];
    }

    const route = currentRoute.routes[selectedRouteIndex];
    const steps = Array.isArray(route.steps) ? route.steps : [];
    const alerts = [];

    for (const step of steps) {
        const speedKmh = step.durationMin > 0 ? (step.distanceKm / (step.durationMin / 60)) : NaN;
        if (!Number.isFinite(speedKmh)) continue;

        if (speedKmh < 18 || speedKmh < 30) {
            const severity = speedKmh < 18 ? 'critical' : 'moderate';
            const level = speedKmh < 18 ? 'Heavy' : 'Moderate';
            alerts.push({
                severity,
                description: `${level} traffic expected on ${step.road || 'this segment'}`,
                location: step.instruction || 'Route segment',
                delayMin: Math.max(1, Math.round(step.durationMin * (severity === 'critical' ? 0.6 : 0.3)))
            });
        }

        if (alerts.length >= 5) break;
    }

    return alerts;
}

function renderFallbackTrafficAlerts(message) {
    const alertsContainer = document.getElementById('traffic-alerts');
    const estimatedAlerts = buildEstimatedTrafficAlertsFromRoute();

    if (estimatedAlerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="alert-empty">
                ${message}<br>
                <small>Find a route to see estimated traffic hotspots.</small>
            </div>
        `;
        clearLiveTrafficMarkers();
        return;
    }

    alertsContainer.innerHTML = estimatedAlerts
        .map((item) => `
            <div class="alert-item ${item.severity}">
                <strong>${item.description}</strong>
                <br><small>${item.location} • ~${item.delayMin} min extra</small>
            </div>
        `)
        .join('');

    clearLiveTrafficMarkers();

    if (currentRoute && currentRoute.routes && currentRoute.routes[selectedRouteIndex]) {
        updateSignalControlForRoute(currentRoute.routes[selectedRouteIndex]);
    }
}

let discoveredApiBase = null;

async function discoverApiBaseUrl() {
    if (discoveredApiBase !== null) {
        return discoveredApiBase;
    }

    // Prefer explicit runtime config for deployed environments.
    const configured = (window.ERS_API_BASE || '').trim();
    if (configured) {
        discoveredApiBase = configured.replace(/\/$/, '');
        window.localStorage.setItem('ersApiBase', discoveredApiBase);
        return discoveredApiBase;
    }

    const hostname = window.location.hostname || '';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    // In production, default to same-origin backend.
    if (!isLocal) {
        discoveredApiBase = '';
        return discoveredApiBase;
    }

    if (window.location.port === '3000') {
        discoveredApiBase = '';
        return discoveredApiBase;
    }

    const cached = window.localStorage.getItem('ersApiBase');
    if (cached) {
        discoveredApiBase = cached;
        return discoveredApiBase;
    }

    const candidatePorts = [3000, 3001, 3002, 3003, 3004, 3005];

    for (let i = 0; i < candidatePorts.length; i += 1) {
        const base = `http://localhost:${candidatePorts[i]}`;
        try {
            const response = await fetch(`${base}/health`, { method: 'GET' });
            if (response.ok) {
                discoveredApiBase = base;
                window.localStorage.setItem('ersApiBase', base);
                return discoveredApiBase;
            }
        } catch (_error) {
            // Try next port.
        }
    }

    discoveredApiBase = 'http://localhost:3000';
    return discoveredApiBase;
}

function getMapBBoxQuery() {
    if (!window.map) {
        return '77.90,30.20,78.15,30.40';
    }

    const bounds = window.map.getBounds();
    if (!bounds || !bounds.isValid()) {
        return '77.90,30.20,78.15,30.40';
    }

    const south = bounds.getSouth();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const east = bounds.getEast();
    return `${west.toFixed(5)},${south.toFixed(5)},${east.toFixed(5)},${north.toFixed(5)}`;
}

async function fetchLiveTrafficData() {
    const bbox = getMapBBoxQuery();
    const apiBase = await discoverApiBaseUrl();
    const endpoint = `${apiBase}/api/live-traffic?bbox=${encodeURIComponent(bbox)}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error('Live traffic endpoint failed');
    }

    return response.json();
}

function getIncidentCategory(severity) {
    if (severity === 'critical') return 'heavy';
    if (severity === 'moderate') return 'moderate';
    return 'smooth';
}

function getIncidentColor(severity) {
    const category = getIncidentCategory(severity);
    if (category === 'heavy') return '#d32f2f';
    if (category === 'moderate') return '#f57c00';
    return '#2e7d32';
}

function drawLiveTrafficMarkers(incidents) {
    if (!window.map) return;

    clearLiveTrafficMarkers();

    incidents.slice(0, 40).forEach((incident) => {
        const color = getIncidentColor(incident.severity);
        const category = getIncidentCategory(incident.severity);
        const marker = L.circleMarker([incident.lat, incident.lng], {
            radius: 7,
            color: '#ffffff',
            weight: 1.5,
            fillColor: color,
            fillOpacity: 0.95
        }).addTo(window.map);

        marker.trafficCategory = category;

        const delayText = incident.delaySeconds > 0 ? `${Math.round(incident.delaySeconds / 60)} min delay` : 'No delay info';
        const roadText = [incident.from, incident.to].filter(Boolean).join(' to ') || 'Road segment';

        marker.bindPopup(`
            <div class="popup-title">Live Traffic Incident</div>
            <div class="popup-info">
                <p><strong>${incident.description || 'Incident'}</strong></p>
                <p>${roadText}</p>
                <p>${delayText}</p>
            </div>
        `);

        liveTrafficIncidentLayers.push(marker);
    });

    applyTrafficKeyFilters();
}

function clearLiveTrafficMarkers() {
    liveTrafficIncidentLayers.forEach((layer) => {
        if (window.map) {
            window.map.removeLayer(layer);
        }
    });
    liveTrafficIncidentLayers = [];
}

function startLiveTrafficPolling() {
    if (liveTrafficPollerId !== null) {
        clearInterval(liveTrafficPollerId);
    }

    liveTrafficPollerId = setInterval(() => {
        loadTrafficAlerts();
    }, 60000);

    if (window.map) {
        window.map.on('moveend', () => {
            loadTrafficAlerts();
        });
    }
}

function setupMapControls() {
    try {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const centerMapBtn = document.getElementById('center-map');

        if (!zoomInBtn || !zoomOutBtn || !centerMapBtn) {
            console.warn('Map control buttons not found');
            return;
        }

        zoomInBtn.addEventListener('click', () => {
            if (window.map && window.mapReady) window.map.zoomIn();
        });

        zoomOutBtn.addEventListener('click', () => {
            if (window.map && window.mapReady) window.map.zoomOut();
        });

        centerMapBtn.addEventListener('click', () => {
            if (window.map && window.mapReady) {
                window.map.setView([30.2865, 78.0158], 13);
            }
        });
    } catch (error) {
        console.error('Error setting up map controls:', error);
    }
}
