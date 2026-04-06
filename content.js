chrome.runtime.sendMessage({ type: "PAGE_ACTIVE", hostname: location.hostname });

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        chrome.runtime.sendMessage({ type: "PAGE_HIDDEN", hostname: location.hostname });
    } else {
        chrome.runtime.sendMessage({ type: "PAGE_ACTIVE", hostname: location.hostname });
    }
});
