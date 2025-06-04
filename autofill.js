const utilsScript = document.createElement("script");
utilsScript.src = chrome.runtime.getURL("utils.js");
utilsScript.type = "module";
document.head.appendChild(utilsScript);

console.log("Credential saving script loaded!");


console.log("Autofill script loaded!");

// Define selectors for common and specific login fields
const usernameSelectors = [
  "#email", // Facebook-specific
  "input[name='email']",
  "input[type='text']",
  "#handleOrEmail"
];

const passwordSelectors = [
  "#pass",
  "#password",
  "input[name='pass']",
  "input[type='password']"
];

// Function to find input fields based on selectors
function findInputField(selectors) {
  for (const selector of selectors) {
    const field = document.querySelector(selector);
    if (field) {
      console.log(`Found field with selector: ${selector}`);
      return field;
    }
  }
  console.log("No matching fields for selectors:", selectors);
  return null;
}

// Function to autofill the fields
function autofillFields(credentials) {
  console.log("Attempting autofill with credentials:", credentials);

  const usernameField = findInputField(usernameSelectors);
  const passwordField = findInputField(passwordSelectors);

  if (usernameField && passwordField) {
    usernameField.value = credentials.username;
    usernameField.dispatchEvent(new Event("input", { bubbles: true }));

    passwordField.value = credentials.password;
    passwordField.dispatchEvent(new Event("input", { bubbles: true }));

    console.log("Autofilled username and password.");
  } else {
    console.log("Username or password field not found.");
  }
}

// Fetch and decrypt saved credentials for autofill
chrome.storage.local.get(null, (items) => {
  console.log("Fetched saved items: ", items);

  const currentUrl = window.location.origin;
  console.log("Current URL: ", currentUrl);

  if (items[currentUrl]) {
    const decryptedData = decrypt(items[currentUrl]);
    console.log(`Autofilling for ${currentUrl}:`, decryptedData);
    autofillFields(decryptedData);
  } else {
    console.log(`No saved credentials for ${currentUrl}`);
  }
});
