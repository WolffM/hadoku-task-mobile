package me.hadoku.task;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onResume() {
        super.onResume();

        // Get the WebView and inject URL tracking for hadoku.me pages
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            // Use evaluateJavascript to check if we're on hadoku.me and inject tracker
            webView.evaluateJavascript(
                "(function() { return window.location.href; })();",
                url -> {
                    if (url != null && url.contains("hadoku.me")) {
                        injectUrlTracker(webView);
                    }
                }
            );
        }
    }

    private void injectUrlTracker(WebView webView) {
        // Inject URL tracking script into the page
        String script =
            "(function() {" +
            "    if (window.hadokuUrlTrackerInstalled) return;" +
            "    window.hadokuUrlTrackerInstalled = true;" +
            "    const LAST_URL_KEY = 'hadoku_last_url';" +
            "    let lastUrl = window.location.href;" +
            "    localStorage.setItem(LAST_URL_KEY, lastUrl);" +
            "    console.log('[URL Tracker] Installed - tracking:', lastUrl);" +
            "    setInterval(() => {" +
            "        const currentUrl = window.location.href;" +
            "        if (currentUrl !== lastUrl) {" +
            "            console.log('[URL Tracker] Changed:', currentUrl);" +
            "            localStorage.setItem(LAST_URL_KEY, currentUrl);" +
            "            lastUrl = currentUrl;" +
            "        }" +
            "    }, 500);" +
            "    window.addEventListener('popstate', () => {" +
            "        localStorage.setItem(LAST_URL_KEY, window.location.href);" +
            "    });" +
            "    window.addEventListener('hashchange', () => {" +
            "        localStorage.setItem(LAST_URL_KEY, window.location.href);" +
            "    });" +
            "    window.addEventListener('beforeunload', () => {" +
            "        localStorage.setItem(LAST_URL_KEY, window.location.href);" +
            "    });" +
            "})();";

        webView.evaluateJavascript(script, null);
    }
}