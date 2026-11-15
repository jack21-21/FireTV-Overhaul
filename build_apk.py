import os
import sys
import shutil
import subprocess
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(r"C:\Users\Jackl\Desktop\Projects\FireTV-Overhaul")
BUILD_DIR = PROJECT_ROOT / ".build_apk"
JAVA_HOME = Path(r"C:\Program Files\Android\openjdk\jdk-21.0.8")
BUILD_TOOLS = Path(r"C:\Program Files (x86)\Android\android-sdk\build-tools\36.0.0")
PLATFORM_JAR = Path(r"C:\Program Files (x86)\Android\android-sdk\platforms\android-35\android.jar")

AAPT = BUILD_TOOLS / "aapt.exe"
D8 = BUILD_TOOLS / "d8.bat"
ZIPALIGN = BUILD_TOOLS / "zipalign.exe"
APKSIGNER = BUILD_TOOLS / "apksigner.bat"
JAVAC = JAVA_HOME / "bin" / "javac.exe"
KEYTOOL = JAVA_HOME / "bin" / "keytool.exe"

os.environ["JAVA_HOME"] = str(JAVA_HOME)
os.environ["PATH"] = f"{JAVA_HOME / 'bin'};{os.environ.get('PATH', '')}"

def main():
    print("=== STARTING NATIVE ANDROID TV APK BUILD ===")
    
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    BUILD_DIR.mkdir(parents=True)
    
    src_dir = BUILD_DIR / "src" / "com" / "jack" / "firetv" / "overhaul"
    src_dir.mkdir(parents=True)
    gen_dir = BUILD_DIR / "gen"
    gen_dir.mkdir(parents=True)
    bin_dir = BUILD_DIR / "bin"
    bin_dir.mkdir(parents=True)
    res_dir = BUILD_DIR / "res"
    (res_dir / "drawable").mkdir(parents=True)
    (res_dir / "values").mkdir(parents=True)
    assets_dir = BUILD_DIR / "assets"
    assets_dir.mkdir(parents=True)
    
    # 1. Generate Icons and Android TV Banner
    print("[1/8] Generating Android TV launcher icon and banner...")
    core_img = PROJECT_ROOT / "assets" / "jarvis_core.jpg"
    dashboard_img = PROJECT_ROOT / "assets" / "dashboard_mockup.jpg"
    
    if core_img.exists():
        im = Image.open(core_img)
        icon = im.resize((192, 192), Image.LANCZOS)
        icon.save(res_dir / "drawable" / "ic_launcher.png")
    else:
        # Fallback icon
        im = Image.new("RGBA", (192, 192), (3, 5, 9, 255))
        im.save(res_dir / "drawable" / "ic_launcher.png")
        
    if dashboard_img.exists():
        im_dash = Image.open(dashboard_img)
        banner = im_dash.resize((320, 180), Image.LANCZOS)
        banner.save(res_dir / "drawable" / "banner.png")
    else:
        banner = Image.new("RGBA", (320, 180), (3, 5, 9, 255))
        banner.save(res_dir / "drawable" / "banner.png")
        
    # 2. Write strings.xml
    (res_dir / "values" / "strings.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">FireTV Overhaul</string>\n</resources>\n',
        encoding="utf-8"
    )
    
    # 3. Write AndroidManifest.xml
    print("[2/8] Writing Android TV Manifest...")
    manifest_content = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.jack.firetv.overhaul"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.wifi" android:required="false" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:banner="@drawable/banner"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:screenOrientation="landscape"
            android:configChanges="orientation|keyboardHidden|screenSize|screenLayout"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
    manifest_file = BUILD_DIR / "AndroidManifest.xml"
    manifest_file.write_text(manifest_content, encoding="utf-8")
    
    # 4. Write MainActivity.java
    print("[3/8] Writing MainActivity.java...")
    main_activity_content = """package com.jack.firetv.overhaul;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUI();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setBackgroundColor(0xFF030509);
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url == null) return false;

                if (url.startsWith("intent:")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        if (intent != null) {
                            view.getContext().startActivity(intent);
                            return true;
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                if (url.startsWith("stremio://")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        view.getContext().startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                if (!url.startsWith("file://") && !url.startsWith("http://192.168.") && !url.startsWith("http://localhost")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        view.getContext().startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    public static class WebAppInterface {
        private Activity activity;

        WebAppInterface(Activity a) {
            this.activity = a;
        }

        @JavascriptInterface
        public void launchPackage(String pkgName) {
            try {
                Intent intent = activity.getPackageManager().getLaunchIntentForPackage(pkgName);
                if (intent != null) {
                    activity.startActivity(intent);
                } else {
                    Toast.makeText(activity, "App not installed: " + pkgName, Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(activity, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }

        @JavascriptInterface
        public void showToast(String message) {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show();
        }
    }
}
"""
    (src_dir / "MainActivity.java").write_text(main_activity_content, encoding="utf-8")
    
    # 5. Copy web application into assets/
    print("[4/8] Bundling Liquid Glass UI into assets/...")
    files_to_copy = ["index.html", "styles.css", "app.js", "updater.js"]
    for f in files_to_copy:
        src = PROJECT_ROOT / f
        if src.exists():
            shutil.copy2(src, assets_dir / f)
            
    assets_sub = PROJECT_ROOT / "assets"
    if assets_sub.exists():
        shutil.copytree(assets_sub, assets_dir / "assets", dirs_exist_ok=True)
        
    # 6. Generate R.java with AAPT
    print("[5/8] Packaging resources with AAPT...")
    cmd_aapt_r = [
        str(AAPT), "package", "-f", "-m",
        "-J", str(gen_dir),
        "-M", str(manifest_file),
        "-S", str(res_dir),
        "-I", str(PLATFORM_JAR)
    ]
    subprocess.check_call(cmd_aapt_r)
    
    # 7. Compile Java with JAVAC
    print("[6/8] Compiling Java classes...")
    r_java = gen_dir / "com" / "jack" / "firetv" / "overhaul" / "R.java"
    main_java = src_dir / "MainActivity.java"
    cmd_javac = [
        str(JAVAC),
        "-d", str(bin_dir),
        "-source", "8", "-target", "8",
        "-cp", str(PLATFORM_JAR),
        str(r_java), str(main_java)
    ]
    subprocess.check_call(cmd_javac)
    
    # 8. DEX classes with D8
    print("[7/8] Converting bytecode to Dalvik Executable (classes.dex) with D8...")
    class_files = list(bin_dir.glob("**/*.class"))
    cmd_d8 = [
        str(D8),
        "--output", str(bin_dir),
        "--lib", str(PLATFORM_JAR)
    ] + [str(c) for c in class_files]
    subprocess.check_call(cmd_d8)
    
    dex_file = bin_dir / "classes.dex"
    if not dex_file.exists():
        raise RuntimeError("classes.dex was not generated!")
        
    # 9. Package unaligned APK with AAPT
    print("[8/8] Assembling, aligning, and signing APK...")
    unaligned_apk = BUILD_DIR / "unaligned.apk"
    cmd_pack = [
        str(AAPT), "package", "-f",
        "-M", str(manifest_file),
        "-S", str(res_dir),
        "-A", str(assets_dir),
        "-I", str(PLATFORM_JAR),
        "-F", str(unaligned_apk)
    ]
    subprocess.check_call(cmd_pack)
    
    # Add classes.dex into the APK
    # In Windows cmd/aapt, run from bin_dir: aapt add unaligned.apk classes.dex
    shutil.copy2(dex_file, BUILD_DIR / "classes.dex")
    cmd_add_dex = [str(AAPT), "add", str(unaligned_apk), "classes.dex"]
    subprocess.check_call(cmd_add_dex, cwd=str(BUILD_DIR))
    
    # 10. Zipalign
    aligned_apk = BUILD_DIR / "aligned.apk"
    cmd_zipalign = [
        str(ZIPALIGN), "-f", "-p", "4",
        str(unaligned_apk), str(aligned_apk)
    ]
    subprocess.check_call(cmd_zipalign)
    
    # 11. Create Release Keystore & Sign with apksigner
    keystore_file = BUILD_DIR / "release.keystore"
    if not keystore_file.exists():
        cmd_keytool = [
            str(KEYTOOL), "-genkeypair",
            "-validity", "10000",
            "-dname", "CN=Jack, OU=FireTV, O=Jack, L=Wisbech, S=Cambs, C=GB",
            "-keystore", str(keystore_file),
            "-storepass", "password123",
            "-keypass", "password123",
            "-alias", "firetv_release",
            "-keyalg", "RSA",
            "-keysize", "2048"
        ]
        subprocess.check_call(cmd_keytool)
        
    final_apk = PROJECT_ROOT / "FireTV-Overhaul.apk"
    cmd_sign = [
        str(APKSIGNER), "sign",
        "--ks", str(keystore_file),
        "--ks-pass", "pass:password123",
        "--ks-key-alias", "firetv_release",
        "--key-pass", "pass:password123",
        "--out", str(final_apk),
        str(aligned_apk)
    ]
    subprocess.check_call(cmd_sign)
    
    # Also verify signature
    cmd_verify = [str(APKSIGNER), "verify", "--verbose", str(final_apk)]
    subprocess.check_call(cmd_verify)
    
    # Copy to 01_APKS folder as well
    apks_folder = PROJECT_ROOT / "01_APKS"
    apks_folder.mkdir(exist_ok=True)
    shutil.copy2(final_apk, apks_folder / "FireTV-Overhaul.apk")
    
    size_mb = final_apk.stat().st_size / (1024 * 1024)
    print(f"\n SUCCESS! FireTV-Overhaul.apk built and signed successfully!")
    print(f" Output Location: {final_apk}")
    print(f" Size: {size_mb:.2f} MB")

if __name__ == "__main__":
    main()
