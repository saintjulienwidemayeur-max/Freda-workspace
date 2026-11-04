import { create } from 'zustand';
import { MailError } from '../data/models';
import { services } from '../services';
import { useAuth } from './auth';

/**
 * Photos de profil des utilisateurs de Freda Mail : chaque adresse affichée est demandée au serveur Freda (jamais à un tiers), par lots ;
 * seules celles qui ont une photo reçoivent une version, les autres gardent leurs initiales. Les images sont mises en cache sur le disque (expo-image).
 */
interface PhotoState {
  versions: Record<string, string>;
  want(email: string): void;
  setMine(blob: Blob): Promise<void>;
  removeMine(): Promise<void>;
  reset(): void;
}

let asked = new Set<string>();
let queue = new Set<string>();
let scheduled = false;

export const usePhotos = create<PhotoState>((set, get) => ({
  versions: {},

  want(email) {
    const a = useAuth.getState();
    const addr = email.trim().toLowerCase();
    if (a.status !== 'signedIn' || a.isDemo || !a.token || !addr.includes('@') || asked.has(addr)) return;
    asked.add(addr); queue.add(addr);
    if (!scheduled) { scheduled = true; queueMicrotask(flush); }
  },

  async setMine(blob) {
    const a = useAuth.getState();
    if (a.status !== 'signedIn' || a.isDemo || !a.token) throw new MailError("La photo de profil n'est pas disponible en démo.");
    const version = await services.api.uploadPhoto(a.token, blob);
    set((s) => ({ versions: { ...s.versions, [a.address.toLowerCase()]: version || String(Date.now()) } }));
  },

  async removeMine() {
    const a = useAuth.getState();
    if (a.status !== 'signedIn' || !a.token) return;
    await services.api.deletePhoto(a.token);
    set((s) => { const v = { ...s.versions }; delete v[a.address.toLowerCase()]; return { versions: v }; });
  },

  reset() { asked = new Set(); queue = new Set(); scheduled = false; set({ versions: {} }); },
}));

async function flush() {
  scheduled = false;
  const a = useAuth.getState();
  if (!a.token || !queue.size) return;
  const batch = [...queue].slice(0, 50);
  batch.forEach((x) => queue.delete(x));
  if (queue.size) { scheduled = true; queueMicrotask(flush); }
  const found = await services.api.photoLookup(a.token, batch);
  if (Object.keys(found).length && useAuth.getState().address === a.address) usePhotos.setState((s) => ({ versions: { ...s.versions, ...found } }));
}

// Nouveau compte actif = nouvelle session : on repart de zéro.
useAuth.subscribe((s, prev) => { if (s.address !== prev.address) usePhotos.getState().reset(); });
