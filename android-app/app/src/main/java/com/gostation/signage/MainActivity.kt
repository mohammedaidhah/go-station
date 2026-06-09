package com.gostation.signage

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Keep the screen on permanently
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // 2. Hide status bar and navigation bar (Immersive Mode for Kiosk/Digital Signage)
        hideSystemUI()
        
        setContentView(R.layout.activity_main)
        
        // 3. Initialize and configure WebView
        webView = findViewById(R.id.webview)
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Re-apply immersive fullscreen when page finishes loading
                hideSystemUI()
            }
        }
        
        val webSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.loadWithOverviewMode = true
        webSettings.useWideViewPort = true
        webSettings.mediaPlaybackRequiresUserGesture = false // Auto-play video/audio
        
        // Enable Hardware Acceleration for smooth 60fps animations
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        // Load the live deployed Vercel Go Station Display URL
        webView.loadUrl("https://mohammedaidhah-go-station.vercel.app/display")
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }

    @SuppressLint("MissingSuperCall")
    override fun onBackPressed() {
        // Prevent back button from closing the application to keep signage running
        // If needed, can allow back navigation inside webView
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // Do nothing to prevent exiting app on signage TV screens
        }
    }
}
