import net from 'net';
import { Connector } from '../src/data/imap/transport';

export const netConnector: Connector = (host, port, _secure, h) =>
  new Promise((resolve, reject) => {
    const s = net.connect({ host, port }, () => resolve({ write: (d) => s.write(d), close: () => s.destroy() }));
    s.on('data', (d: Buffer) => h.onData(new Uint8Array(d)));
    s.on('error', reject);
    s.on('close', () => h.onClose());
  });

export interface FakeMsg { uid: number; flags: Set<string>; date: string; raw: string }
export const CRLF = (s: string) => s.replace(/\r?\n/g, '\r\n');
export function rawMsg(o: { from: string; to: string; subject: string; body: string; date?: string; html?: boolean; attachment?: boolean; latin1?: boolean }): string {
  const d = o.date ?? 'Wed, 04 Nov 2026 10:00:00 +0000';
  const head = `From: ${o.from}\nTo: ${o.to}\nSubject: ${o.subject}\nDate: ${d}\nMessage-ID: <${Math.random().toString(36).slice(2)}@x>\nMIME-Version: 1.0\n`;
  if (o.attachment) return CRLF(`${head}Content-Type: multipart/mixed; boundary="B"\n\n--B\nContent-Type: text/plain; charset=utf-8\n\n${o.body}\n--B\nContent-Type: application/pdf; name="devis.pdf"\nContent-Disposition: attachment; filename="devis.pdf"\nContent-Transfer-Encoding: base64\n\nJVBERi0xLjQK\n--B--\n`);
  if (o.html) return CRLF(`${head}Content-Type: text/html; charset=utf-8\n\n${o.body}\n`);
  if (o.latin1) return CRLF(`${head}Content-Type: text/plain; charset=iso-8859-1\nContent-Transfer-Encoding: quoted-printable\n\n${o.body}\n`);
  return CRLF(`${head}Content-Type: text/plain; charset=utf-8\n\n${o.body}\n`);
}

export interface FakeImap { port: number; folders: Record<string, FakeMsg[]>; log: string[]; connections: number; kill(): void; close(): Promise<void>; capability: string; special: Record<string, string> }

