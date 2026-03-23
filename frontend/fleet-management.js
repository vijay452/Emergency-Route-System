/* ============================================
   FLEET MANAGEMENT & MULTI-VEHICLE TRACKING
   Dispatch Center Dashboard
   ============================================ */

let activeFleet = [];
let vehicleMarkers = {};
let vehicleRoutes = {};
let vehicleRouteLines = {};
let fleetDashboardVisible = false;

// ============================================
// 1. FLEET VEHICLE MANAGEMENT
// ============================================

class FleetVehicle {
    constructor(id, type, status = 'available') {
        this.id = id;
        this.type = type; // 'ambulance', 'fire', 'police'
        this.status = status; // 'available', 'dispatched', 'enroute', 'at-scene', 'returning'
        this.lat = 30.2886; // Default Dehradun center
        this.lng = 77.9984;
        this.speed = 0;
        this.heading = 0;
        this.currentRoute = null;
        this.destination = null;
        this.eta = '--';
        this.responseTime = 0;
        this.createdAt = Date.now();
        this.lastUpdate = Date.now();
        this.color = this.getColorByType(type);
    }

    getColorByType(type) {
        const colors = {
            'ambulance': '#2e7d32',
            'fire': '#d32f2f',
            'police': '#1f73e8'
        };
        return colors[type] || '#666';
    }

    updateLocation(lat, lng, speed = 0, heading = 0) {
        this.lat = lat;
        this.lng = lng;
        this.speed = speed;
        this.heading = heading;
        this.lastUpdate = Date.now();
    }

    setStatus(newStatus) {
        this.status = newStatus;
        if (newStatus === 'dispatched') {
            this.responseTime = Date.now();
        }
    }

    getResponseTimeMinutes() {
        if (this.status === 'dispatched') {
            return Math.round((Date.now() - this.responseTime) / 60000);
        }
        return 0;
    }
}

// Add sample vehicles
function initializeFleet() {
    activeFleet = [
        new FleetVehicle('AMB-001', 'ambulance', 'available'),
        new FleetVehicle('AMB-002', 'ambulance', 'available'),
        new FleetVehicle('FIRE-001', 'fire', 'available'),
        new FleetVehicle('POLICE-01', 'police', 'available'),
        new FleetVehicle('POLICE-02', 'police', 'available')
    ];

    // Scatter them around Dehradun
    activeFleet[0].updateLocation(30.2886, 77.9984); // ISBT
    activeFleet[1].updateLocation(30.3256, 78.0419); // Clock Tower
    activeFleet[2].updateLocation(30.2835, 78.0139); // Clement Town
    activeFleet[3].updateLocation(30.338, 77.9994); // FRI
    activeFleet[4].updateLocation(30.2709, 78.0181); // Clement Market

    activeFleet[0].setStatus('enroute');
    activeFleet[2].setStatus('at-scene');
}

// ============================================
// 2. DISPATCH VEHICLE TO ROUTE
// ============================================

function dispatchVehicleToRoute(vehicleId, sourceCoords, destCoords) {
    const vehicle = activeFleet.find(v => v.id === vehicleId);
    if (!vehicle) {
        showNotification('❌ Vehicle not found');
        return;
    }

    vehicle.updateLocation(sourceCoords.lat, sourceCoords.lng);
    vehicle.setStatus('dispatched');
    vehicle.destination = destCoords;

    showNotification(`🚑 ${vehicle.id} dispatched to destination!`);
    displayFleetDashboard();
}

// ============================================
// 3. MAP VISUALIZATION
// ============================================

function displayFleetVehicles() {
    if (!window.map) return;

    activeFleet.forEach(vehicle => {
        // Remove old marker
        if (vehicleMarkers[vehicle.id]) {
            window.map.removeLayer(vehicleMarkers[vehicle.id]);
        }

        // Create icon based on type and status
        const iconHTML = getVehicleIcon(vehicle);
        const customIcon = L.divIcon({
            html: iconHTML,
            className: `fleet-vehicle-marker ${vehicle.status}`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });

        // Add marker
        const marker = L.marker([vehicle.lat, vehicle.lng], { icon: customIcon })
            .addTo(window.map)
            .bindPopup(`
                <div style="font-weight: 700; color: ${vehicle.color};">${vehicle.id}</div>
                <div style="font-size: 11px; margin-top: 4px;">
                    <div>Status: <span style="text-transform: capitalize;">${vehicle.status}</span></div>
                    <div>Speed: ${vehicle.speed.toFixed(1)} km/h</div>
                    <div>Response: ${vehicle.getResponseTimeMinutes()} mins</div>
                </div>
            `);

        vehicleMarkers[vehicle.id] = marker;
    });
}

