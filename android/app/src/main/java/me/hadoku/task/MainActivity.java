package me.hadoku.task;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onStart() {
        super.onStart();

        // Get the WebView and set a custom WebViewClient to inject URL tracking
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);

                    // Inject URL tracker script when loading hadoku.me pages
                    if (url != null && url.contains("hadoku.me")) {
                        injectUrlTracker(view);
                    }
                }
            });
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
