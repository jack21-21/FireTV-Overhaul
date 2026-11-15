/**
 * app.js - Master Navigation, D-Pad Controller, and J.A.R.V.I.S. Engine
 * Optimized for Jack's JVC 43" Fire TV Edition (Fire OS 7.7.1)
 */

const CONFIG = {
  jarvisHost: "http://192.168.68.54:8000", // Your PC running Jarvis Connected
  fallbackHost: "http://127.0.0.1:8000",
  weatherCity: "London",
  bambuModel: "P1S",
  idleScreensaverMs: 180000 // 3 minutes
};

// State
let currentTab = "home";
let idleTimer = null;
let holdButtonTimer = null;
let isHolding = false;

// DOM Elements
const views = {
  home: document.getElementById("view-home"),
  apps: document.getElementById("view-apps"),
  inputs: document.getElementById("view-inputs"),
  screensaver: document.getElementById("view-screensaver")
};
const jarvisPill = document.getElementById("jarvis-status-pill");
const jarvisModal = document.getElementById("jarvis-hud-modal");
const jarvisDismissBtn = document.getElementById("jarvis-dismiss-btn");
const glowContainer = document.getElementById("ambient-bleed");

/**
 * Switch Active View
 */
function switchTab(tabId) {
  currentTab = tabId;
  
  // Update views
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

  // Rule: J.A.R.V.I.S. Status Mini-Pill is ONLY visible on the Home page
  if (jarvisPill) {
    if (tabId === "home") {
      jarvisPill.style.display = "flex";
    } else {
      jarvisPill.style.display = "none";
    }
  }

  // Set focus to the first interactive item in the tab
  setTimeout(() => {
    const firstFocus = views[tabId]?.querySelector("[tabindex='0']");
    if (firstFocus) firstFocus.focus();
  }, 50);

  resetIdleTimer();
}

/**
 * Dynamic Govee T3 Ambient Lighting Shifter
 * Adapts top/side glow orbs to match the focused card so the Govee camera mirrors it onto the wall!
 */
function updateGoveeAmbientGlow(element) {
  if (!glowContainer) return;
  const app = element.dataset.app || element.dataset.input;

  const topCenter = glowContainer.querySelector(".glow-orb.top-center");
  const topLeft = glowContainer.querySelector(".glow-orb.top-left");
  const topRight = glowContainer.querySelector(".glow-orb.top-right");

  if (app === "stremio") {
    topCenter.style.background = "radial-gradient(circle, rgba(168, 85, 247, 0.7), transparent 70%)";
    topLeft.style.background = "radial-gradient(circle, rgba(147, 51, 234, 0.6), transparent 70%)";
  } else if (app === "smarttube") {
    topCenter.style.background = "radial-gradient(circle, rgba(244, 63, 94, 0.7), transparent 70%)";
    topLeft.style.background = "radial-gradient(circle, rgba(225, 29, 72, 0.6), transparent 70%)";
  } else if (app === "spotify") {
    topCenter.style.background = "radial-gradient(circle, rgba(34, 197, 94, 0.7), transparent 70%)";
    topLeft.style.background = "radial-gradient(circle, rgba(16, 185, 129, 0.6), transparent 70%)";
  } else if (app === "browser" || app === "downloader") {
    topCenter.style.background = "radial-gradient(circle, rgba(56, 189, 248, 0.7), transparent 70%)";
    topLeft.style.background = "radial-gradient(circle, rgba(14, 165, 233, 0.6), transparent 70%)";
  } else if (app === "netflix") {
    topCenter.style.background = "radial-gradient(circle, rgba(220, 38, 38, 0.7), transparent 70%)";
  } else {
    // Default Apple Cyan & Gold
    topCenter.style.background = "radial-gradient(circle, rgba(147, 51, 234, 0.4), transparent 70%)";
    topLeft.style.background = "radial-gradient(circle, rgba(56, 189, 248, 0.5), transparent 70%)";
  }
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

  // Trigger TTS voice or command bridge if server is reachable
  fetch(`${CONFIG.jarvisHost}/api/voice/status`)
    .then(r => r.json())
    .then(data => {
      if (transcript) transcript.textContent = `"Right away, sir. Querying TMDB, resuming Dune in Stremio at 28:14, and syncing Govee T3 to Cinematic Dark."`;
    })
    .catch(() => {
      // Offline fallback
      if (transcript) transcript.textContent = `"System active, sir. Ready to launch Stremio or switch HDMI inputs."`;
    });
}

function dismissJarvisHUD() {
  if (!jarvisModal) return;
  jarvisModal.classList.add("hidden");
  resetIdleTimer();
}

/**
 * Remote Control & Keyboard Navigation Engine
 * Supports standard Fire TV D-Pad Keycodes:
 * 19 (Up), 20 (Down), 21 (Left), 22 (Right), 23 (Center/Select), 4 (Back), 66 (Enter), 85 (Play/Pause)
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
      }, 750); // 750ms hold trigger
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

    // Normal Click / Select
    if ((e.keyCode === 23 || e.key === "Enter" || e.keyCode === 66) && !isHolding) {
      const active = document.activeElement;
      if (active && active.dataset) {
        handleAction(active);
      }
    }
    isHolding = false;
  });

  // Track Focus Changes for Govee Lighting Bleed
  document.addEventListener("focusin", (e) => {
    if (e.target && e.target.classList) {
      updateGoveeAmbientGlow(e.target);
    }
  });
}

/**
 * Spatial Grid Navigation Handler
 */
function handleSpatialNav(direction, current) {
  const focusables = Array.from(document.querySelectorAll("button:not(.hidden), [tabindex='0']:not(.hidden)"));
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

/**
 * Handle Launch / Action on Enter / Select
 */
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
    console.log(`[Launch] App: ${app} (${pkg})`);
    // On Android Webview / TV Launcher, deep link via Android Intent
    if (pkg) {
      window.location.href = `intent:#Intent;package=${pkg};end`;
    }
    return;
  }

  const input = element.dataset.input;
  if (input) {
    console.log(`[Switch Input] JVC Hardware Port: ${input}`);
    // Trigger TV input change via Fire OS JVC API or prompt
    alert(`Switching JVC TV input to ${input.toUpperCase()}...`);
  }
}

/**
 * Screensaver Clock & Idle Timer
 */
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (currentTab !== "screensaver") {
      switchTab("screensaver");
    }
  }, CONFIG.idleScreensaverMs);
}

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  const timeEl = document.getElementById("screensaver-time");
  const dateEl = document.getElementById("screensaver-date");
  if (timeEl) timeEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = `${dateStr} • ${CONFIG.weatherCity} 14°C`;
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  setupRemoteNavigation();
  resetIdleTimer();
  setInterval(updateClock, 1000);
  updateClock();

  // Tab buttons click listeners
  document.querySelectorAll(".nav-pill").forEach(pill => {
    pill.addEventListener("click", () => switchTab(pill.dataset.tab));
  });

  if (jarvisDismissBtn) {
    jarvisDismissBtn.addEventListener("click", dismissJarvisHUD);
  }

  // Set default focus
  const defaultFocus = document.querySelector(".show-card");
  if (defaultFocus) defaultFocus.focus();
});