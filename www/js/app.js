/**
 * Hadoku Task Mobile - Simple Browser Wrapper
 * 
 * Dead simple: Show landing page once, then remember the URL forever.
 * Everything else (auth, themes, preferences) is handled by the website's session storage.
 */

const HADOKU_TASK_URL = 'https://hadoku.me/task/';
const LAST_URL_KEY = 'hadoku_last_url';
const HAS_LAUNCHED_KEY = 'hadoku_has_launched';

// DOM elements
let landingScreen;
let loadingScreen;
let webviewScreen;
let accessKeyInput;
let loginBtn;
let publicModeBtn;
let taskIframe;

/**
 * Initialize app on load
 */
window.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    landingScreen = document.getElementById('landing-screen');
    loadingScreen = document.getElementById('loading-screen');
    webviewScreen = document.getElementById('webview-screen');
    accessKeyInput = document.getElementById('access-key');
    loginBtn = document.getElementById('login-btn');
    publicModeBtn = document.getElementById('public-mode-btn');
    taskIframe = document.getElementById('task-iframe');

    // Check if this is the first launch ever
    const hasLaunched = localStorage.getItem(HAS_LAUNCHED_KEY);
    const lastUrl = localStorage.getItem(LAST_URL_KEY);

    if (!hasLaunched) {
        // First launch ever - show landing page
        console.log(' First launch - showing landing page');
        showLandingScreen();
    } else if (lastUrl) {
        // Load the last URL we had
        console.log(' Loading last URL:', lastUrl);
        loadUrl(lastUrl);
    } else {
        // Fallback: load in public mode
        console.log(' No last URL, loading public mode');
        loadUrl(`${HADOKU_TASK_URL}?mode=public`);
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

    // Listen for messages from the iframe (web app will send URL changes)
    window.addEventListener('message', handleIframeMessage);
});

/**
 * Show the landing screen (only on first launch)
 */
function showLandingScreen() {
    landingScreen.style.display = 'flex';
    loadingScreen.style.display = 'none';
    webviewScreen.style.display = 'none';
    accessKeyInput.focus();
}

/**
 * Validate access key with the server
 */
async function validateKey(key) {
    try {
        console.log(' Validating key:', key.substring(0, 8) + '...');
        
        // Use Capacitor HTTP for better Android WebView compatibility
        if (window.Capacitor && window.Capacitor.Plugins.CapacitorHttp) {
            const response = await window.Capacitor.Plugins.CapacitorHttp.request({
                url: 'https://hadoku.me/task/api/validate-key',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: { key }
            });
            
            console.log(' Validation response:', response.status, response.data);
            return response.data.valid === true;
        } else {
            // Fallback to regular fetch for web/development
            const response = await fetch('https://hadoku.me/task/api/validate-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key })
            });
            
            if (!response.ok) {
                console.error(' HTTP error:', response.status, response.statusText);
                return false;
            }
            
            const result = await response.json();
            console.log(' Validation result:', result);
            return result.valid === true;
        }
    } catch (error) {
        console.error(' Key validation failed:', error);
        return false;
    }
}

/**
 * Handle login with access key
 */
async function handleLogin() {
    const key = accessKeyInput.value.trim();
    
    if (!key) {
        alert('Please enter your access key');
        return;
    }
    
    // Disable button and show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Validating...';
    
    try {
        // Validate the key first
        console.log(' Validating key...');
        const isValid = await validateKey(key);
        
        if (!isValid) {
            // Re-enable button and show error
            loginBtn.disabled = false;
            loginBtn.textContent = 'Continue';
            alert('Invalid access key. Please check and try again.');
            return;
        }
        
        // Key is valid - proceed
        console.log(' Key validated successfully');
        localStorage.setItem(HAS_LAUNCHED_KEY, 'true');
        const url = `${HADOKU_TASK_URL}?key=${encodeURIComponent(key)}`;
        localStorage.setItem(LAST_URL_KEY, url);
        loadUrl(url);
        
    } catch (error) {
        console.error(' Login process failed:', error);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Continue';
        alert('Login failed. Please try again.');
    }
}

/**
 * Handle public mode
 */
function handlePublicMode() {
    // Mark as launched and load in public mode
    localStorage.setItem(HAS_LAUNCHED_KEY, 'true');
    const url = `${HADOKU_TASK_URL}?mode=public`;
    localStorage.setItem(LAST_URL_KEY, url);
    loadUrl(url);
}

/**
 * Handle messages from the iframe (like URL/key changes)
 */
function handleIframeMessage(event) {
    // Only accept messages from hadoku.me domain
    if (!event.origin.includes('hadoku.me')) {
        return;
    }
    
    console.log(' Received message from web app:', event.data);
    
    if (event.data && event.data.type === 'urlChange') {
        const newUrl = event.data.url;
        console.log(' Web app changed URL to:', newUrl);
        
        // Update stored URL
        localStorage.setItem(LAST_URL_KEY, newUrl);
        console.log(' Updated stored URL');
    }
}

/**
 * Load a URL in the iframe
 */
function loadUrl(url) {
    console.log(' Loading URL:', url);
    
    // Show loading screen
    landingScreen.style.display = 'none';
    loadingScreen.style.display = 'flex';
    webviewScreen.style.display = 'none';
    
    // Set iframe source
    taskIframe.src = url;
    
    // Wait for iframe to load
    taskIframe.onload = () => {
        console.log(' Loaded');
        
        // Hide loading, show webview
        loadingScreen.style.display = 'none';
        webviewScreen.style.display = 'block';
    };
    
    // Fallback timeout
    setTimeout(() => {
        if (loadingScreen.style.display !== 'none') {
            loadingScreen.style.display = 'none';
            webviewScreen.style.display = 'block';
        }
    }, 3000);
}
