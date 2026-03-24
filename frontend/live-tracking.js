/* ============================================
   LIVE TRACKING & REAL-TIME TRAFFIC SYSTEM
   Location Tracking, Route Following, Traffic Updates
   ============================================ */

let liveTrackingActive = false;
let liveLocationMarker = null;
let currentPositionOnRoute = 0;
let trackingInterval = null;
let geolocationWatchId = null;
let positionHistoryForSpeed = [];
let isSimulatedTracking = false;
let simulatedPosition = {
    index: 0,
    lat: 0,
    lng: 0,
    progress: 0
};

// ============================================
// 1. LIVE LOCATION TRACKING (Real Geolocation)
// ============================================

function startRealLocationTracking(onLocationUpdate) {
    if (!navigator.geolocation) {
        showNotification('❌ Geolocation not available on this device');
        return false;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    geolocationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const reportedSpeedMps = Number.isFinite(position.coords.speed) ? position.coords.speed : null;
            const accuracy = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : 100;
            const timestamp = Number.isFinite(position.timestamp) ? position.timestamp : Date.now();
            const speedKmh = normalizeLiveSpeed(lat, lng, timestamp, reportedSpeedMps, accuracy);

            updateLiveLocationMarker(lat, lng);
            
            if (onLocationUpdate) {
                onLocationUpdate({
                    lat: lat,
                    lng: lng,
                    speedMps: reportedSpeedMps,
                    speedKmh: speedKmh,
                    accuracy: accuracy,
                    timestamp: timestamp
                });
            }

            // Calculate distance to destination if route active
            if (currentRoute && currentRoute.endCoord) {
                const distanceToEnd = calculateDistance(
                    lat, lng,
                    currentRoute.endCoord.lat,
                    currentRoute.endCoord.lng
                );
                updateDistanceToDestination(distanceToEnd);
            }
        },
        (error) => {
            console.warn('Geolocation error:', error);
            startSimulatedTracking();
        },
        options
    );

    liveTrackingActive = true;
    positionHistoryForSpeed = [];
    showNotification('📍 Live tracking started!');
    return true;
}

function normalizeLiveSpeed(lat, lng, timestamp, reportedSpeedMps, accuracyMeters) {
    const historyPoint = {
        lat: lat,
        lng: lng,
        timestamp: timestamp
    };

    let speedKmh = Number.isFinite(reportedSpeedMps)
        ? Math.max(0, reportedSpeedMps * 3.6)
        : 0;

    const previousPoint = positionHistoryForSpeed[positionHistoryForSpeed.length - 1];
    if (previousPoint) {
        const dtSeconds = (timestamp - previousPoint.timestamp) / 1000;
        if (dtSeconds > 0.2) {
            const distanceKm = calculateDistance(previousPoint.lat, previousPoint.lng, lat, lng);
            const distanceMeters = distanceKm * 1000;
            const derivedSpeedKmh = (distanceMeters / dtSeconds) * 3.6;

            // If GPS displacement is within expected jitter range, treat as stationary.
            const jitterThresholdMeters = Math.max(8, accuracyMeters * 0.35);
            if (distanceMeters <= jitterThresholdMeters) {
                speedKmh = 0;
            } else if (!Number.isFinite(reportedSpeedMps)) {
                speedKmh = derivedSpeedKmh;
            }
        }
    }

    // Additional smoothing to avoid false speed spikes when user is steady.
    const minMovingSpeed = accuracyMeters > 25 ? 6 : 2;
    if (speedKmh < minMovingSpeed || (accuracyMeters > 60 && !Number.isFinite(reportedSpeedMps))) {
        speedKmh = 0;
    }

    positionHistoryForSpeed.push(historyPoint);
    if (positionHistoryForSpeed.length > 6) {
        positionHistoryForSpeed.shift();
    }

    return Math.min(speedKmh, 140);
}

function updateLiveLocationMarker(lat, lng) {
    if (!window.map) return;

    if (liveLocationMarker) {
        liveLocationMarker.setLatLng([lat, lng]);
    } else {
        liveLocationMarker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#1f73e8',
            color: '#ffffff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8,
            className: 'live-location-marker'
        }).addTo(window.map);

        // Add pulse animation
        const pulseMarker = L.circleMarker([lat, lng], {
            radius: 12,
            fillColor: '#1f73e8',
            color: '#1f73e8',
            weight: 1,
            opacity: 0.3,
            fillOpacity: 0.1,
            className: 'live-location-pulse'
        }).addTo(window.map);

        // Pan map to follow
        window.map.setView([lat, lng], window.map.getZoom());
    }
}

// ============================================
// 2. SIMULATED TRACKING (Fallback)
// ============================================

