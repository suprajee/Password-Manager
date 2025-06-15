console.log("Content script loaded!");

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

// Function to save credentials
function saveCredentials(username, password, url) {
  return new Promise(async (resolve, reject) => {
        const masterPassword = await getMasterPassword();
        if (!masterPassword) {
          alert("Master password not unlocked.");
          return;
        }
        const encrypted = await encrypt(password, masterPassword);

        chrome.runtime.sendMessage({
          type: 'SAVE_CREDENTIALS',
          data: { username, password: encrypted, url }
        },

      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error saving credentials:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Credentials saved successfully');
          resolve(response);
        }
      }
    );
  });
}

// Function to handle form submission
async function handleFormSubmit(event) {
  console.log("Form submission detected");
  
  const { usernameField, passwordField } = findInputFields();

  if (usernameField && passwordField) {
    const username = usernameField.value;
    const password = passwordField.value;

    console.log("Found credentials:", { username, password });

    if (username && password) {
      // Store credentials temporarily
      const currentUrl = normalizeUrl(window.location.href);
      
      // Check if these credentials were just autofilled
      const wasAutofilled = usernameField.hasAttribute('data-autofilled') || 
                           passwordField.hasAttribute('data-autofilled');
      
      if (!wasAutofilled) {
        const shouldSave = confirm(`Do you want to save these credentials?\nUsername: ${username}`);
        
        if (shouldSave) {
          try {
            await saveCredentials(username, password, currentUrl);
            alert("Your credentials have been saved.");
          } catch (error) {
            console.error("Failed to save credentials:", error);
          }
        }
      }
    }
  }
}

// Function to attach event listeners
function attachEventListeners() {
  console.log("Attaching event listeners");
  
  // Find all forms
  const forms = document.querySelectorAll('form');
  console.log(`Found ${forms.length} forms`);
  
  // Attach submit event listener to each form
  forms.forEach(form => {
    console.log("Attaching to form:", form);
    form.addEventListener("submit", (event) => {
      handleFormSubmit(event).catch(console.error);
    }, true);
  });

  // Also attach click event listeners to submit buttons
  const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
  console.log(`Found ${submitButtons.length} submit buttons`);
  
  submitButtons.forEach(button => {
    console.log("Attaching to submit button:", button);
    button.addEventListener("click", (event) => {
      const form = event.target.closest('form');
      if (form) {
        handleFormSubmit(new Event('submit', { bubbles: true })).catch(console.error);
      } else {
        handleFormSubmit(event).catch(console.error);
      }
    }, true);
  });
}

// Initial attachment of event listeners
attachEventListeners();

// Monitor for dynamically added forms and buttons
const formObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeName === 'FORM') {
        console.log("New form detected:", node);
        node.addEventListener("submit", (event) => {
          handleFormSubmit(event).catch(console.error);
        }, true);
      }
      // Also check for buttons that might be login buttons
      if (node.nodeName === 'BUTTON' || node.nodeName === 'INPUT') {
        console.log("New button detected:", node);
        node.addEventListener("click", (event) => {
          const form = event.target.closest('form');
          if (form) {
            handleFormSubmit(new Event('submit', { bubbles: true })).catch(console.error);
          } else {
            // For buttons not in forms (like Instagram's login button)
            handleFormSubmit(event).catch(console.error);
          }
        }, true);
      }
    });
  });
});

formObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Disconnect observer after 30 seconds to prevent infinite observation
setTimeout(() => {
  formObserver.disconnect();
  console.log("Form observer disconnected after timeout");
}, 30000);

// monitor for button clicks that might submit forms
document.addEventListener('click', (event) => {
  const target = event.target;
  if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
    const form = target.closest('form');
    if (form) {
      console.log("Button click detected in form:", form);
      handleFormSubmit(new Event('submit', { bubbles: true })).catch(console.error);
    } else {
      // For buttons not in forms (like Instagram's login button)
      handleFormSubmit(event).catch(console.error);
    }
  }
}, true);
