package com.cbsetoppers.learning;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ✅ Security: Prevent Screenshots & Screen Recording
        // Disables screenshotting/recording across the entire application for
        // confidentiality.
        this.getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);

        // Performance Hybridisation: Enable Hardware Acceleration & Optimized Layering
        WebView webView = this.getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);

        // ─── Media & Video Playback Support ───
        // Allow inline HTML5 video (required for YouTube iframe to play in-app)
        settings.setMediaPlaybackRequiresUserGesture(false);
        // Allow loading mixed content (http iframes inside https pages)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        // Allow content access for richer media features
        settings.setAllowContentAccess(true);

        // Native Feel: Disable scrollbars and long-press (disables copy menu)
        webView.setHorizontalScrollBarEnabled(false);
        webView.setVerticalScrollBarEnabled(false);
        webView.setLongClickable(false);
        webView.setOnLongClickListener(v -> true);

        // Force hardware layer for GPU-accelerated glassmorphism and animations
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
    }
}
