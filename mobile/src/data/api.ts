import { MailError } from './models';
import type { Endpoint } from './imap/repo';

export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || 'https://fredaworkspace.com/api').replace(/\/+$/, '');

/** Session de boîte renvoyée par POST /api/mail/login (jeton de boîte, jamais un jeton de compte). */
export interface MailSession { address: string; name: string; token: string; imap: Endpoint; smtp: Endpoint }

const ep = (j: any, fallbackPort: number): Endpoint => ({ host: String(j?.host ?? ''), port: typeof j?.port === 'number' ? j.port : fallbackPort, secure: String(j?.security ?? 'ssl') === 'ssl' });

export class FredaApi {
  constructor(private base: string = API_BASE, private doFetch: typeof fetch = (...a) => fetch(...a)) {}

  private async req(path: string, init: RequestInit = {}, ms = 25000): Promise<Response> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms);
    try { return await this.doFetch(this.base + path, { ...init, signal: ctl.signal }); }
    catch (e: any) {
      if (e?.name === 'AbortError') throw new MailError('Le serveur met trop de temps à répondre. Réessayez dans un instant.');
      throw new MailError('Connexion impossible. Vérifiez votre accès internet.');
    } finally { clearTimeout(timer); }
  }

  private async message(res: Response, fallback: string): Promise<string> {
    try { const j = await res.json(); if (j && typeof j.message === 'string' && j.message) return j.message; } catch { /* pas du JSON */ }
    return fallback;
  }

  /** Vérifie l'adresse et le mot de passe (le serveur teste la vraie connexion IMAP) puis renvoie la session. */
  async login(address: string, password: string): Promise<MailSession> {
    const res = await this.req('/mail/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: address.trim().toLowerCase(), address: address.trim().toLowerCase(), password }) });
    if (res.status !== 200) throw new MailError(await this.message(res, `Connexion refusée (${res.status}).`));
    const b: any = await res.json();
    const mb = b.mailbox ?? {};
    return { address: String(mb.address ?? address), name: String(mb.name ?? ''), token: String(b.token ?? ''), imap: ep(b.imap, 993), smtp: ep(b.smtp, 465) };
  }

  private auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** Quelles adresses ont une photo ? → { adresse: version }. Silencieux en cas d'échec : les initiales suffisent. */
  async photoLookup(token: string, addresses: string[]): Promise<Record<string, string>> {
    try {
      const res = await this.req('/mail/photos', { method: 'POST', headers: { ...this.auth(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ addresses }) }, 15000);
      if (res.status !== 200) return {};
      const j: any = await res.json();
      return j && typeof j.photos === 'object' && j.photos ? j.photos : {};
    } catch { return {}; }
  }

  /** Adresse + en-têtes d'une photo (le cache disque d'expo-image s'en sert). */
  photoSource(token: string, address: string, version: string) {
    return { uri: `${this.base}/mail/photo/${encodeURIComponent(address)}?v=${encodeURIComponent(version)}`, headers: this.auth(token) };
  }

  async uploadPhoto(token: string, body: Blob | Uint8Array): Promise<string> {
    const res = await this.req('/mail/photo', { method: 'PUT', headers: { ...this.auth(token), 'Content-Type': 'application/octet-stream' }, body: body as any }, 30000);
    if (res.status !== 200) throw new MailError(await this.message(res, 'Photo refusée.'));
    return String(((await res.json()) as any).version ?? '');
  }

  async deletePhoto(token: string): Promise<void> {
    const res = await this.req('/mail/photo', { method: 'DELETE', headers: this.auth(token) }, 15000);
    if (res.status !== 200) throw new MailError(await this.message(res, 'Suppression refusée.'));
  }
}
