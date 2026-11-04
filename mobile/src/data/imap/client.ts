import { Connector, Transport } from './transport';
import { ResponseReader, Tok, parseTokens, text } from './parser';

export class ImapError extends Error {
  constructor(message: string, readonly kind: 'auth' | 'no' | 'closed' | 'protocol' = 'protocol') { super(message); this.name = 'ImapError'; }
}

export interface ImapResult { ok: boolean; status: string; untagged: Uint8Array[] }
/** Partie d'une commande : texte ou littéral (envoyé après le « + » du serveur). */
export type Part = string | { literal: Uint8Array };

const enc = new TextEncoder();
const concat = (...a: Uint8Array[]) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const isPlain = (s: string) => /^[\x20-\x7e]*$/.test(s);

/** Chaîne IMAP : entre guillemets si ASCII simple, sinon littéral. */
export const str = (s: string): Part => (isPlain(s) ? `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : { literal: enc.encode(s) });

/** Client IMAP : une connexion, commandes en file (une à la fois), reconnexion à la demande. */
export class ImapClient {
  private transport: Transport | null = null;
  private reader = new ResponseReader();
  private queue: Promise<unknown> = Promise.resolve();
  private tag = 0;
  private pending: { tag: string; untagged: Uint8Array[]; resolve(r: ImapResult): void; reject(e: Error): void; onContinue?: () => void } | null = null;
  private greeting: ((line: string) => void) | null = null;
  capabilities = new Set<string>();
  selected: string | null = null;

  constructor(private connector: Connector, private host: string, private port: number, private secure: boolean, private user: string, private pass: string) {}

  private onData = (chunk: Uint8Array) => {
    for (const raw of this.reader.feed(chunk)) {
      const head = new TextDecoder().decode(raw.slice(0, 200));
      if (this.greeting) { const g = this.greeting; this.greeting = null; g(head); continue; }
      const p = this.pending;
      if (!p) continue;
      if (head.startsWith(p.tag + ' ')) {
        this.pending = null;
        p.resolve({ ok: /^\S+ OK/i.test(head), status: head.slice(p.tag.length + 1), untagged: p.untagged });
      } else if (head.startsWith('+') && p.onContinue) { const f = p.onContinue; p.onContinue = undefined; f(); }
      else p.untagged.push(raw);
    }
  };
  private onClose = () => {
    this.transport = null; this.selected = null;
    const p = this.pending; this.pending = null;
    if (p) p.reject(new ImapError('Connexion au serveur perdue.', 'closed'));
  };

  get connected() { return this.transport !== null; }

  async connect(): Promise<void> {
    this.reader = new ResponseReader();
    const greeted = new Promise<string>((res) => { this.greeting = res; });
    this.transport = await this.connector(this.host, this.port, this.secure, { onData: this.onData, onClose: this.onClose });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const g = await Promise.race([greeted, new Promise<string>((_, rej) => { timer = setTimeout(() => rej(new ImapError('Le serveur ne répond pas.', 'closed')), 15000); })]).finally(() => clearTimeout(timer));
    if (!/^\* (OK|PREAUTH)/i.test(g)) throw new ImapError('Réponse inattendue du serveur.');
    const login = await this.raw(['LOGIN ', str(this.user), ' ', str(this.pass)]);
    if (!login.ok) { this.close(); throw new ImapError('Adresse ou mot de passe refusé par le serveur.', 'auth'); }
    const caps = await this.raw(['CAPABILITY']);
    this.capabilities = new Set(caps.untagged.flatMap((u) => { const t = parseTokens(u); return t[1] && text(t[1]).toUpperCase() === 'CAPABILITY' ? t.slice(2).map((x) => text(x).toUpperCase()) : []; }));
  }

  close() { const t = this.transport; this.transport = null; this.selected = null; try { t?.close(); } catch { /* */ } }

  /** Exécute une commande étiquetée (sérialisée). */
  private raw(parts: Part[]): Promise<ImapResult> {
    const run = async (): Promise<ImapResult> => {
      const t = this.transport;
      if (!t) throw new ImapError('Pas de connexion.', 'closed');
      const tag = `A${String(++this.tag).padStart(4, '0')}`;
      return new Promise<ImapResult>((resolve, reject) => {
        const state = { tag, untagged: [] as Uint8Array[], resolve, reject, onContinue: undefined as undefined | (() => void) };
        this.pending = state;
        const send = (i: number, acc: string): void => {
          if (i >= parts.length) { t.write(enc.encode(acc + '\r\n')); return; }
          const part = parts[i];
          if (typeof part === 'string') return send(i + 1, acc + part);
          // littéral : « texte {n} », attendre le « + » du serveur, puis envoyer les octets et poursuivre
          state.onContinue = () => { t.write(part.literal); send(i + 1, ''); };
          t.write(enc.encode(acc + `{${part.literal.length}}\r\n`));
        };
        send(0, tag + ' ');
      });
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  /** Commande avec reconnexion automatique (une fois) si la connexion est tombée. */
  async cmd(parts: Part[], expectOk = true): Promise<ImapResult> {
    if (!this.connected) await this.connect();
    let r: ImapResult;
    try { r = await this.raw(parts); }
    catch (e) {
      if (e instanceof ImapError && e.kind === 'closed') { await this.connect(); r = await this.raw(parts); } else throw e;
    }
    if (expectOk && !r.ok) throw new ImapError(r.status.replace(/^NO\s*|^BAD\s*/i, '') || 'Le serveur a refusé la commande.', 'no');
    return r;
  }

  async select(mailbox: string, encode: (s: string) => string): Promise<{ exists: number; uidNext: number }> {
    const r = await this.cmd(['SELECT ', str(encode(mailbox))]);
    this.selected = mailbox;
    let exists = 0, uidNext = 0;
    for (const u of r.untagged) {
      const t = parseTokens(u);
      if (text(t[2]).toUpperCase() === 'EXISTS') exists = Number(text(t[1]));
      const m = /UIDNEXT (\d+)/i.exec(new TextDecoder().decode(u.slice(0, 120)));
      if (m) uidNext = Number(m[1]);
    }
    return { exists, uidNext };
  }

  static tokensOf(untagged: Uint8Array[]): Tok[][] { return untagged.map(parseTokens); }
}

