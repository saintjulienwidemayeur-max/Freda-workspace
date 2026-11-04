import { Account, Attachment, FolderKind, MailAddress, MailError, MailFolder, MailMessage, MailRepository, OutgoingMessage, displayOf } from './models';

const FOLDERS: Omit<MailFolder, 'unread'>[] = [
  { id: 'inbox', name: 'Boîte de réception', kind: 'inbox' },
  { id: 'sent', name: 'Envoyés', kind: 'sent' },
  { id: 'drafts', name: 'Brouillons', kind: 'drafts' },
  { id: 'archive', name: 'Archives', kind: 'archive' },
  { id: 'spam', name: 'Courrier indésirable', kind: 'spam' },
  { id: 'trash', name: 'Corbeille', kind: 'trash' },
];

export const DEMO_ADDRESS = 'demo@fredaworkspace.com';

/** Courrier de démonstration en mémoire : essai sans compte et tests. */
export class DemoRepository implements MailRepository {
  private byFolder: Record<string, MailMessage[]> = {};
  private seq = 100;
  constructor(private clock: () => Date = () => new Date(), private latencyMs = 450, readonly address = DEMO_ADDRESS) { this.seed(); }

  get account(): Account {
    return { address: this.address, displayName: this.address === DEMO_ADDRESS ? 'Compte de démonstration' : this.address.split('@')[0] };
  }
  private wait = () => (this.latencyMs ? new Promise<void>((r) => setTimeout(r, this.latencyMs)) : Promise.resolve());

