import { Connector, Transport } from './imap/transport';
import { MailError } from './models';
import { toBase64 } from './mime';

const enc = new TextEncoder();
const dec = new TextDecoder();

export interface SmtpOptions { connector: Connector; host: string; port: number; secure: boolean; user: string; pass: string; ehloName?: string }

/** Envoi SMTP (TLS implicite, ex. port 465) : EHLO, AUTH PLAIN, MAIL FROM, RCPT TO, DATA. */
export async function sendSmtp(o: SmtpOptions, from: string, recipients: string[], raw: string): Promise<void> {
  let buf = '';
  let waiter: ((r: { code: number; lines: string[] }) => void) | null = null;
  let closed: ((e: Error) => void) | null = null;
  const lines: string[] = [];
  const onData = (c: Uint8Array) => {
    buf += dec.decode(c);
    let i: number;
    while ((i = buf.indexOf('\r\n')) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 2); lines.push(line);
      if (/^\d{3} /.test(line) || /^\d{3}$/.test(line)) { const w = waiter; waiter = null; const l = lines.splice(0); w?.({ code: Number(line.slice(0, 3)), lines: l }); }
    }
  };
  const t: Transport = await o.connector(o.host, o.port, o.secure, { onData, onClose: () => closed?.(new MailError('Connexion SMTP perdue.')) });
  const reply = (ms = 30000) => new Promise<{ code: number; lines: string[] }>((res, rej) => {
    const timer = setTimeout(() => rej(new MailError('Le serveur d\'envoi ne répond pas.')), ms);
    waiter = (r) => { clearTimeout(timer); res(r); };
    closed = (e) => { clearTimeout(timer); rej(e); };
  });
  const send = (s: string) => t.write(enc.encode(s));
  const expect = async (codes: number[], what: string) => {
    const r = await reply();
    if (!codes.includes(r.code)) throw new MailError(smtpMessage(r.code, r.lines, what));
    return r;
  };
  try {
    await expect([220], 'connexion');
    send(`EHLO ${o.ehloName ?? 'freda-mail'}\r\n`); await expect([250], 'EHLO');
    send(`AUTH PLAIN ${toBase64(enc.encode(`\0${o.user}\0${o.pass}`))}\r\n`);
    const auth = await reply();
    if (auth.code !== 235) throw new MailError(auth.code === 535 ? 'Envoi refusé : adresse ou mot de passe invalide.' : smtpMessage(auth.code, auth.lines, 'authentification'));
    send(`MAIL FROM:<${from}>\r\n`); await expect([250], 'expéditeur');
    for (const r of recipients) { send(`RCPT TO:<${r}>\r\n`); await expect([250, 251], `destinataire ${r}`); }
    send('DATA\r\n'); await expect([354], 'DATA');
    // bourrage de points (RFC 5321 §4.5.2) puis fin « . »
    send(raw.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..').replace(/\r\n$/, '') + '\r\n.\r\n');
    await expect([250], 'envoi du message');
    send('QUIT\r\n');
  } finally { t.close(); }
}

function smtpMessage(code: number, lines: string[], what: string): string {
  const detail = lines.map((l) => l.slice(4)).join(' ').trim();
  if (code === 550 || code === 553 || code === 551) return `Adresse refusée par le serveur (${what}) : ${detail}`;
  if (code >= 400 && code < 500) return `Le serveur est temporairement indisponible (${detail}). Réessayez dans un instant.`;
  return `Échec de l'envoi (${what}) : ${detail || code}`;
}
