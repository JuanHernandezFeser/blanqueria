// Run this script to generate password hashes for the seed users
// Usage: npx tsx workers/api/scripts/gen-hashes.ts

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  function base64UrlEncode(data: ArrayBuffer): string {
    const uint8 = new Uint8Array(data);
    const binary = String.fromCharCode(...uint8);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  const saltStr = base64UrlEncode(salt.buffer);
  const hashStr = base64UrlEncode(hash);
  return `pbkdf2:sha256:100000:${saltStr}:${hashStr}`;
}

async function main() {
  const adminHash = await hashPassword('admin123');
  const userHash = await hashPassword('user123');

  console.log('-- Update admin password');
  console.log(`UPDATE users SET password_hash = '${adminHash}' WHERE id = 'usr-1';`);
  console.log('');
  console.log('-- Update user password');
  console.log(`UPDATE users SET password_hash = '${userHash}' WHERE id = 'usr-2';`);
  console.log('');
  console.log('Copy the SQL above into a file and run:');
  console.log('npx wrangler d1 execute blanqueria-db --remote --file=users.sql');
}

main();
