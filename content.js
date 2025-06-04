// Prevent multiple executions
if (window.hasRunContentScript) {
  console.log("Content script already running. Skipping execution.");
  // return;
}
window.hasRunContentScript = true;

// Inject the utils.js script dynamically
// const utilsInjectScript = document.createElement("script");
// utilsInjectScript.src = chrome.runtime.getURL("utils.js");
// utilsInjectScript.type = "module";
// document.head.appendChild(utilsInjectScript);
function encrypt(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}
console.log("Credential saving script loaded!");

// Function to save credentials
function saveCredentials() {
  const usernameField = document.querySelector(
    "input[type='text'], input[name='handleOrEmail'], input[name*='user'], input[name*='username'], input[name*='email']"
  );
  const passwordField = document.querySelector(
    "input[type='password'], input[name='password']"
  );

  if (usernameField && passwordField) {
    const username = usernameField.value;
    const password = passwordField.value;

    if (username && password) {
      const shouldSave = confirm(`Do you want to save the credentials for ${window.location.origin}?`);
      if (shouldSave) {
        const data = { username, password };

        // Use encryption from utils.js
        const encryptedData = encrypt(data, "your-strong-secret-key");

        // Save encrypted data
        chrome.storage.local.set({ [window.location.origin]: encryptedData }, () => {
          alert("Credentials saved securely!");
        });
      }
    } else {
      console.log("Username or password field is empty.");
    }
  } else {
    console.log("Username or password field not found.");
  }
}

// Attach event listener for button clicks
document.addEventListener("click", (event) => {
  const button = event.target.closest("button, input[type='submit']");
  if (button && button.type === "submit") {
    console.log("Login button clicked, attempting to save credentials...");
    saveCredentials();
  }
});

// Attach event listener for form submissions
document.addEventListener("submit", (event) => {
  console.log("Form submitted, attempting to save credentials...");
  saveCredentials();
});
