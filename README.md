# Password Manager Chrome Extension

A secure and user-friendly Chrome extension for managing your passwords across different websites. This extension helps you store, manage, and autofill your credentials while maintaining security through a master password system.

## Features

- 🔒 **Master Password Protection**: Secure access to your stored passwords
- 💾 **Password Storage**: Save website credentials securely
- 🔄 **Auto-fill**: Automatically fill in your saved credentials on websites
- 👁️ **Password Visibility Toggle**: Easily view or hide your passwords
- 🔑 **Password Generator**: Generate strong, random passwords
- 🗑️ **Password Management**: Add, view, and delete saved passwords
- 🔐 **Secure Storage**: Passwords are hashed and the corresponding hash is stored locally in your browser

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The Password Manager extension should now appear in your Chrome toolbar

## Usage

### First-time Setup
1. Click the extension icon in your Chrome toolbar
2. Set up your master password when prompted
3. This password will be required to access your saved credentials

### Saving Passwords
1. Click the extension icon
2. Enter the website URL, username, and password
3. Click "Save" to store the credentials
4. Use the "Generate" button to create a strong random password

### Using Saved Passwords
1. Navigate to a website where you've saved credentials
2. The extension will automatically detect login forms
3. Click the extension icon to view and manage saved passwords
4. Use the eye icon to toggle password visibility
5. Use the delete button to remove saved credentials

### Security Features
- Master password protection
- Local storage of hash of credentials
- Password visibility toggle
- Secure password generation

## Development

### Project Structure
- `manifest.json`: Extension configuration
- `popup.html`: Main extension interface
- `popup.js`: Popup functionality
- `content.js`: Content script for webpage interaction
- `background.js`: Background service worker
- `autofill.js`: Auto-fill functionality
- `crypto.js`: Encryption utilities
- `style.css`: Extension styling

### Building from Source
1. Ensure you have Node.js installed
2. Clone the repository
3. Make your changes
4. Load the extension in Chrome using Developer mode

## Security Considerations

- All passwords are hashed and the corresponding hash is stored locally in your browser
- Use a strong master password
- Regularly update your saved passwords
- Don't share your master password
- Keep your browser and extension updated



This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have suggestions, please open an issue in the repository.
