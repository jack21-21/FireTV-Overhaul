/**
 * app.js - Master Navigation, Dynamic Shaders, Settings & J.A.R.V.I.S. Engine
 * Clean Apple Liquid Glass UI for Jack's JVC 43" Fire TV Edition
 */

const DEFAULT_SETTINGS = {
  hdmi1: "Soundbar",
  hdmi2: "PS5",
  hdmi3: "PC Link",
  city: "Wisbech",
  govee: "enabled",
  timeout: 180000
};

let userSettings = Object.assign({}, DEFAULT_SETTINGS);

// Load settings from localStorage
try {
  const saved = localStorage.getItem("fivetv_user_settings");
  if (saved) {
    userSettings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved));
  }
} catch (e) {
  console.warn("Could not load saved settings:", e);
}

// State
let currentTab = "home";
let idleTimer = null;
let holdButtonTimer = null;
let isHolding = false;
let tickerIndex = 0;

// Dynamic Ticker Items for J.A.R.V.I.S. Status Mini-Pill
const TICKER_ITEMS = [
  "🖨 Bambu P1S: Printing 68% • Layer 164/200",
  "💻 PC Hardware: CPU 42°C • GPU 48°C • RAM 38%",
  "✉️ Gmail: 2 New Unread • Latest from Boss"
];

// Color Palettes for Hover / Focus Reactive Shifts
const COLOR_THEMES = {
  dune: {
    orb1: "rgba(245, 158, 11, 0.65)",
    orb2: "rgba(217, 119, 6, 0.6)",
    glow: "rgba(245, 158, 11, 0.45)",
    reactor: "rgba(251, 191, 36, 0.95)"
  },
  arcane: {
    orb1: "rgba(6, 182, 212, 0.65)",
    orb2: "rgba(59, 130, 246, 0.6)",
    glow: "rgba(14, 165, 233, 0.45)",
    reactor: "rgba(34, 211, 238, 0.95)"
  },
  penguin: {
    orb1: "rgba(220, 38, 38, 0.65)",
    orb2: "rgba(159, 18, 57, 0.6)",
    glow: "rgba(225, 29, 72, 0.45)",
    reactor: "rgba(239, 68, 68, 0.95)"
  },
  stremio: {
    orb1: "rgba(168, 85, 247, 0.65)",
    orb2: "rgba(126, 34, 206, 0.6)",
    glow: "rgba(168, 85, 247, 0.45)",
    reactor: "rgba(192, 132, 252, 0.95)"
  },
  youtube: {
    orb1: "rgba(244, 63, 94, 0.65)",
    orb2: "rgba(225, 29, 72, 0.6)",
    glow: "rgba(244, 63, 94, 0.45)",
    reactor: "rgba(251, 113, 133, 0.95)"
  },
  spotify: {
    orb1: "rgba(34, 197, 94, 0.65)",
    orb2: "rgba(16, 185, 129, 0.6)",
    glow: "rgba(34, 197, 94, 0.45)",
    reactor: "rgba(74, 222, 128, 0.95)"
  },
  browser: {
    orb1: "rgba(56, 189, 248, 0.65)",
    orb2: "rgba(14, 165, 233, 0.6)",
    glow: "rgba(56, 189, 248, 0.45)",
    reactor: "rgba(56, 189, 248, 0.95)"
  },
  downloader: {
    orb1: "rgba(14, 165, 233, 0.65)",
    orb2: "rgba(2, 132, 199, 0.6)",
    glow: "rgba(14, 165, 233, 0.45)",
    reactor: "rgba(56, 189, 248, 0.95)"
  },
  streaming: {
    orb1: "rgba(225, 29, 72, 0.65)",
    orb2: "rgba(190, 18, 60, 0.6)",
    glow: "rgba(225, 29, 72, 0.45)",
    reactor: "rgba(244, 63, 94, 0.95)"
  },
  default: {
    orb1: "rgba(56, 189, 248, 0.45)",
    orb2: "rgba(147, 51, 234, 0.4)",
    glow: "rgba(56, 189, 248, 0.45)",
    reactor: "rgba(14, 165, 233, 0.85)"
  }
};

// DOM References
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

/**
 * Apply Dynamic Full-UI Ambient Color Shifting on Hover / Focus
 */
