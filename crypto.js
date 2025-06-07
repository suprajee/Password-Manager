function encrypt(data, key) {
    // Simple encryption (use a library like CryptoJS for real apps)
    return btoa(data);
  }
  
  function decrypt(data, key) {
    return atob(data);
  }
  