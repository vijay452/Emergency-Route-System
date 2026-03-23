/* ============================================
   KEYBOARD SHORTCUTS & HELP SYSTEM
   Accessibility & Feature Discovery
   ============================================ */

let helpPanelActive = false;

const keyboardShortcuts = {
    'core': [
        { key: 'F1', description: 'Show this help panel' },
        { key: '?', description: 'Show this help panel' },
        { key: 'Escape', description: 'Close panels/modals' }
    ],
    'routing': [
        { key: 'Enter', description: 'Find route' },
        { key: 'C', description: 'Clear route' },
        { key: 'S', description: 'Show source picker' },
        { key: 'D', description: 'Show destination picker' },
        { key: 'L', description: 'Use my live location as source' }
    ],
    'dashboard': [
        { key: 'Shift+D', description: 'Toggle dashboard panel' },
        { key: 'Shift+H', description: 'Toggle history panel' },
        { key: 'Shift+K', description: 'Toggle settings panel' },
        { key: 'Shift+F', description: 'Toggle fleet dashboard' }
    ],
    'emergency': [
        { key: 'G', description: 'Optimize green corridor' },
        { key: 'A', description: 'Apply signal overrides' },
        { key: 'R', description: 'Release corridor' },
        { key: 'Shift+L', description: 'Toggle corridor mode' }
    ],
    'tracking': [
        { key: 'T', description: 'Start/stop live tracking' },
        { key: 'P', description: 'Show quick dispatch' }
    ],
    'ui': [
        { key: 'M', description: 'Toggle dark mode' },
        { key: 'Z', description: 'Zoom to fit route' }
    ]
};

// ============================================
// 1. KEYBOARD EVENT LISTENER
// ============================================

document.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    const key = e.key.toUpperCase();
    const shiftKey = e.shiftKey;
    const ctrl = e.ctrlKey;

    // Help panel
    if (key === 'F1' || key === '?') {
        e.preventDefault();
        showHelpPanel();
        return;
    }

    // Escape
    if (key === 'Escape') {
        closeAllPanels();
        return;
    }

    // Routing shortcuts
    if (key === 'ENTER') {
        const findBtn = document.getElementById('find-route-btn');
        if (findBtn) {
            e.preventDefault();
            findBtn.click();
        }
    }

    if (key === 'C') {
        const clearBtn = document.getElementById('clear-route-btn');
        if (clearBtn) clearBtn.click();
    }

    if (key === 'S') {
        const pickSourceBtn = document.getElementById('pick-source-map-btn');
        if (pickSourceBtn) pickSourceBtn.click();
    }

    if (key === 'D') {
        const pickDestBtn = document.getElementById('pick-destination-map-btn');
        if (pickDestBtn) pickDestBtn.click();
    }

    if (key === 'L') {
        const liveLocBtn = document.getElementById('show-my-location-btn');
        if (liveLocBtn) liveLocBtn.click();
    }

    // Dashboard shortcuts
    if (shiftKey && key === 'D') {
        e.preventDefault();
        togglePanel('dashboard-panel');
    }

    if (shiftKey && key === 'H') {
        e.preventDefault();
        togglePanel('history-panel');
    }

    if (shiftKey && key === 'K') {
        e.preventDefault();
        togglePanel('settings-panel');
    }

    if (shiftKey && key === 'F') {
        e.preventDefault();
        if (typeof window.toggleFleetDashboard === 'function') {
            window.toggleFleetDashboard();
        } else {
            showFleetDashboard();
        }
    }

    // Emergency shortcuts
    if (key === 'G') {
        const optimizeBtn = document.getElementById('optimize-corridor-btn');
        if (optimizeBtn) optimizeBtn.click();
    }

    if (key === 'A') {
        const applyBtn = document.getElementById('apply-corridor-btn');
        if (applyBtn) applyBtn.click();
    }

    if (key === 'R') {
        const releaseBtn = document.getElementById('release-corridor-btn');
        if (releaseBtn) releaseBtn.click();
    }

    if (shiftKey && key === 'L') {
        const toggleBtn = document.getElementById('green-corridor-toggle');
        if (toggleBtn) toggleBtn.click();
    }

    // Tracking shortcuts
    if (key === 'T') {
        if (liveTrackingActive) {
            window.stopLiveTracking();
        } else {
            window.startLiveTrackingFromRoute();
        }
    }

    if (key === 'P') {
        window.showQuickDispatchPanel();
    }

    // UI shortcuts
    if (key === 'M') {
        const darkModeToggle = document.getElementById('theme-toggle');
        if (darkModeToggle) {
            darkModeToggle.click();
        }
    }

    if (key === 'Z') {
        if (window.routeLayer && window.map) {
            const bounds = window.routeLayer.getBounds();
            if (bounds && bounds.isValid()) {
                window.map.fitBounds(bounds.pad(0.08));
            }
        }
    }
});

