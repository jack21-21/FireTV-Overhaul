/**
 * app.js - Master Navigation, Dynamic Shaders, Full Fire TV Settings & J.A.R.V.I.S.
 * JVC 43" Fire TV Edition (Fire OS 7.7.1.4)
 */

const DEFAULT_SETTINGS = {
  city: "Wisbech",
  govee: "enabled",
  screensaverTimeout: 900000, // 15 Minutes by default
  screensaverEnabled: true,
  screensaverTheme: "gold",
  antiBurnIn: true,
  resolution: "4K UHD 60Hz",
  colorDepth: "10-bit",
  matchFrameRate: true,
  audioOutput: "eARC (Dolby Atmos)",
  nightModeAudio: false,
  cecControl: true,
  enhancedHdmi: true,
  voiceProfile: "Paul Bettany (Piper MCU)",
  storageUsed: "4.04 GB",
  storageAvail: "7.40 GB"
};

let userSettings = Object.assign({}, DEFAULT_SETTINGS);

// Load saved settings
try {
  const saved = localStorage.getItem("fivetv_user_settings");
  if (saved) {
    userSettings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved));
  }
} catch (e) {
  console.warn("Could not load saved settings:", e);
}

// Watch List State (Dynamic continue watching that changes as user watches)
const DEFAULT_WATCH_LIST = {
  dune: {
    title: "Dune: Prophecy",
    episode: "S1:E2 • 4K HDR Atmos",
    pct: 65,
    resume: "Resume at 28:14"
  },
  arcane: {
    title: "Arcane Season 2",
    episode: "S2:E3 • 4K Atmos",
    pct: 40,
    resume: "Resume at 18:30"
  },
  penguin: {
    title: "The Penguin",
    episode: "S1:E8 • 4K HDR",
    pct: 82,
    resume: "Resume at 55:10"
  }
};

let watchState = Object.assign({}, DEFAULT_WATCH_LIST);
try {
  const savedWatch = localStorage.getItem("fivetv_watch_state");
  if (savedWatch) {
    watchState = Object.assign({}, DEFAULT_WATCH_LIST, JSON.parse(savedWatch));
  }
} catch (e) {}

// Navigation State
let currentTab = "home";
let previousTab = "home";
let idleTimer = null;
let holdButtonTimer = null;
let isHolding = false;
let tickerIndex = 0;
let currentActiveCat = "inputs";
let isSpotifyPlaying = true;

// Cycling Ticker Items for J.A.R.V.I.S. Status Mini-Pill
const TICKER_ITEMS = [
  "🖨 Bambu P1S: Printing 68% • Layer 164/200",
  "💻 PC Hardware: CPU 42°C • GPU 48°C • RAM 38%",
  "✉️ Gmail: 2 New Unread • Latest from Team",
  "⚡ Govee T3: Camera Bias Lighting Synced"
];

// Color & Shader Profiles for Dynamic Blurred Hover Background
const COLOR_THEMES = {
  dune: {
    orb1: "rgba(245, 158, 11, 0.65)",
    orb2: "rgba(217, 119, 6, 0.60)",
    glow: "rgba(245, 158, 11, 0.50)",
    bg: "assets/bg_poster_dune.jpg"
  },
  arcane: {
    orb1: "rgba(6, 182, 212, 0.65)",
    orb2: "rgba(59, 130, 246, 0.60)",
    glow: "rgba(14, 165, 233, 0.50)",
    bg: "assets/bg_poster_arcane.jpg"
  },
  penguin: {
    orb1: "rgba(220, 38, 38, 0.65)",
    orb2: "rgba(159, 18, 57, 0.60)",
    glow: "rgba(225, 29, 72, 0.50)",
    bg: "assets/bg_poster_penguin.jpg"
  },
  stremio: {
    orb1: "rgba(168, 85, 247, 0.65)",
    orb2: "rgba(126, 34, 206, 0.60)",
    glow: "rgba(168, 85, 247, 0.50)",
    bg: "assets/bg_poster_dune.jpg"
  },
  youtube: {
    orb1: "rgba(244, 63, 94, 0.65)",
    orb2: "rgba(225, 29, 72, 0.60)",
    glow: "rgba(244, 63, 94, 0.50)",
    bg: "assets/bg_poster_penguin.jpg"
  },
  spotify: {
    orb1: "rgba(34, 197, 94, 0.65)",
    orb2: "rgba(16, 185, 129, 0.60)",
    glow: "rgba(34, 197, 94, 0.50)",
    bg: "assets/bg_poster_arcane.jpg"
  },
  browser: {
    orb1: "rgba(56, 189, 248, 0.65)",
    orb2: "rgba(14, 165, 233, 0.60)",
    glow: "rgba(56, 189, 248, 0.50)",
    bg: "assets/bg_poster_arcane.jpg"
  },
  streaming: {
    orb1: "rgba(225, 29, 72, 0.65)",
    orb2: "rgba(190, 18, 60, 0.60)",
    glow: "rgba(225, 29, 72, 0.50)",
    bg: "assets/bg_poster_penguin.jpg"
  },
  default: {
    orb1: "rgba(56, 189, 248, 0.45)",
    orb2: "rgba(147, 51, 234, 0.40)",
    glow: "rgba(56, 189, 248, 0.45)",
    bg: "assets/bg_poster_dune.jpg"
  }
};

