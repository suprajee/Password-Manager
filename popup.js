import { encrypt } from "./utils.js";

document.getElementById("saveForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const website = document.getElementById("website").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (website && username && password) {
    const data = { username, password };
    const encryptedData = encrypt(data, secretKey);

    chrome.storage.local.set({ [website]: encryptedData }, () => {
      alert("Credentials saved securely!");
    });
  } else {
    alert("Please fill out all fields.");
  }
});

document.getElementById("generate").addEventListener("click", () => {
  const generatedPassword = Math.random().toString(36).slice(-10); // Simple random password
  document.getElementById("password").value = generatedPassword;
});
