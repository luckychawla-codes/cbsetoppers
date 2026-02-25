package com.cbsetoppers.learning;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Performance Hybridisation: Enable Hardware Acceleration & Optimized Layering
        WebView webView = this.getBridge().getWebView();
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);

        // Native Feel: Disable scrollbars and long-press (disables copy menu)
        webView.setHorizontalScrollBarEnabled(false);
        webView.setVerticalScrollBarEnabled(false);
        webView.setLongClickable(false);
        webView.setOnLongClickListener(v -> true);

        // Force hardware layer for GPU-accelerated glassmorphism and animations
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
    }
}
