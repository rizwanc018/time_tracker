let activeHostname = null;   // Which site is currently being tracked
let trackingStart = null;    // When we started tracking the current session


async function getStoredData() {
  return new Promise(resolve => {
    chrome.storage.local.get(null, data => resolve(data || {}));
  });
}

async function addTime(hostname, seconds) {
  if (!hostname || seconds <= 0) return;
  const data = await getStoredData();
  const key = `time_${hostname}`;
  data[key] = (data[key] || 0) + seconds;
  chrome.storage.local.set(data);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}


function startTracking(hostname) {
  if (activeHostname && trackingStart) {
    const elapsed = Math.floor((Date.now() - trackingStart) / 1000);
    addTime(activeHostname, elapsed);
  }
  activeHostname = hostname;
  trackingStart = Date.now();
}

function pauseTracking() {
  if (activeHostname && trackingStart) {
    const elapsed = Math.floor((Date.now() - trackingStart) / 1000);
    addTime(activeHostname, elapsed);
  }
  activeHostname = null;
  trackingStart = null;
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "PAGE_ACTIVE" && message.hostname) {
    startTracking(message.hostname);
  } else if (message.type === "PAGE_HIDDEN") {
    pauseTracking();
  }
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("tenMinuteReminder", {
    periodInMinutes: 10   
  });
});

chrome.alarms.get("tenMinuteReminder", alarm => {
  if (!alarm) {
    chrome.alarms.create("tenMinuteReminder", { periodInMinutes: 10 });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "tenMinuteReminder") return;

  if (activeHostname && trackingStart) {
    const elapsed = Math.floor((Date.now() - trackingStart) / 1000);
    await addTime(activeHostname, elapsed);
    trackingStart = Date.now(); 
  }

  const data = await getStoredData();

  if (!activeHostname) return; 
  const key = `time_${activeHostname}`;
  const totalSeconds = data[key] || 0;

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: "⏱ Time Check!",
    message: `You've spent ${formatTime(totalSeconds)} on ${activeHostname} today.`
  });
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url && !tab.url.startsWith("chrome://")) {
    try {
      const url = new URL(tab.url);
      startTracking(url.hostname);
    } catch (_) {}
  } else {
    pauseTracking();
  }
});

chrome.tabs.onRemoved.addListener(() => {
  pauseTracking();
});