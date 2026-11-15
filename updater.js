/**
 * updater.js - GitHub Live Over-The-Air (OTA) Auto-Updater
 * Syncs changes made on your PC to your JVC Fire TV over home Wi-Fi via GitHub
 */

const UPDATER_CONFIG = {
  repoOwner: "jack21-21",
  repoName: "FiveTV-Ui",
  branch: "main",
  checkIntervalMs: 600000, // Check every 10 minutes
  localVersion: "1.0.0"
};

class LiveOTAUpdater {
  constructor() {
    this.currentSha = localStorage.getItem("fivetv_current_sha") || "init";
  }

  init() {
    console.log("[OTA Updater] Initialized. Current SHA:", this.currentSha);
    // Check update on launch
    setTimeout(() => this.checkForUpdates(), 3000);
    // Periodic check
    setInterval(() => this.checkForUpdates(), UPDATER_CONFIG.checkIntervalMs);
  }

  async checkForUpdates() {
    try {
      console.log("[OTA Updater] Checking GitHub for remote updates...");
      const url = `https://api.github.com/repos/${UPDATER_CONFIG.repoOwner}/${UPDATER_CONFIG.repoName}/commits/${UPDATER_CONFIG.branch}`;
      const response = await fetch(url, {
        headers: { "Accept": "application/vnd.github.v3+json" }
      });

      if (!response.ok) {
        console.warn("[OTA Updater] GitHub API rate limit or repo private:", response.status);
        return;
      }

      const commit = await response.json();
      const latestSha = commit.sha;

      if (this.currentSha === "init") {
        this.currentSha = latestSha;
        localStorage.setItem("fivetv_current_sha", latestSha);
        return;
      }

      if (latestSha && latestSha !== this.currentSha) {
        console.log(`[OTA Updater] Update detected! Old: ${this.currentSha} -> New: ${latestSha}`);
        this.notifyUpdate(commit.commit?.message || "Layout & features updated");
        this.currentSha = latestSha;
        localStorage.setItem("fivetv_current_sha", latestSha);
        
        // Auto-refresh after 3 seconds
        setTimeout(() => {
          window.location.reload(true);
        }, 3000);
      } else {
        console.log("[OTA Updater] TV is currently on the latest version.");
      }
    } catch (err) {
      console.warn("[OTA Updater] Could not verify GitHub update:", err.message);
    }
  }

  notifyUpdate(message) {
    const banner = document.createElement("div");
    banner.className = "fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-200 text-xs font-mono shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 animate-bounce";
    banner.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
      <span>OTA Update Applied: ${message} (Reloading...)</span>
    `;
    document.body.appendChild(banner);
  }
}

const otaUpdater = new LiveOTAUpdater();
window.addEventListener("DOMContentLoaded", () => otaUpdater.init());
