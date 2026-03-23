(function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => {
                console.log('[PWA] Service worker registered');
            })
            .catch((error) => {
                console.warn('[PWA] Service worker registration failed:', error.message);
            });
    });
})();
