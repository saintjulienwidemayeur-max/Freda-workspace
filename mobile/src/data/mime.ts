import { MailAddress, OutgoingMessage } from './models';

const enc = new TextEncoder();
export function toBase64(bytes: Uint8Array): string {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += A[(n >> 18) & 63] + A[(n >> 12) & 63] + (i + 1 < bytes.length ? A[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? A[n & 63] : '=');
  }
  return out;
}
const wrap76 = (s: string) => (s.match(/.{1,76}/g) ?? ['']).join('\r\n');
const isAscii = (s: string) => /^[\x20-\x7e]*$/.test(s);

/** En-tête non ASCII : mots encodés RFC 2047 (base64, UTF-8), coupés pour rester sous 75 caractères. */
export function encodeHeader(value: string): string {
  if (isAscii(value)) return value;
  const words: string[] = [];
  let cur = '';
  for (const ch of value) {
    if (enc.encode(cur + ch).length > 30) { words.push(cur); cur = ''; }
    cur += ch;
  }
  if (cur) words.push(cur);
  return words.map((w) => `=?UTF-8?B?${toBase64(enc.encode(w))}?=`).join('\r\n ');
}

export function formatAddress(a: MailAddress): string {
  const name = (a.name ?? '').trim();
  if (!name) return a.email;
  return isAscii(name) && !/[",<>@()[\]:;\\]/.test(name) ? `${name} <${a.email}>` : `${encodeHeader(name.replace(/"/g, ''))} <${a.email}>`;
}

const pad = (n: number) => String(n).padStart(2, '0');
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function rfc2822Date(d: Date): string {
  return `${DOW[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`;
}

export function buildMessage(from: MailAddress, m: OutgoingMessage, now: Date, rand: () => string = () => Math.random().toString(36).slice(2) + Date.now().toString(36)): string {
  const domain = from.email.split('@')[1] ?? 'fredaworkspace.com';
  const h = [
    `From: ${formatAddress(from)}`,
    `To: ${m.to.map(formatAddress).join(', ')}`,
    ...(m.cc?.length ? [`Cc: ${m.cc.map(formatAddress).join(', ')}`] : []),
    `Subject: ${encodeHeader(m.subject || '(sans objet)')}`,
    `Date: ${rfc2822Date(now)}`,
    `Message-ID: <${rand()}@${domain}>`,
    ...(m.inReplyTo ? [`In-Reply-To: ${m.inReplyTo}`, `References: ${m.inReplyTo}`] : []),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ];
  return `${h.join('\r\n')}\r\n\r\n${wrap76(toBase64(enc.encode(m.body.replace(/\r?\n/g, '\r\n'))))}\r\n`;
}
