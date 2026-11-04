/** Modèles de l'application (indépendants du protocole : IMAP, démo, tests). */

export interface MailAddress { email: string; name?: string }

export const displayOf = (a: MailAddress): string => (a.name && a.name.trim() ? a.name.trim() : a.email.split('@')[0]);

export type FolderKind = 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash' | 'other';

export interface MailFolder { id: string; name: string; kind: FolderKind; unread: number }

export interface Attachment { name: string; size: number; mime: string }

export interface MailMessage {
  id: string;
  folderId: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;
  date: Date;
  snippet: string;
  bodyText: string;
  bodyHtml?: string;
  isRead: boolean;
  isStarred: boolean;
  attachments: Attachment[];
}

export interface OutgoingMessage {
  to: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
  subject: string;
  body: string;
  inReplyTo?: string;
}

export interface Account { address: string; displayName: string }

export class MailError extends Error {
  constructor(message: string) { super(message); this.name = 'MailError'; }
}

/** Source de courrier : IMAP/SMTP réel ou démonstration. */
export interface MailRepository {
  readonly account: Account;
  folders(): Promise<MailFolder[]>;
  /** Messages d'un dossier, du plus récent au plus ancien. `query` filtre expéditeur, objet, extrait. */
  messages(folderId: string, query?: string, limit?: number): Promise<MailMessage[]>;
  message(folderId: string, id: string): Promise<MailMessage>;
  setRead(folderId: string, id: string, read: boolean): Promise<void>;
  setStarred(folderId: string, id: string, starred: boolean): Promise<void>;
  move(folderId: string, id: string, to: FolderKind): Promise<void>;
  /** Corbeille, ou suppression définitive si déjà dans la corbeille. */
  remove(folderId: string, id: string): Promise<void>;
  send(message: OutgoingMessage): Promise<void>;
  contacts(): Promise<MailAddress[]>;
  dispose(): Promise<void>;
}
