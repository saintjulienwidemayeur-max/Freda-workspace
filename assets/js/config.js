/**
 * Freda Workspace — configuration centrale du frontend.
 * Toutes les valeurs métier (offres, prix, extensions, serveurs mail)
 * sont regroupées ici pour être modifiées sans toucher aux pages.
 */
window.FW_CONFIG = {
  APP_NAME: 'Freda Workspace',
  COMPANY: 'Freda Pay LLC',
  GROUP: 'Freda Group',

  /* URL de votre backend (Node, Laravel, Supabase Edge Functions...).
     Le frontend n'appelle JAMAIS directement le Registrar, Purelymail
     ou Freda Pay : les clés API restent côté serveur. */
  API_BASE: '/api',   // production : 'https://api.fredaworkspace.com/api' (voir le dépôt Freda-workspace-backend ; ajouter l'origine à connect-src dans render.yaml)

  /* true = données simulées dans le navigateur (démo / maquette).
     Passez à false une fois les routes du backend en place (voir api.js). */
  DEMO_MODE: true,

  /* Site public, mesure d'audience et suivi d'erreurs (laisser vide pour désactiver). */
  SITE_URL: 'https://fredaworkspace.com',
  ANALYTICS_DOMAIN: '',   // ex. 'fredaworkspace.com' : active Plausible (sans cookie, respecte Do Not Track)
  ERROR_ENDPOINT: '',     // ex. '/api/client-errors' : reçoit les erreurs JavaScript (JSON via sendBeacon)

  /* Adresse du webmail (ex. Roundcube / SnappyMail sur votre domaine). */
  WEBMAIL_URL: 'https://webmail.fredaworkspace.com',
  /* Émetteur des factures PDF. Complétez l'adresse légale et le numéro fiscal (affichés seulement s'ils sont renseignés). */
  BILLING: {
    legalName: 'Freda Pay LLC',
    brandLine: 'Freda Workspace · Freda Group',
    address: '',
    email: 'support@fredaworkspace.com',
    website: 'fredaworkspace.com',
    taxId: '',
  },

  COUNTRIES: ['Haïti', 'République dominicaine', 'États-Unis', 'Canada', 'France', 'Autre'],

  SUPPORT_EMAIL: 'support@fredaworkspace.com',
  SUPPORT_WHATSAPP: '+509 0000 0000',

  /* Liens des stores (à remplacer après publication de l'app Flutter). */
  APP_STORE_URL: 'https://apps.apple.com/',
  PLAY_STORE_URL: 'https://play.google.com/store/',
  APP_DOWNLOAD_URL: 'https://fredaworkspace.com/app',

  /* Taux indicatif USD -> HTG pour MonCash / NatCash.
     À récupérer dynamiquement depuis Freda Pay au moment du paiement. */
  HTG_RATE: 132.5,

  /* Offres. Annuel = 10 mois payés (2 mois offerts).
     mailboxes : boîtes incluses (Infinity = illimitées).
     storageGb : stockage total partagé ; perBoxGb : stockage par boîte (l'un ou l'autre).
     extras    : options payantes affichées sur les cartes de tarifs. */
  PLANS: {
    starter: {
      id: 'starter',
      name: 'Starter',
      monthly: 2.99,
      tagline: 'Pour les indépendants et les très petites entreprises.',
      mailboxes: 1,
      storageGb: 2,
      extraGbMonthly: 0.30,
      features: [
        'Connectez votre propre domaine ou achetez-en un',
        '1 boîte mail professionnelle',
        '2 Go de stockage',
        'Webmail et application mobile',
        'DNS configuré automatiquement (MX, SPF, DKIM)',
        'Support par email',
      ],
      extras: ['+$0.30 par Go supplémentaire / mois'],
    },
    business: {
      id: 'business',
      name: 'Business',
      monthly: 9.99,
      tagline: 'Pour les équipes qui communiquent au nom de l’entreprise.',
      mailboxes: 5,
      storageGb: 15,
      extraGbMonthly: 0.30,
      extraMailboxMonthly: 1.00,
      popular: true,
      features: [
        'Connectez votre propre domaine ou achetez-en un',
        '5 boîtes mail professionnelles',
        '15 Go de stockage partagé',
        'Webmail et application mobile',
        'Alias et redirections illimités',
        'Support prioritaire (WhatsApp et email)',
      ],
      extras: ['+$1.00 par boîte supplémentaire / mois', '+$0.30 par Go supplémentaire / mois'],
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      monthly: 30.00,
      tagline: 'Pour les groupes et organisations qui gèrent plusieurs noms de domaine et services.',
      mailboxes: Infinity,
      perBoxGb: 5,
      extraGbMonthly: 0.30,
      features: [
        'Domaines illimités',
        'Boîtes mail illimitées',
        '5 Go de stockage par boîte',
        'Webmail et application mobile',
        'Alias et redirections illimités',
        'Support prioritaire (WhatsApp et email)',
      ],
      extras: ['+$0.30 par Go supplémentaire / mois'],
    },
  },
  YEARLY_MONTHS_BILLED: 10,

  /* Certificat SSL offert avec chaque offre. SSL_VALUE_USD = valeur de référence annuelle affichée barrée (0 = pas de prix barré).
     N'indiquez qu'un prix de référence réellement pratiqué ailleurs pour un certificat équivalent. */
  SSL_VALUE_USD: 0,

  /* Extensions proposées.
     included = true si une extension est offerte avec l'offre (aucune pour l'instant) ;
     sinon le domaine est facturé à son propre prix. renew = prix de renouvellement annuel. */
  TLDS: [
    { tld: '.com',    price: 12.99, renew: 14.99, included: false },
    { tld: '.net',    price: 13.99, renew: 15.99, included: false },
    { tld: '.org',    price: 11.99, renew: 13.99, included: false },
    { tld: '.online', price: 3.99,  renew: 29.99, included: false },
    { tld: '.site',   price: 2.99,  renew: 27.99, included: false },
    { tld: '.co',     price: 24.99, renew: 29.99, included: false },
    { tld: '.store',  price: 6.99,  renew: 49.99, included: false },
    { tld: '.tech',   price: 9.99,  renew: 49.99, included: false },
    { tld: '.io',     price: 39.99, renew: 49.99, included: false },
  ],

  /* Serveurs de messagerie affichés aux clients (infrastructure Purelymail).
     Vérifiez les valeurs dans la documentation Purelymail. */
  MAIL_SERVERS: {
    imap: { host: 'imap.purelymail.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.purelymail.com', port: 465, security: 'SSL/TLS', alt: '587 (STARTTLS)' },
    pop:  { host: 'pop.purelymail.com',  port: 995, security: 'SSL/TLS' },
  },

  /* Enregistrements DNS posés automatiquement pour chaque domaine. */
  MAIL_DNS_TEMPLATE: [
    { type: 'MX',    name: '@',                     value: 'mailserver.purelymail.com', priority: 50, managed: true, role: 'MX' },
    { type: 'TXT',   name: '@',                     value: 'v=spf1 include:_spf.purelymail.com ~all', managed: true, role: 'SPF' },
    { type: 'CNAME', name: 'purelymail1._domainkey', value: 'key1.dkimroot.purelymail.com', managed: true, role: 'DKIM' },
    { type: 'CNAME', name: 'purelymail2._domainkey', value: 'key2.dkimroot.purelymail.com', managed: true, role: 'DKIM' },
    { type: 'CNAME', name: 'purelymail3._domainkey', value: 'key3.dkimroot.purelymail.com', managed: true, role: 'DKIM' },
    { type: 'CNAME', name: '_dmarc',                value: 'dmarcroot.purelymail.com', managed: true, role: 'DMARC' },
  ],

  NAMESERVERS: ['ns1.fredaworkspace.com', 'ns2.fredaworkspace.com'],
};

