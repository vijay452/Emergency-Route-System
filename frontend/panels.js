// Panel Management - Dashboard, History, Settings

let cachedRemoteHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    initializePanelHandlers();
    initializeSettings();
    updateDashboard();
});

function initializePanelHandlers() {
    try {
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link[data-panel]');
            if (!navLink) return;

            e.preventDefault();
            const panelName = navLink.getAttribute('data-panel');

            if (panelName === 'dashboard') {
                updateDashboard();
                openPanel('dashboard-panel');
                return;
            }

            if (panelName === 'history') {
                loadHistory();
                openPanel('history-panel');
                return;
            }

            if (panelName === 'settings') {
                initializeSettings();
                openPanel('settings-panel');
                setTimeout(() => setupToggles(), 50);
            }
        });

        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => closePanels());
        }

        document.querySelectorAll('.panel-close').forEach((btn) => {
            btn.addEventListener('click', () => closePanels());
        });

        setupToggles();
        setupHistoryControls();
    } catch (error) {
        console.error('Error initializing panel handlers:', error);
    }
}

function setupHistoryControls() {
    const searchInput = document.getElementById('history-search');
    const filterType = document.getElementById('history-filter-type');

    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', () => renderHistoryList(cachedRemoteHistory));
    }

    if (filterType && !filterType.dataset.bound) {
        filterType.dataset.bound = 'true';
        filterType.addEventListener('change', () => renderHistoryList(cachedRemoteHistory));
    }
}

function openPanel(panelId) {
    try {
        const panel = document.getElementById(panelId);
        const overlay = document.getElementById('modal-overlay');

        if (panel && overlay) {
            closePanels(panelId);
            panel.style.display = 'block';
            overlay.style.display = 'block';

            requestAnimationFrame(() => {
                panel.classList.add('panel-open');
            });
        }
    } catch (error) {
        console.error('Error opening panel:', error);
    }
}

function closePanel(panelId) {
    try {
        const panel = document.getElementById(panelId);
        const overlay = document.getElementById('modal-overlay');

        if (panel) {
            panel.classList.remove('panel-open');
            if (panel.__hideTimer) {
                clearTimeout(panel.__hideTimer);
            }
            setTimeout(() => {
                panel.style.display = 'none';
                if (overlay) overlay.style.display = 'none';
            }, 300);
        }
    } catch (error) {
        console.error('Error closing panel:', error);
    }
}

function closePanels(exceptPanelId = null) {
    try {
        const panels = document.querySelectorAll('.side-panel');
        const overlay = document.getElementById('modal-overlay');

        panels.forEach((panel) => {
            if (exceptPanelId && panel.id === exceptPanelId) return;

            panel.classList.remove('panel-open');
            if (panel.__hideTimer) {
                clearTimeout(panel.__hideTimer);
            }
            panel.__hideTimer = setTimeout(() => {
                panel.style.display = 'none';
            }, 300);
        });

        if (overlay && !exceptPanelId) overlay.style.display = 'none';
    } catch (error) {
        console.error('Error closing panels:', error);
    }
}