function applyThemeShift(themeKey) {
  if (userSettings.govee === "disabled") return;
  const t = COLOR_THEMES[themeKey] || COLOR_THEMES.default;
  const root = document.documentElement;

  root.style.setProperty("--theme-orb-1", t.orb1);
  root.style.setProperty("--theme-orb-2", t.orb2);
  root.style.setProperty("--theme-glow", t.glow);
  root.style.setProperty("--theme-reactor", t.reactor);
}

/**
 * Switch Active View Tab
 */
function switchTab(tabId) {
  currentTab = tabId;
  
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

  // Update tabs highlight
  document.querySelectorAll(".nav-pill").forEach(pill => {
    if (pill.dataset.tab === tabId) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  // J.A.R.V.I.S. Status Mini-Pill is ONLY visible on the Home page
  if (jarvisPill) {
    jarvisPill.style.display = (tabId === "home") ? "flex" : "none";
  }

  // Set focus to the first interactive item in the tab
  setTimeout(() => {
    const firstFocus = views[tabId]?.querySelector("[tabindex='0']");
    if (firstFocus) firstFocus.focus();
  }, 60);

  resetIdleTimer();
}

/**
 * Update UI Labels with Current Settings
 */
function applySettingsToUI() {
  const subHdmi1 = document.getElementById("sub-hdmi1");
  const subHdmi2 = document.getElementById("sub-hdmi2");
  const subHdmi3 = document.getElementById("sub-hdmi3");
  const weatherEl = document.getElementById("weather-display");

  if (subHdmi1) subHdmi1.textContent = userSettings.hdmi1;
  if (subHdmi2) subHdmi2.textContent = userSettings.hdmi2;
  if (subHdmi3) subHdmi3.textContent = userSettings.hdmi3;
  if (weatherEl) weatherEl.textContent = `${userSettings.city} 14°C ☁`;

  // Form inputs
  const inputH1 = document.getElementById("setting-hdmi1");
  const inputH2 = document.getElementById("setting-hdmi2");
  const inputH3 = document.getElementById("setting-hdmi3");
  const inputCity = document.getElementById("setting-city");
  const selectGovee = document.getElementById("setting-govee");
  const selectTimeout = document.getElementById("setting-timeout");

  if (inputH1) inputH1.value = userSettings.hdmi1;
  if (inputH2) inputH2.value = userSettings.hdmi2;
  if (inputH3) inputH3.value = userSettings.hdmi3;
  if (inputCity) inputCity.value = userSettings.city;
  if (selectGovee) selectGovee.value = userSettings.govee;
  if (selectTimeout) selectTimeout.value = userSettings.timeout;
}

/**
 * Save Settings
 */
function saveSettings() {
  const inputH1 = document.getElementById("setting-hdmi1")?.value.trim() || DEFAULT_SETTINGS.hdmi1;
  const inputH2 = document.getElementById("setting-hdmi2")?.value.trim() || DEFAULT_SETTINGS.hdmi2;
  const inputH3 = document.getElementById("setting-hdmi3")?.value.trim() || DEFAULT_SETTINGS.hdmi3;
  const inputCity = document.getElementById("setting-city")?.value.trim() || DEFAULT_SETTINGS.city;
  const selectGovee = document.getElementById("setting-govee")?.value || DEFAULT_SETTINGS.govee;
  const selectTimeout = parseInt(document.getElementById("setting-timeout")?.value || DEFAULT_SETTINGS.timeout);

  userSettings = {
    hdmi1: inputH1,
    hdmi2: inputH2,
    hdmi3: inputH3,
    city: inputCity,
    govee: selectGovee,
    timeout: selectTimeout
  };

  localStorage.setItem("fivetv_user_settings", JSON.stringify(userSettings));
  applySettingsToUI();

  const status = document.getElementById("settings-status");
  if (status) {
    status.textContent = "✓ Settings saved successfully!";
    setTimeout(() => { status.textContent = ""; }, 3000);
  }
}

/**
 * Reset Settings to Default
 */
function resetSettingsToDefault() {
  userSettings = Object.assign({}, DEFAULT_SETTINGS);
  localStorage.removeItem("fivetv_user_settings");
  applySettingsToUI();
  applyThemeShift("default");

  const status = document.getElementById("settings-status");
  if (status) {
    status.textContent = "↺ Reset to factory defaults complete.";
    setTimeout(() => { status.textContent = ""; }, 3000);
  }
}

/**
 * Ticker Rotation: Cycles Bambu P1S, PC Temps, Newest Email
 */
function startTicker() {
  setInterval(() => {
    tickerIndex = (tickerIndex + 1) % TICKER_ITEMS.length;
    if (jarvisTicker) {
      jarvisTicker.classList.remove("ticker-fade");
      void jarvisTicker.offsetWidth; // trigger reflow
      jarvisTicker.textContent = TICKER_ITEMS[tickerIndex];
      jarvisTicker.classList.add("ticker-fade");
    }
  }, 3500);
}

/**
 * J.A.R.V.I.S. Voice Assistant HUD
 */
function showJarvisHUD(promptText = "Listening for request...") {
  if (!jarvisModal) return;
  jarvisModal.classList.remove("hidden");
  
  const transcript = document.getElementById("jarvis-transcript");
  if (transcript) {
    transcript.textContent = promptText;
  }
}

function dismissJarvisHUD() {
  if (!jarvisModal) return;
  jarvisModal.classList.add("hidden");
  resetIdleTimer();
}

/**
 * Remote Control & Keyboard Navigation Engine
 */
function setupRemoteNavigation() {
  window.addEventListener("keydown", (e) => {
    resetIdleTimer();

    // Dismiss Jarvis HUD on Back or Escape
    if ((e.keyCode === 4 || e.key === "Escape" || e.key === "Backspace") && !jarvisModal.classList.contains("hidden")) {
      e.preventDefault();
      dismissJarvisHUD();
      return;
    }

    // Wake from screensaver on any key
    if (currentTab === "screensaver") {
      e.preventDefault();
      switchTab("home");
      return;
    }

    // Long Press Detection for "Hold Button" -> Summon J.A.R.V.I.S.
    if ((e.keyCode === 23 || e.key === "Enter" || e.keyCode === 66 || e.keyCode === 85) && !holdButtonTimer) {
      holdButtonTimer = setTimeout(() => {
        isHolding = true;
        showJarvisHUD("Voice satellite active. Listening in Paul Bettany voice...");
      }, 750);
    }

    // D-Pad Directional Navigation
    const active = document.activeElement;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      handleSpatialNav(e.key, active);
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

  // Track Focus & Hover for Dynamic Shifter
  document.addEventListener("focusin", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.theme) {
      applyThemeShift(e.target.dataset.theme);
    }
  });

  document.querySelectorAll("[data-theme]").forEach(el => {
    el.addEventListener("mouseenter", () => applyThemeShift(el.dataset.theme));
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

  const stream = element.dataset.stream;
  if (stream) {
    window.location.href = stream;
    return;
  }

  const app = element.dataset.app;
  if (app) {
    const pkg = element.dataset.package;
    if (pkg) {
      window.location.href = `intent:#Intent;package=${pkg};end`;
    }
    return;
  }

  const input = element.dataset.input;
  if (input) {
    switchTab("settings");
    setTimeout(() => {
      document.getElementById(`setting-${input}`)?.focus();
    }, 100);
  }
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (currentTab !== "screensaver") {
      switchTab("screensaver");
    }
  }, userSettings.timeout || DEFAULT_SETTINGS.timeout);
}

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  const timeEl = document.getElementById("screensaver-time");
  const dateEl = document.getElementById("screensaver-date");
  if (timeEl) timeEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = `${dateStr} • ${userSettings.city} 14°C`;
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  setupRemoteNavigation();
  applySettingsToUI();
  startTicker();
  resetIdleTimer();
  setInterval(updateClock, 1000);
  updateClock();

  // Tab listeners
  document.querySelectorAll(".nav-pill").forEach(pill => {
    pill.addEventListener("click", () => switchTab(pill.dataset.tab));
  });

  // Settings Buttons
  const btnSave = document.getElementById("btn-save-settings");
  const btnReset = document.getElementById("btn-reset-defaults");
  const btnDismiss = document.getElementById("jarvis-dismiss-btn");

  if (btnSave) btnSave.addEventListener("click", saveSettings);
  if (btnReset) btnReset.addEventListener("click", resetSettingsToDefault);
  if (btnDismiss) btnDismiss.addEventListener("click", dismissJarvisHUD);

  // Default focus
  const defaultFocus = document.querySelector(".show-card");
  if (defaultFocus) defaultFocus.focus();
});