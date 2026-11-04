import { create } from 'zustand';
import { services } from '../services';

export const GRACE_MS = 30_000;

interface LockState {
  loaded: boolean; enabled: boolean; locked: boolean; message: string | null; pausedAt: number | null;
  load(): Promise<void>;
  unlock(): Promise<boolean>;
  enable(): Promise<string | null>;
  disable(): Promise<string | null>;
  markUnlocked(): void;
  onBackground(): void;
  onForeground(): void;
}

/** Verrouillage biométrique : démarrage à froid verrouillé si l'option est active ; retour après 30 s en arrière-plan = verrouillé. */
export const useLock = create<LockState>((set, get) => ({
  loaded: false, enabled: false, locked: false, message: null, pausedAt: null,

  async load() {
    const on = await services.settings.lockEnabled();
    set({ loaded: true, enabled: on, locked: on });
  },
  async unlock() {
    const ok = await services.biometric.authenticate('Déverrouiller Freda Mail');
    set(ok ? { locked: false, message: null } : { message: 'Vérification échouée. Réessayez.' });
    return ok;
  },
  /** On vérifie d'abord que l'identification fonctionne vraiment (sinon l'utilisateur pourrait se bloquer dehors). */
  async enable() {
    if (!(await services.biometric.available())) return "Aucune biométrie ni code n'est configuré sur ce téléphone. Activez-en un dans les réglages du téléphone.";
    if (!(await services.biometric.authenticate('Activer le verrouillage de Freda Mail'))) return "Vérification annulée : le verrouillage n'a pas été activé.";
    await services.settings.setLockEnabled(true);
    set({ enabled: true, locked: false, message: null });
    return null;
  },
  /** Désactiver demande aussi une vérification (quelqu'un qui emprunte le téléphone déverrouillé ne peut pas l'enlever). */
  async disable() {
    if (!(await services.biometric.authenticate('Désactiver le verrouillage de Freda Mail'))) return 'Vérification annulée : le verrouillage reste actif.';
    await services.settings.setLockEnabled(false);
    set({ enabled: false, locked: false, message: null });
    return null;
  },
  markUnlocked: () => set({ locked: false, message: null }),
  onBackground: () => set({ pausedAt: services.clock().getTime() }),
  onForeground() {
    const { pausedAt, enabled } = get();
    set({ pausedAt: null });
    if (!enabled || pausedAt === null) return;
    if (services.clock().getTime() - pausedAt >= GRACE_MS) set({ locked: true });
  },
}));