async function updateDashboard() {
    try {
        const history = await getUnifiedHistory();

        if (history.length === 0) {
            document.getElementById('total-routes').textContent = '0';
            document.getElementById('time-saved').textContent = '0 min';
            document.getElementById('avg-speed').textContent = '0 km/h';
            document.getElementById('total-distance').textContent = '0 km';
            const lastRouteEl = document.getElementById('last-route-time');
            if (lastRouteEl) lastRouteEl.textContent = 'Never';
            return;
        }

        const totalTime = history.reduce((sum, route) => {
            const distance = Number(route.distance || 0);
            const recordedTime = Number(route.rawTime || route.time || 0);
            const minimumCityTime = distance > 0 ? (distance / 70) * 60 : 0;
            return sum + Math.max(recordedTime, minimumCityTime);
        }, 0);
        const totalDistance = history.reduce((sum, route) => sum + Number(route.distance || 0), 0);
        const avgSpeed = (totalDistance > 0 && totalTime > 0)
            ? Math.round((totalDistance / (totalTime / 60)) * 10) / 10
            : 0;
        const timeSaved = Math.round(history.length * 5);

        document.getElementById('total-routes').textContent = history.length;
        document.getElementById('time-saved').textContent = `${timeSaved} min`;
        document.getElementById('avg-speed').textContent = `${avgSpeed} km/h`;
        document.getElementById('total-distance').textContent = `${totalDistance.toFixed(1)} km`;

        const latest = history[0];
        const lastRouteEl = document.getElementById('last-route-time');
        if (lastRouteEl && latest) {
            const latestTime = latest.createdAt || latest.timestamp || latest.date;
            lastRouteEl.textContent = latestTime ? new Date(latestTime).toLocaleString() : 'Unknown';
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function addToHistory(route) {
    try {
        const history = JSON.parse(localStorage.getItem('routeHistory') || '[]');
        const historyEntry = {
            id: Date.now(),
            from: route.start || 'Unknown',
            to: route.end || 'Unknown',
            distance: route.distance || 0,
            time: route.time || 0,
            rawTime: route.rawTime || route.time || 0,
            emergencyType: route.emergencyType || window.currentEmergencyType || 'ambulance',
            status: route.status || 'Local history',
            roads: Array.isArray(route.path) ? route.path : [],
            date: new Date().toLocaleString(),
            timestamp: Date.now()
        };

        history.unshift(historyEntry);
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem('routeHistory', JSON.stringify(history));
        updateDashboard();
    } catch (error) {
        console.error('Error adding to history:', error);
    }
}

async function loadHistory() {
    try {
        cachedRemoteHistory = await getUnifiedHistory();
        updateHistorySummary(cachedRemoteHistory);
        renderHistoryList(cachedRemoteHistory);
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function renderHistoryList(history) {
    const historyList = document.getElementById('history-list');
    const sourceNote = document.getElementById('history-source-note');

    if (!historyList) return;

    const query = (document.getElementById('history-search')?.value || '').trim().toLowerCase();
    const typeFilter = (document.getElementById('history-filter-type')?.value || 'all').toLowerCase();

    const filtered = history.filter((entry) => {
        const from = String(entry.from || '').toLowerCase();
        const to = String(entry.to || '').toLowerCase();
        const matchesQuery = !query || from.includes(query) || to.includes(query);
        const matchesType = typeFilter === 'all' || String(entry.emergencyType || '').toLowerCase() === typeFilter;
        return matchesQuery && matchesType;
    });

    if (sourceNote) {
        sourceNote.textContent = history.__sourceNote || (filtered.length === history.length
            ? `Showing ${filtered.length} saved routes`
            : `Showing ${filtered.length} of ${history.length} saved routes`);
    }

    if (filtered.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-folder-open"></i>
                <p>No matching routes found</p>
                <small>Try a different search term or emergency type filter</small>
            </div>
        `;
        return;
    }

    historyList.innerHTML = filtered.map((entry, index) => {
        const routeText = `${entry.from || 'Unknown'} → ${entry.to || 'Unknown'}`;
        const emergencyType = String(entry.emergencyType || 'ambulance').toLowerCase();
        const status = entry.status || 'Saved';
        const roads = Array.isArray(entry.roads) && entry.roads.length > 0
            ? entry.roads.slice(0, 3).join(' • ')
            : 'Road-by-road detail unavailable';
        const createdAt = entry.createdAt || entry.timestamp || entry.date;

        return `
            <div class="history-item">
                <div class="history-item-topline">
                    <span class="history-type-badge ${emergencyType}">
                        <i class="fas ${getEmergencyTypeIcon(emergencyType)}"></i> ${emergencyType}
                    </span>
                    <span class="history-status-badge">${status}</span>
                </div>
                <div class="history-item-header">
                    <div class="history-item-route">
                        <i class="fas fa-arrow-right"></i>
                        <span class="route-text">${routeText}</span>
                    </div>
                    <button class="history-delete" onclick="deleteHistoryEntry('${entry.id || index}', event)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="history-item-details">
                    <span><i class="fas fa-road"></i> ${Number(entry.distance || 0).toFixed(1)} km</span>
                    <span><i class="fas fa-clock"></i> ${Number(entry.time || 0).toFixed(0)} min</span>
                    <span><i class="fas fa-calendar"></i> ${createdAt ? new Date(createdAt).toLocaleString() : 'Unknown'}</span>
                </div>
                <div class="history-road-preview">
                    <strong>Roads:</strong> ${roads}
                </div>
                <div class="history-item-actions">
                    <button class="history-inline-btn primary" onclick="loadHistoryRoute('${entry.id || index}')">Reuse Route</button>
                    <button class="history-inline-btn secondary" onclick="copyHistoryRoute('${entry.id || index}')">Copy Details</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateHistorySummary(history) {
    const totalEl = document.getElementById('history-total-count');
    const avgTimeEl = document.getElementById('history-average-time');
    const avgDistanceEl = document.getElementById('history-average-distance');

    if (!totalEl || !avgTimeEl || !avgDistanceEl) return;

    if (!history.length) {
        totalEl.textContent = '0';
        avgTimeEl.textContent = '0 min';
        avgDistanceEl.textContent = '0 km';
        return;
    }

    const totalTime = history.reduce((sum, entry) => sum + Number(entry.time || 0), 0);
    const totalDistance = history.reduce((sum, entry) => sum + Number(entry.distance || 0), 0);

    totalEl.textContent = String(history.length);
    avgTimeEl.textContent = `${(totalTime / history.length).toFixed(1)} min`;
    avgDistanceEl.textContent = `${(totalDistance / history.length).toFixed(1)} km`;
}

async function getUnifiedHistory() {
    const localHistory = getLocalHistory();

    try {
        const remoteHistory = await fetchRemoteHistory();
        const merged = mergeHistory(remoteHistory, localHistory);
        merged.__sourceNote = `Connected to database. Showing ${remoteHistory.length} remote entries${localHistory.length ? ` and ${localHistory.length} local cached entries` : ''}.`;
        return merged;
    } catch (_error) {
        localHistory.__sourceNote = 'Database history is unavailable right now. Showing local cached history only.';
        return localHistory;
    }
}

function getLocalHistory() {
    const history = JSON.parse(localStorage.getItem('routeHistory') || '[]');
    return history.map((entry) => ({
        id: entry.id,
        from: entry.from,
        to: entry.to,
        distance: entry.distance,
        time: entry.time,
        rawTime: entry.rawTime,
        createdAt: entry.timestamp || entry.date,
        emergencyType: entry.emergencyType || 'ambulance',
        status: entry.status || 'Local history',
        roads: Array.isArray(entry.roads) ? entry.roads : []
    }));
}

async function fetchRemoteHistory() {
    const apiBase = await discoverApiBaseUrl();
    const response = await fetch(`${apiBase}/api/route-history`);

    if (!response.ok) {
        throw new Error('Failed to fetch route history');
    }

    const payload = await response.json();
    return Array.isArray(payload)
        ? payload.map((entry) => ({
            id: entry.id,
            from: entry.start,
            to: entry.end,
            distance: Number(entry.distanceKm || 0),
            time: Number(entry.estimatedTimeMin || 0),
            rawTime: Number(entry.rawTimeMin || entry.estimatedTimeMin || 0),
            createdAt: entry.createdAt,
            emergencyType: entry.emergencyType || 'ambulance',
            status: entry.status || 'Saved',
            roads: Array.isArray(entry.roads) ? entry.roads : [],
            startPoint: entry.startPoint || null,
            endPoint: entry.endPoint || null
        }))
        : [];
}

function mergeHistory(remoteHistory, localHistory) {
    const merged = [];
    const seen = new Set();

    [...remoteHistory, ...localHistory].forEach((entry) => {
        const key = `${entry.from}|${entry.to}|${entry.createdAt || entry.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(entry);
    });

    merged.sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));
    return merged;
}

function loadHistoryRoute(index) {
    try {
        const entry = cachedRemoteHistory.find((item) => String(item.id) === String(index))
            || cachedRemoteHistory[Number(index)];

        if (entry) {
            const fromInput = document.getElementById('location-from');
            const toInput = document.getElementById('location-to');

            if (fromInput) fromInput.value = entry.from || '';
            if (toInput) toInput.value = entry.to || '';

            closePanels();

            const findBtn = document.getElementById('find-route-btn');
            if (findBtn) findBtn.click();
        }
    } catch (error) {
        console.error('Error loading history route:', error);
    }
}

function copyHistoryRoute(index) {
    const entry = cachedRemoteHistory.find((item) => String(item.id) === String(index))
        || cachedRemoteHistory[Number(index)];

    if (!entry) return;

    const text = [
        `From: ${entry.from || 'Unknown'}`,
        `To: ${entry.to || 'Unknown'}`,
        `Emergency Type: ${entry.emergencyType || 'ambulance'}`,
        `Distance: ${Number(entry.distance || 0).toFixed(1)} km`,
        `Estimated Time: ${Number(entry.time || 0).toFixed(1)} min`,
        `Status: ${entry.status || 'Saved'}`
    ].join('\n');

    navigator.clipboard?.writeText(text).catch(() => {});
}

function deleteHistoryEntry(index, event) {
    try {
        event.stopPropagation();

        const history = JSON.parse(localStorage.getItem('routeHistory') || '[]');
        const matchedIndex = history.findIndex((item) => String(item.id) === String(index));
        const fallbackIndex = Number(index);

        if (matchedIndex >= 0) {
            history.splice(matchedIndex, 1);
        } else if (!Number.isNaN(fallbackIndex) && history[fallbackIndex]) {
            history.splice(fallbackIndex, 1);
        }

        localStorage.setItem('routeHistory', JSON.stringify(history));
        loadHistory();
        updateDashboard();
    } catch (error) {
        console.error('Error deleting history entry:', error);
    }
}

function clearAllHistory() {
    try {
        if (confirm('Are you sure you want to clear all local history? Database entries will remain untouched.')) {
            localStorage.removeItem('routeHistory');
            loadHistory();
            updateDashboard();
        }
    } catch (error) {
        console.error('Error clearing history:', error);
    }
}

async function refreshRemoteHistory() {
    await loadHistory();
    await updateDashboard();
}

function getEmergencyTypeIcon(type) {
    if (type === 'fire') return 'fa-fire-extinguisher';
    if (type === 'police') return 'fa-shield-halved';
    return 'fa-truck-medical';
}

function initializeSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');

        const themToggle = document.getElementById('theme-toggle');
        const avoidTraffic = document.getElementById('avoid-traffic');
        const showAlternatives = document.getElementById('show-alternatives');
        const notifications = document.getElementById('notifications');
        const enableAnalytics = document.getElementById('enable-analytics');

        if (themToggle) {
            themToggle.checked = settings.darkMode || false;
        }
        if (avoidTraffic) {
            avoidTraffic.checked = settings.avoidTraffic !== false;
        }
        if (showAlternatives) {
            showAlternatives.checked = settings.showAlternatives !== false;
        }
        if (notifications) {
            notifications.checked = settings.notifications !== false;
        }
        if (enableAnalytics) {
            enableAnalytics.checked = settings.enableAnalytics !== false;
        }

        if (settings.darkMode) {
            applyDarkMode();
        } else {
            removeDarkMode();
        }

        setupToggles();
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
}

function setupToggles() {
    try {
        const toggles = document.querySelectorAll('.toggle-input');

        toggles.forEach((toggle) => {
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);

            newToggle.addEventListener('change', () => {
                saveSettings();

                if (newToggle.id === 'theme-toggle') {
                    if (newToggle.checked) {
                        applyDarkMode();
                    } else {
                        removeDarkMode();
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error setting up toggles:', error);
    }
}

function saveSettings() {
    try {
        const settings = {
            darkMode: document.getElementById('theme-toggle').checked,
            avoidTraffic: document.getElementById('avoid-traffic').checked,
            showAlternatives: document.getElementById('show-alternatives').checked,
            notifications: document.getElementById('notifications').checked,
            enableAnalytics: document.getElementById('enable-analytics')
                ? document.getElementById('enable-analytics').checked
                : true
        };

        localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

function applyDarkMode() {
    try {
        document.body.style.backgroundColor = '#0d0d0d';
        document.body.style.color = '#ffffff';
        document.documentElement.style.setProperty('--bg-white', '#1a1a1a');
        document.documentElement.style.setProperty('--text-dark', '#ffffff');
        document.documentElement.style.setProperty('--light-gray', '#2a2a2a');
        document.documentElement.style.setProperty('--border-color', '#3a3a3a');

        if (!document.getElementById('dark-mode-stylesheet')) {
            const darkModeStyle = document.createElement('style');
            darkModeStyle.id = 'dark-mode-stylesheet';
            darkModeStyle.textContent = `
                body.dark-mode {
                    background: #0d0d0d;
                    color: #ffffff;
                }
                body.dark-mode .container {
                    background: #1a1a1a;
                }
                body.dark-mode .side-panel {
                    background: linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%);
                }
                body.dark-mode .panel-content,
                body.dark-mode .sidebar,
                body.dark-mode .results-section,
                body.dark-mode .traffic-section,
                body.dark-mode .search-section {
                    background: #1a1a1a;
                    color: #ffffff;
                }
                body.dark-mode .dashboard-stat,
                body.dark-mode .history-item,
                body.dark-mode .history-summary-card,
                body.dark-mode .result-item,
                body.dark-mode .setting-item,
                body.dark-mode .about-info {
                    background: #2a2a2a;
                    border-color: #3a3a3a;
                    color: #ffffff;
                }
                body.dark-mode .history-search-input,
                body.dark-mode .history-filter-select,
                body.dark-mode input,
                body.dark-mode select,
                body.dark-mode textarea {
                    background: #2a2a2a;
                    color: #ffffff;
                    border-color: #3a3a3a;
                }
                body.dark-mode .history-source-note,
                body.dark-mode .map-pick-status,
                body.dark-mode .corridor-status {
                    background: rgba(31, 115, 232, 0.15);
                    color: #c7defa;
                    border-color: rgba(31, 115, 232, 0.3);
                }
                body.dark-mode .btn-secondary,
                body.dark-mode .history-inline-btn.secondary {
                    background: #3a3a3a;
                    color: #ffffff;
                    border-color: #4a4a4a;
                }
                body.dark-mode .traffic-legend,
                body.dark-mode .alerts-container,
                body.dark-mode .route-path-item {
                    background: #252525;
                    color: #ffffff;
                }
                body.dark-mode .navbar {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                }
                body.dark-mode .result-item .label,
                body.dark-mode .help-text,
                body.dark-mode .history-road-preview,
                body.dark-mode .history-source-note {
                    color: #bbbbbb;
                }
            `;
            document.head.appendChild(darkModeStyle);
        }

        document.body.classList.add('dark-mode');
    } catch (error) {
        console.error('Error applying dark mode:', error);
    }
}

function removeDarkMode() {
    try {
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
        document.documentElement.style.setProperty('--bg-white', '#ffffff');
        document.documentElement.style.setProperty('--text-dark', '#1f1f1f');
        document.documentElement.style.setProperty('--light-gray', '#f5f7fa');
        document.documentElement.style.setProperty('--border-color', '#e0e0e0');

        document.body.classList.remove('dark-mode');

        const darkModeStyle = document.getElementById('dark-mode-stylesheet');
        if (darkModeStyle) {
            darkModeStyle.remove();
        }
    } catch (error) {
        console.error('Error removing dark mode:', error);
    }
}

function clearAllSettings() {
    try {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            localStorage.removeItem('appSettings');

            document.getElementById('theme-toggle').checked = false;
            document.getElementById('avoid-traffic').checked = true;
            document.getElementById('show-alternatives').checked = true;
            document.getElementById('notifications').checked = true;

            removeDarkMode();
            saveSettings();
            alert('Settings reset to defaults!');
        }
    } catch (error) {
        console.error('Error clearing settings:', error);
    }
}

window.openPanel = openPanel;
window.closePanel = closePanel;
window.closePanels = closePanels;
window.loadHistoryRoute = loadHistoryRoute;
window.deleteHistoryEntry = deleteHistoryEntry;
window.clearAllHistory = clearAllHistory;
window.initializeSettings = initializeSettings;
window.setupToggles = setupToggles;
window.clearAllSettings = clearAllSettings;
window.saveSettings = saveSettings;
window.addToHistory = addToHistory;
window.refreshRemoteHistory = refreshRemoteHistory;
window.copyHistoryRoute = copyHistoryRoute;
