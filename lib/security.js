export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(String(salt || '') + ':' + String(password || ''));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
