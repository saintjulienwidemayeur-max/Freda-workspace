/** Pages de marque : « Freda Mail » et « Freda Connect » (FR / HT / EN), pour que quiconque cherche ces noms trouve Freda Workspace. Fusionnées dans landing-content.js. */
const FR = 'fr', HT = 'ht', EN = 'en';

const mailOffers = [
  { name: 'Freda Mail Gratuit', price: 0, description: '1 boîte email professionnelle (1 Go) sur votre propre domaine' },
  { name: 'Freda Mail Starter', price: '{starter_num}', description: '2 boîtes, 2 Go, par mois' },
  { name: 'Freda Mail Business', price: '{business_num}', description: '5 boîtes, 15 Go partagés, par mois' },
  { name: 'Freda Mail Enterprise', price: '{enterprise_num}', description: 'Boîtes illimitées, 5 Go par boîte, par mois' },
];

module.exports = [
  /* ================================================================ Freda Mail */
  {
    id: 'freda-mail', priority: '0.9', lang: FR, path: 'freda-mail.html', alt: { ht: 'ht/freda-mail.html', en: 'en/freda-mail.html' },
    breadcrumb: 'Freda Mail',
    title: 'Freda Mail · Email professionnel · Freda Workspace',
    description: 'Freda Mail, l’email professionnel de Freda Workspace : 1 boîte gratuite sur votre domaine, SPF, DKIM et DMARC automatiques, application mobile.',
    h1: 'Freda Mail : l’email professionnel sur votre propre nom de domaine',
    lead: 'Freda Mail est le produit d’email professionnel de Freda Workspace, une marque de Freda Pay LLC. Il vous donne des adresses sur votre propre domaine (contact@votre-entreprise.com), avec {free_mailboxes} boîte gratuite par compte, SPF, DKIM et DMARC configurés automatiquement, une application mobile et la compatibilité avec tout logiciel IMAP et SMTP.',
    facts: [
      ['Produit', 'Freda Mail, email professionnel de Freda Workspace (Freda Pay LLC)'],
      ['Ce que c’est', 'Des adresses email sur votre propre nom de domaine, par exemple contact@votre-entreprise.com'],
      ['Offre gratuite', '{free_mailboxes} boîte (1 Go) par compte, sans abonnement ni carte bancaire ; le nom de domaine est payant'],
      ['Offres payantes', 'Starter {starter_price}/mois (2 boîtes), Business {business_price}/mois (5 boîtes), Enterprise {enterprise_price}/mois (illimité)'],
      ['Sécurité', 'SPF, DKIM et DMARC configurés automatiquement'],
      ['Compatibilité', 'Application Freda Mail, et tout logiciel IMAP / SMTP (Outlook, Apple Mail, Gmail)'],
      ['Paiement', 'MonCash, NatCash, carte et autres moyens proposés par Stripe ; solde prépayé pour les abonnements'],
      ['Produit associé', 'Freda Connect (noms de domaine et DNS)'],
    ],
    sections: [
      {
        h2: 'Ce que fait Freda Mail',
        paragraphs: ['Freda Mail héberge vos boîtes email professionnelles et les relie à votre nom de domaine. Vous créez vos adresses (contact@, ventes@, direction@), vous lisez et envoyez vos messages dans l’application Freda Mail ou dans n’importe quel logiciel compatible IMAP et SMTP, et vous gérez les alias et les mots de passe depuis votre espace client. Les protections SPF, DKIM et DMARC, qui aident vos messages à arriver en boîte de réception, sont configurées pour vous.'],
      },
      {
        h2: 'Les offres Freda Mail',
        table: {
          head: ['', 'Gratuit', 'Starter', 'Business', 'Enterprise'],
          rows: [
            ['Prix', '0 $', '{starter_price}/mois', '{business_price}/mois', '{enterprise_price}/mois'],
            ['Boîtes email', '{free_mailboxes}', '{starter_boxes}', '{business_boxes}', 'Illimitées'],
            ['Stockage', '1 Go', '2 Go', '15 Go partagés', '5 Go par boîte'],
          ],
        },
        paragraphs: ['Les offres payantes se règlent pour 1 à 12 mois à l’avance ; 12 mois = deux mois offerts. Les prix peuvent évoluer : la page des tarifs fait foi.'],
      },
      {
        h2: 'Démarrer avec Freda Mail',
        steps: [
          'Créez votre compte Freda Workspace (gratuit, sans carte bancaire).',
          'Choisissez votre nom de domaine avec Freda Connect, ou connectez celui que vous possédez déjà.',
          'Créez votre première adresse email : les enregistrements MX, SPF, DKIM et DMARC sont ajoutés ou clairement indiqués.',
          'Connectez-vous avec l’application Freda Mail ou votre logiciel de messagerie habituel.',
        ],
      },
      {
        h2: 'Freda Mail et Freda Connect, ensemble',
        paragraphs: ['Freda Mail fonctionne avec n’importe quel nom de domaine, mais il est le plus simple avec Freda Connect : le domaine et l’email se configurent au même endroit, et le DNS de l’email est préparé automatiquement.'],
      },
    ],
    faq: [
      ['Qu’est-ce que Freda Mail ?', 'Freda Mail est le produit d’email professionnel de Freda Workspace, une marque de Freda Pay LLC. Il permet d’avoir des adresses email sur son propre nom de domaine, avec une application mobile et la compatibilité IMAP / SMTP.'],
      ['Freda Mail est-il gratuit ?', 'Chaque compte a droit à {free_mailboxes} boîte Freda Mail gratuite (1 Go) sur son propre domaine, sans abonnement ni carte bancaire. Le nom de domaine, lui, est payant. Les offres Starter, Business et Enterprise ajoutent des boîtes et du stockage.'],
      ['Quelle est la différence entre Freda Mail et Freda Workspace ?', 'Freda Workspace est la marque. Elle regroupe Freda Mail (email professionnel) et Freda Connect (noms de domaine et DNS).'],
      ['Comment lire mes emails Freda Mail ?', 'Avec l’application Freda Mail, ou avec tout logiciel compatible IMAP et SMTP comme Outlook, Apple Mail ou Gmail. Les paramètres sont affichés dans votre espace.'],
      ['Combien de boîtes Freda Mail puis-je avoir ?', 'Gratuit : {free_mailboxes} boîte. Starter : {starter_boxes} boîtes. Business : {business_boxes} boîtes. Enterprise : illimité. Les alias sont gratuits.'],
      ['Puis-je payer Freda Mail avec MonCash ou NatCash ?', 'Oui. MonCash et NatCash ne permettent pas de prélèvement automatique : vous rechargez un solde Freda qui paie ensuite votre offre automatiquement.'],
    ],
    related: [['freda-connect.html', 'Freda Connect : noms de domaine et DNS'], ['email-pro-gratuit.html', 'Email pro gratuit'], ['qui-sommes-nous.html', 'Qui sommes-nous ?']],
    cta: [['Créer mon email Freda Mail', 'inscription.html'], ['Voir Freda Connect', 'freda-connect.html']],
    product: { name: 'Freda Mail', description: 'Email professionnel sur votre propre nom de domaine, avec 1 boîte gratuite, SPF, DKIM et DMARC configurés automatiquement et une application mobile.', offers: mailOffers },
  },
  {
    id: 'freda-mail-ht', priority: '0.8', lang: HT, path: 'ht/freda-mail.html', alt: { fr: 'freda-mail.html', en: 'en/freda-mail.html' },
    breadcrumb: 'Freda Mail',
    title: 'Freda Mail · Imèl pwofesyonèl · Freda Workspace',
    description: 'Freda Mail se imèl pwofesyonèl Freda Workspace: 1 bwat gratis sou domèn ou, SPF, DKIM ak DMARC otomatik, aplikasyon mobil, peman MonCash, NatCash oswa kat.',
    h1: 'Freda Mail: imèl pwofesyonèl sou pwòp non domèn ou',
    lead: 'Freda Mail se pwodwi imèl pwofesyonèl Freda Workspace, yon mak Freda Pay LLC. Li ba ou adrès sou pwòp domèn ou (kontak@biznis-ou.com), ak {free_mailboxes} bwat gratis pou chak kont, SPF, DKIM ak DMARC konfigire otomatikman, yon aplikasyon mobil ak konpatibilite ak nenpòt lojisyèl IMAP ak SMTP.',
    facts: [
      ['Pwodwi', 'Freda Mail, imèl pwofesyonèl Freda Workspace (Freda Pay LLC)'],
      ['Kisa li ye', 'Adrès imèl sou pwòp non domèn ou, pa egzanp kontak@biznis-ou.com'],
      ['Òf gratis', '{free_mailboxes} bwat (1 Go) pou chak kont, san abònman ni kat bankè; non domèn nan peye'],
      ['Òf ki peye', 'Starter {starter_price}/mwa (2 bwat), Business {business_price}/mwa (5 bwat), Enterprise {enterprise_price}/mwa (san limit)'],
      ['Sekirite', 'SPF, DKIM ak DMARC konfigire otomatikman'],
      ['Konpatibilite', 'Aplikasyon Freda Mail, ak nenpòt lojisyèl IMAP / SMTP (Outlook, Apple Mail, Gmail)'],
      ['Peman', 'MonCash, NatCash, kat ak lòt mwayen Stripe pwopoze; balans prepeye pou abònman yo'],
      ['Pwodwi asosye', 'Freda Connect (non domèn ak DNS)'],
    ],
    sections: [
      {
        h2: 'Sa Freda Mail fè',
        paragraphs: ['Freda Mail eberje bwat imèl pwofesyonèl ou yo epi li konekte yo ak non domèn ou. Ou kreye adrès ou yo (kontak@, lavant@, direksyon@), ou li epi voye mesaj ou yo nan aplikasyon Freda Mail la oswa nan nenpòt lojisyèl ki sipòte IMAP ak SMTP, epi ou jere alyas ak modpas yo depi nan espas kliyan ou. Pwoteksyon SPF, DKIM ak DMARC yo, ki ede mesaj ou yo rive nan bwat resepsyon, konfigire pou ou.'],
      },
      {
        h2: 'Òf Freda Mail yo',
        table: {
          head: ['', 'Gratis', 'Starter', 'Business', 'Enterprise'],
          rows: [
            ['Pri', '0 $', '{starter_price}/mwa', '{business_price}/mwa', '{enterprise_price}/mwa'],
            ['Bwat imèl', '{free_mailboxes}', '{starter_boxes}', '{business_boxes}', 'San limit'],
            ['Espas', '1 Go', '2 Go', '15 Go pataje', '5 Go pou chak bwat'],
          ],
        },
        paragraphs: ['Ou peye òf ki peye yo pou 1 a 12 mwa davans; 12 mwa = de mwa gratis. Pri yo ka chanje: paj tarif la fè lafwa.'],
      },
      {
        h2: 'Kijan pou kòmanse ak Freda Mail',
        steps: [
          'Kreye kont Freda Workspace ou (gratis, san kat bankè).',
          'Chwazi non domèn ou ak Freda Connect, oswa konekte youn ou genyen deja.',
          'Kreye premye adrès imèl ou: enregistreman MX, SPF, DKIM ak DMARC yo ajoute oswa yo endike klèman.',
          'Konekte ak aplikasyon Freda Mail la oswa ak lojisyèl imèl ou abitye ak li a.',
        ],
      },
      {
        h2: 'Freda Mail ak Freda Connect ansanm',
        paragraphs: ['Freda Mail mache ak nenpòt non domèn, men li pi senp ak Freda Connect: domèn nan ak imèl la konfigire nan menm kote, epi DNS imèl la prepare otomatikman.'],
      },
    ],
    faq: [
      ['Kisa Freda Mail ye?', 'Freda Mail se pwodwi imèl pwofesyonèl Freda Workspace, yon mak Freda Pay LLC. Li pèmèt ou gen adrès imèl sou pwòp non domèn ou, ak yon aplikasyon mobil ak konpatibilite IMAP / SMTP.'],
      ['Èske Freda Mail gratis?', 'Chak kont gen dwa a {free_mailboxes} bwat Freda Mail gratis (1 Go) sou pwòp domèn li, san abònman ni kat bankè. Non domèn nan, li menm, peye. Òf Starter, Business ak Enterprise yo ajoute plis bwat ak plis espas.'],
      ['Ki diferans ki genyen ant Freda Mail ak Freda Workspace?', 'Freda Workspace se mak la. Li gen Freda Mail (imèl pwofesyonèl) ak Freda Connect (non domèn ak DNS) andedan.'],
      ['Kijan pou m li imèl Freda Mail mwen yo?', 'Ak aplikasyon Freda Mail la, oswa ak nenpòt lojisyèl ki sipòte IMAP ak SMTP tankou Outlook, Apple Mail oswa Gmail. Paramèt yo parèt nan espas ou.'],
      ['Konbyen bwat Freda Mail mwen ka genyen?', 'Gratis: {free_mailboxes} bwat. Starter: {starter_boxes} bwat. Business: {business_boxes} bwat. Enterprise: san limit. Alyas yo gratis.'],
      ['Èske mwen ka peye Freda Mail ak MonCash oswa NatCash?', 'Wi. MonCash ak NatCash pa pèmèt prelèvman otomatik: ou rechaje yon balans Freda ki peye òf ou a otomatikman apre.'],
    ],
    related: [['ht/freda-connect.html', 'Freda Connect: non domèn ak DNS'], ['ht/imel-pwofesyonel-gratis.html', 'Imèl pwofesyonèl gratis'], ['ht/kiyes-nou-ye.html', 'Kiyès nou ye?']],
    cta: [['Kreye imèl Freda Mail mwen', 'inscription.html'], ['Gade Freda Connect', 'ht/freda-connect.html']],
    product: { name: 'Freda Mail', description: 'Imèl pwofesyonèl sou pwòp non domèn ou, ak 1 bwat gratis, SPF, DKIM ak DMARC konfigire otomatikman ak yon aplikasyon mobil.', offers: mailOffers },
  },
  {
    id: 'freda-mail-en', priority: '0.8', lang: EN, path: 'en/freda-mail.html', alt: { fr: 'freda-mail.html', ht: 'ht/freda-mail.html' },
    breadcrumb: 'Freda Mail',
    title: 'Freda Mail · Professional email · Freda Workspace',
    description: 'Freda Mail, the professional email of Freda Workspace: 1 free mailbox on your domain, automatic SPF, DKIM and DMARC, and a mobile app.',
    h1: 'Freda Mail: professional email on your own domain name',
    lead: 'Freda Mail is the professional email product of Freda Workspace, a brand of Freda Pay LLC. It gives you addresses on your own domain (contact@your-company.com), with {free_mailboxes} free mailbox per account, SPF, DKIM and DMARC configured automatically, a mobile app and compatibility with any IMAP and SMTP client.',
    facts: [
      ['Product', 'Freda Mail, the professional email of Freda Workspace (Freda Pay LLC)'],
      ['What it is', 'Email addresses on your own domain name, for example contact@your-company.com'],
      ['Free plan', '{free_mailboxes} mailbox (1 GB) per account, no subscription, no bank card; the domain name is paid'],
      ['Paid plans', 'Starter {starter_price}/month (2 mailboxes), Business {business_price}/month (5 mailboxes), Enterprise {enterprise_price}/month (unlimited)'],
      ['Security', 'SPF, DKIM and DMARC configured automatically'],
      ['Compatibility', 'Freda Mail app, and any IMAP / SMTP client (Outlook, Apple Mail, Gmail)'],
      ['Payment', 'MonCash, NatCash, card and other methods offered by Stripe; prepaid balance for subscriptions'],
      ['Related product', 'Freda Connect (domain names and DNS)'],
    ],
    sections: [
      {
        h2: 'What Freda Mail does',
        paragraphs: ['Freda Mail hosts your professional mailboxes and links them to your domain name. You create your addresses (contact@, sales@, management@), read and send messages in the Freda Mail app or in any IMAP and SMTP client, and manage aliases and passwords from your account. The SPF, DKIM and DMARC protections, which help your messages reach the inbox, are configured for you.'],
      },
      {
        h2: 'Freda Mail plans',
        table: {
          head: ['', 'Free', 'Starter', 'Business', 'Enterprise'],
          rows: [
            ['Price', '$0', '{starter_price}/month', '{business_price}/month', '{enterprise_price}/month'],
            ['Mailboxes', '{free_mailboxes}', '{starter_boxes}', '{business_boxes}', 'Unlimited'],
            ['Storage', '1 GB', '2 GB', '15 GB shared', '5 GB per mailbox'],
          ],
        },
        paragraphs: ['Paid plans are paid 1 to 12 months in advance; 12 months = two months free. Prices may change: the pricing page is authoritative.'],
      },
      {
        h2: 'Getting started with Freda Mail',
        steps: [
          'Create your Freda Workspace account (free, no bank card).',
          'Choose your domain name with Freda Connect, or connect one you already own.',
          'Create your first email address: the MX, SPF, DKIM and DMARC records are added or clearly shown.',
          'Sign in with the Freda Mail app or your usual email client.',
        ],
      },
    ],
    faq: [
      ['What is Freda Mail?', 'Freda Mail is the professional email product of Freda Workspace, a brand of Freda Pay LLC. It lets you have email addresses on your own domain name, with a mobile app and IMAP / SMTP compatibility.'],
      ['Is Freda Mail free?', 'Every account includes {free_mailboxes} free Freda Mail mailbox (1 GB) on its own domain, with no subscription or bank card. The domain name is paid. Starter, Business and Enterprise plans add mailboxes and storage.'],
      ['What is the difference between Freda Mail and Freda Workspace?', 'Freda Workspace is the brand. It includes Freda Mail (professional email) and Freda Connect (domain names and DNS).'],
      ['How do I read my Freda Mail email?', 'With the Freda Mail app, or any IMAP and SMTP client such as Outlook, Apple Mail or Gmail. The settings are shown in your account.'],
      ['Can I pay for Freda Mail with MonCash or NatCash?', 'Yes. MonCash and NatCash do not allow automatic charges, so you top up a Freda balance that then pays your plan automatically.'],
    ],
    related: [['en/freda-connect.html', 'Freda Connect: domain names and DNS'], ['en/free-business-email-haiti.html', 'Free business email'], ['en/about-us.html', 'About us']],
    cta: [['Create my Freda Mail address', 'inscription.html'], ['See Freda Connect', 'en/freda-connect.html']],
    product: { name: 'Freda Mail', description: 'Professional email on your own domain name, with 1 free mailbox, SPF, DKIM and DMARC configured automatically and a mobile app.', offers: mailOffers },
  },

  /* ================================================================ Freda Connect */
  {
    id: 'freda-connect', priority: '0.9', lang: FR, path: 'freda-connect.html', alt: { ht: 'ht/freda-connect.html', en: 'en/freda-connect.html' },
    breadcrumb: 'Freda Connect',
    title: 'Freda Connect · Noms de domaine et DNS · Freda Workspace',
    description: 'Freda Connect : enregistrez et gérez vos noms de domaine (.com, .net, .org…) et vos DNS. Whois privé gratuit, MonCash ou carte. Le .ht arrive bientôt.',
    h1: 'Freda Connect : noms de domaine et DNS de Freda Workspace',
    lead: 'Freda Connect est le produit de noms de domaine de Freda Workspace, une marque de Freda Pay LLC. Il permet de rechercher et d’enregistrer un nom de domaine international pour 1 à 10 ans, de gérer ses enregistrements DNS, de connecter un domaine que vous possédez déjà et de le relier automatiquement à Freda Mail. Le nom de domaine en .ht arrive bientôt.',
    facts: [
      ['Produit', 'Freda Connect, noms de domaine et DNS de Freda Workspace (Freda Pay LLC)'],
      ['Extensions', '.com, .net, .org, .co, .store, .online, .site, .tech, .io ; le .ht arrive bientôt'],
      ['Durée', 'De 1 à 10 ans'],
      ['Prix', 'À partir de {domain_from} la première année selon l’extension ; prix exact affiché avant paiement ; le renouvellement peut coûter plus cher'],
      ['Inclus', 'Confidentialité Whois gratuite, verrouillage anti-transfert, éditeur DNS complet, rappels de renouvellement'],
      ['Domaine existant', 'Vous pouvez connecter un domaine que vous possédez déjà, y compris un .ht'],
      ['Paiement', 'Carte et autres moyens Stripe selon votre pays ; MonCash et NatCash'],
      ['Produit associé', 'Freda Mail (email professionnel, 1 boîte gratuite sur votre domaine)'],
    ],
    sections: [
      {
        h2: 'Ce que fait Freda Connect',
        paragraphs: ['Freda Connect vous permet de chercher un nom de domaine, de l’enregistrer pour 1 à 10 ans, de gérer ses enregistrements DNS (A, AAAA, CNAME, MX, TXT…) depuis votre espace, de verrouiller le domaine contre les transferts non voulus et de demander le code d’autorisation (EPP) pour le transférer ailleurs. Freda Connect enregistre les domaines par l’intermédiaire d’un registraire partenaire accrédité ICANN.'],
      },
      {
        h2: 'Le nom de domaine .ht arrive bientôt',
        paragraphs: ['Freda Connect prépare l’enregistrement des noms de domaine en .ht (domaine national d’Haïti, géré par NIC Haïti). La date de lancement et les prix seront annoncés ici ; aucun prix n’est fixé pour l’instant. Si vous possédez déjà un .ht, vous pouvez le connecter dès maintenant à Freda Workspace pour y créer des adresses email professionnelles. Pour être prévenu du lancement, écrivez à support@fredaworkspace.com.'],
      },
      {
        h2: 'Démarrer avec Freda Connect',
        steps: [
          'Tapez le nom de votre entreprise dans la recherche de domaine.',
          'Choisissez l’extension et la durée, puis payez par carte, MonCash ou NatCash.',
          'Gérez vos enregistrements DNS depuis votre espace ; si vous ajoutez l’email professionnel, MX, SPF, DKIM et DMARC sont configurés automatiquement.',
        ],
      },
      {
        h2: 'Freda Connect et Freda Mail, ensemble',
        paragraphs: ['Chaque compte Freda Workspace a droit à 1 boîte email professionnelle gratuite sur son propre domaine avec Freda Mail. Le nom de domaine, lui, est payant.'],
      },
    ],
    faq: [
      ['Qu’est-ce que Freda Connect ?', 'Freda Connect est le produit de noms de domaine et de DNS de Freda Workspace, une marque de Freda Pay LLC : recherche, enregistrement, gestion DNS et connexion de domaines existants.'],
      ['Quelles extensions propose Freda Connect ?', 'Freda Connect propose .com, .net, .org, .co, .store, .online, .site, .tech et .io. Le .ht arrive bientôt, sans date ni prix annoncés pour l’instant.'],
      ['Combien coûte un nom de domaine avec Freda Connect ?', 'Les prix commencent à {domain_from} la première année selon l’extension. Le prix exact et le prix de renouvellement sont affichés avant le paiement.'],
      ['Puis-je connecter un domaine que je possède déjà ?', 'Oui, y compris un domaine en .ht. Freda Connect affiche les enregistrements DNS à ajouter chez votre fournisseur, puis vérifie la connexion.'],
      ['Quelle est la différence entre Freda Connect et Freda Mail ?', 'Freda Connect gère les noms de domaine et le DNS ; Freda Mail gère les boîtes email professionnelles. Les deux sont des produits de Freda Workspace.'],
    ],
    related: [['freda-mail.html', 'Freda Mail : email professionnel'], ['enregistrer-nom-de-domaine.html', 'Enregistrer un nom de domaine'], ['nom-de-domaine-haiti.html', 'Nom de domaine pour Haïti']],
    cta: [['Chercher un nom de domaine', 'domaines.html'], ['Voir Freda Mail', 'freda-mail.html']],
    product: { name: 'Freda Connect', description: 'Enregistrement et gestion de noms de domaine internationaux (.com, .net, .org…) avec confidentialité Whois gratuite et éditeur DNS complet.', offers: [{ name: 'Nom de domaine, première année (à partir de)', price: '{domain_num}', description: 'Prix selon l’extension, affiché avant paiement' }] },
  },
  {
    id: 'freda-connect-ht', priority: '0.8', lang: HT, path: 'ht/freda-connect.html', alt: { fr: 'freda-connect.html', en: 'en/freda-connect.html' },
    breadcrumb: 'Freda Connect',
    title: 'Freda Connect · Non domèn ak DNS · Freda Workspace',
    description: 'Freda Connect: anrejistre epi jere non domèn ou (.com, .net, .org…) ak DNS ou. Whois prive gratis, 1 a 10 an, kat, MonCash oswa NatCash. .ht la ap vini byento.',
    h1: 'Freda Connect: non domèn ak DNS Freda Workspace',
    lead: 'Freda Connect se pwodwi non domèn Freda Workspace, yon mak Freda Pay LLC. Li pèmèt ou chèche epi anrejistre yon non domèn entènasyonal pou 1 a 10 an, jere enregistreman DNS li yo, konekte yon domèn ou genyen deja epi lye l otomatikman ak Freda Mail. Non domèn .ht la ap vini byento.',
    facts: [
      ['Pwodwi', 'Freda Connect, non domèn ak DNS Freda Workspace (Freda Pay LLC)'],
      ['Ekstansyon', '.com, .net, .org, .co, .store, .online, .site, .tech, .io; .ht la ap vini byento'],
      ['Dire', 'De 1 a 10 an'],
      ['Pri', 'A pati de {domain_from} premye ane a dapre ekstansyon an; pri egzak la parèt anvan ou peye; renouvèlman an ka koute pi chè'],
      ['Sa ki enkli', 'Konfidansyalite Whois gratis, vèwouyaj kont transfè, editè DNS konplè, rapèl renouvèlman'],
      ['Domèn ki egziste deja', 'Ou ka konekte yon domèn ou genyen deja, menm yon .ht'],
      ['Peman', 'Kat ak lòt mwayen Stripe dapre peyi w; MonCash ak NatCash'],
      ['Pwodwi asosye', 'Freda Mail (imèl pwofesyonèl, 1 bwat gratis sou domèn ou)'],
    ],
    sections: [
      {
        h2: 'Sa Freda Connect fè',
        paragraphs: ['Freda Connect pèmèt ou chèche yon non domèn, anrejistre l pou 1 a 10 an, jere enregistreman DNS li yo (A, AAAA, CNAME, MX, TXT…) depi nan espas ou, vèwouye domèn nan kont transfè ou pa vle epi mande kòd otorizasyon an (EPP) pou transfere l yon lòt kote. Freda Connect anrejistre domèn yo pa mwayen yon rejistrè patnè ICANN akredite.'],
      },
      {
        h2: 'Non domèn .ht la ap vini byento',
        paragraphs: ['Freda Connect ap prepare enskripsyon non domèn .ht yo (domèn nasyonal Ayiti, NIC Ayiti jere l). Nou pral anonse dat lansman an ak pri yo isit la; pa gen pri ki fikse pou kounye a. Si ou genyen yon .ht deja, ou ka konekte l ak Freda Workspace depi kounye a pou kreye adrès imèl pwofesyonèl sou li. Pou yo avèti w lè l lanse, ekri nan support@fredaworkspace.com.'],
      },
      {
        h2: 'Kijan pou kòmanse ak Freda Connect',
        steps: [
          'Tape non biznis ou nan rechèch domèn nan.',
          'Chwazi ekstansyon an ak dire a, epi peye ak kat, MonCash oswa NatCash.',
          'Jere enregistreman DNS ou yo depi nan espas ou; si ou ajoute imèl pwofesyonèl la, MX, SPF, DKIM ak DMARC konfigire otomatikman.',
        ],
      },
    ],
    faq: [
      ['Kisa Freda Connect ye?', 'Freda Connect se pwodwi non domèn ak DNS Freda Workspace, yon mak Freda Pay LLC: rechèch, enskripsyon, jesyon DNS ak koneksyon domèn ki egziste deja.'],
      ['Ki ekstansyon Freda Connect ofri?', 'Freda Connect ofri .com, .net, .org, .co, .store, .online, .site, .tech ak .io. .ht la ap vini byento, san dat ni pri anonse pou kounye a.'],
      ['Konbyen yon non domèn koute ak Freda Connect?', 'Pri yo kòmanse a {domain_from} premye ane a dapre ekstansyon an. Pri egzak la ak pri renouvèlman an parèt anvan ou peye.'],
      ['Èske mwen ka konekte yon domèn mwen genyen deja?', 'Wi, menm yon domèn .ht. Freda Connect montre enregistreman DNS pou ajoute kote founisè ou a, apre sa li verifye koneksyon an.'],
      ['Ki diferans ki genyen ant Freda Connect ak Freda Mail?', 'Freda Connect jere non domèn ak DNS; Freda Mail jere bwat imèl pwofesyonèl yo. Tou de se pwodwi Freda Workspace.'],
    ],
    related: [['ht/freda-mail.html', 'Freda Mail: imèl pwofesyonèl'], ['ht/non-domenn-ayiti.html', 'Non domèn pou Ayiti'], ['ht/kiyes-nou-ye.html', 'Kiyès nou ye?']],
    cta: [['Chèche yon non domèn', 'domaines.html'], ['Gade Freda Mail', 'ht/freda-mail.html']],
    product: { name: 'Freda Connect', description: 'Enskripsyon ak jesyon non domèn entènasyonal (.com, .net, .org…) ak konfidansyalite Whois gratis ak editè DNS konplè.', offers: [{ name: 'Non domèn, premye ane (a pati de)', price: '{domain_num}', description: 'Pri a depann de ekstansyon an, li parèt anvan ou peye' }] },
  },
  {
    id: 'freda-connect-en', priority: '0.8', lang: EN, path: 'en/freda-connect.html', alt: { fr: 'freda-connect.html', ht: 'ht/freda-connect.html' },
    breadcrumb: 'Freda Connect',
    title: 'Freda Connect · Domain names and DNS · Freda Workspace',
    description: 'Freda Connect: register and manage your domain names (.com, .net, .org…) and DNS. Free WHOIS privacy, MonCash or card. .ht is coming soon.',
    h1: 'Freda Connect: domain names and DNS from Freda Workspace',
    lead: 'Freda Connect is the domain-name product of Freda Workspace, a brand of Freda Pay LLC. It lets you search for and register an international domain name for 1 to 10 years, manage its DNS records, connect a domain you already own and link it automatically to Freda Mail. The .ht domain name is coming soon.',
    facts: [
      ['Product', 'Freda Connect, domain names and DNS from Freda Workspace (Freda Pay LLC)'],
      ['Extensions', '.com, .net, .org, .co, .store, .online, .site, .tech, .io; .ht is coming soon'],
      ['Length', '1 to 10 years'],
      ['Price', 'From {domain_from} for the first year depending on the extension; exact price shown before payment; renewal can cost more'],
      ['Included', 'Free WHOIS privacy, transfer lock, full DNS editor, renewal reminders'],
      ['Existing domain', 'You can connect a domain you already own, including a .ht'],
      ['Payment', 'Card and other Stripe methods depending on your country; MonCash and NatCash'],
      ['Related product', 'Freda Mail (professional email, 1 free mailbox on your domain)'],
    ],
    sections: [
      {
        h2: 'What Freda Connect does',
        paragraphs: ['Freda Connect lets you search for a domain name, register it for 1 to 10 years, manage its DNS records (A, AAAA, CNAME, MX, TXT…) from your account, lock the domain against unwanted transfers and request the authorization (EPP) code to move it elsewhere. Freda Connect registers domains through a partner registrar accredited by ICANN.'],
      },
      {
        h2: 'The .ht domain name is coming soon',
        paragraphs: ['Freda Connect is preparing registration of .ht domain names (Haiti’s national domain, managed by NIC Haiti). The launch date and prices will be announced here; no price is set yet. If you already own a .ht you can connect it to Freda Workspace now and create professional email addresses on it. To be told when it launches, write to support@fredaworkspace.com.'],
      },
      {
        h2: 'Getting started with Freda Connect',
        steps: [
          'Type your business name in the domain search.',
          'Choose the extension and length, then pay by card, MonCash or NatCash.',
          'Manage your DNS records from your account; if you add professional email, MX, SPF, DKIM and DMARC are configured automatically.',
        ],
      },
    ],
    faq: [
      ['What is Freda Connect?', 'Freda Connect is the domain-name and DNS product of Freda Workspace, a brand of Freda Pay LLC: search, registration, DNS management and connection of existing domains.'],
      ['Which extensions does Freda Connect offer?', 'Freda Connect offers .com, .net, .org, .co, .store, .online, .site, .tech and .io. .ht is coming soon, with no date or price announced yet.'],
      ['How much does a domain name cost with Freda Connect?', 'Prices start at {domain_from} for the first year depending on the extension. The exact price and the renewal price are shown before payment.'],
      ['Can I connect a domain I already own?', 'Yes, including a .ht domain. Freda Connect shows the DNS records to add at your provider, then checks the connection.'],
      ['What is the difference between Freda Connect and Freda Mail?', 'Freda Connect manages domain names and DNS; Freda Mail manages professional mailboxes. Both are Freda Workspace products.'],
    ],
    related: [['en/freda-mail.html', 'Freda Mail: professional email'], ['en/register-domain-name.html', 'Register a domain name'], ['en/about-us.html', 'About us']],
    cta: [['Search a domain name', 'domaines.html'], ['See Freda Mail', 'en/freda-mail.html']],
    product: { name: 'Freda Connect', description: 'Registration and management of international domain names (.com, .net, .org…) with free WHOIS privacy and a full DNS editor.', offers: [{ name: 'Domain name, first year (from)', price: '{domain_num}', description: 'Price depends on the extension, shown before payment' }] },
  },
];
