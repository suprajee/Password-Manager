chrome.runtime.onInstalled.addListener(() => {
    console.log("Password Manager installed!");
  });
  
// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_CREDENTIALS') {
    const { username, password, url } = request.data;
    
    // Save to storage
    chrome.storage.local.set({ [url]: { username, password } }, () => {
      console.log(`Credentials saved for ${url}`);
      // Send response back to content script
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for the async response
  }
});
  