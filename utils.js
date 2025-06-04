// Encryption key (use a dynamic or securely stored key in production)
const secretKey = "your-strong-secret-key"; // Replace this with a securely managed key.

// Function to encrypt data
function encrypt(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

// Function to decrypt data
function decrypt(data, key) {
  const bytes = CryptoJS.AES.decrypt(data, key);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

window.utils = { encrypt, decrypt };
