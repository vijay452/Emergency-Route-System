(function initRealtimeClient() {
    const isSocketIoAvailable = typeof window.io === 'function';

    if (!isSocketIoAvailable) {
        return;
    }

    function resolveRealtimeUrl() {
        const configured = (window.ERS_API_BASE || '').trim();
        if (configured) {
            return configured.replace(/\/$/, '');
        }

        const hostname = window.location.hostname || '';
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

        if (!isLocal) {
            return window.location.origin;
        }

        if (window.location.port === '3000') {
            return window.location.origin;
        }

        return 'http://localhost:3000';
    }

    const socket = window.io(resolveRealtimeUrl(), {
        transports: ['websocket', 'polling'],
        timeout: 4000,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
    });

    socket.on('connect', () => {
        console.log('[Realtime] Connected:', socket.id);
    });

    socket.on('system:connected', (payload) => {
        if (typeof window.showNotification === 'function') {
            window.showNotification(payload.message || 'Realtime connected', 'success');
        }
    });

    socket.on('traffic:update', (payload) => {
        if (!payload || !Array.isArray(payload.incidents)) {
            return;
        }

        if (typeof window.showNotification === 'function' && payload.incidents.length > 0) {
            window.showNotification(`Traffic update received: ${payload.incidents.length} incidents`, 'warning');
        }
    });

    socket.on('fleet:event', (payload) => {
        if (!payload) {
            return;
        }

        if (typeof window.showNotification === 'function') {
            const vehicle = payload.vehicleId || 'Vehicle';
            const action = payload.action || 'updated';
            window.showNotification(`Fleet event: ${vehicle} ${action}`, 'info');
        }
    });

    socket.on('disconnect', () => {
        console.log('[Realtime] Disconnected');
    });

    window.realtimeSocket = socket;
})();