// DOM Elements
const views = {
  home: document.getElementById("view-home"),
  apps: document.getElementById("view-apps"),
  inputs: document.getElementById("view-inputs"),
  settings: document.getElementById("view-settings"),
  screensaver: document.getElementById("view-screensaver")
};
const jarvisPill = document.getElementById("jarvis-status-pill");
const jarvisModal = document.getElementById("jarvis-hud-modal");
const jarvisTicker = document.getElementById("jarvis-ticker");
const dynamicBg = document.getElementById("dynamic-bg");

/**
 * Apply Dynamic Blurred Background & Ambient Color Shifting on Hover / Focus
 */
function applyThemeShift(themeKey, customBg = null) {
  const t = COLOR_THEMES[themeKey] || COLOR_THEMES.default;
  const root = document.documentElement;

  root.style.setProperty("--theme-glow", t.glow);

  const orbTL = document.querySelector(".glow-orb.top-left");
  const orbTC = document.querySelector(".glow-orb.top-center");
  const orbTR = document.querySelector(".glow-orb.top-right");

  if (orbTL) orbTL.style.backgroundColor = t.orb1;
  if (orbTC) orbTC.style.backgroundColor = t.orb2;
  if (orbTR) orbTR.style.backgroundColor = t.glow;

  if (dynamicBg) {
    const bgUrl = customBg ? `url('${customBg}')` : `url('${t.bg}')`;
    dynamicBg.style.backgroundImage = bgUrl;
  }
}

/**
 * Switch Active View Tab
 */
