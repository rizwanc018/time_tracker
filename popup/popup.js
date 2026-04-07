// popup.js
// Reads data from chrome.storage and renders it in popup.html

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

async function render() {
  // 1. Get all stored data
  const data = await new Promise(resolve =>
    chrome.storage.local.get(null, resolve)
  );

  // 2. Get the active tab's hostname
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let currentHost = null;
  try {
    currentHost = new URL(tab.url).hostname;
  } catch (_) {}

  // 3. Show current site info
  const hostEl = document.getElementById("currentHost");
  const timeEl = document.getElementById("currentTime");
  if (currentHost) {
    hostEl.textContent = currentHost;
    const currentSeconds = data[`time_${currentHost}`] || 0;
    timeEl.textContent = formatTime(currentSeconds);
  } else {
    hostEl.textContent = "chrome page";
    timeEl.textContent = "—";
  }

  // 4. Build sorted list of all tracked sites
  const entries = Object.entries(data)
    .filter(([k]) => k.startsWith("time_"))
    .map(([k, v]) => ({ hostname: k.replace("time_", ""), seconds: v }))
    .sort((a, b) => b.seconds - a.seconds);

  const listEl = document.getElementById("siteList");

  if (entries.length === 0) {
    listEl.innerHTML = `<div class="empty">No data yet. Start browsing!</div>`;
    return;
  }

  const maxSeconds = entries[0].seconds; // For bar width scaling
  const totalSeconds = entries.reduce((sum, e) => sum + e.seconds, 0);

  // 5. Render each site row
  listEl.innerHTML = entries.map((entry, i) => {
    const barWidth = Math.round((entry.seconds / maxSeconds) * 100);
    const isActive = entry.hostname === currentHost;
    return `
      <div class="site-row" style="animation-delay:${i * 40}ms; ${isActive ? 'border-color: #2a3a1a;' : ''}">
        <span class="site-name" title="${entry.hostname}">${entry.hostname}</span>
        <div class="site-bar-wrap">
          <div class="site-bar" style="width:${barWidth}%; ${isActive ? 'background:#e8ff47' : 'background:#3a3a50'}"></div>
        </div>
        <span class="site-time">${formatTime(entry.seconds)}</span>
      </div>
    `;
  }).join("");

  document.getElementById("totalTime").textContent = formatTime(totalSeconds);
}

// Run on open
render();