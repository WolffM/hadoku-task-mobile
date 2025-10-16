/**
 * Hadoku Task Mobile - Auth Wrapper
 * Simple landing page that loads hadoku.me/task in WebView
 */

const HADOKU_TASK_URL = 'https://hadoku.me/task/';
const STORAGE_KEY = 'hadoku_access_key';

// DOM elements
let landingScreen;
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
    webviewScreen = document.getElementById('webview-screen');
    accessKeyInput = document.getElementById('access-key');
    loginBtn = document.getElementById('login-btn');
    publicModeBtn = document.getElementById('public-mode-btn');
    taskIframe = document.getElementById('task-iframe');

    // Check if user already has a key stored
    const storedKey = localStorage.getItem(STORAGE_KEY);
    if (storedKey) {
        loadTaskApp(storedKey);
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
 * Handle login with access key
 */
function handleLogin() {
    const key = accessKeyInput.value.trim();
    
    if (!key) {
        alert('Please enter your access key');
        return;
    }
    
    // Validate key format (basic check)
    if (key.length < 10) {
        alert('Access key seems too short. Please check and try again.');
        return;
    }
    
    // Store key
    localStorage.setItem(STORAGE_KEY, key);
    
    // Load app
    loadTaskApp(key);
}

/**
 * Handle public mode (no auth)
 */
function handlePublicMode() {
    // Clear stored key if any
    localStorage.removeItem(STORAGE_KEY);
    
    // Load app in public mode
    loadTaskApp(null, true);
}

/**
 * Load the main task app in iframe
 */
function loadTaskApp(key, publicMode = false) {
    let url;
    
    if (publicMode) {
        // Public mode - no key needed
        url = `${HADOKU_TASK_URL}?mode=public`;
    } else if (key) {
        // Authenticated mode
        url = `${HADOKU_TASK_URL}?key=${encodeURIComponent(key)}`;
    } else {
        console.error('No key provided and not in public mode');
        return;
    }
    
    // Set iframe source
    taskIframe.src = url;
    
    // Switch screens
    landingScreen.style.display = 'none';
    webviewScreen.style.display = 'block';
    
    console.log(`✅ Loading Hadoku Task: ${publicMode ? 'Public Mode' : 'Authenticated'}`);
}

/**
 * Handle logout (called from app if needed)
 */
function logout() {
    localStorage.removeItem(STORAGE_KEY);
    taskIframe.src = '';
    landingScreen.style.display = 'flex';
    webviewScreen.style.display = 'none';
    accessKeyInput.value = '';
}

// Expose logout function globally for potential use
window.hadokuLogout = logout;

/**
 * Listen for messages from iframe (optional future enhancement)
 */
window.addEventListener('message', (event) => {
    // Verify origin
    if (event.origin !== 'https://hadoku.me') {
        return;
    }
    
    // Handle messages from task app
    const { type, data } = event.data;
    
    switch (type) {
        case 'logout':
            logout();
            break;
        case 'error':
            console.error('Error from task app:', data);
            // Could show error UI here
            break;
        default:
            console.log('Unknown message type:', type);
    }
});
