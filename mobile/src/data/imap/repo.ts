import PostalMime from 'postal-mime';
import { htmlToText } from '../../core/htmlSafety';
import { buildMessage } from '../mime';
import { Account, FolderKind, MailAddress, MailError, MailFolder, MailMessage, MailRepository, OutgoingMessage } from '../models';
import { sendSmtp } from '../smtp';
import { ImapClient, ImapError, str } from './client';
import { containsString, decodeMutf7, encodeMutf7, fetchItems, parseTokens, text, Tok } from './parser';
import { Connector } from './transport';

export interface Endpoint { host: string; port: number; secure: boolean }
export interface ImapRepoOptions { account: Account; imap: Endpoint; smtp: Endpoint; password: string; connector: Connector; clock?: () => Date }

const HEADER_FIELDS = 'FROM TO CC SUBJECT DATE MESSAGE-ID CONTENT-TYPE CONTENT-TRANSFER-ENCODING';
const PAGE = 50;

export function folderKind(name: string, flags: string[]): FolderKind {
  if (name.toUpperCase() === 'INBOX') return 'inbox';
  const f = flags.map((x) => x.toLowerCase());
  if (f.includes('\\sent')) return 'sent';
  if (f.includes('\\drafts')) return 'drafts';
  if (f.includes('\\trash')) return 'trash';
  if (f.includes('\\junk')) return 'spam';
  if (f.includes('\\archive') || f.includes('\\all')) return 'archive';
  if (/(^|[/.])(sent|envoy)/i.test(name)) return 'sent';
  if (/draft|brouillon/i.test(name)) return 'drafts';
  if (/trash|corbeille|deleted|supprim/i.test(name)) return 'trash';
  if (/junk|spam|ind[ée]sir/i.test(name)) return 'spam';
  if (/archive/i.test(name)) return 'archive';
  return 'other';
}

const FRIENDLY: Record<FolderKind, string> = { inbox: 'Boîte de réception', sent: 'Envoyés', drafts: 'Brouillons', archive: 'Archives', spam: 'Courrier indésirable', trash: 'Corbeille', other: '' };
const ORDER: FolderKind[] = ['inbox', 'drafts', 'sent', 'archive', 'spam', 'trash', 'other'];
const addr = (a: any): MailAddress => ({ email: String(a?.address ?? ''), name: a?.name ? String(a.name) : undefined });
const flat = (list: any[] | undefined): MailAddress[] => (list ?? []).flatMap((x) => (x?.group ? x.group.map(addr) : [addr(x)])).filter((a) => a.email);

export class ImapRepository implements MailRepository {
  readonly account: Account;
  private imap: ImapClient;
  private folderCache: MailFolder[] = [];
  private known = new Map<string, MailAddress>();
  private now: () => Date;

  constructor(private o: ImapRepoOptions) {
    this.account = o.account;
    this.now = o.clock ?? (() => new Date());
    this.imap = new ImapClient(o.connector, o.imap.host, o.imap.port, o.imap.secure, o.account.address, o.password);
  }

  /** Ouvre la connexion et vérifie l'identité (sert à la connexion de l'utilisateur). */
  async open() { await this.imap.connect(); }

  private async use(folder: string) {
    if (!this.imap.connected || this.imap.selected !== folder) return this.imap.select(folder, encodeMutf7);
    return { exists: -1, uidNext: 0 };
  }

