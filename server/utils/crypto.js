const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_please_change_in_prod';

// Ensure key is 32 bytes
const getKey = () => {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
};

// Encrypt sensitive data
const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

// Decrypt sensitive data
const decrypt = (encryptedData) => {
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

// Hash password (for API keys, etc.)
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

module.exports = {
  encrypt,
  decrypt,
  hashString,
};
