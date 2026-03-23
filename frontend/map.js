// Map initialization and management

let map;
window.map = null;
window.routeLayer = null;
window.mapReady = false;
const markers = {};

function initializeMap() {
    try {
        // Initialize Leaflet map
        map = L.map('map').setView([30.2865, 78.0158], 13);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            zoomControl: false,
            subdomains: 'abc',
            crossOrigin: true
        }).addTo(map);

        // Add custom map style
        addMapStyle();

        window.map = map;
        window.mapReady = true;
        
        // Trigger custom event to notify when map is ready
        window.dispatchEvent(new CustomEvent('mapReady'));
        
        return map;
    } catch (error) {
        console.error('Map initialization error:', error);
        window.mapReady = false;
    }
}

function addMapStyle() {
    // Add custom styling to the map
    const style = document.createElement('style');
    style.textContent = `
        .leaflet-container {
            background-color: #f0f0f0;
        }
        
        .leaflet-tile-loaded {
            filter: brightness(1.1) contrast(1.05);
        }

        .custom-marker {
            background: linear-gradient(135deg, #1f73e8, #1565c0);
            color: white;
            border: 3px solid white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            text-align: center;
            line-height: 30px;
        }

        .start-marker {
            background: linear-gradient(135deg, #2e7d32, #1b5e20);
        }

        .end-marker {
            background: linear-gradient(135deg, #d32f2f, #b71c1c);
        }

        .hospital-marker {
            background: linear-gradient(135deg, #1976d2, #1565c0);
        }

        .fire-marker {
            background: linear-gradient(135deg, #f57c00, #e65100);
        }

        .police-marker {
            background: linear-gradient(135deg, #7b1fa2, #6a1b9a);
        }

        .leaflet-popup {
            font-family: inherit;
        }

        .leaflet-popup-content {
            margin: 0;
            min-width: 150px;
        }

        .popup-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 4px;
            color: #1f1f1f;
        }

        .popup-info {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
        }
    `;
    document.head.appendChild(style);
}

function addMarker(lat, lng, name, type, icon) {
    const markerClass = `${type}-marker`;
    
    const customHTML = `<div class="custom-marker ${markerClass}">${icon}</div>`;
    
    const customIcon = L.divIcon({
        html: customHTML,
        className: '', // Remove default leaflet-marker-icon
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
    });

    const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
            <div class="popup-title">${name}</div>
            <div class="popup-info">
                <p><strong>Type:</strong> ${type}</p>
                <p><strong>Coords:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
            </div>
        `, { maxWidth: 250 });

    markers[name] = marker;
}

window.addMarker = addMarker;

// Handle window resize
window.addEventListener('resize', () => {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
});