/* ---------- Aides d'affichage des offres ---------- */
(function () {
  const C = window.FW_CONFIG;
  /* Ligne « Certificat SSL gratuit » ajoutée à chaque offre, avec la valeur de référence barrée. */
  Object.values(C.PLANS).forEach((p) => {
    const worth = C.SSL_VALUE_USD > 0 ? ' <s class="opacity-60 tabular">$' + C.SSL_VALUE_USD + '/an</s> <strong class="text-cta">Gratuit</strong>' : '';
    p.features.push('Certificat SSL' + (worth || ' gratuit'));
  });
  /** Stockage par boîte (Go). */
  C.perBoxGb = (p) => p.perBoxGb || p.storageGb / p.mailboxes;
  /** Stockage total disponible pour n boîtes (Go). */
  C.storageTotal = (p, n) => (p.perBoxGb ? p.perBoxGb * Math.max(n, 1) : p.storageGb);
  /** « 5 boîtes » / « Boîtes illimitées ». */
  C.boxLabel = (p) => (p.mailboxes === Infinity ? 'Boîtes illimitées' : p.mailboxes + ' boîte' + (p.mailboxes > 1 ? 's' : ''));
  /** « 15 Go partagés » / « 5 Go par boîte ». */
  C.storageLabel = (p) => (p.perBoxGb ? p.perBoxGb + ' Go par boîte' : p.storageGb + ' Go' + (p.mailboxes > 1 ? ' partagés' : ''));
  /** « 3 / 5 » ou « 3 » si illimité. */
  C.boxUsage = (p, n) => (p.mailboxes === Infinity ? String(n) : n + ' / ' + p.mailboxes);
  C.boxPct = (p, n) => (p.mailboxes === Infinity ? 0 : Math.min(100, (n / p.mailboxes) * 100));
})();