function switchTab(tabId) {
  if (currentTab !== "screensaver") {
    previousTab = currentTab;
  }
  currentTab = tabId;

  // Manage 3D WebGL core active state
  if (tabId === "screensaver") {
    document.body.classList.add("screensaver-active");
    if (window.dispatchEvent) {
      window.dispatchEvent(new Event("resize"));
    }
    if (window.jarvisCoreTriggerSpeechAnimation) {
      window.jarvisCoreTriggerSpeechAnimation(60);
    }
    if (window.jarvisCoreSetTheme) {
      window.jarvisCoreSetTheme(userSettings.screensaverTheme === "cyan" ? "arc_cyan" : "gold");
    }
  } else {
    document.body.classList.remove("screensaver-active");
  }

  // Toggle View Containers
  Object.keys(views).forEach(key => {
    if (views[key]) {
      if (key === tabId) {
        views[key].classList.remove("hidden");
        views[key].classList.add("active");
      } else {
        views[key].classList.add("hidden");
        views[key].classList.remove("active");
      }
    }
  });

  // Toggle Header Nav Pills
  document.querySelectorAll(".nav-pill").forEach(pill => {
    if (pill.dataset.tab === tabId) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  // J.A.R.V.I.S. Pill is ONLY visible on the Home page
  if (jarvisPill) {
    jarvisPill.style.display = (tabId === "home") ? "flex" : "none";
  }

  if (tabId === "settings") {
    renderSettingsCategory(currentActiveCat);
  } else if (tabId === "home") {
    applyThemeShift("default");
  }

  // Restore focus to first interactive element
  setTimeout(() => {
    const firstFocus = views[tabId]?.querySelector("[tabindex='0']");
    if (firstFocus) firstFocus.focus();
  }, 60);

  resetInactivityTimer();
}

/**
 * Wake Up from Screensaver
 */
function wakeFromScreensaver() {
  if (currentTab === "screensaver") {
    switchTab(previousTab || "home");
  }
}

/**
 * Render Complete Fire TV Settings Category Details (All Default Categories)
 */
function renderSettingsCategory(catId) {
  currentActiveCat = catId;
  const panel = document.getElementById("settings-detail-panel");
  if (!panel) return;

  document.querySelectorAll(".settings-menu-item").forEach(item => {
    if (item.dataset.cat === catId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  let html = "";
  if (catId === "inputs") {
    html = `
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>⎚</span> HDMI Hardware Inputs
        </h3>
        <p class="text-xs text-white/60">Configure physical ports, HDMI CEC, and live detection</p>
        <div class="space-y-3 max-w-lg text-xs">
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-white font-semibold">HDMI 1 (eARC)</span>
              <span class="text-cyan-300 font-mono">Soundbar / Home Audio</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-white font-semibold">HDMI 2</span>
              <span class="text-emerald-300 font-mono flex items-center gap-1.5">
                <span class="hdmi-live-dot"></span> Active Signal Detected (4K 60Hz)
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-white font-semibold">HDMI 3</span>
              <span class="text-white/50 font-mono">Standard Port (Standby)</span>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div class="font-bold text-white">HDMI-CEC Device Control</div>
              <div class="text-[11px] text-white/60">Control connected power & audio via Fire TV remote</div>
            </div>
            <input type="checkbox" id="cfg-cec" class="toggle-checkbox w-5 h-5 accent-cyan-400" ${userSettings.cecControl ? "checked" : ""}>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div class="font-bold text-white">HDMI Input Plus (Enhanced 4K 60Hz 4:4:4)</div>
              <div class="text-[11px] text-white/60">Enables full HDR10 bandwidth on all HDMI inputs</div>
            </div>
            <input type="checkbox" id="cfg-enhanced-hdmi" class="toggle-checkbox w-5 h-5 accent-cyan-400" ${userSettings.enhancedHdmi ? "checked" : ""}>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-white/10 flex justify-end">
        <button onclick="saveActiveSettings()" class="px-5 py-2 rounded-xl bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-xs font-bold hover:bg-cyan-500/35 transition cursor-pointer">Save Input Settings</button>
      </div>
    `;
  } else if (catId === "display") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>🖥</span> Display & Audio Settings
        </h3>
        <div class="space-y-3 max-w-lg">
          <div>
            <label class="text-white/70 block mb-1">Video Resolution:</label>
            <select id="cfg-res" class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white font-medium">
              <option value="4K UHD 60Hz" selected>Auto / 4K UHD (3840x2160 @ 60Hz HDR)</option>
              <option value="1080p 60Hz">1080p Full HD @ 60Hz</option>
              <option value="720p 60Hz">720p HD</option>
            </select>
          </div>
          <div>
            <label class="text-white/70 block mb-1">Color Depth:</label>
            <select id="cfg-color-depth" class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white font-medium">
              <option value="10-bit" selected>Up to 10-bit (Recommended for HDR10)</option>
              <option value="8-bit">8-bit Standard</option>
              <option value="12-bit">12-bit Extended</option>
            </select>
          </div>
          <div>
            <label class="text-white/70 block mb-1">Audio Surround Format:</label>
            <select id="cfg-audio-out" class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white font-medium">
              <option selected>eARC Pass-Through (Dolby Atmos & TrueHD)</option>
              <option>Dolby Digital Plus</option>
              <option>PCM Stereo</option>
            </select>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div class="font-bold text-white">Night Mode Audio (Dynamic Range Compression)</div>
              <div class="text-[11px] text-white/60">Boosts quiet dialogue & softens loud explosions for night viewing</div>
            </div>
            <input type="checkbox" id="cfg-night-audio" class="w-5 h-5 accent-cyan-400" ${userSettings.nightModeAudio ? "checked" : ""}>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div class="font-bold text-white">Govee T3 Ambient Camera Bleed</div>
              <div class="text-[11px] text-white/60">Dynamic edge glow matching current hovered title</div>
            </div>
            <input type="checkbox" id="cfg-govee" class="w-5 h-5 accent-cyan-400" ${userSettings.govee === "enabled" ? "checked" : ""}>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-white/10 flex justify-end">
        <button onclick="saveActiveSettings()" class="px-5 py-2 rounded-xl bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-xs font-bold hover:bg-cyan-500/35 transition cursor-pointer">Save Display Preferences</button>
      </div>
    `;
  } else if (catId === "network") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>📶</span> Network & Wi-Fi Configuration
        </h3>
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="flex justify-between"><span class="text-white/60">Connected Wi-Fi:</span><span class="text-emerald-300 font-semibold font-mono">Home-5G (Mesh Wi-Fi 6)</span></div>
          <div class="flex justify-between"><span class="text-white/60">Signal Strength:</span><span class="text-white font-mono">Excellent (-46 dBm)</span></div>
          <div class="flex justify-between"><span class="text-white/60">TV IP Address:</span><span class="text-white font-mono">192.168.68.82</span></div>
          <div class="flex justify-between"><span class="text-white/60">Gateway / DNS:</span><span class="text-white font-mono">192.168.68.1</span></div>
          <div class="flex justify-between"><span class="text-white/60">J.A.R.V.I.S. Host Link:</span><span class="text-cyan-300 font-mono">192.168.68.54:8000 (Connected)</span></div>
        </div>
        <div class="pt-2">
          <button onclick="testNetworkSpeed()" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition">
            Test Network Connection & Latency
          </button>
        </div>
      </div>
    `;
  } else if (catId === "applications") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>📱</span> Manage Installed Applications
        </h3>
        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div class="font-bold text-white">Stremio 4K</div>
              <div class="text-[10px] text-white/50 font-mono">v1.6.12 • Cache: 142 MB</div>
            </div>
            <button onclick="clearAppCache('Stremio')" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px]">Clear Cache</button>
          </div>
          <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div class="font-bold text-white">SmartTube (YouTube Ad-Free)</div>
              <div class="text-[10px] text-white/50 font-mono">v22.38 • Cache: 68 MB</div>
            </div>
            <button onclick="clearAppCache('SmartTube')" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px]">Clear Cache</button>
          </div>
          <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div class="font-bold text-white">Spotify TV</div>
              <div class="text-[10px] text-white/50 font-mono">v8.9.10 • Cache: 84 MB</div>
            </div>
            <button onclick="clearAppCache('Spotify')" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px]">Clear Cache</button>
          </div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
          <span class="text-emerald-300 font-semibold">Unknown Sources / Sideloading:</span>
          <span class="text-emerald-400 font-mono font-bold">ALLOWED</span>
        </div>
      </div>
    `;
  } else if (catId === "equipment") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎛</span> Equipment Control
        </h3>
        <p class="text-xs text-white/60">Configure automatic TV & Soundbar power syncing</p>
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
          <div class="flex justify-between"><span>TV Power Control:</span><span class="text-white font-bold">Automatic via HDMI CEC</span></div>
          <div class="flex justify-between"><span>Soundbar Volume:</span><span class="text-white font-bold">eARC Master Sync</span></div>
          <div class="flex justify-between"><span>Input Switching:</span><span class="text-white font-bold">Direct HDMI 1/2/3</span></div>
        </div>
      </div>
    `;
  } else if (catId === "remotes") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎮</span> Remotes & Bluetooth Devices
        </h3>
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="flex justify-between"><span>Fire TV Voice Remote:</span><span class="text-emerald-300 font-semibold font-mono">Connected (Battery: 92%)</span></div>
          <div class="flex justify-between"><span>Firmware Version:</span><span class="text-white font-mono">v127 (Up to date)</span></div>
        </div>
        <div class="flex gap-2 pt-2">
          <button onclick="showToast('Scanning for Bluetooth headphones...')" class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold">Pair Bluetooth Headphones</button>
          <button onclick="showToast('Scanning for Game Controllers...')" class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold">Pair Game Controller</button>
        </div>
      </div>
    `;
  } else if (catId === "jarvis") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>🤖</span> J.A.R.V.I.S. Voice Engine & PC Bridge
        </h3>
        <div class="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2 font-mono">
          <div class="flex justify-between"><span class="text-white/70">Neural Voice:</span><span class="text-cyan-200 font-bold">Paul Bettany (Piper ONNX)</span></div>
          <div class="flex justify-between"><span class="text-white/70">Master Host PC:</span><span class="text-cyan-200">192.168.68.54:8000</span></div>
          <div class="flex justify-between"><span class="text-white/70">Bambu Lab P1S Link:</span><span class="text-emerald-300">Connected (Layer 164/200)</span></div>
          <div class="flex justify-between"><span class="text-white/70">Activation Shortcut:</span><span class="text-cyan-300">Hold Remote Select (750ms)</span></div>
        </div>
      </div>
    `;
  } else if (catId === "preferences") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>⚙</span> Preferences & Location
        </h3>
        <div class="space-y-3 max-w-md">
          <div>
            <label class="text-white/70 block mb-1">Weather & Location City:</label>
            <input type="text" id="cfg-city" class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white font-medium" value="${userSettings.city}">
          </div>
          <div>
            <label class="text-white/70 block mb-1">Timezone & Format:</label>
            <div class="px-3 py-2 rounded-xl bg-white/5 text-white/80 font-mono">Europe/London (GMT) • 12-Hour Clock</div>
          </div>
          <div class="p-3 rounded-xl bg-white/5 border border-white/10 text-white/60">
            Ad Tracking, Telemetry & Amazon Sponsored Ads: <strong class="text-emerald-400">Completely Blocked (0 Ads)</strong>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-white/10 flex justify-end">
        <button onclick="saveActiveSettings()" class="px-5 py-2 rounded-xl bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-xs font-bold hover:bg-cyan-500/35 transition cursor-pointer">Save Preferences</button>
      </div>
    `;
  } else if (catId === "sleep") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>⏱</span> Screensaver Timeout & Sleep
        </h3>
        <p class="text-xs text-white/60">3D Marvel Cinematic Holographic Core with Anti-Burn-In Protection</p>
        <div class="space-y-3 max-w-md">
          <div>
            <label class="text-white/70 block mb-1">Inactivity Timeout:</label>
            <select id="cfg-timeout" class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white font-medium">
              <option value="900000" ${userSettings.screensaverTimeout == 900000 && userSettings.screensaverEnabled ? "selected" : ""}>15 Minutes of No Movement (Default)</option>
              <option value="300000" ${userSettings.screensaverTimeout == 300000 && userSettings.screensaverEnabled ? "selected" : ""}>5 Minutes</option>
              <option value="600000" ${userSettings.screensaverTimeout == 600000 && userSettings.screensaverEnabled ? "selected" : ""}>10 Minutes</option>
              <option value="1800000" ${userSettings.screensaverTimeout == 1800000 && userSettings.screensaverEnabled ? "selected" : ""}>30 Minutes</option>
              <option value="0" ${!userSettings.screensaverEnabled ? "selected" : ""}>Turn Off Screensaver (Disabled)</option>
            </select>
          </div>
          <div>
            <label class="text-white/70 block mb-1">3D Visualizer Theme:</label>
            <select id="cfg-theme" class="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white font-medium">
              <option value="gold" ${userSettings.screensaverTheme === "gold" ? "selected" : ""}>Stark Amber Gold (Age of Ultron 1:1)</option>
              <option value="cyan" ${userSettings.screensaverTheme === "cyan" ? "selected" : ""}>Arc Reactor Cyan</option>
            </select>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div class="font-bold text-white">Anti-Burn-In Pixel Shift Drift</div>
              <div class="text-[11px] text-white/60">Gently drifts clock & weather to preserve TV panel pixels</div>
            </div>
            <input type="checkbox" id="cfg-drift" class="w-5 h-5 accent-cyan-400" checked>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-white/10 flex justify-end">
        <button onclick="saveActiveSettings()" class="px-5 py-2 rounded-xl bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-xs font-bold hover:bg-cyan-500/35 transition cursor-pointer">Save Screensaver Settings</button>
      </div>
    `;
  } else if (catId === "device") {
    html = `
      <div class="space-y-4 text-xs">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>ℹ</span> My Fire TV (About Device)
        </h3>
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="flex justify-between"><span class="text-white/60">Device:</span><span class="text-white font-bold">Jack's JVC 43" 4K TV</span></div>
          <div class="flex justify-between"><span class="text-white/60">Model:</span><span class="text-white font-mono">JVC_LT-43CF810(C)</span></div>
          <div class="flex justify-between"><span class="text-white/60">Software:</span><span class="text-white font-mono">Fire OS 7.7.1.4 (Android 9 Pie API 28)</span></div>
          <div class="flex justify-between"><span class="text-white/60">Storage:</span><span class="text-white font-mono">7.40 GB available of 11.44 GB</span></div>
          <div class="flex justify-between"><span class="text-white/60">System Interface:</span><span class="text-cyan-300 font-bold">Liquid Glass Zero-Ad Launcher v1.0.0</span></div>
        </div>
        <div class="flex gap-2 pt-2">
          <button onclick="simulateReboot()" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold">Restart Fire TV</button>
          <button onclick="switchTab('screensaver')" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold">Sleep / Standby</button>
        </div>
      </div>
    `;
  }

  panel.innerHTML = html;
}