// ============================================
// 2. HELP PANEL
// ============================================

function showHelpPanel() {
    let helpPanel = document.getElementById('help-panel');

    if (!helpPanel) {
        helpPanel = document.createElement('div');
        helpPanel.id = 'help-panel';
        document.body.appendChild(helpPanel);
    }

    helpPanel.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideInRight 0.3s;
    `;

    let html = `
        <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #1f73e8; font-size: 24px;">⌨️ Keyboard Shortcuts</h2>
                <button onclick="document.getElementById('help-panel').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            </div>
    `;

    for (const [category, shortcuts] of Object.entries(keyboardShortcuts)) {
        html += `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; color: #1f73e8; text-transform: capitalize; font-size: 14px; font-weight: 700;">${category.toUpperCase()}</h3>
                <table style="width: 100%; border-collapse: collapse;">
        `;

        shortcuts.forEach(({ key, description }) => {
            html += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                        <kbd style="
                            background: #f0f0f0;
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            padding: 4px 8px;
                            font-family: monospace;
                            font-size: 12px;
                            font-weight: 600;
                            display: inline-block;
                        ">${key}</kbd>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">
                        ${description}
                    </td>
                </tr>
            `;
        });

        html += `</table></div>`;
    }

    html += `
        <div style="margin-top: 20px; padding: 16px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #2e7d32;">
            <strong style="color: #2e7d32;">💡 Pro Tips:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">
                <li>Press <kbd style="background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; padding: 2px 6px; font-family: monospace;">F1</kbd> anytime to show help</li>
                <li>Use <kbd style="background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; padding: 2px 6px; font-family: monospace;">Shift+Key</kbd> for panel toggles</li>
                <li>Emergency shortcuts work from anywhere</li>
            </ul>
        </div>
    </div>
    `;

    helpPanel.innerHTML = html;
    helpPanelActive = true;
}

// ============================================
// 3. HELPER FUNCTIONS
// ============================================

function togglePanel(panelId) {
    if (typeof openPanel === 'function') {
        openPanel(panelId);
    }
}

function closeAllPanels() {
    const panels = [
        'dashboard-panel',
        'history-panel',
        'settings-panel',
        'help-panel',
        'fleet-dashboard-modal',
        'quick-dispatch-panel'
    ];

    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.opacity = '0';
            panel.style.transition = 'opacity 0.2s';
            setTimeout(() => panel.remove(), 200);
        }
    });
}

// Show keyboard hint on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        let hint = document.getElementById('keyboard-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'keyboard-hint';
            hint.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(135deg, #1f73e8 0%, #1565c0 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                z-index: 900;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                opacity: 0.8;
                animation: slideInLeft 0.5s;
            `;
            hint.textContent = '💡 Press F1 for keyboard shortcuts';
            hint.onclick = showHelpPanel;
            document.body.appendChild(hint);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                hint.style.opacity = '0.3';
                hint.style.transition = 'opacity 0.3s';
            }, 5000);
        }
    }, 2000);
});

// Export
window.showHelpPanel = showHelpPanel;
