import { create } from 'zustand';
import { DemoRepository } from '../data/demo';
import { MailError, MailRepository } from '../data/models';
import { services } from '../services';

interface AuthState {
  status: 'restoring' | 'signedOut' | 'signedIn';
  repo: MailRepository | null;
  isDemo: boolean;
  /** Jeton de session de la boîte (photos de profil). Absent en démo. */
  token: string | null;
  /** Adresses de tous les comptes enregistrés sur cet appareil (le compte actif y figure). */
  accounts: string[];
  address: string;
  restore(): Promise<void>;
  login(address: string, password: string, remember?: boolean): Promise<void>;
  addAccount(address: string, password: string): Promise<void>;
  switchTo(address: string): Promise<void>;
  removeAccount(address: string): Promise<void>;
  startDemo(): void;
  logout(): Promise<void>;
}

const addresses = async () => (await services.sessions.accounts()).map((a) => a.address);
const dispose = (r: MailRepository | null) => { r?.dispose().catch(() => undefined); };

export const useAuth = create<AuthState>((set, get) => ({
  status: 'restoring', repo: null, isDemo: false, token: null, accounts: [], address: '',

  async restore() {
    const all = await services.sessions.accounts();
    if (!all.length) { set({ status: 'signedOut' }); return; }
    const active = await services.sessions.active();
    // Le compte actif d'abord ; si ses identifiants sont périmés, on essaie les autres avant de renoncer.
    const order = [...all.filter((a) => a.address === active), ...all.filter((a) => a.address !== active)];
    for (const a of order) {
      try { await get().login(a.address, a.password, false); await services.sessions.setActive(a.address); return; } catch { /* identifiants périmés ou hors ligne : compte suivant */ }
    }
    set({ status: 'signedOut' });
  },

  /** Connexion à une vraie boîte : l'API Freda vérifie les identifiants et donne les serveurs, puis IMAP. */
  async login(address, password, remember = true) {
    const session = await services.api.login(address, password);
    const repo = await services.repoFactory(session, password, services.connector);
    if (remember) await services.sessions.save(session.address, password);
    const old = get().repo;
    set({ status: 'signedIn', repo, isDemo: false, token: session.token || null, accounts: await addresses(), address: repo.account.address });
    dispose(old);
  },

  addAccount: (address, password) => get().login(address, password),

  async switchTo(address) {
    const s = get();
    if (s.status !== 'signedIn' || s.address.toLowerCase() === address.toLowerCase()) return;
    const target = (await services.sessions.accounts()).find((a) => a.address === address.toLowerCase());
    if (!target) throw new MailError("Ce compte n'est plus enregistré sur cet appareil.");
    await get().login(target.address, target.password, false);
    await services.sessions.setActive(target.address);
  },

  /** Retire un compte de l'appareil. Si c'est le compte actif, on passe à un autre, ou on revient à la connexion s'il n'y en a plus. */
  async removeAccount(address) {
    const s = get();
    await services.sessions.remove(address);
    const rest = await addresses();
    const wasActive = s.status === 'signedIn' && s.address.toLowerCase() === address.toLowerCase();
    if (wasActive) {
      const old = s.repo;
      if (!rest.length) { set({ status: 'signedOut', repo: null, token: null, accounts: [], address: '' }); dispose(old); return; }
      try {
        const t = (await services.sessions.accounts()).find((a) => a.address === rest[0])!;
        await get().login(t.address, t.password, false);
        await services.sessions.setActive(t.address);
      } catch { set({ status: 'signedOut', repo: null, token: null, accounts: [], address: '' }); dispose(old); }
    } else if (s.status === 'signedIn') set({ accounts: rest });
  },

  startDemo() {
    const repo = new DemoRepository(services.clock, services.demoLatencyMs);
    set({ status: 'signedIn', repo, isDemo: true, token: null, accounts: [], address: repo.account.address });
  },

  /** Se déconnecter = retirer le compte actif de l'appareil (les autres comptes restent). */
  async logout() {
    const s = get();
    if (s.status === 'signedIn' && !s.isDemo) { await get().removeAccount(s.address); return; }
    await services.sessions.clear();
    const old = s.repo;
    set({ status: 'signedOut', repo: null, isDemo: false, token: null, accounts: [], address: '' });
    dispose(old);
  },
}));