  async folders(): Promise<MailFolder[]> {
    await this.wait();
    return FOLDERS.map((f) => ({ ...f, unread: (this.byFolder[f.id] ?? []).filter((m) => !m.isRead).length }));
  }
  async messages(folderId: string, query?: string, limit = 1000): Promise<MailMessage[]> {
    await this.wait();
    const q = (query ?? '').trim().toLowerCase();
    let list = [...(this.byFolder[folderId] ?? [])];
    if (q) list = list.filter((m) => `${displayOf(m.from)} ${m.from.email} ${m.subject} ${m.snippet}`.toLowerCase().includes(q));
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  async message(folderId: string, id: string): Promise<MailMessage> { await this.wait(); return this.find(folderId, id); }
  private find(folderId: string, id: string): MailMessage {
    const m = (this.byFolder[folderId] ?? []).find((x) => x.id === id);
    if (!m) throw new MailError('Message introuvable.');
    return m;
  }
  private patch(folderId: string, id: string, p: Partial<MailMessage>) {
    const list = this.byFolder[folderId] ?? [];
    const i = list.findIndex((m) => m.id === id);
    if (i >= 0) list[i] = { ...list[i], ...p };
  }
  async setRead(f: string, id: string, isRead: boolean) { this.patch(f, id, { isRead }); }
  async setStarred(f: string, id: string, isStarred: boolean) { this.patch(f, id, { isStarred }); }
  private idOf = (k: FolderKind) => FOLDERS.find((f) => f.kind === k)!.id;
  async move(folderId: string, id: string, to: FolderKind) {
    const m = this.find(folderId, id);
    this.byFolder[folderId] = this.byFolder[folderId].filter((x) => x.id !== id);
    const dest = this.idOf(to);
    (this.byFolder[dest] ??= []).push({ ...m, folderId: dest });
  }
  async remove(folderId: string, id: string) {
    if (folderId === 'trash') this.byFolder[folderId] = (this.byFolder[folderId] ?? []).filter((m) => m.id !== id);
    else await this.move(folderId, id, 'trash');
  }
  async send(m: OutgoingMessage) {
    await this.wait();
    (this.byFolder.sent ??= []).push({
      id: `s${this.seq++}`, folderId: 'sent', from: { email: this.address, name: 'Moi' }, to: m.to, cc: m.cc ?? [],
      subject: m.subject || '(sans objet)', date: this.clock(), snippet: m.body.replace(/\n/g, ' ').trim(), bodyText: m.body,
      isRead: true, isStarred: false, attachments: [],
    });
  }
  async contacts(): Promise<MailAddress[]> {
    const seen = new Map<string, MailAddress>();
    for (const list of Object.values(this.byFolder)) for (const m of list) if (m.from.email !== this.address) seen.set(m.from.email.toLowerCase(), m.from);
    return [...seen.values()].sort((a, b) => displayOf(a).toLowerCase().localeCompare(displayOf(b).toLowerCase()));
  }
  async dispose() {}

  private seed() {
    const now = this.clock();
    const ago = (o: { d?: number; h?: number; m?: number }) => new Date(now.getTime() - ((o.d ?? 0) * 1440 + (o.h ?? 0) * 60 + (o.m ?? 0)) * 60000);
    const me: MailAddress = { email: this.address, name: 'Moi' };
    let n = 0;
    const file = (name: string, size: number, mime: string): Attachment => ({ name, size, mime });
    const mk = (folder: string, from: MailAddress, subject: string, body: string, o: { date: Date; read?: boolean; star?: boolean; html?: string; files?: Attachment[]; to?: MailAddress[]; cc?: MailAddress[] }): MailMessage => {
      const plain = body.replace(/\n/g, ' ').trim();
      return { id: `m${n++}`, folderId: folder, from, to: o.to ?? [me], cc: o.cc ?? [], subject, date: o.date, snippet: plain.length > 140 ? `${plain.slice(0, 140)}…` : plain, bodyText: body, bodyHtml: o.html, isRead: !!o.read, isStarred: !!o.star, attachments: o.files ?? [] };
    };
    const marie = { email: 'marieclaire.joseph@atelier-joseph.ht', name: 'Marie-Claire Joseph' };
    const jb = { email: 'jb.pierre@gmail.com', name: 'Jean-Baptiste Pierre' };
    const freda = { email: 'equipe@fredaworkspace.com', name: 'Équipe Freda Workspace' };
    const stripe = { email: 'receipts@stripe.com', name: 'Stripe' };
    const namesilo = { email: 'support@namesilo.com', name: 'NameSilo' };
    const nadege = { email: 'nadege.fleury@outlook.com', name: 'Nadège Fleury' };
    const google = { email: 'no-reply@accounts.google.com', name: 'Google' };
    const samuel = { email: 'samuel.etienne@boutique-etienne.com', name: 'Samuel Étienne' };
    const linda = { email: 'linda.desir@hotmail.com', name: 'Linda Désir' };
    const banque = { email: 'releves@unibank.ht', name: 'Unibank' };

    this.byFolder.inbox = [
      mk('inbox', marie, 'Devis pour la rénovation de la boutique', 'Bonjour,\n\nComme convenu, veuillez trouver ci-joint le devis détaillé pour la rénovation de la boutique de Pétion-Ville (peinture, éclairage et mobilier de caisse).\n\nLe délai estimé est de trois semaines à partir de la validation. Dites-moi si vous souhaitez ajuster certains postes avant jeudi.\n\nCordialement,\nMarie-Claire', { date: ago({ m: 35 }), files: [file('Devis-renovation-boutique.pdf', 482113, 'application/pdf')] }),
      mk('inbox', freda, 'Bienvenue sur Freda Mail', 'Bienvenue ! Votre boîte professionnelle est prête. Découvrez comment tirer le meilleur de Freda Mail.', { date: ago({ h: 1, m: 10 }), html: '<div style="font-family:sans-serif"><h2>Bienvenue sur Freda Mail 👋</h2><p>Votre boîte professionnelle est prête. Voici trois astuces pour bien démarrer :</p><ul><li><b>Balayez</b> un message vers la droite pour l\'archiver, vers la gauche pour le supprimer.</li><li><b>Annulez l\'envoi</b> pendant quelques secondes si vous vous êtes trompé.</li><li>Les <b>images distantes sont bloquées</b> par défaut : personne ne sait que vous avez lu ce message.</li></ul><img src="https://fredaworkspace.com/assets/img/tracker.png" width="1" height="1"><p><a href="https://fredaworkspace.com">Ouvrir mon espace Freda</a></p></div>' }),
      mk('inbox', jb, 'Réunion de jeudi : ordre du jour', "Salut,\n\nVoici l'ordre du jour de jeudi :\n1. Point sur les ventes de novembre\n2. Lancement de la nouvelle offre\n3. Questions diverses\n\nPeux-tu préparer deux slides sur les chiffres ? Merci !\n\nJB", { date: ago({ h: 3 }), cc: [marie] }),
      mk('inbox', samuel, 'Re: Livraison de mardi', "C'est bon pour mardi matin, le camion sera devant la boutique vers 9 h. Peux-tu confirmer qu'il y aura quelqu'un pour réceptionner ?", { date: ago({ h: 6 }) }),
      mk('inbox', stripe, 'Votre reçu de paiement #1042', "Merci pour votre paiement de 9,99 $ pour l'offre Business. Votre reçu est disponible dans votre espace.", { date: ago({ d: 1, h: 2 }), read: true, files: [file('recu-1042.pdf', 31820, 'application/pdf')] }),
      mk('inbox', namesilo, 'Votre domaine fredaworkspace.com expire dans 30 jours', 'Le renouvellement de votre domaine fredaworkspace.com est prévu dans 30 jours. Activez le renouvellement automatique pour ne rien oublier.', { date: ago({ d: 1, h: 9 }), read: true, star: true }),
      mk('inbox', nadege, 'Photos du catalogue de décembre', "Coucou ! Je t'envoie les trois premières photos du catalogue. Dis-moi laquelle tu préfères pour la couverture.", { date: ago({ d: 2, h: 4 }), files: [file('couverture-A.jpg', 2310480, 'image/jpeg'), file('couverture-B.jpg', 2185900, 'image/jpeg'), file('couverture-C.jpg', 2420011, 'image/jpeg')] }),
      mk('inbox', google, 'Alerte de sécurité : nouvelle connexion', "Une nouvelle connexion à votre compte Google a été détectée depuis un appareil Android. Si c'était vous, aucune action n'est requise.", { date: ago({ d: 3, h: 1 }), read: true }),
      mk('inbox', linda, "Invitation : inauguration de la boutique", "Tu es invité(e) à l'inauguration samedi à 17 h. Il y aura de la musique et un petit buffet. Confirme-moi ta présence !", { date: ago({ d: 4, h: 5 }), read: true, star: true }),
      mk('inbox', banque, 'Votre relevé de novembre est disponible', 'Votre relevé mensuel est disponible dans votre espace en ligne.', { date: ago({ d: 12 }), read: true, files: [file('releve-novembre.pdf', 188200, 'application/pdf')] }),
      mk('inbox', jb, "Idée de nom pour la nouvelle offre", "J'ai pensé à « Pro Max » ou « Équipe+ ». Qu'en penses-tu ?", { date: ago({ d: 45 }), read: true }),
    ];
    this.byFolder.sent = [
      mk('sent', me, 'Re: Devis pour la rénovation', 'Merci Marie-Claire, je valide le devis. Pouvez-vous commencer lundi ?', { date: ago({ d: 1, h: 5 }), read: true, to: [marie] }),
      mk('sent', me, 'Photos pour le catalogue', "Voici les photos retouchées. Dis-moi si tu veux d'autres angles.", { date: ago({ d: 6 }), read: true, to: [nadege] }),
    ];
    this.byFolder.drafts = [mk('drafts', me, 'Proposition de partenariat', 'Bonjour, je vous écris pour vous proposer…', { date: ago({ d: 2 }), read: true, to: [{ email: 'contact@partenaire.ht', name: 'Contact Partenaire' }] })];
    this.byFolder.archive = [mk('archive', freda, 'Votre facture Freda Workspace', 'Votre facture de novembre est disponible dans votre espace.', { date: ago({ d: 20 }), read: true })];
    this.byFolder.spam = [mk('spam', { email: 'promo@gagnez-vite.biz', name: 'Gagnez Vite' }, 'Vous avez gagné un iPhone !!!', 'Cliquez ici pour récupérer votre cadeau.', { date: ago({ d: 1 }) })];
    this.byFolder.trash = [mk('trash', { email: 'news@pub-marche.com', name: 'Pub Marché' }, "Soldes de fin d'année", "Jusqu'à -50 % sur une sélection d'articles.", { date: ago({ d: 8 }), read: true })];
  }
}