  async folders(): Promise<MailFolder[]> {
    const list = await this.imap.cmd(['LIST "" "*"']);
    const raw: { id: string; name: string; kind: FolderKind }[] = [];
    for (const u of list.untagged) {
      const t = parseTokens(u);
      if (text(t[1]).toUpperCase() !== 'LIST' || !Array.isArray(t[2])) continue;
      const flags = (t[2] as Tok[]).map(text);
      if (flags.some((f) => f.toLowerCase() === '\\noselect')) continue;
      const id = decodeMutf7(text(t[4]));
      raw.push({ id, name: id, kind: folderKind(id, flags) });
    }
    const out: MailFolder[] = [];
    for (const f of raw) {
      let unread = 0;
      try {
        const s = await this.imap.cmd(['STATUS ', str(encodeMutf7(f.id)), ' (UNSEEN)']);
        const m = /UNSEEN (\d+)/i.exec(s.untagged.map((u) => new TextDecoder().decode(u)).join(' '));
        unread = m ? Number(m[1]) : 0;
      } catch { /* dossier illisible : 0 */ }
      out.push({ ...f, name: FRIENDLY[f.kind] || f.name.replace(/^INBOX[./]/i, ''), unread });
    }
    out.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.name.localeCompare(b.name));
    this.folderCache = out;
    return out;
  }

  private async folderOf(kind: FolderKind): Promise<string> {
    if (!this.folderCache.length) await this.folders();
    const f = this.folderCache.find((x) => x.kind === kind);
    if (!f) throw new MailError(kind === 'trash' ? 'Aucun dossier Corbeille sur ce compte.' : kind === 'archive' ? 'Aucun dossier Archives sur ce compte.' : 'Dossier introuvable sur ce compte.');
    return f.id;
  }

  private async parseHead(headers: Uint8Array | null, body: Uint8Array | null): Promise<{ from: MailAddress; to: MailAddress[]; cc: MailAddress[]; subject: string; date?: Date; snippet: string }> {
    const h = headers ? new TextDecoder().decode(headers).replace(/\r?\n\r?\n$/, '') : '';
    const doc = h + '\r\n\r\n' + (body ? new TextDecoder().decode(body) : '');
    let p: any = {};
    try { p = await PostalMime.parse(doc); } catch { /* en-têtes illisibles : champs vides */ }
    const plain = (p.text && String(p.text).trim()) || (p.html ? htmlToText(String(p.html)) : '');
    const d = p.date ? new Date(p.date) : undefined;
    return { from: addr(p.from), to: flat(p.to), cc: flat(p.cc), subject: String(p.subject ?? '').trim(), date: d && !isNaN(d.getTime()) ? d : undefined, snippet: plain.replace(/\s+/g, ' ').slice(0, 140) };
  }

  async messages(folderId: string, query?: string, limit = PAGE): Promise<MailMessage[]> {
    const sel = await this.imap.select(folderId, encodeMutf7);
    const q = (query ?? '').trim();
    let range: string;
    let byUid = false;
    if (q) {
      const r = await this.imap.cmd(['UID SEARCH CHARSET UTF-8 OR OR FROM ', str(q), ' SUBJECT ', str(q), ' TEXT ', str(q)]);
      const uids = r.untagged.flatMap((u) => { const t = parseTokens(u); return text(t[1]).toUpperCase() === 'SEARCH' ? t.slice(2).map((x) => Number(text(x))) : []; }).sort((a, b) => b - a).slice(0, limit);
      if (!uids.length) return [];
      range = uids.join(','); byUid = true;
    } else {
      if (sel.exists === 0) return [];
      range = `${Math.max(1, sel.exists - limit + 1)}:${sel.exists}`;
    }
    const r = await this.imap.cmd([`${byUid ? 'UID ' : ''}FETCH ${range} (UID FLAGS INTERNALDATE BODYSTRUCTURE BODY.PEEK[HEADER.FIELDS (${HEADER_FIELDS})] BODY.PEEK[TEXT]<0 1500>)`]);
    const out: MailMessage[] = [];
    for (const u of r.untagged) {
      const t = parseTokens(u);
      if (text(t[2]).toUpperCase() !== 'FETCH') continue;
      const it = fetchItems(t[3]);
      const key = (p: string) => [...it.keys()].find((k) => k.startsWith(p));
      const head = it.get(key('BODY[HEADER') ?? '') as Uint8Array | undefined;
      const body = it.get(key('BODY[TEXT]') ?? '') as Uint8Array | undefined;
      const flags = (Array.isArray(it.get('FLAGS')) ? (it.get('FLAGS') as Tok[]) : []).map((f) => text(f).toLowerCase());
      const h = await this.parseHead(head ?? null, body ?? null);
      const internal = new Date(text(it.get('INTERNALDATE') ?? null));
      const hasAtt = containsString(it.get('BODYSTRUCTURE') ?? null, 'attachment');
      const from = h.from.email ? h.from : { email: 'inconnu', name: 'Expéditeur inconnu' };
      const msg: MailMessage = {
        id: text(it.get('UID') ?? null), folderId, from, to: h.to, cc: h.cc, subject: h.subject || '(sans objet)',
        date: h.date ?? (isNaN(internal.getTime()) ? this.now() : internal), snippet: h.snippet, bodyText: '',
        isRead: flags.includes('\\seen'), isStarred: flags.includes('\\flagged'),
        attachments: hasAtt ? [{ name: 'Pièce jointe', size: 0, mime: '' }] : [],
      };
      out.push(msg);
      if (msg.from.email !== this.account.address) this.known.set(msg.from.email.toLowerCase(), msg.from);
      for (const a of msg.to) if (msg.from.email === this.account.address) this.known.set(a.email.toLowerCase(), a);
    }
    return out.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async message(folderId: string, id: string): Promise<MailMessage> {
    await this.imap.select(folderId, encodeMutf7);
    const r = await this.imap.cmd([`UID FETCH ${Number(id)} (FLAGS BODY.PEEK[])`]);
    for (const u of r.untagged) {
      const t = parseTokens(u);
      if (text(t[2]).toUpperCase() !== 'FETCH') continue;
      const it = fetchItems(t[3]);
      const raw = it.get('BODY[]') as Uint8Array | undefined;
      if (!raw) continue;
      const p: any = await PostalMime.parse(raw);
      const flags = (Array.isArray(it.get('FLAGS')) ? (it.get('FLAGS') as Tok[]) : []).map((f) => text(f).toLowerCase());
      const html = p.html ? String(p.html) : undefined;
      const bodyText = (p.text && String(p.text).trim()) || (html ? htmlToText(html) : '');
      const date = p.date ? new Date(p.date) : this.now();
      return {
        id, folderId, from: p.from ? addr(p.from) : { email: 'inconnu', name: 'Expéditeur inconnu' }, to: flat(p.to), cc: flat(p.cc),
        subject: String(p.subject ?? '').trim() || '(sans objet)', date: isNaN(date.getTime()) ? this.now() : date,
        snippet: bodyText.replace(/\s+/g, ' ').slice(0, 140), bodyText, bodyHtml: html,
        isRead: flags.includes('\\seen'), isStarred: flags.includes('\\flagged'),
        attachments: (p.attachments ?? []).filter((a: any) => a.disposition !== 'inline' || a.filename).map((a: any) => ({ name: a.filename || 'pièce-jointe', size: a.content?.byteLength ?? 0, mime: a.mimeType || 'application/octet-stream' })),
      };
    }
    throw new MailError('Message introuvable.');
  }

  private async store(folderId: string, id: string, flag: string, on: boolean) {
    await this.imap.select(folderId, encodeMutf7);
    await this.imap.cmd([`UID STORE ${Number(id)} ${on ? '+' : '-'}FLAGS.SILENT (${flag})`]);
  }
  setRead(f: string, id: string, read: boolean) { return this.store(f, id, '\\Seen', read); }
  setStarred(f: string, id: string, starred: boolean) { return this.store(f, id, '\\Flagged', starred); }

  async move(folderId: string, id: string, to: FolderKind) {
    const dest = await this.folderOf(to);
    if (dest === folderId) return;
    await this.imap.select(folderId, encodeMutf7);
    const uid = Number(id);
    if (this.imap.capabilities.has('MOVE')) { await this.imap.cmd([`UID MOVE ${uid} `, str(encodeMutf7(dest))]); return; }
    await this.imap.cmd([`UID COPY ${uid} `, str(encodeMutf7(dest))]);
    await this.expunge(uid);
  }

  private async expunge(uid: number) {
    await this.imap.cmd([`UID STORE ${uid} +FLAGS.SILENT (\\Deleted)`]);
    await this.imap.cmd([this.imap.capabilities.has('UIDPLUS') ? `UID EXPUNGE ${uid}` : 'EXPUNGE']);
  }

  async remove(folderId: string, id: string) {
    const trash = this.folderCache.find((f) => f.kind === 'trash')?.id ?? (await this.folderOf('trash').catch(() => null));
    if (trash === null || folderId === trash) { await this.imap.select(folderId, encodeMutf7); await this.expunge(Number(id)); return; }
    await this.move(folderId, id, 'trash');
  }

  async send(m: OutgoingMessage) {
    const raw = buildMessage({ email: this.account.address, name: this.account.displayName }, m, this.now());
    const rcpts = [...m.to, ...(m.cc ?? []), ...(m.bcc ?? [])].map((a) => a.email);
    await sendSmtp({ connector: this.o.connector, ...this.o.smtp, user: this.account.address, pass: this.o.password }, this.account.address, rcpts, raw);
    // copie dans « Envoyés » (le serveur SMTP ne la crée pas toujours) ; un échec ici ne doit pas faire croire que l'envoi a échoué
    try {
      const sent = await this.folderOf('sent');
      await this.imap.cmd(['APPEND ', str(encodeMutf7(sent)), ' (\\Seen) ', { literal: new TextEncoder().encode(raw) }]);
    } catch { /* copie non enregistrée */ }
  }

  async contacts(): Promise<MailAddress[]> {
    if (this.known.size < 5) {
      try { await this.messages('INBOX', undefined, 100); } catch { /* */ }
      try { await this.messages(await this.folderOf('sent'), undefined, 100); } catch { /* */ }
    }
    return [...this.known.values()].sort((a, b) => (a.name || a.email).toLowerCase().localeCompare((b.name || b.email).toLowerCase()));
  }

  async dispose() { this.imap.close(); }
}

export { ImapError };
