// --- Crypto Utility Functions ---

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
    ["encrypt", "decrypt"]
  );
}

async function encrypt(text, password) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await getKeyFromPassword(password, salt);

  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt))
  };
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

// --- Master Password Utilities ---

function isMasterPasswordSet() {
  return new Promise((resolve) => {
    chrome.storage.local.get('masterPassword', (result) => {
      resolve(!!result.masterPassword);
    });
  });
}

function verifyMasterPassword(password) {
  return new Promise((resolve) => {
    chrome.storage.local.get('masterPassword', (result) => {
      resolve(result.masterPassword === password);
    });
  });
}

function setMasterPassword(password) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ masterPassword: password }, resolve);
  });
}

async function getMasterPassword() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_MASTER_PASSWORD" }, (response) => {
      resolve(response?.password || null);
    });
  });
}

// --- UI Helpers ---

function showMainContent() {
  document.getElementById('masterPasswordSection').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  displaySavedPasswords();
}

function hideMainContent() {
  document.getElementById('masterPasswordSection').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('masterPassword').value = '';
}

// --- Display Passwords ---

async function displaySavedPasswords() {
  const savedPasswordsDiv = document.getElementById('savedPasswords');
  chrome.storage.local.get(null, async (items) => {
    savedPasswordsDiv.innerHTML = '';

    const masterPassword = await getMasterPassword();
    if (!masterPassword) {
      savedPasswordsDiv.innerHTML = '<p>Please unlock with master password.</p>';
      return;
    }

    for (const [url, data] of Object.entries(items)) {
      if (data.username && data.password && url !== 'masterPassword') {
        const passwordDiv = document.createElement('div');
        passwordDiv.className = 'saved-password';

        const decryptedPassword = await decrypt(data.password, masterPassword);

        const urlText = document.createElement('div');
        urlText.textContent = `Website: ${url}`;

        const usernameText = document.createElement('div');
        usernameText.textContent = `Username: ${data.username}`;

        const passwordContainer = document.createElement('div');
        passwordContainer.className = 'password-container';

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.value = decryptedPassword;
        passwordInput.readOnly = true;

        const toggleIcon = document.createElement('i');
        toggleIcon.className = 'fas fa-eye toggle-password';
        toggleIcon.onclick = () => {
          if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash toggle-password';
          } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye toggle-password';
          }
        };

        passwordContainer.appendChild(passwordInput);
        passwordContainer.appendChild(toggleIcon);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => {
          chrome.storage.local.remove(url, () => {
            displaySavedPasswords();
          });
        };

        passwordDiv.appendChild(urlText);
        passwordDiv.appendChild(usernameText);
        passwordDiv.appendChild(passwordContainer);
        passwordDiv.appendChild(deleteButton);

        savedPasswordsDiv.appendChild(passwordDiv);
      }
    }
  });
}

// --- Event Handlers ---

document.getElementById("masterPasswordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("masterPassword").value;

  if (!password) {
    alert("Please enter a password!");
    return;
  }

  const isSet = await isMasterPasswordSet();

  if (!isSet) {
    localStorage.setItem("unlockedMasterPassword", password);
    chrome.runtime.sendMessage({ type: "SET_MASTER_PASSWORD", data: password });
    await setMasterPassword(password);
    showMainContent();
  } else {
    const isValid = await verifyMasterPassword(password);
    if (isValid) {
      chrome.runtime.sendMessage({ type: "SET_MASTER_PASSWORD", data: password });
      showMainContent();
    } else {
      alert("Incorrect password!");
    }
  }
});

document.getElementById("lockButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "SET_MASTER_PASSWORD", data: null });
  hideMainContent();
});

document.getElementById("saveForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const website = document.getElementById("website").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const masterPassword = await getMasterPassword();
  if (!masterPassword) {
    alert("Please unlock first.");
    return;
  }

  if (website && username && password) {
    const encrypted = await encrypt(password, masterPassword);
    chrome.storage.local.set({ [website]: { username, password: encrypted } }, () => {
      alert("Password saved!");
      displaySavedPasswords();
      e.target.reset();
    });
  } else {
    alert("Please fill in all fields!");
  }
});

document.getElementById("generate").addEventListener("click", () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let generatedPassword = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    generatedPassword += charset[randomIndex];
  }

  document.getElementById("password").value = generatedPassword;
});

// --- Initial Load ---

document.addEventListener('DOMContentLoaded', async () => {
  const isSet = await isMasterPasswordSet();

  if (!isSet) {
    document.getElementById('masterPasswordSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';

    const info = document.createElement("p");
    info.textContent = "Set your master password to protect your credentials.";
    info.style.color = "gray";
    info.style.marginTop = "10px";
    document.getElementById("masterPasswordForm").appendChild(info);
  } else {
    hideMainContent();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input && input.type === 'password') {
        input.type = 'text';
        toggle.className = 'fas fa-eye-slash toggle-password';
      } else if (input) {
        input.type = 'password';
        toggle.className = 'fas fa-eye toggle-password';
      }
    });
  });
});
