import { FredaApi, MailSession } from './data/api';
import { tcpConnector } from './data/imap/transport';
import { ImapRepository } from './data/imap/repo';
import { Connector } from './data/imap/transport';
import { MailRepository } from './data/models';
import { SecureSessionStore, SessionStore } from './data/sessions';

export interface BiometricGate {
  /** Le téléphone sait-il vérifier une identité (biométrie ou code configuré) ? */
  available(): Promise<boolean>;
  authenticate(reason: string): Promise<boolean>;
}
export interface SettingsStore { lockEnabled(): Promise<boolean>; setLockEnabled(v: boolean): Promise<void> }
export interface PhotoPicker { pick(camera: boolean): Promise<Blob | null> }
export type RepoFactory = (session: MailSession, password: string, connector: Connector) => Promise<MailRepository>;

/** L'application ne lit JAMAIS de donnée biométrique : le système répond seulement oui ou non. */
export const localAuthGate: BiometricGate = {
  async available() { // biométrie OU code d'appareil configuré
    try { const L = require('expo-local-authentication'); return (await L.getEnrolledLevelAsync()) > 0; } catch { return false; }
  },
  async authenticate(reason) {
    try { const L = require('expo-local-authentication'); const r = await L.authenticateAsync({ promptMessage: reason, cancelLabel: 'Annuler', fallbackLabel: 'Utiliser le code' }); return !!r.success; } catch { return false; }
  },
};

export const asyncSettings: SettingsStore = {
  async lockEnabled() { try { return (await require('@react-native-async-storage/async-storage').default.getItem('lock_enabled')) === '1'; } catch { return false; } },
  async setLockEnabled(v) { await require('@react-native-async-storage/async-storage').default.setItem('lock_enabled', v ? '1' : '0'); },
};

export const imapFactory: RepoFactory = async (s, password, connector) => {
  const repo = new ImapRepository({ account: { address: s.address, displayName: s.name || s.address.split('@')[0] }, imap: s.imap, smtp: s.smtp, password, connector });
  await repo.open(); // vérifie la connexion IMAP avant d'entrer
  return repo;
};

/** Dépendances remplaçables (tests). */
export const services = {
  api: new FredaApi(),
  connector: tcpConnector as Connector,
  sessions: new SecureSessionStore() as SessionStore,
  settings: asyncSettings,
  biometric: localAuthGate as BiometricGate,
  picker: null as PhotoPicker | null,
  repoFactory: imapFactory,
  clock: () => new Date(),
  demoLatencyMs: 450,
};
