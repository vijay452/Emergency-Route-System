// Panel Management - Dashboard, History, Settings

// Initialize panel handlers
document.addEventListener('DOMContentLoaded', () => {
    initializePanelHandlers();
    initializeSettings();
    updateDashboard();
});

function initializePanelHandlers() {
    try {
        // Delegated nav handling for Dashboard/History/Settings links
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
                // Re-setup toggles after panel opens
                setTimeout(() => setupToggles(), 50);
            }
        });

        // Modal overlay handler
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                closePanels();
            });
        }

        // Close button handlers inside panels
        const closeButtons = document.querySelectorAll('.panel-close');
        closeButtons.forEach((btn) => {
            btn.addEventListener('click', () => closePanels());
        });

        // Toggle switches - initial setup
        setupToggles();
    } catch (error) {
        console.error('Error initializing panel handlers:', error);
    }
}

function openPanel(panelId) {
    try {
        const panel = document.getElementById(panelId);
        const overlay = document.getElementById('modal-overlay');

        if (panel && overlay) {
            // Close any open panels except the one we are opening
            closePanels(panelId);

            // Open the requested panel
            panel.style.display = 'block';
            overlay.style.display = 'block';

            // Trigger animation
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

        panels.forEach(panel => {
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

// Dashboard Functions
function updateDashboard() {
    try {
        const history = JSON.parse(localStorage.getItem('routeHistory') || '[]');
        
        if (history.length === 0) {
            document.getElementById('total-routes').textContent = '0';
            document.getElementById('time-saved').textContent = '0 min';
            document.getElementById('avg-speed').textContent = '0 km/h';
            document.getElementById('total-distance').textContent = '0 km';
            return;
        }

        // Calculate statistics (use raw time when available; normalize old entries)
        const totalTime = history.reduce((sum, route) => {
            const distance = Number(route.distance || 0);
            const recordedTime = Number(route.rawTime || route.time || 0);

            // Guard for old entries that may have unrealistically low time values
            const minimumCityTime = distance > 0 ? (distance / 70) * 60 : 0;
            const safeTime = Math.max(recordedTime, minimumCityTime);

            return sum + safeTime;
        }, 0);
        const totalDistance = history.reduce((sum, route) => sum + (route.distance || 0), 0);
        const avgSpeed = (totalDistance > 0 && totalTime > 0)
            ? Math.round((totalDistance / (totalTime / 60)) * 10) / 10
            : 0;
        const timeSaved = Math.round(history.length * 5); // Estimate 5 min saved per route

        document.getElementById('total-routes').textContent = history.length;
        document.getElementById('time-saved').textContent = timeSaved + ' min';
        document.getElementById('avg-speed').textContent = avgSpeed + ' km/h';
        document.getElementById('total-distance').textContent = totalDistance.toFixed(1) + ' km';
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// History Functions
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
            date: new Date().toLocaleString(),
            timestamp: Date.now()
        };

        history.unshift(historyEntry);
        
        // Keep only last 50 routes
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem('routeHistory', JSON.stringify(history));
        updateDashboard();
    } catch (error) {
        console.error('Error adding to history:', error);
    }
}

function loadHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('routeHistory') || '[]');
        const historyList = document.getElementById('history-list');

        if (!historyList) return;

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-folder-open"></i>
                    <p>No routes found in history</p>
                    <small>Your route history will appear here</small>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map((entry, index) => `
            <div class="history-item" onclick="loadHistoryRoute(${index})">
                <div class="history-item-header">
                    <div class="history-item-route">
                        <i class="fas fa-arrow-right"></i>
                        <span class="route-text">${entry.from} → ${entry.to}</span>
                    </div>
                    <button class="history-delete" onclick="deleteHistoryEntry(${index}, event)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="history-item-details">
                    <span><i class="fas fa-road"></i> ${entry.distance.toFixed(1)} km</span>
                    <span><i class="fas fa-clock"></i> ${entry.time.toFixed(0)} min</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function loadHistoryRoute(index) {
    try {
        const history = JSON.parse(localStorage.getItem('routeHistory') || '[]');
        if (history[index]) {
            const entry = history[index];
            
            // Set the input fields
            const fromInput = document.getElementById('location-from');
            const toInput = document.getElementById('location-to');
            
            if (fromInput) fromInput.value = entry.from;
            if (toInput) toInput.value = entry.to;
            
            // Close the history panel
            closePanels();
            
            // Trigger route finding
            const findBtn = document.getElementById('find-route-btn');
            if (findBtn) findBtn.click();
        }
    } catch (error) {
        console.error('Error loading history route:', error);
    }
}

function deleteHistoryEntry(index, event) {
    try {
        event.stopPropagation();
        
        const history = JSON.parse(localStorage.getItem('routeHistory') || '[]');
        history.splice(index, 1);
        localStorage.setItem('routeHistory', JSON.stringify(history));
        
        loadHistory();
        updateDashboard();
    } catch (error) {
        console.error('Error deleting history entry:', error);
    }
}

function clearAllHistory() {
    try {
        if (confirm('Are you sure you want to clear all history?')) {
            localStorage.removeItem('routeHistory');
            loadHistory();
            updateDashboard();
        }
    } catch (error) {
        console.error('Error clearing history:', error);
    }
}

// Settings Functions
function initializeSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');

        // Restore toggle states
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

        // Apply theme if dark mode is enabled
        if (settings.darkMode) {
            applyDarkMode();
        } else {
            removeDarkMode();
        }

        // Re-setup toggles to ensure listeners are attached
        setupToggles();
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
}

function setupToggles() {
    try {
        const toggles = document.querySelectorAll('.toggle-input');

        toggles.forEach(toggle => {
            // Remove existing listeners by cloning and replacing
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);

            // Add new listener
            newToggle.addEventListener('change', (e) => {
                saveSettings();

                // Special handling for theme toggle
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
        
        // Add dark mode stylesheet
        if (!document.getElementById('dark-mode-stylesheet')) {
            const darkModeStyle = document.createElement('style');
            darkModeStyle.id = 'dark-mode-stylesheet';
            darkModeStyle.textContent = `
                /* Dark Mode Overrides */
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
                
                body.dark-mode .panel-content {
                    background: #1a1a1a;
                }
                
                body.dark-mode .settings-group {
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom-color: rgba(255, 255, 255, 0.1);
                }
                
                body.dark-mode .setting-item {
                    background: rgba(255, 255, 255, 0.08);
                }
                
                body.dark-mode .setting-item:hover {
                    background: rgba(255, 255, 255, 0.12);
                }
                
                body.dark-mode .dashboard-stat {
                    background: linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(25, 25, 25, 0.98) 100%);
                    border-color: rgba(31, 115, 232, 0.2);
                }
                
                body.dark-mode .history-item {
                    background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(25, 25, 25, 0.95) 100%);
                    border-color: rgba(31, 115, 232, 0.15);
                }
                
                body.dark-mode .history-item:hover {
                    border-color: rgba(31, 115, 232, 0.4);
                }
                
                body.dark-mode input[type="text"],
                body.dark-mode input[type="password"],
                body.dark-mode input[type="email"],
                body.dark-mode input[type="number"],
                body.dark-mode textarea,
                body.dark-mode select {
                    background: #2a2a2a;
                    color: #ffffff;
                    border-color: #3a3a3a;
                }
                
                body.dark-mode input[type="text"]::placeholder,
                body.dark-mode input[type="password"]::placeholder,
                body.dark-mode textarea::placeholder {
                    color: #888;
                }
                
                body.dark-mode input[type="text"]:focus,
                body.dark-mode input[type="password"]:focus,
                body.dark-mode textarea:focus,
                body.dark-mode select:focus {
                    background: #333333;
                    border-color: #1f73e8;
                    color: #ffffff;
                }
                
                body.dark-mode label {
                    color: #ffffff;
                }
                
                body.dark-mode .btn-secondary {
                    background: #3a3a3a;
                    color: #ffffff;
                    border-color: #4a4a4a;
                }
                
                body.dark-mode .btn-secondary:hover {
                    background: #4a4a4a;
                    border-color: #5a5a5a;
                }
                
                body.dark-mode .traffic-legend {
                    background: linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%);
                    border-color: rgba(31, 115, 232, 0.15);
                }
                
                body.dark-mode .traffic-legend-row {
                    color: #ffffff;
                }
                
                body.dark-mode .traffic-legend-row:hover {
                    background: rgba(31, 115, 232, 0.1);
                }
                
                body.dark-mode .modal-overlay {
                    background: rgba(0, 0, 0, 0.7);
                }
                
                body.dark-mode .result-item {
                    background: #2a2a2a;
                    border-color: #3a3a3a;
                    color: #ffffff;
                }
                
                body.dark-mode .alternatives-list {
                    background: #1a1a1a;
                }
                
                body.dark-mode .route-card {
                    background: #2a2a2a;
                    border-color: #3a3a3a;
                }
                
                body.dark-mode .route-card:hover {
                    background: #333333;
                }
                
                body.dark-mode .emergency-corridor-details {
                    background: linear-gradient(135deg, rgba(245, 124, 0, 0.15) 0%, rgba(255, 179, 71, 0.1) 100%);
                    border-color: rgba(245, 124, 0, 0.3);
                }
                
                body.dark-mode .loader {
                    background: rgba(0, 0, 0, 0.55);
                }

                body.dark-mode .loader-card {
                    background: rgba(24, 24, 24, 0.96);
                    border-color: rgba(255, 255, 255, 0.12);
                }

                body.dark-mode .loader p {
                    color: #f2f2f2;
                }
                
                body.dark-mode .navbar {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                }
                
                body.dark-mode .route-details {
                    background: #1a1a1a;
                }
                
                body.dark-mode .result-item .label {
                    color: #bbbbbb;
                }
                
                body.dark-mode h3, body.dark-mode h4 {
                    color: #ffffff;
                }
                
                body.dark-mode .about-info {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                
                body.dark-mode .corridor-status {
                    background: #2a2a2a;
                    border-color: #3a3a3a;
                    color: #ffffff;
                }
                
                /* Dark mode scrollbar */
                body.dark-mode::-webkit-scrollbar-thumb {
                    background: rgba(31, 115, 232, 0.5);
                }
                
                body.dark-mode::-webkit-scrollbar-thumb:hover {
                    background: rgba(31, 115, 232, 0.8);
                }

                /* Dark mode sidebar and search section */
                body.dark-mode .sidebar {
                    background: rgba(26, 26, 26, 0.95);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                body.dark-mode .search-section {
                    background: rgba(30, 30, 30, 0.9);
                    border-color: rgba(255, 255, 255, 0.08);
                }

                body.dark-mode .search-section h3 {
                    color: #ffffff;
                    text-shadow: none;
                }

                body.dark-mode .input-group {
                    background: rgba(255, 255, 255, 0.03);
                }

                body.dark-mode .input-group label {
                    color: #ffffff;
                    font-weight: 600;
                }

                body.dark-mode .help-text {
                    color: #999999;
                }

                body.dark-mode .traffic-section {
                    background: rgba(30, 30, 30, 0.9);
                    border-color: rgba(255, 255, 255, 0.08);
                }

                body.dark-mode .traffic-section h3 {
                    color: #ffffff;
                }

                body.dark-mode .alerts-container {
                    background: rgba(0, 0, 0, 0.3);
                }

                body.dark-mode .alert-empty {
                    color: #999999;
                }

                body.dark-mode .traffic-data-mode {
                    background: rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                    border-color: rgba(255, 255, 255, 0.1);
                }

                body.dark-mode .map-pick-status {
                    background: rgba(31, 115, 232, 0.15);
                    color: #93c5ff;
                    border-color: rgba(31, 115, 232, 0.3);
                }

                body.dark-mode .mode-estimated {
                    background: rgba(255, 152, 0, 0.1);
                    border-bottom-color: rgba(255, 152, 0, 0.3);
                }

                body.dark-mode .main-wrapper {
                    background: #1a1a1a;
                }

                body.dark-mode .results-section {
                    background: rgba(30, 30, 30, 0.9);
                }

                body.dark-mode .results-section h3 {
                    color: #ffffff;
                }
            `;
            document.head.appendChild(darkModeStyle);
        }
        
        // Apply dark mode class
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
        
        // Remove dark mode class
        document.body.classList.remove('dark-mode');
        
        // Remove dark mode stylesheet if it exists
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
            
            // Reset toggles
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

// Make functions globally available
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
window.clearAllSettings = clearAllSettings;
window.addToHistory = addToHistory;
