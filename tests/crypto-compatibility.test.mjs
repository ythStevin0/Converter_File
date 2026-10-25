/**
 * Automated Cryptographic Roundtrip & Compatibility Test
 * Validates OrbitDrop AES-256-GCM + PBKDF2-HMAC-SHA256 (600,000 iterations)
 * Verifies ORBT v1 container, AAD header authentication, path traversal defense, and byte-for-byte fidelity.
 */

import assert from 'node:assert/strict';

const MAGIC_HEADER = new Uint8Array([0x4f, 0x52, 0x42, 0x54]); // 'ORBT'
const CURRENT_VERSION = 0x01;
const OWASP_PBKDF2_ITERATIONS = 600000;
const MAX_SAFE_FILE_SIZE_BYTES = 150 * 1024 * 1024;

function sanitizeFileName(rawName) {
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

async function deriveKey(password, salt, iterations) {
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
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptFileBuffer(fileBuffer, fileName, password) {
  if (fileBuffer.byteLength > MAX_SAFE_FILE_SIZE_BYTES) {
    throw new Error('Ukuran berkas melebihi batas aman pemrosesan memori (150 MB).');
  }

  const cleanName = sanitizeFileName(fileName);
  const nameBytes = new TextEncoder().encode(cleanName);
  const nameLen = nameBytes.length;

  if (nameLen > 65535) {
    throw new Error('Nama berkas terlalu panjang.');
  }

  const fileBytes = new Uint8Array(fileBuffer);
  const payload = new Uint8Array(2 + nameLen + fileBytes.length);
  payload[0] = (nameLen >> 8) & 0xff;
  payload[1] = nameLen & 0xff;
  payload.set(nameBytes, 2);
  payload.set(fileBytes, 2 + nameLen);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = OWASP_PBKDF2_ITERATIONS;

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
  const finalPackage = new Uint8Array(header.length + ciphertext.length);
  finalPackage.set(header, 0);
  finalPackage.set(ciphertext, header.length);

  return finalPackage;
}

async function decryptFileBuffer(packageBuffer, password) {
  const data = new Uint8Array(packageBuffer);

  if (data.length < 55) {
    throw new Error('Berkas terlalu kecil atau format bukan OrbitDrop .locked yang valid.');
  }

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

  const key = await deriveKey(password, salt, iterations);

  let decryptedBuffer;
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

async function runTests() {
  console.log('🧪 Starting OrbitDrop Cryptographic Compatibility Test Suite...\n');

  // Test 1: Full Roundtrip Encryption & Decryption
  {
    console.log('  [Test 1] Roundtrip Encryption & Decryption (OWASP 600k iterations)...');
    const originalText = 'OrbitDrop Confidential Financial Audit 2026 - Top Secret Content.';
    const originalBuffer = new TextEncoder().encode(originalText).buffer;
    const originalFileName = 'Audit_Report_2026.pdf';
    const testPassword = 'CorrectHorseBatteryStaple!987#';

    const t0 = performance.now();
    const lockedPackage = await encryptFileBuffer(originalBuffer, originalFileName, testPassword);
    const encryptTime = (performance.now() - t0).toFixed(1);

    assert(lockedPackage.length > 37 + 16, 'Locked package should contain header and ciphertext');
    assert.equal(lockedPackage[0], 0x4f, 'Magic byte 0 should be O');
    assert.equal(lockedPackage[1], 0x52, 'Magic byte 1 should be R');
    assert.equal(lockedPackage[2], 0x42, 'Magic byte 2 should be B');
    assert.equal(lockedPackage[3], 0x54, 'Magic byte 3 should be T');
    assert.equal(lockedPackage[4], 0x01, 'Version byte should be 0x01');

    // Verify 600,000 iterations stored in header (Big Endian)
    const headerIterations =
      ((lockedPackage[5] << 24) >>> 0) |
      (lockedPackage[6] << 16) |
      (lockedPackage[7] << 8) |
      lockedPackage[8];
    assert.equal(headerIterations, 600000, 'Header should encode 600,000 iterations');

    const t1 = performance.now();
    const result = await decryptFileBuffer(lockedPackage.buffer, testPassword);
    const decryptTime = (performance.now() - t1).toFixed(1);

    const decryptedText = new TextDecoder().decode(result.decryptedBytes);
    assert.equal(result.fileName, originalFileName, 'Restored filename must match');
    assert.equal(decryptedText, originalText, 'Restored plaintext bytes must match original');

    console.log(`  ✓ Passed (Enc: ${encryptTime}ms, Dec: ${decryptTime}ms)`);
  }

  // Test 2: Reject Invalid Password
  {
    console.log('  [Test 2] Rejection of Invalid Password...');
    const originalBuffer = new TextEncoder().encode('Test Data').buffer;
    const lockedPackage = await encryptFileBuffer(originalBuffer, 'data.txt', 'correctPassword123');

    let errorThrown = false;
    try {
      await decryptFileBuffer(lockedPackage.buffer, 'wrongPassword456');
    } catch (err) {
      errorThrown = true;
      assert.equal(
        err.message,
        'Kata sandi salah atau berkas rusak / telah dimodifikasi.',
        'Error message must state both password and tampering possibilities'
      );
    }
    assert(errorThrown, 'Decryption must fail when password is wrong');
    console.log('  ✓ Passed');
  }

  // Test 3: Authenticated Additional Data (AAD) Anti-Tampering
  {
    console.log('  [Test 3] Tamper-Proof Header Verification (AAD)...');
    const originalBuffer = new TextEncoder().encode('Authentic document').buffer;
    const lockedPackage = await encryptFileBuffer(originalBuffer, 'doc.txt', 'pass123456');

    // Attempt to tamper with iteration count in header (attacker tries to reduce iteration count)
    const tamperedPackage = new Uint8Array(lockedPackage);
    tamperedPackage[8] = tamperedPackage[8] ^ 0x01; // flip 1 bit in iterations

    let tamperCaught = false;
    try {
      await decryptFileBuffer(tamperedPackage.buffer, 'pass123456');
    } catch {
      tamperCaught = true;
    }
    assert(tamperCaught, 'Header tampering must be caught and rejected by GCM AAD verification');
    console.log('  ✓ Passed (AAD successfully prevented parameter tampering)');
  }

  // Test 4: Path Traversal Attack Defense
  {
    console.log('  [Test 4] Path Traversal Sanitization Defense...');
    const maliciousNames = [
      '../../../../etc/shadow',
      '..\\..\\Windows\\System32\\calc.exe',
      '../../../app.asar',
      'safe_file.txt\0.exe',
    ];

    for (const rawName of maliciousNames) {
      const clean = sanitizeFileName(rawName);
      assert(!clean.includes('../'), `Clean name "${clean}" must not contain "../"`);
      assert(!clean.includes('..\\'), `Clean name "${clean}" must not contain "..\\"`);
      assert(!clean.includes('\0'), `Clean name "${clean}" must not contain null bytes`);
      assert(!clean.includes('/') && !clean.includes('\\'), `Clean name "${clean}" must not contain path separators`);
    }
    console.log('  ✓ Passed (All malicious paths neutralized)');
  }

  // Test 5: Filename Metadata Confidentiality
  {
    console.log('  [Test 5] Filename Metadata Confidentiality...');
    const sensitiveName = 'TOP_SECRET_ACQUISITION_PLAN_2026.docx';
    const payloadBuffer = new TextEncoder().encode('Confidential contract body').buffer;
    const lockedPackage = await encryptFileBuffer(payloadBuffer, sensitiveName, 'StrictPass#2026');

    // Convert raw locked bytes to binary string and verify sensitiveName is NOT found in cleartext header
    const rawHeaderBytes = lockedPackage.slice(0, 37);
    const headerString = new TextDecoder('latin1').decode(rawHeaderBytes);
    assert(!headerString.includes(sensitiveName), 'Original filename must NOT appear in plaintext header');
    console.log('  ✓ Passed (Filename is strictly encrypted inside GCM payload)');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 5 CRYPTOGRAPHIC COMPLIANCE TESTS PASSED (100%)');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Crypto test suite failed:', err);
  process.exit(1);
});
