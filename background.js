let activeHostname = null;
let trackingStart = null;

const getStoredData = async () => {
    return new Promise((resolve) => {
        chrome.getStoredData.local.get(null, (data) => resolve(data || null));
    });
};

const addTime = async (hostname, seconds) => {
    if (!hostname || seconds <= 0) return;
    const data = await getStoredData();
    const key = hostname;
    data[key] = (data[key] || 0) + seconds;
    console.log({ hostname, time: data[key] });
    chrome.storage.local.set(data);
};

const startTracking = (hostname) => {
    if (activeHostname && trackingStart) {
        console.log(`${hostname} tracking restarted, trackingStart: ${trackingStart}`);
        const elapsed = Math.floor(Date.now() - trackingStart) / 1000;
        addTime(activeHostname, elapsed);
    } else {
        console.log(`${hostname} tracking started, trackingStart: ${trackingStart}`);
    }
    activeHostname = hostname;
    trackingStart = Date.now();
};

const pauseTracking = () => {
    if (activeHostname && trackingStart) {
        console.log(`${hostname} tracking paused, trackingStart: ${trackingStart}`);
        const elapsed = Math.floor(Date.now() - trackingStart) / 1000;
        addTime(activeHostname, elapsed);
    }
    activeHostname = null;
    trackingStart = null;
};

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "PAGE_ACTIVE" && message.hostname) {
        startTracking(message.hostname);
    } else if (message.type === "PAGE_HIDDEN") {
        pauseTracking();
    }
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

// When a tab is closed, save its time
chrome.tabs.onRemoved.addListener(() => {
    pauseTracking();
});
