/**
 * URL Tracker - Injected into hadoku.me pages to monitor URL changes
 * This script saves URL changes to localStorage so the app can restore the last URL
 */
(function() {
    'use strict';

    const LAST_URL_KEY = 'hadoku_last_url';
    let lastUrl = window.location.href;

    console.log('📍 URL Tracker initialized on:', lastUrl);

    // Save initial URL
    localStorage.setItem(LAST_URL_KEY, lastUrl);

    // Monitor URL changes using setInterval
    setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            console.log('🔄 URL changed:', currentUrl);
            localStorage.setItem(LAST_URL_KEY, currentUrl);
            lastUrl = currentUrl;
        }
    }, 500);

    // Also monitor using popstate event (for browser back/forward)
    window.addEventListener('popstate', () => {
        const currentUrl = window.location.href;
        console.log('🔄 Popstate - URL changed:', currentUrl);
        localStorage.setItem(LAST_URL_KEY, currentUrl);
        lastUrl = currentUrl;
    });

    // Monitor using hashchange event
    window.addEventListener('hashchange', () => {
        const currentUrl = window.location.href;
        console.log('🔄 Hash changed - URL changed:', currentUrl);
        localStorage.setItem(LAST_URL_KEY, currentUrl);
        lastUrl = currentUrl;
    });

    // Save URL when page is about to unload
    window.addEventListener('beforeunload', () => {
        const currentUrl = window.location.href;
        localStorage.setItem(LAST_URL_KEY, currentUrl);
        console.log('💾 Saving URL on unload:', currentUrl);
    });

    // Save URL when app goes to background (Capacitor)
    if (window.Capacitor && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('pause', () => {
            const currentUrl = window.location.href;
            localStorage.setItem(LAST_URL_KEY, currentUrl);
            console.log('📱 App paused - saved URL:', currentUrl);
        });
    }

    console.log('✅ URL Tracker active');
})();
