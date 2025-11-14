/**
 * Hadoku Task Mobile - Direct Navigation (No Iframe)
 * 
 * Super simple wrapper that navigates directly to hadoku.me/task
 * The website handles all auth via sessionStorage/localStorage
 * Mobile app just shows a landing page once, then gets out of the way
 */

const HADOKU_TASK_URL = 'https://hadoku.me/task/?mobile=true';
const HAS_LAUNCHED_KEY = 'hadoku_has_launched';

// Enable detailed logging
const DEBUG = true;

function log(...args) {
    if (DEBUG) {
        console.log('[HadokuMobile]', ...args);
    }
}

// DOM elements
let landingScreen;
let loadingScreen;
let accessKeyInput;
let loginBtn;
let publicModeBtn;

/**
 * Initialize app on load
 */
window.addEventListener('DOMContentLoaded', () => {
    log('═══════════════════════════════════════');
    log('App starting - DOMContentLoaded fired');
    log('User Agent:', navigator.userAgent);
    log('Platform:', navigator.platform);
    log('═══════════════════════════════════════');
    
    // Get DOM elements
    landingScreen = document.getElementById('landing-screen');
    loadingScreen = document.getElementById('loading-screen');
    accessKeyInput = document.getElementById('access-key');
    loginBtn = document.getElementById('login-btn');
    publicModeBtn = document.getElementById('public-mode-btn');

    log('DOM elements retrieved successfully');

    // Check if this is the first launch ever
    const hasLaunched = localStorage.getItem(HAS_LAUNCHED_KEY);

    log('LocalStorage state:', {
        hasLaunched: hasLaunched
    });

    if (!hasLaunched) {
        // First launch ever - show landing page
        log('🆕 First launch - showing landing page');
        showLandingScreen();
    } else {
        // Already launched before - go directly to the website
        log('✅ Not first launch - navigating to task website');
        navigateToTaskWebsite();
    }

    // Event listeners
    loginBtn.addEventListener('click', handleLogin);
    publicModeBtn.addEventListener('click', handlePublicMode);
    
    // Allow Enter key to submit
    accessKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    log('Event listeners attached');
});

/**
 * Show the landing screen (only on first launch)
 */
function showLandingScreen() {
    log('Showing landing screen');
    landingScreen.style.display = 'flex';
    loadingScreen.style.display = 'none';
    accessKeyInput.focus();
    log('Landing screen displayed');
}

/**
 * Validate access key with the server
 */
async function validateKey(key) {
    try {
        log('🔍 Validating key:', key.substring(0, 8) + '...');

        // Use Capacitor HTTP for better Android WebView compatibility
        if (window.Capacitor && window.Capacitor.Plugins.CapacitorHttp) {
            log('📱 Using CapacitorHttp plugin');

            const requestConfig = {
                url: 'https://hadoku.me/task/api/validate-key',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Hadoku-App': 'mobile-android'
                },
                data: { key }
            };

            log('📤 Request config:', JSON.stringify(requestConfig, null, 2));

            const response = await window.Capacitor.Plugins.CapacitorHttp.request(requestConfig);

            log('📥 Response status:', response.status);
            log('📥 Response headers:', JSON.stringify(response.headers, null, 2));
            log('📥 Response data:', JSON.stringify(response.data, null, 2));

            return response.data.valid === true;
        } else {
            log('🌐 Using standard fetch (fallback)');

            // Fallback to regular fetch for web/development
            const response = await fetch('https://hadoku.me/task/api/validate-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Hadoku-App': 'mobile-android'
                },
                body: JSON.stringify({ key })
            });

            log('📥 Fetch response status:', response.status, response.statusText);

            if (!response.ok) {
                log('❌ HTTP error:', response.status, response.statusText);
                return false;
            }

            const result = await response.json();
            log('📥 Fetch result:', result);
            return result.valid === true;
        }
    } catch (error) {
        log('❌ Key validation failed:', error);
        log('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return false;
    }
}

/**
 * Handle login with access key
 */
async function handleLogin() {
    const key = accessKeyInput.value.trim();
    
    log('Login button clicked, key length:', key.length);
    
    if (!key) {
        alert('Please enter your access key');
        log('Login failed: empty key');
        return;
    }
    
    // Disable button and show loading state
    loginBtn.disabled = true;
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Validating...';
    
    try {
        // Validate the key first
        log('🔐 Validating key...');
        const isValid = await validateKey(key);
        
        if (!isValid) {
            // Re-enable button and show error
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            alert('Invalid access key. Please check and try again.');
            log('❌ Key validation failed');
            return;
        }
        
        // Key is valid - proceed
        log('✅ Key validated successfully');
        
        // Mark as launched
        localStorage.setItem(HAS_LAUNCHED_KEY, 'true');
        log('Login: HAS_LAUNCHED_KEY set to true');
        
        // Store the key in sessionStorage for the website to read
        // Website expects 'auth_key' as per mobile integration docs
        sessionStorage.setItem('auth_key', key);
        log('Login: Stored auth_key in sessionStorage');
        
        // Navigate to task website
        navigateToTaskWebsite();
        
    } catch (error) {
        log('❌ Login process failed:', error);
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
        alert('Login failed. Please try again.');
    }
}

/**
 * Handle public mode
 */
function handlePublicMode() {
    log('Public mode button clicked');
    
    // Mark as launched
    localStorage.setItem(HAS_LAUNCHED_KEY, 'true');
    log('Public mode: HAS_LAUNCHED_KEY set to true');
    
    // Clear any stored key (use 'auth_key' to match website expectations)
    sessionStorage.removeItem('auth_key');
    log('Public mode: Cleared any stored auth key');
    
    // Navigate to task website
    navigateToTaskWebsite();
}

/**
 * Navigate directly to the task website
 * This replaces the current page entirely
 */
function navigateToTaskWebsite() {
    log('═══════════════════════════════════════');
    log('📱 NAVIGATING TO:', HADOKU_TASK_URL);
    log('Timestamp:', new Date().toISOString());
    log('Auth key present:', !!sessionStorage.getItem('auth_key'));
    log('═══════════════════════════════════════');
    
    // Show loading screen briefly
    landingScreen.style.display = 'none';
    loadingScreen.style.display = 'flex';
    
    log('Loading screen displayed');
    
    // Navigate after a brief moment to show loading state
    setTimeout(() => {
        log('Executing navigation...');
        window.location.href = HADOKU_TASK_URL;
    }, 300);
}

// Listen for auth changes from the website (if it dispatches events)
window.addEventListener('authKeyChanged', (e) => {
    log('📢 Auth key changed event received:', e.detail);
    // Website handles everything, we just log it
});

// Add global error handler to catch any unhandled errors
window.addEventListener('error', (event) => {
    log('❌ GLOBAL ERROR:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    log('❌ UNHANDLED PROMISE REJECTION:', {
        reason: event.reason,
        promise: event.promise
    });
});

// Log when app goes to background/foreground
document.addEventListener('visibilitychange', () => {
    log('� Visibility changed:', document.hidden ? 'HIDDEN (background)' : 'VISIBLE (foreground)');
});

log('Global error handlers and lifecycle listeners attached');