function startSimulatedTracking() {
    if (!currentRoute || currentRoute.routes.length === 0) {
        showNotification('ℹ️ Please find a route first');
        return;
    }

    isSimulatedTracking = true;
    showNotification('🎬 Using simulated tracking (Real GPS unavailable)');
    
    const primaryRoute = currentRoute.routes[selectedRouteIndex];
    const routeCoords = primaryRoute.coordinates;

    if (!routeCoords || routeCoords.length === 0) {
        showNotification('❌ Route coordinates not available');
        return;
    }

    simulatedPosition = {
        index: 0,
        lat: routeCoords[0][0],
        lng: routeCoords[0][1],
        progress: 0,
        coords: routeCoords
    };

    // Simulate movement every 2 seconds
    trackingInterval = setInterval(() => {
        simulateNextPosition();
    }, 2000);

    liveTrackingActive = true;
}

function simulateNextPosition() {
    if (!simulatedPosition.coords) return;

    const coords = simulatedPosition.coords;
    const totalPoints = coords.length;

    // Move to next position
    simulatedPosition.index += 1;

    if (simulatedPosition.index >= totalPoints) {
        // Reached destination
        stopLiveTracking();
        showNotification('✅ Destination reached!');
        playAlertSound('success');
        return;
    }

    simulatedPosition.lat = coords[simulatedPosition.index][0];
    simulatedPosition.lng = coords[simulatedPosition.index][1];
    simulatedPosition.progress = (simulatedPosition.index / totalPoints) * 100;

    // Update marker and UI
    updateLiveLocationMarker(simulatedPosition.lat, simulatedPosition.lng);
    const simulatedSpeedKmh = 36 + Math.random() * 14;
    updateLiveTrackingUI(simulatedPosition.lat, simulatedPosition.lng, {
        speedKmh: simulatedSpeedKmh,
        accuracy: 999,
        timestamp: Date.now()
    });
    
    // Check traffic at current location
    checkTrafficAtLocation(simulatedPosition.lat, simulatedPosition.lng);
}

// ============================================
// 3. LIVE TRACKING UI UPDATES
// ============================================