export async function startImap(user: string, pass: string, folders: Record<string, FakeMsg[]>): Promise<FakeImap> {
  const state: FakeImap = { port: 0, folders, log: [], connections: 0, kill() { sockets.forEach((s) => s.destroy()); }, close: async () => { state.kill(); await new Promise((r) => server.close(r)); }, capability: 'IMAP4rev1 UIDPLUS MOVE', special: { Sent: '\\Sent', Drafts: '\\Drafts', Trash: '\\Trash', Junk: '\\Junk', Archive: '\\Archive' } };
  const sockets = new Set<net.Socket>();
  const server = net.createServer((sock) => {
    sockets.add(sock); state.connections++;
    sock.on('close', () => sockets.delete(sock));
    sock.write('* OK fake imap ready\r\n');
    let buf = Buffer.alloc(0);
    let selected = '';
    let literalFor: { need: number; line: string; got: Buffer[]; } | null = null;
    const w = (s: string | Buffer) => sock.write(s);
    const unq = (s: string) => s.replace(/^"|"$/g, '').replace(/\\(["\\])/g, '$1');

    function handle(line: string, literals: string[]) {
      const sp = line.indexOf(' ');
      const tag = line.slice(0, sp);
      let rest = line.slice(sp + 1);
      state.log.push(rest.slice(0, 120));
      const cmd = rest.split(' ')[0].toUpperCase();
      rest = rest.slice(cmd.length + 1);
      const ok = (m = 'done') => w(`${tag} OK ${m}\r\n`);
      const no = (m: string) => w(`${tag} NO ${m}\r\n`);
      let L = 0;
      const lit = () => literals[L++];
      const msgs = () => state.folders[selected] ?? [];
      if (cmd === 'CAPABILITY') { w(`* CAPABILITY ${state.capability}\r\n`); return ok(); }
      if (cmd === 'LOGIN') {
        const parts = [...rest.matchAll(/"((?:[^"\\]|\\.)*)"|\{LIT\}/g)].map((m) => (m[0] === '{LIT}' ? lit() : unq(m[0])));
        return parts[0] === user && parts[1] === pass ? ok('logged in') : no('[AUTHENTICATIONFAILED] Invalid credentials');
      }
      if (cmd === 'LIST') { for (const f of Object.keys(state.folders)) w(`* LIST (\\HasNoChildren${state.special[f] ? ' ' + state.special[f] : ''}) "/" "${f}"\r\n`); return ok(); }
      if (cmd === 'STATUS') { const name = unq(rest.split(' ')[0]); const n = (state.folders[name] ?? []).filter((m) => !m.flags.has('\\Seen')).length; w(`* STATUS "${name}" (UNSEEN ${n})\r\n`); return ok(); }
      if (cmd === 'SELECT') { selected = unq(rest.trim()); if (!state.folders[selected]) return no('no such mailbox'); const ms = msgs(); w(`* ${ms.length} EXISTS\r\n* OK [UIDNEXT ${Math.max(0, ...ms.map((m) => m.uid)) + 1}] next\r\n`); return ok('[READ-WRITE] selected'); }
      const uidMode = cmd === 'UID';
      let c2 = cmd, r2 = rest;
      if (uidMode) { c2 = rest.split(' ')[0].toUpperCase(); r2 = rest.slice(c2.length + 1); }
      const pick = (set: string): FakeMsg[] => {
        const ms = msgs();
        const want = new Set<number>();
        for (const part of set.split(',')) {
          const [a, b] = part.split(':').map(Number);
          for (let i = a; i <= (b ?? a); i++) want.add(i);
        }
        return uidMode ? ms.filter((m) => want.has(m.uid)) : ms.filter((_m, i) => want.has(i + 1));
      };
      if (c2 === 'SEARCH') {
        const needle = (r2.match(/"([^"]*)"/)?.[1] ?? lit() ?? '').toLowerCase();
        const hit = msgs().filter((m) => m.raw.toLowerCase().includes(needle));
        w(`* SEARCH ${hit.map((m) => m.uid).join(' ')}\r\n`); return ok();
      }
      if (c2 === 'FETCH') {
        const set = r2.split(' ')[0];
        for (const m of pick(set)) {
          const idx = msgs().indexOf(m) + 1;
          const [head, ...bodyParts] = m.raw.split('\r\n\r\n');
          const body = bodyParts.join('\r\n\r\n');
          const hf = head.split('\r\n').filter((l) => /^(from|to|cc|subject|date|message-id|content-type|content-transfer-encoding):/i.test(l)).join('\r\n') + '\r\n\r\n';
          const out: (string | Buffer)[] = [`* ${idx} FETCH (UID ${m.uid} FLAGS (${[...m.flags].join(' ')})`];
          if (r2.includes('INTERNALDATE')) out.push(` INTERNALDATE "${m.date}"`);
          if (r2.includes('BODYSTRUCTURE')) out.push(/attachment/i.test(m.raw) ? ' BODYSTRUCTURE (("TEXT" "PLAIN" ("CHARSET" "UTF-8") NIL NIL "7BIT" 10 1)("APPLICATION" "PDF" ("NAME" "devis.pdf") NIL NIL "BASE64" 100 NIL ("ATTACHMENT" ("FILENAME" "devis.pdf")) NIL) "MIXED")' : ' BODYSTRUCTURE ("TEXT" "PLAIN" ("CHARSET" "UTF-8") NIL NIL "7BIT" 10 1)');
          if (/HEADER\.FIELDS/.test(r2)) { const b = Buffer.from(hf); out.push(` BODY[HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID CONTENT-TYPE CONTENT-TRANSFER-ENCODING)] {${b.length}}\r\n`, b); }
          const part = /BODY\.PEEK\[TEXT\]<0 (\d+)>/.exec(r2);
          if (part) { const b = Buffer.from(body).subarray(0, Number(part[1])); out.push(` BODY[TEXT]<0> {${b.length}}\r\n`, b); }
          if (/BODY\.PEEK\[\]/.test(r2)) { const b = Buffer.from(m.raw); out.push(` BODY[] {${b.length}}\r\n`, b); }
          out.push(')\r\n');
          out.forEach((x) => w(x));
        }
        return ok();
      }
      if (c2 === 'STORE') {
        const [set, mode, flagsRaw] = [r2.split(' ')[0], r2.split(' ')[1], r2.slice(r2.indexOf('(') + 1, r2.indexOf(')'))];
        for (const m of pick(set)) for (const f of flagsRaw.split(' ')) (mode.startsWith('+') ? m.flags.add(f) : m.flags.delete(f));
        return ok();
      }
      if (c2 === 'MOVE' || c2 === 'COPY') {
        const set = r2.split(' ')[0]; const dest = unq(r2.slice(set.length + 1).trim());
        if (!state.folders[dest]) return no('[TRYCREATE] no such mailbox');
        for (const m of pick(set)) {
          state.folders[dest].push({ ...m, uid: Math.max(0, ...state.folders[dest].map((x) => x.uid)) + 1, flags: new Set(m.flags) });
          if (c2 === 'MOVE') state.folders[selected] = state.folders[selected].filter((x) => x !== m);
        }
        return ok();
      }
      if (cmd === 'EXPUNGE' || c2 === 'EXPUNGE') {
        const del = r2.trim() && uidMode ? new Set(pick(r2.trim())) : null;
        state.folders[selected] = msgs().filter((m) => !(m.flags.has('\\Deleted') && (!del || del.has(m)))); return ok();
      }
      if (cmd === 'APPEND') {
        const name = unq(rest.split(' ')[0]); const raw = lit();
        state.folders[name] = state.folders[name] ?? [];
        state.folders[name].push({ uid: Math.max(0, ...state.folders[name].map((x) => x.uid)) + 1, flags: new Set(['\\Seen']), date: '04-Nov-2026 10:00:00 +0000', raw });
        return ok('appended');
      }
      if (cmd === 'LOGOUT') { w('* BYE\r\n'); ok(); sock.end(); return; }
      if (cmd === 'NOOP') return ok();
      w(`${tag} BAD unknown command ${cmd}\r\n`);
    }

    // lecture : ligne ; si elle finit par {n}, envoyer « + », lire n octets, puis continuer la même commande
    let pendingLine = ''; let lits: string[] = [];
    function pump() {
      for (;;) {
        if (literalFor) {
          if (buf.length < literalFor.need) return;
          lits.push(buf.subarray(0, literalFor.need).toString('utf8')); buf = buf.subarray(literalFor.need); literalFor = null;
          continue;
        }
        const i = buf.indexOf('\r\n');
        if (i < 0) return;
        const line = buf.subarray(0, i).toString('utf8'); buf = buf.subarray(i + 2);
        const m = /\{(\d+)\}$/.exec(line);
        if (m) { pendingLine += line.slice(0, line.length - m[0].length) + '{LIT}'; literalFor = { need: Number(m[1]), line: '', got: [] }; w('+ go ahead\r\n'); continue; }
        const full = pendingLine + line; const ll = lits; pendingLine = ''; lits = [];
        handle(full, ll);
      }
    }
    sock.on('data', (d: Buffer) => { buf = Buffer.concat([buf, d]); pump(); });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  state.port = (server.address() as net.AddressInfo).port;
  return state;
}

export interface FakeSmtp { port: number; received: { from: string; to: string[]; data: string }[]; close(): Promise<void> }
export async function startSmtp(user: string, pass: string, opts: { rejectRcpt?: string } = {}): Promise<FakeSmtp> {
  const st: FakeSmtp = { port: 0, received: [], close: async () => { sockets.forEach((s) => s.destroy()); await new Promise((r) => server.close(r)); } };
  const sockets = new Set<net.Socket>();
  const server = net.createServer((sock) => {
    sockets.add(sock);
    sock.write('220 fake smtp\r\n');
    let buf = ''; let data: string | null = null; let cur = { from: '', to: [] as string[] };
    sock.on('data', (d) => {
      buf += d.toString('utf8');
      for (;;) {
        if (data !== null) {
          const end = buf.indexOf('\r\n.\r\n');
          if (end < 0) return;
          const body = buf.slice(0, end); buf = buf.slice(end + 5); data = null;
          st.received.push({ from: cur.from, to: cur.to, data: body.replace(/^\.\./gm, '.') }); sock.write('250 queued\r\n'); continue;
        }
        const i = buf.indexOf('\r\n'); if (i < 0) return;
        const line = buf.slice(0, i); buf = buf.slice(i + 2);
        if (/^EHLO/i.test(line)) sock.write('250-fake\r\n250 AUTH PLAIN\r\n');
        else if (/^AUTH PLAIN/i.test(line)) { const [, u, p] = Buffer.from(line.slice(11), 'base64').toString().split('\0'); sock.write(u === user && p === pass ? '235 ok\r\n' : '535 bad credentials\r\n'); }
        else if (/^MAIL FROM/i.test(line)) { cur = { from: /<(.*)>/.exec(line)![1], to: [] }; sock.write('250 ok\r\n'); }
        else if (/^RCPT TO/i.test(line)) { const a = /<(.*)>/.exec(line)![1]; if (a === opts.rejectRcpt) sock.write('550 no such user\r\n'); else { cur.to.push(a); sock.write('250 ok\r\n'); } }
        else if (/^DATA/i.test(line)) { data = ''; sock.write('354 go\r\n'); }
        else if (/^QUIT/i.test(line)) { sock.write('221 bye\r\n'); sock.end(); }
        else sock.write('500 ?\r\n');
      }
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  st.port = (server.address() as net.AddressInfo).port;
  return st;
}
