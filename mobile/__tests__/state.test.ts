import { FredaApi } from '../src/data/api';
import { DemoRepository } from '../src/data/demo';
import { MemorySessionStore } from '../src/data/sessions';
import { services } from '../src/services';
import { useAuth } from '../src/state/auth';
import { useInbox, scheduleSend, openMessage } from '../src/state/mail';
import { useLock } from '../src/state/lock';
import { usePhotos } from '../src/state/photos';
import { useToast } from '../src/state/toast';

const NOW = new Date(2026, 10, 4, 12);
let clock = NOW;
let calls: string[] = [];
let photoOwners = new Set<string>();

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const fakeFetch = (async (url: string, init: RequestInit = {}) => {
  const path = new URL(url).pathname.replace('/api', '');
  calls.push(`${init.method ?? 'GET'} ${path}`);
  const body = init.body && typeof init.body === 'string' ? JSON.parse(init.body) : {};
  if (path === '/mail/login') {
    if (body.password === 'mauvais') return json({ message: 'Adresse ou mot de passe incorrect.' }, 401);
    return json({ mailbox: { address: body.email, name: 'Moi' }, token: 'tok-' + body.email, imap: { host: 'h', port: 993, security: 'ssl' }, smtp: { host: 'h', port: 465, security: 'ssl' } });
  }
  expect((init.headers as any).Authorization).toMatch(/^Bearer tok-/);
  if (path === '/mail/photos') return json({ photos: Object.fromEntries((body.addresses as string[]).filter((a) => photoOwners.has(a)).map((a) => [a, 'v1'])) });
  if (path === '/mail/photo' && init.method === 'PUT') return json({ version: 'v9' });
  if (path === '/mail/photo' && init.method === 'DELETE') return json({ ok: true });
  return json({}, 404);
}) as unknown as typeof fetch;

const blank = { status: 'restoring' as const, repo: null, isDemo: false, token: null, accounts: [], address: '' };
beforeEach(() => {
  calls = []; photoOwners = new Set(); clock = NOW;
  services.sessions = new MemorySessionStore();
  services.api = new FredaApi('https://api.test/api', fakeFetch);
  services.clock = () => clock;
  services.demoLatencyMs = 0;
  services.repoFactory = async (s) => new DemoRepository(() => clock, 0, s.address);
  useAuth.setState(blank);
  useInbox.getState().reset();
  usePhotos.getState().reset();
  useToast.getState().hide();
  useLock.setState({ loaded: false, enabled: false, locked: false, message: null, pausedAt: null });
});

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('comptes multiples', () => {
  test('connexion refusée : message du serveur, rien d\'enregistré', async () => {
    await expect(useAuth.getState().login('a@neuf.com', 'mauvais')).rejects.toThrow('incorrect');
    expect(await services.sessions.accounts()).toEqual([]);
  });

  test('ajouter, changer, retirer ; déconnexion = retirer le compte actif', async () => {
    const a = useAuth.getState();
    await a.login('Machann@Neuf.com', 'pw1');
    expect(useAuth.getState()).toMatchObject({ status: 'signedIn', address: 'Machann@Neuf.com'.toLowerCase(), accounts: ['machann@neuf.com'] });
    await a.addAccount('love@neuf.com', 'pw2');
    expect(useAuth.getState().address).toBe('love@neuf.com');
    expect(useAuth.getState().accounts).toEqual(['machann@neuf.com', 'love@neuf.com']);
    await a.switchTo('machann@neuf.com');
    expect(useAuth.getState().address).toBe('machann@neuf.com');
    expect(await services.sessions.active()).toBe('machann@neuf.com');
    await a.logout();
    expect(useAuth.getState()).toMatchObject({ status: 'signedIn', address: 'love@neuf.com', accounts: ['love@neuf.com'] });
    await a.logout();
    expect(useAuth.getState().status).toBe('signedOut');
  });

  test('démarrage : reprend le compte actif, sinon un autre si ses identifiants sont périmés', async () => {
    await services.sessions.save('a@neuf.com', 'pw');
    await services.sessions.save('b@neuf.com', 'mauvais'); // actif mais périmé
    await useAuth.getState().restore();
    expect(useAuth.getState()).toMatchObject({ status: 'signedIn', address: 'a@neuf.com' });
    useAuth.setState(blank);
    await services.sessions.clear();
    await useAuth.getState().restore();
    expect(useAuth.getState().status).toBe('signedOut');
  });
});

