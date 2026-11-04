import { ResponseReader, parseTokens, text, decodeMutf7, encodeMutf7, fetchItems } from '../src/data/imap/parser';
import { ImapRepository } from '../src/data/imap/repo';
import { folderKind } from '../src/data/imap/repo';
import { buildMessage, encodeHeader } from '../src/data/mime';
import { FakeImap, FakeMsg, FakeSmtp, netConnector, rawMsg, startImap, startSmtp } from './fakeServers';

const enc = new TextEncoder();
const NOW = new Date(Date.UTC(2026, 10, 4, 12));

test('lecteur : littéraux {n} traversant plusieurs paquets, réponses recollées', () => {
  const r = new ResponseReader();
  const all = enc.encode('* 1 FETCH (UID 4 BODY[TEXT] {12}\r\nhello\r\nworld)\r\nA1 OK done\r\n');
  const out: Uint8Array[] = [];
  for (let i = 0; i < all.length; i += 7) out.push(...r.feed(all.slice(i, i + 7)));
  expect(out.length).toBe(2);
  const t = parseTokens(out[0]);
  const it = fetchItems(t[3]);
  expect(text(it.get('UID') ?? null)).toBe('4');
  expect(text(it.get('BODY[TEXT]') ?? null)).toBe('hello\r\nworld');
});

test('jetons : listes, NIL, guillemets échappés, sections BODY[HEADER.FIELDS (…)]', () => {
  const t = parseTokens(enc.encode('* LIST (\\HasNoChildren \\Sent) "/" "Envoy&AOk-s \\"x\\""'));
  expect((t[2] as string[])[1]).toBe('\\Sent');
  expect(text(t[4])).toBe('Envoy&AOk-s "x"');
  const f = parseTokens(enc.encode('* 2 FETCH (BODY[HEADER.FIELDS (FROM TO)] "x" BODYSTRUCTURE NIL)'));
  const it = fetchItems(f[3]);
  expect([...it.keys()][0]).toBe('BODY[HEADER.FIELDS (FROM TO)]');
  expect(it.get('BODYSTRUCTURE')).toBeNull();
});

test('noms de dossiers : UTF-7 modifié aller-retour', () => {
  expect(decodeMutf7('Envoy&AOk-s')).toBe('Envoyés');
  expect(encodeMutf7('Envoyés')).toBe('Envoy&AOk-s');
  expect(encodeMutf7('A&B')).toBe('A&-B');
  expect(folderKind('Sent Items', [])).toBe('sent');
  expect(folderKind('Corbeille', [])).toBe('trash');
  expect(folderKind('X', ['\\Junk'])).toBe('spam');
});

test('MIME : en-têtes non ASCII encodés, corps base64, adresses', () => {
  expect(encodeHeader('Réunion à 17 h')).toMatch(/^=\?UTF-8\?B\?/);
  const raw = buildMessage({ email: 'me@x.com', name: 'Moi' }, { to: [{ email: 'a@b.co', name: 'Zoé' }], subject: 'Été', body: 'Bonjour\nça va ?' }, NOW, () => 'id1');
  expect(raw).toContain('Message-ID: <id1@x.com>');
  expect(raw).toContain('Content-Transfer-Encoding: base64');
  expect(raw).not.toMatch(/[^\x00-\x7f]/);
});