/**
 * Save Active Settings
 */
window.saveActiveSettings = function() {
  const city = document.getElementById("cfg-city")?.value.trim();
  const govee = document.getElementById("cfg-govee")?.checked;
  const timeoutVal = document.getElementById("cfg-timeout")?.value;
  const themeVal = document.getElementById("cfg-theme")?.value;
  const cec = document.getElementById("cfg-cec")?.checked;
  const enh = document.getElementById("cfg-enhanced-hdmi")?.checked;
  const nightAudio = document.getElementById("cfg-night-audio")?.checked;

  if (city) userSettings.city = city;
  if (govee !== undefined) userSettings.govee = govee ? "enabled" : "disabled";
  if (themeVal) userSettings.screensaverTheme = themeVal;
  if (cec !== undefined) userSettings.cecControl = cec;
  if (enh !== undefined) userSettings.enhancedHdmi = enh;
  if (nightAudio !== undefined) userSettings.nightModeAudio = nightAudio;

  if (timeoutVal !== undefined) {
    const t = parseInt(timeoutVal);
    if (t === 0) {
      userSettings.screensaverEnabled = false;
    } else {
      userSettings.screensaverEnabled = true;
      userSettings.screensaverTimeout = t;
    }
  }

  localStorage.setItem("fivetv_user_settings", JSON.stringify(userSettings));
  applySettingsToUI();
  showToast("Fire TV Settings saved successfully!");
};

