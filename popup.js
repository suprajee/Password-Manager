// Function to check if master password is set
function isMasterPasswordSet() {
  return new Promise((resolve) => {
    chrome.storage.local.get('masterPassword', (result) => {
      resolve(!!result.masterPassword);
    });
  });
}

// Function to verify master password
function verifyMasterPassword(password) {
  return new Promise((resolve) => {
    chrome.storage.local.get('masterPassword', (result) => {
      resolve(result.masterPassword === password);
    });
  });
}

// Function to set master password
function setMasterPassword(password) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ masterPassword: password }, resolve);
  });
}

// Function to show main content
function showMainContent() {
  document.getElementById('masterPasswordSection').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  displaySavedPasswords();
}

// Function to hide main content
function hideMainContent() {
  document.getElementById('masterPasswordSection').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('masterPassword').value = '';
}

// Function to display saved passwords
function displaySavedPasswords() {
  const savedPasswordsDiv = document.getElementById('savedPasswords');
  chrome.storage.local.get(null, (items) => {
    savedPasswordsDiv.innerHTML = '';
    
    Object.entries(items).forEach(([url, data]) => {
      if (data.username && data.password && url !== 'masterPassword') {
        const passwordDiv = document.createElement('div');
        passwordDiv.className = 'saved-password';
        
        const urlText = document.createElement('div');
        urlText.textContent = `Website: ${url}`;
        
        const usernameText = document.createElement('div');
        usernameText.textContent = `Username: ${data.username}`;
        
        const passwordText = document.createElement('div');
        passwordText.textContent = `Password: ${data.password}`;
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => {
          chrome.storage.local.remove(url, () => {
            displaySavedPasswords(); // Refresh the list
          });
        };
        
        passwordDiv.appendChild(urlText);
        passwordDiv.appendChild(usernameText);
        passwordDiv.appendChild(passwordText);
        passwordDiv.appendChild(deleteButton);
        
        savedPasswordsDiv.appendChild(passwordDiv);
      }
    });
  });
}

// Handle master password form submission
document.getElementById("masterPasswordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("masterPassword").value;
  
  if (!password) {
    alert("Please enter a password!");
    return;
  }

  const isSet = await isMasterPasswordSet();
  
  if (!isSet) {
    // First time setup
    await setMasterPassword(password);
    showMainContent();
  } else {
    // Verify existing password
    const isValid = await verifyMasterPassword(password);
    if (isValid) {
      showMainContent();
    } else {
      alert("Incorrect password!");
    }
  }
});

// Handle lock button
document.getElementById("lockButton").addEventListener("click", () => {
  hideMainContent();
});

// Save new password
document.getElementById("saveForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const website = document.getElementById("website").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  if (website && username && password) {
    chrome.storage.local.set({ [website]: { username, password } }, () => {
      alert("Password saved!");
      displaySavedPasswords(); // Refresh the list
      e.target.reset(); // Clear the form
    });
  } else {
    alert("Please fill in all fields!");
  }
});

// Generate password
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

// Check if master password is set when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const isSet = await isMasterPasswordSet();
  if (isSet) {
    hideMainContent();
  } else {
    showMainContent();
  }
});
