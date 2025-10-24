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
        console.log('🆕 First launch - showing landing page');
        showLandingScreen();
    } else if (lastUrl) {
        // Load the last URL we had
        console.log('✅ Loading last URL:', lastUrl);
        loadUrl(lastUrl);
    } else {
        // Fallback: load in public mode
        console.log('🌐 No last URL, loading public mode');
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
 * Handle login with access key
 */
function handleLogin() {
    const key = accessKeyInput.value.trim();
    
    if (!key) {
        alert('Please enter your access key');
        return;
    }
    
    // Mark as launched and load with key
    localStorage.setItem(HAS_LAUNCHED_KEY, 'true');
    const url = `${HADOKU_TASK_URL}?key=${encodeURIComponent(key)}`;
    localStorage.setItem(LAST_URL_KEY, url);
    loadUrl(url);
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
 * Load a URL in the iframe
 */
function loadUrl(url) {
    console.log('📱 Loading URL:', url);
    
    // Show loading screen
    landingScreen.style.display = 'none';
    loadingScreen.style.display = 'flex';
    webviewScreen.style.display = 'none';
    
    // Set iframe source
    taskIframe.src = url;
    
    // Wait for iframe to load
    taskIframe.onload = () => {
        console.log('✅ Loaded');
        
        // Update stored URL to match current iframe src (handles internal navigation)
        updateStoredUrl();
        
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

/**
 * Update the stored URL to match iframe's current src
 * This handles when the website internally navigates (like changing auth key)
 */
function updateStoredUrl() {
    const currentUrl = taskIframe.src;
    if (currentUrl && currentUrl !== 'about:blank') {
        const lastUrl = localStorage.getItem(LAST_URL_KEY);
        if (currentUrl !== lastUrl) {
            console.log('🔄 URL changed, updating stored URL');
            localStorage.setItem(LAST_URL_KEY, currentUrl);
        }
    }
}

// Check for URL changes periodically (handles internal navigation in iframe)
setInterval(() => {
    if (taskIframe && taskIframe.src && taskIframe.src !== 'about:blank') {
        updateStoredUrl();
    }
}, 2000); // Check every 2 seconds