describe('verrouillage biométrique', () => {
  const gate = (o: { available?: boolean; result?: boolean } = {}) => {
    const g = { available: o.available ?? true, result: o.result ?? true, prompts: 0 };
    services.biometric = { available: async () => g.available, authenticate: async () => { g.prompts++; return g.result; } };
    return g;
  };
  let stored = false;
  beforeEach(() => { stored = false; services.settings = { lockEnabled: async () => stored, setLockEnabled: async (v) => { stored = v; } }; });

  test('option active : démarrage verrouillé ; échec puis réussite', async () => {
    stored = true; const g = gate({ result: false });
    await useLock.getState().load();
    expect(useLock.getState()).toMatchObject({ loaded: true, enabled: true, locked: true });
    expect(await useLock.getState().unlock()).toBe(false);
    expect(useLock.getState().message).toContain('Réessayez');
    g.result = true;
    expect(await useLock.getState().unlock()).toBe(true);
    expect(useLock.getState()).toMatchObject({ locked: false, message: null });
  });

  test('sans option : jamais verrouillé', async () => {
    const g = gate(); await useLock.getState().load();
    expect(useLock.getState().locked).toBe(false);
    useLock.getState().onBackground(); clock = new Date(NOW.getTime() + 3600_000); useLock.getState().onForeground();
    expect(useLock.getState().locked).toBe(false);
    expect(g.prompts).toBe(0);
  });

  test('activer / désactiver exigent une vérification réussie', async () => {
    const g = gate({ available: false });
    expect(await useLock.getState().enable()).toContain('Aucune biométrie');
    g.available = true; g.result = false;
    expect(await useLock.getState().enable()).toContain('annulé');
    expect(stored).toBe(false);
    g.result = true;
    expect(await useLock.getState().enable()).toBeNull(); expect(stored).toBe(true);
    g.result = false;
    expect(await useLock.getState().disable()).toContain('reste actif'); expect(stored).toBe(true);
    g.result = true;
    expect(await useLock.getState().disable()).toBeNull(); expect(stored).toBe(false);
  });

  test('retour d\'arrière-plan : verrouille seulement après 30 s', async () => {
    gate(); await useLock.getState().enable();
    useLock.getState().onBackground(); clock = new Date(NOW.getTime() + 10_000); useLock.getState().onForeground();
    expect(useLock.getState().locked).toBe(false);
    useLock.getState().onBackground(); clock = new Date(clock.getTime() + 31_000); useLock.getState().onForeground();
    expect(useLock.getState().locked).toBe(true);
  });
});

describe('photos de profil', () => {
  test('demandes groupées en un appel, seules les adresses avec photo reçoivent une version', async () => {
    photoOwners = new Set(['jb.pierre@gmail.com']);
    await useAuth.getState().login('moi@neuf.com', 'pw');
    calls = [];
    const p = usePhotos.getState();
    p.want('jb.pierre@gmail.com'); p.want('JB.Pierre@gmail.com'); p.want('autre@x.fr'); p.want('pas-une-adresse');
    await tick(); await tick();
    expect(calls).toEqual(['POST /mail/photos']);
    expect(usePhotos.getState().versions).toEqual({ 'jb.pierre@gmail.com': 'v1' });
    p.want('jb.pierre@gmail.com'); await tick();
    expect(calls.length).toBe(1);
  });

  test('démo : aucune requête', async () => {
    useAuth.getState().startDemo();
    usePhotos.getState().want('a@b.co'); await tick(); await tick();
    expect(calls).toEqual([]);
  });

  test('ma photo : envoi, affichage immédiat, suppression ; changement de compte = cache vidé', async () => {
    await useAuth.getState().login('moi@neuf.com', 'pw');
    await usePhotos.getState().setMine(new Uint8Array([1, 2, 3]) as unknown as Blob);
    expect(usePhotos.getState().versions['moi@neuf.com']).toBe('v9');
    await usePhotos.getState().removeMine();
    expect(usePhotos.getState().versions['moi@neuf.com']).toBeUndefined();
    await usePhotos.getState().setMine(new Uint8Array([1]) as unknown as Blob);
    await useAuth.getState().addAccount('autre@neuf.com', 'pw');
    expect(usePhotos.getState().versions).toEqual({});
  });
});

describe('boîte de réception et envoi', () => {
  test('chargement, filtres, archivage avec annulation, lecture marque lu', async () => {
    useAuth.getState().startDemo();
    await tick(); await tick();
    const s = () => useInbox.getState();
    expect(s().messages.length).toBeGreaterThan(5);
    s().setFilter('unread');
    const unread = s().messages.filter((m) => !m.isRead).length;
    expect(unread).toBeGreaterThan(0);
    const m = s().messages[0];
    const undo = await s().moveAway(m, { delete: false });
    expect(s().messages.some((x) => x.id === m.id)).toBe(false);
    await undo!();
    expect(s().messages.some((x) => x.subject === m.subject)).toBe(true);
    const opened = s().messages.find((x) => !x.isRead)!;
    await openMessage(opened.folderId, opened.id);
    expect(s().messages.find((x) => x.id === opened.id)!.isRead).toBe(true);
    await s().selectFolder('trash');
    const t = s().messages[0];
    expect(await s().moveAway(t, { delete: true })).toBeNull();
  });

  test('envoi annulable : annuler rouvre le brouillon ; sinon envoyé après le délai', async () => {
    useAuth.getState().startDemo();
    const msg = { to: [{ email: 'a@b.co' }], subject: 'Salut', body: 'x' };
    let reopened = 0;
    scheduleSend(msg, () => { reopened++; }, 20);
    expect(useToast.getState().toast!.text).toBe('Envoi en cours…');
    useToast.getState().toast!.action!.run();
    await new Promise((r) => setTimeout(r, 40));
    expect(reopened).toBe(1);
    expect((await useAuth.getState().repo!.messages('sent')).some((m) => m.subject === 'Salut')).toBe(false);
    scheduleSend(msg, () => { reopened++; }, 10);
    await new Promise((r) => setTimeout(r, 40));
    expect((await useAuth.getState().repo!.messages('sent')).some((m) => m.subject === 'Salut')).toBe(true);
    expect(useToast.getState().toast!.text).toBe('Message envoyé ✓');
  });
});
