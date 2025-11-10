// src/lib/crypto.js
// Web Crypto API + Optional Passphrase Recovery

const ENABLE_RECOVERY = import.meta.env.VITE_ENABLE_PASSPHRASE_RECOVERY === 'true';

let cachedKey = null;

export async function deriveKeyFromPassphrase(passphrase, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(message, recipientId) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  let key;
  if (ENABLE_RECOVERY) {
    const passphrase = prompt('Enter recovery passphrase (set in settings):');
    if (!passphrase) throw new Error('Passphrase required');
    key = await deriveKeyFromPassphrase(passphrase, user.id);
  } else {
    key = cachedKey || await generateEphemeralKey();
  }

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );

  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  const ivStr = btoa(String.fromCharCode(...iv));
  const saltStr = ENABLE_RECOVERY ? btoa(String.fromCharCode(...salt)) : null;

  return { ciphertext, iv: ivStr, salt: saltStr };
}

export async function decryptMessage(ciphertext, iv, salt) {
  let key;
  if (ENABLE_RECOVERY && salt) {
    const passphrase = prompt('Enter recovery passphrase:');
    if (!passphrase) throw new Error('Passphrase required');
    key = await deriveKeyFromPassphrase(passphrase, (await supabase.auth.getUser()).data.user.id);
  } else {
    key = cachedKey;
  }

  const decoder = new TextDecoder();
  const encryptedData = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  );

  return decoder.decode(decrypted);
}

async function generateEphemeralKey() {
  cachedKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  return cachedKey;
}