/**
 * Reset to Factory Defaults Modal Handlers
 */
window.openResetModal = function() {
  const modal = document.getElementById("reset-confirm-modal");
  if (modal) modal.classList.remove("hidden");
};

window.closeResetModal = function() {
  const modal = document.getElementById("reset-confirm-modal");
  if (modal) modal.classList.add("hidden");
};

window.confirmResetDefaults = function() {
  userSettings = Object.assign({}, DEFAULT_SETTINGS);
  watchState = Object.assign({}, DEFAULT_WATCH_LIST);
  localStorage.removeItem("fivetv_user_settings");
  localStorage.removeItem("fivetv_watch_state");

  closeResetModal();
  applySettingsToUI();
  applyWatchStateToUI();
  applyThemeShift("default");
  renderSettingsCategory(currentActiveCat);
  showToast("Fire TV settings successfully reset to factory defaults!");
};

/**
 * Update UI Labels with Current Settings
 */
function applySettingsToUI() {
  const weatherEl = document.getElementById("weather-display");
  const screensaverDate = document.getElementById("screensaver-date");

  if (weatherEl) weatherEl.textContent = `${userSettings.city} 14°C ☁`;
  if (screensaverDate) screensaverDate.textContent = `Sunday, November 15 • ${userSettings.city} 14°C ☁`;
}