describe('ImapRepository contre un faux serveur', () => {
  let imap: FakeImap, smtp: FakeSmtp;
  const mk = (uid: number, o: Parameters<typeof rawMsg>[0], flags: string[] = []): FakeMsg => ({ uid, flags: new Set(flags), date: '04-Nov-2026 10:00:00 +0000', raw: rawMsg(o) });
  const make = (pass = 'secret') => new ImapRepository({
    account: { address: 'moi@neuf.com', displayName: 'Moi' }, password: pass, connector: netConnector, clock: () => NOW,
    imap: { host: '127.0.0.1', port: imap.port, secure: false }, smtp: { host: '127.0.0.1', port: smtp.port, secure: false },
  });

  beforeEach(async () => {
    imap = await startImap('moi@neuf.com', 'secret', {
      INBOX: [
        mk(1, { from: 'Marie <marie@atelier.ht>', to: 'moi@neuf.com', subject: 'Devis', body: 'Voici le devis.', date: 'Wed, 04 Nov 2026 09:00:00 +0000', attachment: true }, ['\\Seen']),
        mk(2, { from: 'Équipe <equipe@freda.com>', to: 'moi@neuf.com', subject: 'Bienvenue', body: '<p>Bonjour <b>vous</b></p>', date: 'Wed, 04 Nov 2026 11:00:00 +0000', html: true }),
        mk(3, { from: 'Zoé <zoe@x.fr>', to: 'moi@neuf.com', subject: 'Caf=?UTF-8?Q?=C3=A9?=', body: 'Rendez-vous =E0 17 h', date: 'Tue, 03 Nov 2026 09:00:00 +0000', latin1: true }, ['\\Flagged']),
      ],
      Sent: [], Drafts: [], Trash: [], Archive: [], Junk: [],
    });
    smtp = await startSmtp('moi@neuf.com', 'secret', { rejectRcpt: 'inconnu@x.fr' });
  });
  afterEach(async () => { await imap.close(); await smtp.close(); });

  test('mauvais mot de passe : message clair, pas de connexion ouverte', async () => {
    const r = make('mauvais');
    await expect(r.open()).rejects.toThrow(/refusé/);
  });

  test('mot de passe non ASCII : envoyé en littéral', async () => {
    await imap.close();
    imap = await startImap('moi@neuf.com', 'Café#2026é', { INBOX: [] });
    const r = make('Café#2026é');
    await r.open();
    expect(await r.messages('INBOX')).toEqual([]);
    await r.dispose();
  });

  test('dossiers : noms français, ordre, non lus', async () => {
    const r = make();
    const f = await r.folders();
    expect(f.map((x) => x.kind)).toEqual(['inbox', 'drafts', 'sent', 'archive', 'spam', 'trash']);
    expect(f[0]).toMatchObject({ name: 'Boîte de réception', unread: 2 });
    await r.dispose();
  });

  test('liste : tri récent d\'abord, extraits, pièce jointe, lu / favori, charset latin-1 et sujet encodé', async () => {
    const r = make();
    const list = await r.messages('INBOX');
    expect(list.map((m) => m.id)).toEqual(['2', '1', '3']);
    expect(list[0]).toMatchObject({ subject: 'Bienvenue', isRead: false, snippet: 'Bonjour vous' });
    expect(list[0].from).toEqual({ email: 'equipe@freda.com', name: 'Équipe' });
    expect(list[1]).toMatchObject({ isRead: true });
    expect(list[1].attachments.length).toBe(1);
    expect(list[2]).toMatchObject({ subject: 'Café', isStarred: true });
    expect(list[2].snippet).toContain('à 17 h');
    await r.dispose();
  });

  test('lecture complète : texte, HTML, pièces jointes avec nom et taille', async () => {
    const r = make();
    const a = await r.message('INBOX', '1');
    expect(a.bodyText).toContain('Voici le devis.');
    expect(a.attachments[0]).toMatchObject({ name: 'devis.pdf', mime: 'application/pdf' });
    expect(a.attachments[0].size).toBeGreaterThan(0);
    const b = await r.message('INBOX', '2');
    expect(b.bodyHtml).toContain('<b>vous</b>');
    expect(b.bodyText).toBe('Bonjour vous');
    await expect(r.message('INBOX', '99')).rejects.toThrow(/introuvable/);
    await r.dispose();
  });

  test('lu / favori / archiver (MOVE) / supprimer vers la corbeille puis définitivement', async () => {
    const r = make();
    await r.setRead('INBOX', '2', true);
    expect(imap.folders.INBOX.find((m) => m.uid === 2)!.flags.has('\\Seen')).toBe(true);
    await r.setStarred('INBOX', '2', true);
    expect(imap.folders.INBOX.find((m) => m.uid === 2)!.flags.has('\\Flagged')).toBe(true);
    await r.move('INBOX', '1', 'archive');
    expect(imap.folders.Archive.length).toBe(1);
    expect(imap.folders.INBOX.length).toBe(2);
    await r.remove('INBOX', '2');
    expect(imap.folders.Trash.length).toBe(1);
    await r.remove('Trash', '1');
    expect(imap.folders.Trash.length).toBe(0);
    await r.dispose();
  });

  test('sans MOVE : COPY + suppression + UID EXPUNGE', async () => {
    imap.capability = 'IMAP4rev1 UIDPLUS';
    const r = make();
    await r.move('INBOX', '3', 'trash');
    expect(imap.folders.Trash.length).toBe(1);
    expect(imap.folders.INBOX.map((m) => m.uid)).toEqual([1, 2]);
    expect(imap.log.some((l) => l.startsWith('UID COPY'))).toBe(true);
    await r.dispose();
  });

  test('recherche : par texte, y compris accents (littéral UTF-8)', async () => {
    const r = make();
    expect((await r.messages('INBOX', 'devis')).map((m) => m.id)).toEqual(['1']);
    expect(await r.messages('INBOX', 'introuvable')).toEqual([]);
    await r.dispose();
  });

  test('envoi : SMTP authentifié, copie dans Envoyés, destinataire refusé = erreur claire', async () => {
    const r = make();
    await r.send({ to: [{ email: 'zoe@x.fr', name: 'Zoé' }], cc: [{ email: 'cc@x.fr' }], bcc: [{ email: 'bcc@x.fr' }], subject: 'Été 2026', body: 'Salut.\n.point seul\nÀ bientôt' });
    expect(smtp.received.length).toBe(1);
    expect(smtp.received[0]).toMatchObject({ from: 'moi@neuf.com', to: ['zoe@x.fr', 'cc@x.fr', 'bcc@x.fr'] });
    expect(smtp.received[0].data).toContain('To: Zoé <zoe@x.fr>'.replace('Zoé', '=?UTF-8?B?Wm/DqQ==?='));
    expect(smtp.received[0].data).not.toContain('bcc@x.fr');
    expect(imap.folders.Sent.length).toBe(1);
    await expect(r.send({ to: [{ email: 'inconnu@x.fr' }], subject: 'x', body: 'y' })).rejects.toThrow(/refusée/);
    await r.dispose();
  });

  test('connexion coupée : reconnexion automatique à la commande suivante', async () => {
    const r = make();
    await r.messages('INBOX');
    expect(imap.connections).toBe(1);
    imap.kill();
    await new Promise((x) => setTimeout(x, 50));
    expect((await r.messages('INBOX')).length).toBe(3);
    expect(imap.connections).toBe(2);
    await r.dispose();
  });

  test('contacts : expéditeurs connus, sans soi-même', async () => {
    const r = make();
    const c = await r.contacts();
    expect(c.map((x) => x.email)).toEqual(['equipe@freda.com', 'marie@atelier.ht', 'zoe@x.fr']);
    await r.dispose();
  });
});
