console.log("Autofill script loaded!");
async function getKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decrypt(encrypted, password) {
  const iv = new Uint8Array(atob(encrypted.iv).split("").map(c => c.charCodeAt(0)));
  const salt = new Uint8Array(atob(encrypted.salt).split("").map(c => c.charCodeAt(0)));
  const data = new Uint8Array(atob(encrypted.ciphertext).split("").map(c => c.charCodeAt(0)));

  const key = await getKeyFromPassword(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, key, data
  );

  return new TextDecoder().decode(decrypted);
}

function getMasterPassword() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_MASTER_PASSWORD" }, (response) => {
      resolve(response?.password || null);
    });
  });
}

// Function to normalize URL
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch (e) {
    return url;
  }
}

// Function to find input fields
function findInputFields() {
  console.log("Searching for input fields in document");
  
  // Common selectors for username/email fields
  const usernameSelectors = [
    "input[type='text']",
    "input[type='email']",
    "input[name*='user']",
    "input[name*='email']",
    "input[id*='user']",
    "input[id*='email']",
    "input[placeholder*='user']",
    "input[placeholder*='email']",
    "input[autocomplete='username']",
    "input[autocomplete='email']",
    "input[name='username']",
    "input[aria-label='Phone number, username, or email']",
    "input[aria-label='Username']",
    "input[name='handleOrEmail']",
    "input[id='handleOrEmail']",
    "input[placeholder='Handle or Email']",
    "input[type='text'][name='handleOrEmail']",
    "input[type='text'][id='handleOrEmail']",
    "input[type='text'][placeholder='Handle or Email']",
    "input[type='text'][name='handle']",
    "input[type='text'][id='handle']",
    "input[type='text'][name='email']",
    "input[type='text'][id='email']",
    "form input[type='text']:first-of-type",
    "form input[type='text']:not([type='password'])"
  ];

  // Common selectors for password fields
  const passwordSelectors = [
    "input[type='password']",
    "input[name*='pass']",
    "input[id*='pass']",
    "input[placeholder*='pass']",
    "input[autocomplete='current-password']",
    "input[name='password']",
    "input[aria-label='Password']",
    "input[name='password']",
    "input[id='password']",
    "input[type='password'][name='password']",
    "input[type='password'][id='password']",
    "form input[type='password']",
    "form input[type='password']:last-of-type"
  ];

  // Try to find username field
  let usernameField = null;
  for (const selector of usernameSelectors) {
    const fields = document.querySelectorAll(selector);
    console.log(`Checking selector ${selector}, found ${fields.length} fields`);
    if (fields.length > 0) {
      usernameField = fields[0];
      break;
    }
  }

  // Try to find password field
  let passwordField = null;
  for (const selector of passwordSelectors) {
    const fields = document.querySelectorAll(selector);
    console.log(`Checking selector ${selector}, found ${fields.length} fields`);
    if (fields.length > 0) {
      passwordField = fields[0];
      break;
    }
  }

  if (!usernameField) {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const textInputs = form.querySelectorAll('input[type="text"]');
      if (textInputs.length > 0) {
        usernameField = textInputs[0];
        console.log("Found username field through form structure:", usernameField);
      }
    });
  }

  console.log("Found fields:", { usernameField, passwordField });
  return { usernameField, passwordField };
}
function getMasterPassword() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_MASTER_PASSWORD" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        resolve(response?.password || null);
      }
    });
  });
}

// Function to attempt autofill
function attemptAutofill() {
  const { usernameField, passwordField } = findInputFields();
  
  if (usernameField && passwordField) {
    // Fetch saved credentials
    chrome.storage.local.get(null, async (items) => {
      console.log("Fetched saved items: ", items);

      const currentUrl = normalizeUrl(window.location.href);
      console.log("Current URL: ", currentUrl);

      if (items[currentUrl]) {
        const masterPassword = await getMasterPassword();
        if (!masterPassword) return;

        const { username, password: encrypted } = items[currentUrl];
        const password = await decrypt(encrypted, masterPassword);

        console.log(`Autofilling for ${currentUrl}:`, { username, password });

        // Set values and trigger input events
        usernameField.value = username;
        passwordField.value = password;
        
        // Mark fields as autofilled
        usernameField.setAttribute('data-autofilled', 'true');
        passwordField.setAttribute('data-autofilled', 'true');
        
        // Trigger input events to ensure the website recognizes the changes
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log("Fields autofilled!");
      } else {
        console.log(`No saved credentials for ${currentUrl}`);
      }
    });
  } else {
    console.log("Username or password field not found, will retry...");
    // Retry after a short delay
    setTimeout(attemptAutofill, 1000);
  }
}

// Start attempting to autofill
attemptAutofill();

// Set up a mutation observer to detect when the form is added
const autofillObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      const { usernameField, passwordField } = findInputFields();
      if (usernameField && passwordField) {
        console.log("Form detected, attempting autofill");
        attemptAutofill();
        autofillObserver.disconnect(); 
        break;
      }
    }
  }
});

// Start observing with a timeout
autofillObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Disconnect observer after 30 seconds to prevent infinite observation
setTimeout(() => {
  autofillObserver.disconnect();
  console.log("Autofill observer disconnected after timeout");
}, 30000);