/**
 * Dynamic Watch History Tracking
 */
window.resumeWatchItem = function(watchId) {
  const item = watchState[watchId];
  if (!item) return;

  // Advance watch percentage by +5% on resume click to demonstrate live dynamic tracking
  item.pct = Math.min(100, item.pct + 5);
  item.resume = `Resume at ${Math.floor(item.pct * 0.45)}:20`;
  watchState[watchId] = item;
  localStorage.setItem("fivetv_watch_state", JSON.stringify(watchState));

  applyWatchStateToUI();
  showToast(`Resuming ${item.title} on Stremio 4K...`);
};

function applyWatchStateToUI() {
  Object.keys(watchState).forEach(id => {
    const item = watchState[id];
    const bar = document.getElementById(`${id}-prog-bar`);
    const pct = document.getElementById(`${id}-pct-label`);
    const resume = document.getElementById(`${id}-resume-label`);
    const ep = document.getElementById(`${id}-ep-text`);

    if (bar) bar.style.width = `${item.pct}%`;
    if (pct) pct.textContent = `${item.pct}%`;
    if (resume) resume.textContent = item.resume;
    if (ep) ep.textContent = item.episode;
  });
}

/**
 * Input Port Switching
 */
window.switchToInput = function(portName) {
  showToast(`Switched TV Input to ${portName}`);
};

