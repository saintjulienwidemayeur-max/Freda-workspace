/** Pages supplémentaires : enregistrement de domaine international (FR / EN) et « Qui sommes-nous » (FR / HT / EN). Fusionnées dans landing-content.js. */
const FR = 'fr', HT = 'ht';

module.exports = [
  /* ---------------------------------------------------------------- enregistrer un domaine, international (FR / EN) */
  {
    id: 'domaine-intl', lang: FR, path: 'enregistrer-nom-de-domaine.html', alt: { en: 'en/register-domain-name.html' },
    breadcrumb: 'Enregistrer un nom de domaine',
    title: 'Enregistrer un nom de domaine international · Freda Workspace',
    description: 'Enregistrez un nom de domaine (.com, .net, .org, .co, .io…) où que vous soyez : 1 à 10 ans, Whois privé gratuit, DNS inclus, paiement par carte ou MonCash.',
    h1: 'Enregistrer un nom de domaine, où que vous soyez dans le monde',
    lead: 'Freda Connect, la partie « noms de domaine » de Freda Workspace, vous permet d’enregistrer un nom de domaine international (.com, .net, .org, .co, .store, .online, .site, .tech, .io) pour 1 à 10 ans, avec la confidentialité Whois gratuite et la gestion DNS dans votre espace. Vous payez par carte et par les autres moyens proposés par Stripe, ou par MonCash et NatCash depuis Haïti.',
    facts: [
      ['Extensions', '.com, .net, .org, .co, .store, .online, .site, .tech, .io'],
      ['Durée d’enregistrement', 'De 1 à 10 ans'],
      ['Prix', 'À partir de {domain_from} la première année selon l’extension ; prix exact affiché avant paiement ; le renouvellement peut coûter plus cher que la première année'],
      ['Inclus', 'Confidentialité Whois gratuite, verrouillage anti-transfert, gestion DNS complète, rappels de renouvellement'],
      ['Paiement', 'Carte bancaire et autres moyens affichés par Stripe selon votre pays ; MonCash et NatCash pour les clients en Haïti'],
      ['Transfert', 'Votre domaine vous appartient : code d’autorisation (EPP) disponible dans votre espace'],
      ['Email', '1 boîte email professionnelle gratuite sur votre domaine'],
    ],
    sections: [
      {
        h2: 'Comment enregistrer votre domaine',
        steps: [
          'Tapez le nom de votre entreprise ou de votre projet : Freda Connect vérifie la disponibilité sur toutes les extensions et propose des alternatives.',
          'Choisissez la durée (de 1 à 10 ans) et gardez la confidentialité Whois gratuite activée.',
          'Payez avec une carte bancaire ou un autre moyen proposé par Stripe pour votre pays, ou avec MonCash ou NatCash si vous êtes en Haïti.',
          'Votre domaine est enregistré dès que le paiement est confirmé ; vous gérez ensuite les enregistrements DNS depuis votre espace.',
        ],
      },
      {
        h2: 'Ce qui est inclus avec chaque domaine',
        paragraphs: ['Freda Connect enregistre les domaines par l’intermédiaire d’un registraire partenaire accrédité ICANN. Chaque domaine inclut la confidentialité Whois (vos coordonnées personnelles restent masquées), le verrouillage contre les transferts non voulus, un éditeur DNS complet (A, AAAA, CNAME, MX, TXT…) et des rappels avant l’expiration. Si vous ajoutez l’email professionnel, les enregistrements MX, SPF, DKIM et DMARC sont configurés automatiquement.'],
      },
      {
        h2: 'Un domaine et une adresse email au même endroit',
        paragraphs: ['Chaque compte Freda Workspace a droit à 1 boîte email professionnelle gratuite sur son propre domaine (le domaine, lui, est payant). Les offres Starter, Business et Enterprise ajoutent des boîtes et du stockage, avec un paiement de 1 à 12 mois à l’avance.'],
      },
      {
        h2: 'Pour qui ?',
        paragraphs: ['Pour les entrepreneurs, les petites entreprises, les associations et les agences, en Haïti comme à l’étranger, y compris la diaspora qui enregistre un domaine pour un proche ou pour son activité. Le site et le support fonctionnent en français, en créole haïtien et en anglais.'],
      },
    ],
    faq: [
      ['Quelles extensions de nom de domaine puis-je enregistrer ?', 'Freda Connect propose .com, .net, .org, .co, .store, .online, .site, .tech et .io. Le prix exact de chaque extension est affiché avant le paiement.'],
      ['Puis-je enregistrer un nom de domaine depuis l’étranger ?', 'Oui. Le service n’est pas limité à Haïti : vous payez par carte bancaire ou par les autres moyens que Stripe propose dans votre pays, et vous gérez votre domaine depuis votre espace.'],
      ['Combien coûte un nom de domaine ?', 'Les prix commencent à {domain_from} la première année selon l’extension. Le prix de renouvellement peut être plus élevé ; il est affiché avant le paiement.'],
      ['Mon nom de domaine m’appartient-il ?', 'Oui. Le domaine est enregistré à votre nom et vous pouvez le transférer chez un autre registraire avec le code d’autorisation (EPP) fourni dans votre espace, selon les règles de l’ICANN.'],
      ['Y a-t-il un nom de domaine gratuit ?', 'Non, Freda Workspace ne vend pas de nom de domaine gratuit. Ce qui est gratuit, c’est une boîte email professionnelle sur votre propre domaine.'],
    ],
    related: [['email-pro-gratuit.html', 'Email pro gratuit avec votre domaine'], ['acheter-domaine-moncash.html', 'Payer avec MonCash ou NatCash'], ['qui-sommes-nous.html', 'Qui sommes-nous ?']],
    cta: [['Chercher un nom de domaine', 'domaines.html'], ['Créer un compte', 'inscription.html']],
  },
  {
    id: 'domaine-intl-en', lang: 'en', path: 'en/register-domain-name.html', alt: { fr: 'enregistrer-nom-de-domaine.html' },
    breadcrumb: 'Register a domain name',
    title: 'Register an international domain name · Freda Workspace',
    description: 'Register a domain name (.com, .net, .org, .co, .store, .io…) from anywhere: 1 to 10 years, free WHOIS privacy, DNS included, pay by card or MonCash.',
    h1: 'Register a domain name from anywhere in the world',
    lead: 'Freda Connect, the domain-name part of Freda Workspace, lets you register an international domain name (.com, .net, .org, .co, .store, .online, .site, .tech, .io) for 1 to 10 years, with free WHOIS privacy and full DNS management in your account. You pay by card and the other methods Stripe offers in your country, or with MonCash and NatCash from Haiti.',
    facts: [
      ['Extensions', '.com, .net, .org, .co, .store, .online, .site, .tech, .io'],
      ['Registration length', '1 to 10 years'],
      ['Price', 'From {domain_from} for the first year depending on the extension; exact price shown before payment; renewal can cost more than the first year'],
      ['Included', 'Free WHOIS privacy, transfer lock, full DNS management, renewal reminders'],
      ['Payment', 'Bank card and other methods shown by Stripe for your country; MonCash and NatCash for customers in Haiti'],
      ['Transfer', 'The domain is yours: authorization (EPP) code available in your account'],
      ['Email', '1 free professional mailbox on your domain'],
    ],
    sections: [
      {
        h2: 'How to register your domain',
        steps: [
          'Type your business or project name: Freda Connect checks availability on every extension and suggests alternatives.',
          'Choose the length (1 to 10 years) and keep the free WHOIS privacy turned on.',
          'Pay with a bank card or another method Stripe offers for your country, or with MonCash or NatCash if you are in Haiti.',
          'Your domain is registered as soon as the payment is confirmed; you then manage DNS records from your account.',
        ],
      },
      {
        h2: 'What every domain includes',
        paragraphs: ['Freda Connect registers domains through a partner registrar accredited by ICANN. Every domain includes WHOIS privacy (your personal details stay hidden), a lock against unwanted transfers, a full DNS editor (A, AAAA, CNAME, MX, TXT…) and reminders before expiry. If you add professional email, the MX, SPF, DKIM and DMARC records are configured automatically.'],
      },
      {
        h2: 'A domain and an email address in one place',
        paragraphs: ['Every Freda Workspace account includes 1 free professional mailbox on its own domain (the domain itself is paid). Starter, Business and Enterprise plans add mailboxes and storage, paid 1 to 12 months in advance.'],
      },
    ],
    faq: [
      ['Which domain extensions can I register?', 'Freda Connect offers .com, .net, .org, .co, .store, .online, .site, .tech and .io. The exact price of each extension is shown before you pay.'],
      ['Can I register a domain name from outside Haiti?', 'Yes. The service is not limited to Haiti: you pay by bank card or the other methods Stripe offers in your country, and you manage your domain from your account.'],
      ['How much does a domain name cost?', 'Prices start at {domain_from} for the first year depending on the extension. The renewal price can be higher; it is shown before payment.'],
      ['Do I own my domain name?', 'Yes. The domain is registered in your name and you can transfer it to another registrar with the authorization (EPP) code provided in your account, following ICANN rules.'],
      ['Is there a free domain name?', 'No, Freda Workspace does not sell free domain names. What is free is one professional mailbox on your own domain.'],
    ],
    related: [['en/free-business-email-haiti.html', 'Free business email'], ['en/about-us.html', 'About us'], ['enregistrer-nom-de-domaine.html', 'Version française']],
    cta: [['Search a domain name', 'domaines.html'], ['Create an account', 'inscription.html']],
  },

  /* ---------------------------------------------------------------- Qui sommes-nous (FR / HT / EN) */
  {
    id: 'about', type: 'about', lang: FR, path: 'qui-sommes-nous.html', alt: { ht: 'ht/kiyes-nou-ye.html', en: 'en/about-us.html' },
    breadcrumb: 'Qui sommes-nous',
    title: 'Qui sommes-nous ? Freda Workspace, par Freda Pay LLC',
    description: 'Freda Workspace est une marque de Freda Pay LLC : Freda Connect (noms de domaine) et Freda Mail (email professionnel) pour les entreprises du monde entier.',
    h1: 'Qui sommes-nous ? Freda Workspace, une marque de Freda Pay LLC',
    lead: 'Freda Workspace est une marque de Freda Pay LLC. Elle réunit deux produits : Freda Connect (noms de domaine et DNS) et Freda Mail (email professionnel et application mobile). Notre but : permettre à toute entreprise, en Haïti comme dans le reste du monde, d’avoir son nom de domaine et son adresse email professionnelle au même endroit, avec des moyens de paiement adaptés.',
    facts: [
      ['Marque', 'Freda Workspace'],
      ['Société', 'Freda Pay LLC, société enregistrée dans l’État du Wyoming (États-Unis), membre de Freda Group'],
      ['Produits', 'Freda Connect (noms de domaine et DNS) et Freda Mail (email professionnel et application mobile)'],
      ['Paiements', 'MonCash et NatCash (traités par Freda Pay Issuing, de Freda Pay LLC) ; cartes et portefeuilles numériques (traités par Stripe)'],
      ['Clients', 'Entrepreneurs, petites entreprises, associations et agences, en Haïti et à l’international'],
      ['Langues', 'Français, créole haïtien et anglais'],
      ['Contact', 'support@fredaworkspace.com, du lundi au samedi, de 8 h à 18 h (heure d’Haïti)'],
    ],
    sections: [
      {
        h2: 'Nos deux produits',
        paragraphs: [
          'Freda Connect : enregistrez un nom de domaine international (.com, .net, .org, .co, .store, .online, .site, .tech, .io), gérez ses enregistrements DNS, protégez vos coordonnées avec la confidentialité Whois gratuite et gardez la maîtrise de votre domaine, que vous pouvez transférer à tout moment.',
          'Freda Mail : créez des adresses email professionnelles sur votre propre domaine (contact@votre-entreprise.com), avec SPF, DKIM et DMARC configurés automatiquement, une application mobile et la compatibilité avec tout logiciel IMAP et SMTP. Chaque compte a droit à 1 boîte gratuite ; les offres Starter, Business et Enterprise ajoutent des boîtes et du stockage.',
        ],
      },
      {
        h2: 'Notre approche',
        paragraphs: [
          'Simplicité : le domaine et l’email se configurent ensemble, sans compétence technique ; les enregistrements DNS sont ajoutés pour vous ou clairement expliqués.',
          'Paiement local : beaucoup d’entrepreneurs n’ont pas de carte internationale. Freda Workspace accepte MonCash et NatCash, ainsi que les cartes et les autres moyens proposés par Stripe. Comme MonCash et NatCash ne permettent pas de prélèvement automatique, un solde prépayé paie vos abonnements et nous vous prévenons par email quand il devient trop bas.',
          'Transparence : les prix sont affichés avant tout paiement, le domaine vous appartient et nous ne vendons jamais vos données.',
        ],
      },
      {
        h2: 'Nous contacter',
        paragraphs: ['Écrivez à support@fredaworkspace.com ou utilisez le formulaire du centre d’aide. Nous répondons en français, en créole haïtien et en anglais, du lundi au samedi, de 8 h à 18 h (heure d’Haïti). Freda Workspace est un service en ligne ; les conditions d’utilisation, la politique de confidentialité et la politique de remboursement sont publiées sur la page des mentions légales.'],
      },
    ],
    faq: [
      ['Qui est derrière Freda Workspace ?', 'Freda Workspace est une marque de Freda Pay LLC, société enregistrée dans l’État du Wyoming (États-Unis), membre de Freda Group.'],
      ['Que comprend Freda Workspace ?', 'Deux produits : Freda Connect pour les noms de domaine et le DNS, et Freda Mail pour l’email professionnel et l’application mobile.'],
      ['Freda Workspace est-il réservé à Haïti ?', 'Non. Le service accepte MonCash et NatCash pour les clients en Haïti, mais les noms de domaine internationaux peuvent être enregistrés depuis l’étranger et payés par carte ou par les autres moyens proposés par Stripe.'],
      ['Quelle est la différence entre Freda Workspace et Freda Pay ?', 'Freda Pay LLC est la société. Freda Workspace est sa marque dédiée aux noms de domaine et à l’email professionnel. Les paiements MonCash et NatCash sont traités par Freda Pay Issuing, de la même société.'],
      ['Comment contacter le support ?', 'Par email à support@fredaworkspace.com ou par le formulaire du centre d’aide, du lundi au samedi, de 8 h à 18 h (heure d’Haïti), en français, créole haïtien ou anglais.'],
    ],
    related: [['enregistrer-nom-de-domaine.html', 'Enregistrer un nom de domaine'], ['email-pro-gratuit.html', 'Email pro gratuit'], ['legal.html', 'Mentions légales']],
    cta: [['Créer un compte', 'inscription.html'], ['Contacter le support', 'support.html#contact']],
  },
  {
    id: 'about-ht', type: 'about', lang: HT, path: 'ht/kiyes-nou-ye.html', alt: { fr: 'qui-sommes-nous.html', en: 'en/about-us.html' },
    breadcrumb: 'Kiyès nou ye',
    title: 'Kiyès nou ye? Freda Workspace, pa Freda Pay LLC',
    description: 'Freda Workspace se yon mak Freda Pay LLC. Li reyini Freda Connect (non domèn) ak Freda Mail (imèl pwofesyonèl) pou biznis toupatou nan mond lan.',
    h1: 'Kiyès nou ye? Freda Workspace, yon mak Freda Pay LLC',
    lead: 'Freda Workspace se yon mak Freda Pay LLC. Li reyini de pwodwi: Freda Connect (non domèn ak DNS) ak Freda Mail (imèl pwofesyonèl ak aplikasyon mobil). Objektif nou: pèmèt tout biznis, nan Ayiti kou nan rès mond lan, gen non domèn li ak adrès imèl pwofesyonèl li nan menm kote, ak mwayen peman ki adapte.',
    facts: [
      ['Mak', 'Freda Workspace'],
      ['Konpayi', 'Freda Pay LLC, konpayi ki anrejistre nan Eta Wyoming (Etazini), manm Freda Group'],
      ['Pwodwi', 'Freda Connect (non domèn ak DNS) ak Freda Mail (imèl pwofesyonèl ak aplikasyon mobil)'],
      ['Peman', 'MonCash ak NatCash (Freda Pay Issuing, yon pwodwi Freda Pay LLC, trete yo); kat ak pòtfèy nimerik (Stripe trete yo)'],
      ['Kliyan', 'Antreprenè, ti biznis, asosyasyon ak ajans, nan Ayiti ak aletranje'],
      ['Lang', 'Fransè, kreyòl ayisyen ak anglè'],
      ['Kontak', 'support@fredaworkspace.com, de lendi a samdi, de 8 è a 6 è (lè Ayiti)'],
    ],
    sections: [
      {
        h2: 'De pwodwi nou yo',
        paragraphs: [
          'Freda Connect: anrejistre yon non domèn entènasyonal (.com, .net, .org, .co, .store, .online, .site, .tech, .io), jere enregistreman DNS li yo, pwoteje enfòmasyon pèsonèl ou ak konfidansyalite Whois gratis epi kenbe kontwòl domèn ou, ou ka transfere l nenpòt ki lè.',
          'Freda Mail: kreye adrès imèl pwofesyonèl sou pwòp domèn ou (kontak@biznis-ou.com), ak SPF, DKIM ak DMARC konfigire otomatikman, yon aplikasyon mobil ak konpatibilite ak nenpòt lojisyèl IMAP ak SMTP. Chak kont gen dwa a 1 bwat gratis; òf Starter, Business ak Enterprise yo ajoute plis bwat ak plis espas.',
        ],
      },
      {
        h2: 'Fason nou travay',
        paragraphs: [
          'Senplisite: domèn nan ak imèl la konfigire ansanm, san konesans teknik; nou ajoute enregistreman DNS yo pou ou oswa nou eksplike yo klèman.',
          'Peman lokal: anpil antreprenè pa gen kat entènasyonal. Freda Workspace aksepte MonCash ak NatCash, ansanm ak kat yo ak lòt mwayen Stripe pwopoze yo. Kòm MonCash ak NatCash pa pèmèt prelèvman otomatik, yon balans prepeye peye abònman ou yo epi nou avèti w pa imèl lè li vin twò ba.',
          'Transparans: nou afiche pri yo anvan ou peye, domèn nan se pa w, epi nou pa janm vann done ou yo.',
        ],
      },
      {
        h2: 'Kontakte nou',
        paragraphs: ['Ekri nan support@fredaworkspace.com oswa itilize fòmilè sant èd la. Nou reponn an fransè, an kreyòl ayisyen ak an anglè, de lendi a samdi, de 8 è a 6 è (lè Ayiti). Freda Workspace se yon sèvis sou entènèt; kondisyon itilizasyon yo, politik konfidansyalite a ak politik ranbousman an pibliye sou paj mansyon legal yo.'],
      },
    ],
    faq: [
      ['Kiyès ki dèyè Freda Workspace?', 'Freda Workspace se yon mak Freda Pay LLC, konpayi ki anrejistre nan Eta Wyoming (Etazini), manm Freda Group.'],
      ['Kisa Freda Workspace genyen andedan?', 'De pwodwi: Freda Connect pou non domèn ak DNS, ak Freda Mail pou imèl pwofesyonèl ak aplikasyon mobil.'],
      ['Èske Freda Workspace se pou Ayiti sèlman?', 'Non. Sèvis la aksepte MonCash ak NatCash pou kliyan nan Ayiti, men yo ka anrejistre non domèn entènasyonal depi aletranje epi peye ak kat oswa lòt mwayen Stripe pwopoze yo.'],
      ['Ki diferans ki genyen ant Freda Workspace ak Freda Pay?', 'Freda Pay LLC se konpayi an. Freda Workspace se mak li pou non domèn ak imèl pwofesyonèl. Freda Pay Issuing, nan menm konpayi an, trete peman MonCash ak NatCash yo.'],
      ['Kijan pou m kontakte sipò a?', 'Pa imèl nan support@fredaworkspace.com oswa pa fòmilè sant èd la, de lendi a samdi, de 8 è a 6 è (lè Ayiti), an fransè, an kreyòl ayisyen oswa an anglè.'],
    ],
    related: [['ht/non-domenn-ayiti.html', 'Non domèn pou Ayiti'], ['ht/imel-pwofesyonel-gratis.html', 'Imèl pwofesyonèl gratis'], ['legal.html', 'Mansyon legal']],
    cta: [['Kreye yon kont', 'inscription.html'], ['Kontakte sipò a', 'support.html#contact']],
  },
  {
    id: 'about-en', type: 'about', lang: 'en', path: 'en/about-us.html', alt: { fr: 'qui-sommes-nous.html', ht: 'ht/kiyes-nou-ye.html' },
    breadcrumb: 'About us',
    title: 'About us: Freda Workspace, by Freda Pay LLC',
    description: 'Freda Workspace is a brand of Freda Pay LLC. It brings together Freda Connect (domain names) and Freda Mail (professional email) for businesses worldwide.',
    h1: 'About us: Freda Workspace, a brand of Freda Pay LLC',
    lead: 'Freda Workspace is a brand of Freda Pay LLC. It brings together two products: Freda Connect (domain names and DNS) and Freda Mail (professional email and a mobile app). Our goal: let any business, in Haiti and around the world, get its domain name and professional email address in one place, with payment methods that fit.',
    facts: [
      ['Brand', 'Freda Workspace'],
      ['Company', 'Freda Pay LLC, a company registered in the State of Wyoming (USA), part of Freda Group'],
      ['Products', 'Freda Connect (domain names and DNS) and Freda Mail (professional email and mobile app)'],
      ['Payments', 'MonCash and NatCash (processed by Freda Pay Issuing, from Freda Pay LLC); cards and digital wallets (processed by Stripe)'],
      ['Customers', 'Entrepreneurs, small businesses, associations and agencies, in Haiti and abroad'],
      ['Languages', 'French, Haitian Creole and English'],
      ['Contact', 'support@fredaworkspace.com, Monday to Saturday, 8am to 6pm (Haiti time)'],
    ],
    sections: [
      {
        h2: 'Our two products',
        paragraphs: [
          'Freda Connect: register an international domain name (.com, .net, .org, .co, .store, .online, .site, .tech, .io), manage its DNS records, protect your details with free WHOIS privacy and keep control of your domain, which you can transfer at any time.',
          'Freda Mail: create professional email addresses on your own domain (contact@your-company.com), with SPF, DKIM and DMARC configured automatically, a mobile app and compatibility with any IMAP and SMTP client. Every account includes 1 free mailbox; Starter, Business and Enterprise plans add mailboxes and storage.',
        ],
      },
      {
        h2: 'Our approach',
        paragraphs: [
          'Simplicity: the domain and the email are set up together, without technical skills; DNS records are added for you or clearly explained.',
          'Local payment: many entrepreneurs do not have an international card. Freda Workspace accepts MonCash and NatCash, as well as cards and the other methods Stripe offers. Because MonCash and NatCash cannot charge you automatically, a prepaid balance pays your subscriptions and we email you when it runs low.',
          'Transparency: prices are shown before you pay, the domain is yours and we never sell your data.',
        ],
      },
      {
        h2: 'Contact us',
        paragraphs: ['Write to support@fredaworkspace.com or use the help-centre form. We answer in French, Haitian Creole and English, Monday to Saturday, 8am to 6pm (Haiti time). Freda Workspace is an online service; the terms of use, privacy policy and refund policy are published on the legal page.'],
      },
    ],
    faq: [
      ['Who is behind Freda Workspace?', 'Freda Workspace is a brand of Freda Pay LLC, a company registered in the State of Wyoming (USA), part of Freda Group.'],
      ['What does Freda Workspace include?', 'Two products: Freda Connect for domain names and DNS, and Freda Mail for professional email and the mobile app.'],
      ['Is Freda Workspace only for Haiti?', 'No. The service accepts MonCash and NatCash for customers in Haiti, but international domain names can be registered from abroad and paid by card or the other methods Stripe offers.'],
      ['What is the difference between Freda Workspace and Freda Pay?', 'Freda Pay LLC is the company. Freda Workspace is its brand for domain names and professional email. MonCash and NatCash payments are processed by Freda Pay Issuing, from the same company.'],
      ['How do I contact support?', 'By email at support@fredaworkspace.com or through the help-centre form, Monday to Saturday, 8am to 6pm (Haiti time), in French, Haitian Creole or English.'],
    ],
    related: [['en/register-domain-name.html', 'Register a domain name'], ['en/free-business-email-haiti.html', 'Free business email'], ['legal.html', 'Legal']],
    cta: [['Create an account', 'inscription.html'], ['Contact support', 'support.html#contact']],
  },
];
