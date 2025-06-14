
let unlockedMasterPassword = null;
chrome.runtime.onInstalled.addListener(() => {
    console.log("Password Manager installed!");
  });
  
// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_CREDENTIALS') {
    const { username, password, url } = request.data;
    chrome.storage.local.set({ [url]: { username, password } }, () => {
      console.log(`Credentials saved for ${url}`);
      sendResponse({ success: true });
    });
    return true;
  }

  // 🔐 Handle setting master password
  if (request.type === 'SET_MASTER_PASSWORD') {
    unlockedMasterPassword = request.data;
    sendResponse({ success: true });
    return true;
  }

  // 🔓 Handle getting master password
  if (request.type === 'GET_MASTER_PASSWORD') {
    sendResponse({ password: unlockedMasterPassword });
    return true;
  }
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && /^https?:/.test(tab.url)) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["crypto.js"]
    });
  }
});

  