/**
 * OrbitDrop Cryptographic Engine (AES-256-GCM with PBKDF2-HMAC-SHA256)
 * - OWASP Recommended: 600,000 PBKDF2 iterations
 * - Container Format: ORBT v1 with versioned KDF parameters & authenticated header (AAD)
 * - Filename Privacy: Original filename is encrypted inside the ciphertext payload
 * - Path Traversal Protection: Strict sanitization of restored filenames
 * - 100% Client-side & Local CPU: Zero network transmission
 */

const MAGIC_HEADER = new Uint8Array([0x4f, 0x52, 0x42, 0x54]); // 'ORBT'
const CURRENT_VERSION = 0x01;
export const OWASP_PBKDF2_ITERATIONS = 600000;
export const MAX_SAFE_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB buffer limit

// Sanitize restored filename to prevent path traversal
export function sanitizeFileName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return 'decrypted_file';
  let clean = rawName
    .replace(/[\0\x00-\x1f\x7f]/g, '')
    .replace(/[/\\]+/g, '_')
    .replace(/\.\.+/g, '')
    .trim();
  
  if (!clean || clean === '.' || clean === '..') {
    clean = 'decrypted_file';
  }
  return clean;
}

// Derive AES-256-GCM key from password, salt, and specified iterations
async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an ArrayBuffer with AES-256-GCM and packages into ORBT v1 container
 */
export async function encryptFileBuffer(
  fileBuffer: ArrayBuffer,
  fileName: string,
  password: string
): Promise<Uint8Array> {
  if (fileBuffer.byteLength > MAX_SAFE_FILE_SIZE_BYTES) {
    throw new Error(
      `Ukuran berkas (${(fileBuffer.byteLength / (1024 * 1024)).toFixed(1)} MB) melebihi batas aman pemrosesan memori (150 MB).`
    );
  }

  const cleanName = sanitizeFileName(fileName);
  const nameBytes = new TextEncoder().encode(cleanName);
  const nameLen = nameBytes.length;

  if (nameLen > 65535) {
    throw new Error('Nama berkas terlalu panjang.');
  }

  // 1. Pack plaintext payload (Filename is encrypted INSIDE payload to protect metadata)
  const fileBytes = new Uint8Array(fileBuffer);
  const payload = new Uint8Array(2 + nameLen + fileBytes.length);
  payload[0] = (nameLen >> 8) & 0xff;
  payload[1] = nameLen & 0xff;
  payload.set(nameBytes, 2);
  payload.set(fileBytes, 2 + nameLen);

  // 2. Generate random cryptographic parameters
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = OWASP_PBKDF2_ITERATIONS;

  // 3. Assemble Header
  const header = new Uint8Array(4 + 1 + 4 + 16 + 12);
  let hOffset = 0;
  header.set(MAGIC_HEADER, hOffset);
  hOffset += 4;

  header[hOffset] = CURRENT_VERSION;
  hOffset += 1;

  header[hOffset] = (iterations >> 24) & 0xff;
  header[hOffset + 1] = (iterations >> 16) & 0xff;
  header[hOffset + 2] = (iterations >> 8) & 0xff;
  header[hOffset + 3] = iterations & 0xff;
  hOffset += 4;

  header.set(salt, hOffset);
  hOffset += 16;

  header.set(iv, hOffset);

  // 4. Derive key and encrypt with Header as AAD
  const key = await deriveKey(password, salt, iterations);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: header,
    },
    key,
    payload
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);

  // 5. Final Package: [Header] + [Ciphertext + AuthTag]
  const finalPackage = new Uint8Array(header.length + ciphertext.length);
  finalPackage.set(header, 0);
  finalPackage.set(ciphertext, header.length);

  return finalPackage;
}

/**
 * Decrypts an OrbitDrop '.locked' package
 */
export async function decryptFileBuffer(
  packageBuffer: ArrayBuffer,
  password: string
): Promise<{ fileName: string; decryptedBytes: Uint8Array }> {
  const data = new Uint8Array(packageBuffer);

  if (data.length < 55) {
    throw new Error('Berkas terlalu kecil atau format bukan OrbitDrop .locked yang valid.');
  }

  // 1. Verify Magic
  if (
    data[0] !== MAGIC_HEADER[0] ||
    data[1] !== MAGIC_HEADER[1] ||
    data[2] !== MAGIC_HEADER[2] ||
    data[3] !== MAGIC_HEADER[3]
  ) {
    throw new Error('Format berkas tidak dikenal. Berkas harus berformat .locked resmi OrbitDrop.');
  }

  const version = data[4];
  if (version !== 0x01) {
    throw new Error(`Versi enkripsi berkas (v${version}) tidak didukung oleh versi aplikasi ini.`);
  }

  // 2. Extract Header (AAD) parameters
  const iterations =
    ((data[5] << 24) >>> 0) |
    (data[6] << 16) |
    (data[7] << 8) |
    data[8];

  if (iterations < 10000 || iterations > 5000000) {
    throw new Error('Parameter iterasi KDF di luar batas keamanan.');
  }

  const headerLength = 4 + 1 + 4 + 16 + 12; // 37 bytes
  const header = data.slice(0, headerLength);
  const salt = data.slice(9, 25);
  const iv = data.slice(25, 37);
  const ciphertext = data.slice(headerLength);

  // 3. Derive key and decrypt
  const key = await deriveKey(password, salt, iterations);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: header,
      },
      key,
      ciphertext
    );
  } catch {
    throw new Error('Kata sandi salah atau berkas rusak / telah dimodifikasi.');
  }

  // 4. Unpack plaintext payload: [2B nameLen] + [nameBytes] + [fileBytes]
  const decryptedData = new Uint8Array(decryptedBuffer);
  if (decryptedData.length < 2) {
    throw new Error('Payload berkas rusak atau kosong.');
  }

  const nameLen = (decryptedData[0] << 8) | decryptedData[1];
  if (decryptedData.length < 2 + nameLen) {
    throw new Error('Header metadata nama berkas tidak valid.');
  }

  const nameBytes = decryptedData.slice(2, 2 + nameLen);
  const rawFileName = new TextDecoder().decode(nameBytes);
  const fileName = sanitizeFileName(rawFileName);
  const decryptedBytes = decryptedData.slice(2 + nameLen);

  return {
    fileName,
    decryptedBytes,
  };
}

/**
 * Calculates SHA-256 hexadecimal hash
 */
export async function calculateSHA256Hash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
