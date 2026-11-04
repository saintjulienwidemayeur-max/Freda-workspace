import { create } from 'zustand';
import { FolderKind, MailError, MailFolder, MailMessage, MailRepository, OutgoingMessage } from '../data/models';
import { useAuth } from './auth';
import { useToast } from './toast';

export type MailFilter = 'all' | 'unread' | 'attachments' | 'starred';
const PAGE = 50;

interface InboxState {
  folders: MailFolder[]; folderId: string; messages: MailMessage[]; loading: boolean; error: string | null;
  query: string; filter: MailFilter; limit: number; canLoadMore: boolean;
  reload(): Promise<void>;
  selectFolder(id: string): Promise<void>;
  setQuery(q: string): Promise<void>;
  setFilter(f: MailFilter): void;
  loadMore(): Promise<void>;
  moveAway(m: MailMessage, o: { delete: boolean }): Promise<(() => Promise<void>) | null>;
  toggleRead(m: MailMessage): Promise<void>;
  toggleStar(m: MailMessage): Promise<void>;
  markReadLocal(id: string): void;
  reset(): void;
}

const repo = (): MailRepository | null => useAuth.getState().repo;
let gen = 0; // ignore les réponses d'une requête devenue obsolète

export const visible = (s: Pick<InboxState, 'messages' | 'filter'>) => s.messages.filter((m) => (s.filter === 'unread' ? !m.isRead : s.filter === 'attachments' ? m.attachments.length > 0 : s.filter === 'starred' ? m.isStarred : true));
export const kindOf = (s: Pick<InboxState, 'folders' | 'folderId'>): FolderKind => s.folders.find((f) => f.id === s.folderId)?.kind ?? 'inbox';

const initial = { folders: [] as MailFolder[], folderId: 'inbox', messages: [] as MailMessage[], loading: true, error: null as string | null, query: '', filter: 'all' as MailFilter, limit: PAGE, canLoadMore: false };

export const useInbox = create<InboxState>((set, get) => ({
  ...initial,

  async reload() {
    const r = repo();
    if (!r) return;
    const g = ++gen;
    set((s) => ({ loading: s.messages.length === 0, error: null }));
    try {
      const folders = await r.folders();
      const cur = get().folderId;
      const id = folders.some((f) => f.id === cur) ? cur : folders[0]?.id ?? cur;
      const { query, limit } = get();
      const msgs = await r.messages(id, query, limit);
      if (g !== gen) return;
      set({ folders, folderId: id, messages: msgs, loading: false, error: null, canLoadMore: !query && msgs.length >= limit });
    } catch (e) {
      if (g !== gen) return;
      set({ loading: false, error: e instanceof MailError ? e.message : 'Impossible de charger le courrier. Tirez pour réessayer.' });
    }
  },

  async selectFolder(id) { set({ folderId: id, messages: [], loading: true, filter: 'all', limit: PAGE }); await get().reload(); },
  async setQuery(q) { set({ query: q, limit: PAGE }); await get().reload(); },
  setFilter: (filter) => set({ filter }),
  async loadMore() { if (!get().canLoadMore || get().loading) return; set((s) => ({ limit: s.limit + PAGE })); await get().reload(); },

  /** Archive ou supprime avec mise à jour immédiate. Renvoie la fonction d'annulation, ou null si l'action est définitive. */
  async moveAway(m, { delete: del }) {
    const r = repo()!;
    const from = m.folderId;
    const fromKind = kindOf(get());
    const before = get().messages;
    set({ messages: before.filter((x) => x.id !== m.id) });
    try { if (del) await r.remove(from, m.id); else await r.move(from, m.id, 'archive'); }
    catch (e) { set({ messages: before }); throw e; }
    refreshFolders();
    if (del && fromKind === 'trash') return null;
    return async () => {
      // L'annulation remet le message dans son dossier d'origine (l'identifiant IMAP change après un déplacement).
      const moved = await findIn(r, del ? 'trash' : 'archive', m);
      if (moved) await r.move(moved.folderId, moved.id, fromKind);
      await get().reload();
    };
  },

  async toggleRead(m) {
    const next = !m.isRead;
    patch(m.id, { isRead: next });
    try { await repo()!.setRead(m.folderId, m.id, next); } catch { patch(m.id, { isRead: !next }); }
    refreshFolders();
  },
  async toggleStar(m) {
    const next = !m.isStarred;
    patch(m.id, { isStarred: next });
    try { await repo()!.setStarred(m.folderId, m.id, next); } catch { patch(m.id, { isStarred: !next }); }
  },
  markReadLocal: (id) => patch(id, { isRead: true }),
  reset() { gen++; set({ ...initial }); },
}));

const patch = (id: string, p: Partial<MailMessage>) => useInbox.setState((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...p } : m)) }));

async function refreshFolders() {
  try { const folders = await repo()!.folders(); useInbox.setState({ folders }); } catch { /* la liste se rafraîchira à la prochaine ouverture */ }
}

async function findIn(r: MailRepository, kind: FolderKind, o: MailMessage): Promise<MailMessage | null> {
  const target = (await r.folders()).find((f) => f.kind === kind);
  if (!target) return null;
  const list = await r.messages(target.id);
  return list.find((c) => c.subject === o.subject && c.date.getTime() === o.date.getTime() && c.from.email === o.from.email) ?? null;
}

// Nouveau compte actif (ou déconnexion) : boîte vide, puis chargement.
useAuth.subscribe((s, prev) => {
  if (s.repo === prev.repo) return;
  useInbox.getState().reset();
  if (s.repo) queueMicrotask(() => useInbox.getState().reload());
});

/** Message complet ; le marque « lu » (côté serveur et dans la liste). */
export async function openMessage(folderId: string, id: string): Promise<MailMessage> {
  const r = repo();
  if (!r) throw new MailError('Session expirée.');
  const m = await r.message(folderId, id);
  if (!m.isRead) {
    try { await r.setRead(folderId, id, true); useInbox.getState().markReadLocal(id); } catch { /* sans gravité */ }
  }
  return m;
}

export const UNDO_MS = 6000;

/** Envoi annulable : tant que le délai court, « Annuler » rouvre le brouillon (via onUndo). */
export function scheduleSend(msg: OutgoingMessage, onUndo: (m: OutgoingMessage) => void, windowMs = UNDO_MS): void {
  const r = repo();
  if (!r) return;
  const toast = useToast.getState();
  let cancelled = false;
  const timer = setTimeout(async () => {
    if (cancelled) return;
    try {
      await r.send(msg);
      useToast.getState().show('Message envoyé ✓', { ms: 2000 });
      useInbox.getState().reload();
    } catch (e) {
      useToast.getState().show(e instanceof MailError ? e.message : "L'envoi a échoué. Votre message n'est pas perdu.", { ms: 10000, action: { label: 'Rouvrir', run: () => onUndo(msg) } });
    }
  }, windowMs);
  toast.show('Envoi en cours…', { ms: windowMs, action: { label: 'Annuler', run: () => { cancelled = true; clearTimeout(timer); onUndo(msg); } } });
}