function getVehicleIcon(vehicle) {
    const statusColors = {
        'available': '#90caf9',
        'dispatched': '#ffd54f',
        'enroute': '#4fc3f7',
        'at-scene': '#ff7043',
        'returning': '#81c784'
    };

    const icons = {
        'ambulance': '🚑',
        'fire': '🚒',
        'police': '🚓'
    };

    const iconEmoji = icons[vehicle.type] || '🚗';
    const statusColor = statusColors[vehicle.status] || '#999';

    return `
        <div style="
            background: ${statusColor};
            border: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            position: relative;
        ">
            ${iconEmoji}
            <div style="
                position: absolute;
                top: -8px;
                right: -8px;
                background: ${vehicle.color};
                color: white;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                border: 1px solid white;
            ">●</div>
        </div>
    `;
}

// ============================================
// 4. FLEET DASHBOARD
// ============================================

function displayFleetDashboard() {
    fleetDashboardVisible = true;
    let dashboardModal = document.getElementById('fleet-dashboard-modal');
    
    if (!dashboardModal) {
        dashboardModal = document.createElement('div');
        dashboardModal.id = 'fleet-dashboard-modal';
        document.body.appendChild(dashboardModal);
    }

    const statusCounts = {
        available: activeFleet.filter(v => v.status === 'available').length,
        dispatched: activeFleet.filter(v => v.status === 'dispatched').length,
        enroute: activeFleet.filter(v => v.status === 'enroute').length,
        atScene: activeFleet.filter(v => v.status === 'at-scene').length,
        returning: activeFleet.filter(v => v.status === 'returning').length
    };

    dashboardModal.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        max-width: 400px;
        max-height: 500px;
        overflow-y: auto;
        border: 2px solid #1f73e8;
    `;

    dashboardModal.innerHTML = `
        <div style="padding: 20px; background: linear-gradient(135deg, #1f73e8 0%, #1565c0 100%); color: white; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <div>
                <h2 style="margin: 0; font-size: 18px; font-weight: 700;">🚨 Fleet Dashboard</h2>
                <div style="font-size: 12px; opacity: 0.9;">Total: ${activeFleet.length} vehicles</div>
            </div>
            <button onclick="hideFleetDashboard()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 6px; width: 30px; height: 30px; cursor: pointer; font-size: 16px; line-height: 1;">×</button>
        </div>

        <div style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #2e7d32;">${statusCounts.available}</div>
                <div style="font-size: 11px; color: #2e7d32; text-transform: uppercase;">Available</div>
            </div>
            <div style="background: #fff3e0; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #f57c00;">${statusCounts.dispatched}</div>
                <div style="font-size: 11px; color: #f57c00; text-transform: uppercase;">Dispatched</div>
            </div>
            <div style="background: #e0f2f1; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #00897b;">${statusCounts.enroute}</div>
                <div style="font-size: 11px; color: #00897b; text-transform: uppercase;">En Route</div>
            </div>
            <div style="background: #ffebee; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #d32f2f;">${statusCounts.atScene}</div>
                <div style="font-size: 11px; color: #d32f2f; text-transform: uppercase;">At Scene</div>
            </div>
        </div>

        <div style="padding: 16px; border-top: 1px solid #eee;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #333;">Active Vehicles</h3>
            ${activeFleet.map(vehicle => `
                <div style="
                    background: ${vehicle.status === 'available' ? '#f5f5f5' : 'linear-gradient(135deg, rgba(' + hexToRgb(vehicle.color) + ', 0.1) 0%, rgba(' + hexToRgb(vehicle.color) + ', 0.05) 100%)'}; 
                    padding: 10px; 
                    border-radius: 8px; 
                    margin-bottom: 8px;
                    border-left: 4px solid ${vehicle.color};
                    font-size: 12px;
                ">
                    <div style="font-weight: 700; color: ${vehicle.color};">
                        ${getVehicleTypeIcon(vehicle.type)} ${vehicle.id}
                        <span style="float: right; background: ${vehicle.color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                            ${vehicle.status.toUpperCase()}
                        </span>
                    </div>
                    <div style="margin-top: 4px; color: #666;">
                        Speed: ${vehicle.speed.toFixed(1)} km/h
                        ${vehicle.getResponseTimeMinutes() > 0 ? `| Response: ${vehicle.getResponseTimeMinutes()}m` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function hideFleetDashboard() {
    const dashboardModal = document.getElementById('fleet-dashboard-modal');
    if (dashboardModal) {
        dashboardModal.remove();
    }
    fleetDashboardVisible = false;
}

function toggleFleetDashboard() {
    if (fleetDashboardVisible) {
        hideFleetDashboard();
        return;
    }

    displayFleetDashboard();
    displayFleetVehicles();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
}

function getVehicleTypeIcon(type) {
    const icons = {
        'ambulance': '🚑',
        'fire': '🚒',
        'police': '🚓'
    };
    return icons[type] || '🚗';
}

// ============================================
// 5. SIMULATE VEHICLE MOVEMENT
// ============================================

function simulateFleetMovement() {
    setInterval(() => {
        activeFleet.forEach(vehicle => {
            if (vehicle.status === 'enroute' && vehicle.destination) {
                // Move toward destination
                const distance = calculateDistance(
                    vehicle.lat, vehicle.lng,
                    vehicle.destination.lat, vehicle.destination.lng
                );

                if (distance < 0.1) {
                    vehicle.setStatus('at-scene');
                    vehicle.speed = 0;
                } else {
                    const bearing = calculateBearing(
                        vehicle.lat, vehicle.lng,
                        vehicle.destination.lat, vehicle.destination.lng
                    );
                    const speed = 40 + Math.random() * 20; // 40-60 km/h
                    const moveDistance = (speed / 60) / 111; // Convert to degrees

                    vehicle.lat += Math.cos(bearing) * moveDistance;
                    vehicle.lng += Math.sin(bearing) * moveDistance;
                    vehicle.speed = speed;
                    vehicle.heading = bearing;
                }
            }
        });

        // Update display
        displayFleetVehicles();
        if (fleetDashboardVisible) {
            displayFleetDashboard();
        }
    }, 5000); // Update every 5 seconds
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
        Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    return Math.atan2(y, x);
}

// ============================================
// 6. QUICK DISPATCH BUTTON
// ============================================

function showQuickDispatchPanel() {
    let panel = document.getElementById('quick-dispatch-panel');
    
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'quick-dispatch-panel';
        document.body.appendChild(panel);
    }

    const availableVehicles = activeFleet.filter(v => v.status === 'available');

    panel.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        padding: 24px;
        max-width: 500px;
        animation: slideDown 0.3s;
    `;

    panel.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #1f73e8;">Quick Dispatch</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            ${availableVehicles.map(vehicle => `
                <button onclick="dispatchVehicleToRoute('${vehicle.id}', window.selectedStart, window.selectedEnd)" 
                    style="
                        background: linear-gradient(135deg, ${vehicle.color}20 0%, ${vehicle.color}10 100%);
                        border: 2px solid ${vehicle.color};
                        color: ${vehicle.color};
                        padding: 12px;
                        border-radius: 8px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.background = '${vehicle.color}30'"
                    onmouseout="this.style.background = 'linear-gradient(135deg, ${vehicle.color}20 0%, ${vehicle.color}10 100%)'"
                >
                    ${getVehicleTypeIcon(vehicle.type)} ${vehicle.id}
                </button>
            `).join('')}
        </div>
        <button onclick="document.getElementById('quick-dispatch-panel').remove()" 
            style="width: 100%; background: #f5f5f5; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Close
        </button>
    `;
}

// Export functions
window.initializeFleet = initializeFleet;
window.displayFleetVehicles = displayFleetVehicles;
window.displayFleetDashboard = displayFleetDashboard;
window.hideFleetDashboard = hideFleetDashboard;
window.toggleFleetDashboard = toggleFleetDashboard;
window.dispatchVehicleToRoute = dispatchVehicleToRoute;
window.showQuickDispatchPanel = showQuickDispatchPanel;
window.simulateFleetMovement = simulateFleetMovement;

// Navigation handler
function showFleetDashboard(event) {
    if (event) event.preventDefault();
    displayFleetDashboard();
    displayFleetVehicles();
}

window.showFleetDashboard = showFleetDashboard;

// Initialize fleet when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeFleet();
        displayFleetVehicles();
        simulateFleetMovement();
    }, 1500);
});