function updateLiveTrackingUI(lat, lng, telemetry = {}) {
    let trackingPanel = document.getElementById('live-tracking-panel');
    
    if (!trackingPanel) {
        trackingPanel = document.createElement('div');
        trackingPanel.id = 'live-tracking-panel';
        trackingPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(135deg, rgba(31, 115, 232, 0.95) 0%, rgba(21, 101, 192, 0.95) 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            min-width: 300px;
            border: 2px solid rgba(31, 115, 232, 0.5);
            animation: slideInLeft 0.3s;
        `;
        document.body.appendChild(trackingPanel);
    }

    const currentSpeedKmh = Number.isFinite(telemetry.speedKmh) ? telemetry.speedKmh : 0;
    const speed = currentSpeedKmh.toFixed(1);
    const distanceRemaining = calculateDistance(lat, lng, currentRoute.endCoord.lat, currentRoute.endCoord.lng);
    const effectiveSpeed = currentSpeedKmh > 0 ? currentSpeedKmh : 30;
    const timeRemaining = (distanceRemaining / effectiveSpeed * 60).toFixed(1);
    const accuracy = isSimulatedTracking ? 'Simulated' : 'High';

    trackingPanel.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 700;">🚗 Live Tracking Active</h3>
            <button onclick="stopLiveTracking()" style="background: rgba(255, 255, 255, 0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">Stop</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                <div style="font-size: 11px; opacity: 0.8; text-transform: uppercase;">Current Speed</div>
                <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">${speed} km/h</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                <div style="font-size: 11px; opacity: 0.8; text-transform: uppercase;">Distance Left</div>
                <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">${distanceRemaining.toFixed(1)} km</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                <div style="font-size: 11px; opacity: 0.8; text-transform: uppercase;">Time Remaining</div>
                <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">${timeRemaining} min</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                <div style="font-size: 11px; opacity: 0.8; text-transform: uppercase;">Accuracy</div>
                <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">${accuracy}</div>
            </div>
        </div>

        <div id="live-traffic-status" style="background: rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.6;">
            <span style="opacity: 0.8;">📊 Traffic Condition:</span> <span style="font-weight: 600;">Loading...</span>
        </div>

        <div style="margin-top: 12px; width: 100%; height: 4px; background: rgba(255, 255, 255, 0.2); border-radius: 2px; overflow: hidden;">
            <div id="progress-bar" style="width: ${isSimulatedTracking ? ((simulatedPosition.index / simulatedPosition.coords.length) * 100) : 0}%; height: 100%; background: #4fc3f7; transition: width 0.3s;"></div>
        </div>
        <div style="text-align: center; margin-top: 8px; font-size: 11px; opacity: 0.8;">
            <span id="progress-text">Starting journey...</span>
        </div>
    `;
}

// ============================================
// 4. REAL-TIME TRAFFIC MONITORING
// ============================================

function checkTrafficAtLocation(lat, lng) {
    const trafficStatus = getTrafficConditionAtLocation(lat, lng);
    const statusElement = document.getElementById('live-traffic-status');
    
    if (statusElement) {
        let statusHTML = '';
        let statusColor = '';
        let statusIcon = '';
        
        switch (trafficStatus.condition) {
            case 'smooth':
                statusIcon = '🟢';
                statusColor = '#2e7d32';
                statusHTML = `${statusIcon} Smooth traffic ahead - No delays`;
                break;
            case 'moderate':
                statusIcon = '🟡';
                statusColor = '#f57c00';
                statusHTML = `${statusIcon} Moderate traffic - Minor delays`;
                break;
            case 'heavy':
                statusIcon = '🔴';
                statusColor = '#d32f2f';
                statusHTML = `${statusIcon} Heavy traffic ahead - Possible delays`;
                break;
        }

        statusElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="opacity: 0.8;">📊 Traffic Condition:</span>
                <span style="font-weight: 600; font-size: 14px;">${statusHTML}</span>
            </div>
        `;
    }
}

function getTrafficConditionAtLocation(lat, lng) {
    // Simulate traffic based on time and location
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    
    // Random variation for different segments
    const rand = Math.random();
    
    let condition = 'smooth';
    
    if (isPeakHour && rand > 0.6) {
        condition = rand > 0.85 ? 'heavy' : 'moderate';
    } else if (rand > 0.7) {
        condition = 'moderate';
    }
    
    return {
        condition: condition,
        timestamp: Date.now(),
        lat: lat,
        lng: lng
    };
}

function updateDistanceToDestination(distanceKm) {
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        const percentage = 100 - Math.min(100, (distanceKm / (currentRoute.routes[selectedRouteIndex].distance / 1000)) * 100);
        progressText.textContent = `${percentage.toFixed(0)}% Complete - ${distanceKm.toFixed(1)}km remaining`;
    }
}

// ============================================
// 5. TRAFFIC ALERTS DURING TRAVEL
// ============================================

function monitorAheadTraffic() {
    if (!liveTrackingActive || !currentRoute) return;

    const checkInterval = setInterval(() => {
        if (!liveTrackingActive) {
            clearInterval(checkInterval);
            return;
        }

        // Check for incidents ahead
        if (latestLiveIncidents && latestLiveIncidents.length > 0) {
            latestLiveIncidents.forEach(incident => {
                const distanceToIncident = calculateDistance(
                    simulatedPosition.lat,
                    simulatedPosition.lng,
                    incident.lat,
                    incident.lng
                );

                // Alert if incident is within 1km ahead
                if (distanceToIncident < 1 && distanceToIncident > 0) {
                    showTrafficAlert(incident);
                    playAlertSound('alarm');
                }
            });
        }
    }, 5000); // Check every 5 seconds
}

function showTrafficAlert(incident) {
    let alertBox = document.getElementById('traffic-alert-notification');
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'traffic-alert-notification';
        document.body.appendChild(alertBox);
    }

    alertBox.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, rgba(211, 47, 47, 0.95) 0%, rgba(192, 0, 0, 0.95) 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        min-width: 300px;
        border-left: 4px solid #ff6b6b;
        animation: slideInRight 0.3s;
        font-weight: 600;
    `;

    alertBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🚨</span>
            <div>
                <div style="font-weight: 700">Traffic Alert Ahead!</div>
                <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">${incident.type} - ${incident.severity} condition</div>
            </div>
        </div>
    `;

    setTimeout(() => {
        alertBox.style.opacity = '0';
        alertBox.style.transition = 'opacity 0.3s';
        setTimeout(() => alertBox.remove(), 300);
    }, 5000);
}

// ============================================
// 6. STOP TRACKING
// ============================================

function stopLiveTracking() {
    liveTrackingActive = false;
    isSimulatedTracking = false;
    
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }

    if (geolocationWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geolocationWatchId);
        geolocationWatchId = null;
    }

    positionHistoryForSpeed = [];

    if (liveLocationMarker) {
        window.map.removeLayer(liveLocationMarker);
        liveLocationMarker = null;
    }

    const trackingPanel = document.getElementById('live-tracking-panel');
    if (trackingPanel) {
        trackingPanel.style.opacity = '0';
        trackingPanel.style.transition = 'opacity 0.3s';
        setTimeout(() => trackingPanel.remove(), 300);
    }

    showNotification('⏹️ Live tracking stopped');
}

// ============================================
// 7. HELPER FUNCTIONS
// ============================================

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ============================================
// 8. START TRACKING FROM UI
// ============================================

function startLiveTrackingFromRoute() {
    if (!currentRoute || currentRoute.routes.length === 0) {
        showNotification('❌ Please find a route first');
        return;
    }

    // Try real geolocation first, fallback to simulated
    const realLocationStarted = startRealLocationTracking((location) => {
        updateLiveTrackingUI(location.lat, location.lng, location);
        checkTrafficAtLocation(location.lat, location.lng);
    });

    if (!realLocationStarted) {
        startSimulatedTracking();
    }

    // Start monitoring traffic ahead
    monitorAheadTraffic();
}

// Export functions
window.startLiveTrackingFromRoute = startLiveTrackingFromRoute;
window.stopLiveTracking = stopLiveTracking;
window.updateLiveTrackingUI = updateLiveTrackingUI;