/**
 * Spotify Mini-Player Controls
 */
window.toggleSpotifyPlayback = function() {
  isSpotifyPlaying = !isSpotifyPlaying;
  const tag = document.getElementById("spotify-status-tag");
  const btn = document.getElementById("spotify-play-btn");

  if (isSpotifyPlaying) {
    if (tag) {
      tag.textContent = "Playing";
      tag.className = "text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    }
    if (btn) btn.textContent = "❚❚";
    showToast("Spotify TV: Resumed playback");
  } else {
    if (tag) {
      tag.textContent = "Paused";
      tag.className = "text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 border border-white/20";
    }
    if (btn) btn.textContent = "▶";
    showToast("Spotify TV: Paused");
  }
};

/**
 * Ticker Rotation
 */
function startTicker() {
  setInterval(() => {
    tickerIndex = (tickerIndex + 1) % TICKER_ITEMS.length;
    if (jarvisTicker) {
      jarvisTicker.classList.remove("ticker-fade");
      void jarvisTicker.offsetWidth;
      jarvisTicker.textContent = TICKER_ITEMS[tickerIndex];
      jarvisTicker.classList.add("ticker-fade");
    }
  }, 4000);
}

/**
 * Toast Notification Helper
 */
function showToast(msg) {
  const toast = document.getElementById("toast-notify");
  const label = document.getElementById("toast-message");
  if (!toast || !label) return;

  label.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

/**
 * J.A.R.V.I.S. Voice HUD Handlers
 */
window.showJarvisHUD = function(promptText = "Listening for request...") {
  if (!jarvisModal) return;
  jarvisModal.classList.remove("hidden");
  const transcript = document.getElementById("jarvis-transcript");
  if (transcript) transcript.textContent = promptText;
  if (window.jarvisCoreTriggerSpeechAnimation) {
    window.jarvisCoreTriggerSpeechAnimation(4.5);
  }
};

window.hideJarvisHUD = function() {
  if (!jarvisModal) return;
  jarvisModal.classList.add("hidden");
  resetInactivityTimer();
};

window.toggleNightMode = function() {
  userSettings.nightModeAudio = !userSettings.nightModeAudio;
  const btn = document.getElementById("btn-night-mode");
  if (btn) {
    btn.textContent = userSettings.nightModeAudio ? "🌙 Night Audio: On" : "🌙 Night Audio: Off";
  }
  showToast(userSettings.nightModeAudio ? "Night Audio compressor activated" : "Night Audio standard");
};

window.setGoveePreset = function(preset) {
  showToast(`Govee T3 backlight set to: ${preset.toUpperCase()}`);
};

window.clearAppCache = function(appName) {
  showToast(`Cleared cache for ${appName}`);
};

window.testNetworkSpeed = function() {
  showToast("Ping: 8ms • Download: 642 Mbps • Latency: Ultra-low");
};

window.simulateReboot = function() {
  showToast("Rebooting JVC 43' Fire TV system...");
  setTimeout(() => {
    window.location.reload();
  }, 1200);
};

/**
 * 15-Minute Screensaver Inactivity Auto-Activation
 */
function resetInactivityTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  
  // If screensaver is currently active, any user movement wakes the TV up!
  if (currentTab === "screensaver") {
    wakeFromScreensaver();
  }

  if (!userSettings.screensaverEnabled) return; // Can be turned off in Settings!

  const timeoutMs = userSettings.screensaverTimeout || 900000; // 15 mins = 900,000ms
  idleTimer = setTimeout(() => {
    if (currentTab !== "screensaver") {
      switchTab("screensaver");
    }
  }, timeoutMs);
}

/**
 * Clock & Anti-Burn-In Floating Drift
 */
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const timeEl = document.getElementById("screensaver-time");
  if (timeEl) {
    timeEl.innerHTML = `${hours}:${minutes}<span class="screensaver-ampm text-amber-300 font-light ml-3">${ampm}</span>`;
  }
}

/**
 * Remote D-Pad Navigation & Action Handlers
 */
function setupRemoteNavigation() {
  window.addEventListener("keydown", (e) => {
    resetInactivityTimer();

    // Dismiss Jarvis HUD on Back / Escape
    if ((e.keyCode === 4 || e.key === "Escape" || e.key === "Backspace") && jarvisModal && !jarvisModal.classList.contains("hidden")) {
      e.preventDefault();
      hideJarvisHUD();
      return;
    }

    // Wake from screensaver on any keypress
    if (currentTab === "screensaver") {
      e.preventDefault();
      wakeFromScreensaver();
      return;
    }

    // Hold Remote Button (750ms) -> J.A.R.V.I.S. Voice HUD
    if ((e.keyCode === 23 || e.key === "Enter" || e.keyCode === 66 || e.keyCode === 85) && !holdButtonTimer) {
      holdButtonTimer = setTimeout(() => {
        isHolding = true;
        showJarvisHUD("Voice satellite active. Listening in Paul Bettany voice...");
      }, 750);
    }

    // Spatial Navigation
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      handleSpatialNav(e.key, document.activeElement);
    }
  });

  window.addEventListener("keyup", (e) => {
    if (holdButtonTimer) {
      clearTimeout(holdButtonTimer);
      holdButtonTimer = null;
    }

    if ((e.keyCode === 23 || e.key === "Enter" || e.keyCode === 66) && !isHolding) {
      const active = document.activeElement;
      if (active && active.dataset) {
        handleAction(active);
      }
    }
    isHolding = false;
  });

  // Reset inactivity timer on any user interaction
  window.addEventListener("mousemove", resetInactivityTimer);
  window.addEventListener("click", resetInactivityTimer);
  window.addEventListener("touchstart", resetInactivityTimer);

  // Track Focus & Hover for Dynamic Shaders & Blurred Background Preview
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (el && el.dataset && el.dataset.theme) {
      applyThemeShift(el.dataset.theme, el.dataset.bg);
    }
  });

  document.querySelectorAll("[data-theme]").forEach(el => {
    el.addEventListener("mouseenter", () => applyThemeShift(el.dataset.theme, el.dataset.bg));
    el.addEventListener("mouseleave", () => {
      if (!document.activeElement?.dataset?.theme) {
        applyThemeShift("default");
      }
    });
  });
}

function handleSpatialNav(direction, current) {
  const focusables = Array.from(document.querySelectorAll("button:not(.hidden), [tabindex='0']:not(.hidden), input:not(.hidden)"));
  const currentIndex = focusables.indexOf(current);

  if (currentIndex === -1 && focusables.length > 0) {
    focusables[0].focus();
    return;
  }

  let nextIndex = currentIndex;
  if (direction === "ArrowRight") nextIndex = Math.min(currentIndex + 1, focusables.length - 1);
  if (direction === "ArrowLeft") nextIndex = Math.max(currentIndex - 1, 0);
  if (direction === "ArrowDown") nextIndex = Math.min(currentIndex + 3, focusables.length - 1);
  if (direction === "ArrowUp") nextIndex = Math.max(currentIndex - 3, 0);

  if (focusables[nextIndex]) {
    focusables[nextIndex].focus();
  }
}

function handleAction(element) {
  const tab = element.dataset.tab;
  if (tab) {
    switchTab(tab);
    return;
  }

  const cat = element.dataset.cat;
  if (cat) {
    renderSettingsCategory(cat);
    return;
  }

  const watchId = element.dataset.watchId;
  if (watchId) {
    resumeWatchItem(watchId);
    return;
  }

  const app = element.dataset.app;
  if (app) {
    showToast(`Launching ${app}...`);
    const pkg = element.dataset.package;
    if (pkg) {
      window.location.href = `intent:#Intent;package=${pkg};end`;
    }
    return;
  }

  const input = element.dataset.input;
  if (input) {
    switchToInput(element.querySelector(".text-xs, .text-base")?.textContent || input);
  }
}

// Lifecycle Init
window.addEventListener("DOMContentLoaded", () => {
  setupRemoteNavigation();
  applySettingsToUI();
  applyWatchStateToUI();
  startTicker();
  resetInactivityTimer();
  setInterval(updateClock, 1000);
  updateClock();

  // Navigation tab listeners
  document.querySelectorAll(".nav-pill").forEach(pill => {
    pill.addEventListener("click", () => switchTab(pill.dataset.tab));
  });

  // Settings category sidebar listeners
  document.querySelectorAll(".settings-menu-item").forEach(item => {
    item.addEventListener("click", () => renderSettingsCategory(item.dataset.cat));
  });

  // Set initial focus to the first show card
  const defaultFocus = document.querySelector(".show-card");
  if (defaultFocus) defaultFocus.focus();
});
