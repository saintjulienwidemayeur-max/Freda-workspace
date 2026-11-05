/**
 * Page de comparaison honnête « Freda Mail vs Gmail / Google Workspace / Zoho » (FR / HT / EN). Fusionnée dans landing-content.js.
 * Règles : aucun prix de concurrent n'est cité (ils changent, on renvoie vers leurs sites) ; on dit ce que Freda Mail fait vraiment
 * et on recommande les concurrents là où ils conviennent mieux.
 */
const FR = 'fr', HT = 'ht', EN = 'en';

module.exports = [
  {
    id: 'compare', priority: '0.7', lang: FR, path: 'freda-mail-vs-gmail-google-workspace-zoho.html', alt: { ht: 'ht/freda-mail-kont-gmail-google-workspace-zoho.html', en: 'en/freda-mail-vs-gmail-google-workspace-zoho.html' },
    breadcrumb: 'Freda Mail vs Gmail, Google Workspace, Zoho',
    title: 'Freda Mail vs Gmail, Google Workspace, Zoho : différences',
    description: 'Freda Mail, Gmail, Google Workspace ou Zoho Mail ? Ce que propose Freda Mail (1 boîte gratuite sur votre domaine, MonCash) et quand choisir un autre.',
    h1: 'Freda Mail vs Gmail / Google Workspace / Zoho : quelle différence ?',
    lead: 'Freda Mail est une messagerie professionnelle sur votre propre nom de domaine, pensée pour les entrepreneurs d’Haïti et d’ailleurs : {free_mailboxes} boîte gratuite par compte, paiement en MonCash ou NatCash, support en trois langues. Gmail, Google Workspace et Zoho Mail sont de bons produits qui font plus de choses ; cette page explique honnêtement qui devrait choisir quoi. Nous ne citons pas les prix de ces fournisseurs, car ils changent : consultez leurs sites officiels.',
    facts: [
      ['Ce qu’est Freda Mail', 'Une messagerie professionnelle (adresses sur votre domaine, application mobile, IMAP/SMTP), pas une suite bureautique'],
      ['Boîte gratuite', '{free_mailboxes} boîte (1 Go) par compte, sans abonnement ni carte bancaire ; le nom de domaine, lui, est payant'],
      ['Offres payantes', 'Starter {starter_price}/mois, Business {business_price}/mois, Enterprise {enterprise_price}/mois'],
      ['Paiement', 'MonCash, NatCash, carte ; solde prépayé pour les abonnements. Frais de traitement : carte 3,5 % + 0,40 $, MonCash/NatCash 6 %'],
      ['Support', 'Français, créole haïtien et anglais, du lundi au samedi, de 8 h à 18 h (heure d’Haïti)'],
      ['Quand choisir un autre', 'Si vous avez besoin d’une suite bureautique, d’agendas partagés ou de visioconférence intégrés : Google Workspace ou Zoho'],
      ['Prix des concurrents', 'Non indiqués ici : ils changent, consultez les sites de Google et de Zoho'],
    ],
    sections: [
      {
        h2: 'Les différences en un coup d’œil',
        paragraphs: ['Les cellules « À vérifier » signifient que nous ne l’affirmons pas : consultez le site du fournisseur pour la situation actuelle.'],
        table: {
          head: ['', 'Freda Mail', 'Gmail (compte gratuit)', 'Google Workspace', 'Zoho Mail'],
          rows: [
            ['Adresse sur votre propre domaine', 'Oui', 'Non : adresse @gmail.com', 'Oui', 'Oui'],
            ['Boîte gratuite', '{free_mailboxes} boîte (1 Go) par compte ; domaine payant', 'Oui, avec une adresse @gmail.com', 'Non : offre payante', 'À vérifier'],
            ['Suite bureautique, agenda, visioconférence', 'Non : messagerie seulement', 'Services Google grand public', 'Oui, suite complète', 'Selon l’offre'],
            ['Paiement en MonCash ou NatCash', 'Oui', 'Sans objet (gratuit)', 'À vérifier', 'À vérifier'],
            ['Support en créole haïtien', 'Oui', 'À vérifier', 'À vérifier', 'À vérifier'],
            ['Prix', 'Voir la page des tarifs de Freda Workspace', 'Gratuit', 'Voir le site de Google', 'Voir le site de Zoho'],
          ],
        },
      },
      {
        h2: 'Quand choisir Freda Mail',
        paragraphs: [
          'Choisissez Freda Mail si vous voulez surtout une adresse professionnelle sur votre propre nom de domaine (contact@votre-entreprise.com), sans abonnement pour démarrer, et si vous payez plus facilement en MonCash ou NatCash qu’avec une carte internationale. Le domaine et l’email se configurent au même endroit, avec SPF, DKIM et DMARC ajoutés pour vous.',
          'Vos boîtes fonctionnent aussi avec n’importe quel logiciel compatible IMAP et SMTP, y compris Gmail, Outlook et Apple Mail : vous n’êtes pas obligé de changer vos habitudes de lecture.',
        ],
      },
      {
        h2: 'Quand choisir Gmail, Google Workspace ou Zoho',
        paragraphs: [
          'Choisissez Gmail si vous n’avez besoin que d’une adresse personnelle gratuite et que l’adresse @gmail.com vous suffit.',
          'Choisissez Google Workspace ou Zoho si votre équipe a besoin d’une suite complète : documents et tableurs partagés, agendas communs, visioconférence, stockage de fichiers et outils d’administration avancés. Freda Mail ne les propose pas.',
          'Les deux démarches se combinent : vous pouvez acheter votre nom de domaine chez Freda Connect et l’utiliser avec le fournisseur de messagerie de votre choix, ou garder un outil collaboratif de votre côté et prendre uniquement vos adresses chez Freda Mail.',
        ],
      },
      {
        h2: 'Comment comparer les prix',
        paragraphs: ['Pour une adresse sur votre propre domaine, il faut dans tous les cas un nom de domaine, qui est payant chez tous les fournisseurs. Comparez ensuite le coût par boîte et par mois sur les sites officiels, à la date où vous décidez. Chez Freda Workspace, les prix sont ceux de la page des tarifs, en dollars américains, avec conversion en gourdes au taux indiqué avant le paiement.'],
      },
    ],
    faq: [
      ['Freda Mail remplace-t-il Google Workspace ?', 'Pas entièrement. Freda Mail est une messagerie professionnelle : adresses sur votre domaine, application mobile, compatibilité IMAP et SMTP. Si votre équipe a besoin de documents partagés, d’agendas communs ou de visioconférence intégrés, Google Workspace ou Zoho conviennent mieux.'],
      ['Pourquoi ne pas simplement utiliser Gmail ?', 'Gmail gratuit vous donne une adresse @gmail.com. Une adresse sur votre propre domaine (contact@votre-entreprise.com) inspire plus confiance à vos clients et reste la vôtre quel que soit le fournisseur. Si vous n’avez pas besoin de cela, Gmail suffit.'],
      ['Puis-je lire mes emails Freda Mail dans Gmail ?', 'Oui. Vos boîtes fonctionnent avec tout logiciel compatible IMAP et SMTP, dont Gmail, Outlook et Apple Mail, ainsi qu’avec l’application Freda Mail.'],
      ['Freda Mail est-il moins cher que Google Workspace ou Zoho ?', 'Nous ne publions pas leurs prix, car ils changent. Ce que nous pouvons dire : Freda Mail offre {free_mailboxes} boîte gratuite par compte, et les offres payantes commencent à {starter_price}/mois. Comparez avec les sites de Google et de Zoho au moment de décider.'],
      ['Puis-je payer Freda Mail avec MonCash ou NatCash ?', 'Oui. MonCash et NatCash ne permettent pas de prélèvement automatique : vous rechargez un solde Freda Workspace qui paie ensuite votre offre automatiquement. Frais de traitement : MonCash et NatCash 6 %, carte 3,5 % + 0,40 $.'],
    ],
    related: [['freda-mail.html', 'Freda Mail : email professionnel'], ['email-pro-gratuit.html', 'Email pro gratuit avec votre domaine'], ['acheter-domaine-moncash.html', 'Payer avec MonCash ou NatCash']],
    cta: [['Créer mon email Freda Mail', 'inscription.html'], ['Voir les offres', 'index.html#tarifs']],
  },
  {
    id: 'compare-ht', priority: '0.6', lang: HT, path: 'ht/freda-mail-kont-gmail-google-workspace-zoho.html', alt: { fr: 'freda-mail-vs-gmail-google-workspace-zoho.html', en: 'en/freda-mail-vs-gmail-google-workspace-zoho.html' },
    breadcrumb: 'Freda Mail kont Gmail, Google Workspace, Zoho',
    title: 'Freda Mail kont Gmail, Google Workspace, Zoho : diferans',
    description: 'Freda Mail, Gmail, Google Workspace oswa Zoho Mail? Sa Freda Mail ofri (1 bwat gratis sou domèn ou, MonCash) ak ki lè pou chwazi yon lòt.',
    h1: 'Freda Mail kont Gmail / Google Workspace / Zoho: ki diferans?',
    lead: 'Freda Mail se yon imèl pwofesyonèl sou pwòp non domèn ou, fèt pou antreprenè Ayiti ak lòt kote: {free_mailboxes} bwat gratis pou chak kont, peman ak MonCash oswa NatCash, sipò nan twa lang. Gmail, Google Workspace ak Zoho Mail se bon pwodwi ki fè plis bagay; paj sa a esplike onètman ki moun ki ta dwe chwazi kisa. Nou pa site pri founisè sa yo, paske yo chanje: gade sit ofisyèl yo.',
    facts: [
      ['Sa Freda Mail ye', 'Yon imèl pwofesyonèl (adrès sou domèn ou, aplikasyon mobil, IMAP/SMTP), se pa yon suit biwotik'],
      ['Bwat gratis', '{free_mailboxes} bwat (1 Go) pou chak kont, san abònman ni kat labank; non domèn nan, li menm, peye'],
      ['Òf ki peye', 'Starter {starter_price}/mwa, Business {business_price}/mwa, Enterprise {enterprise_price}/mwa'],
      ['Peman', 'MonCash, NatCash, kat; balans prepeye pou abònman yo. Frè pwosesis: kat 3,5 % + 0,40 $, MonCash/NatCash 6 %'],
      ['Sipò', 'Fransè, kreyòl ayisyen ak anglè, de lendi a samdi, de 8 è nan maten rive 6 è nan aswè (lè Ayiti)'],
      ['Ki lè pou chwazi yon lòt', 'Si w bezwen yon suit biwotik, ajanda pataje oswa videyokonferans entegre: Google Workspace oswa Zoho'],
      ['Pri konkiran yo', 'Nou pa site yo isit la: yo chanje, gade sit Google ak sit Zoho'],
    ],
    sections: [
      {
        h2: 'Diferans yo yon kout je',
        paragraphs: ['Selil ki di “Verifye” vle di nou pa afime sa: gade sit founisè a pou sitiyasyon jodi a.'],
        table: {
          head: ['', 'Freda Mail', 'Gmail (kont gratis)', 'Google Workspace', 'Zoho Mail'],
          rows: [
            ['Adrès sou pwòp domèn ou', 'Wi', 'Non: adrès @gmail.com', 'Wi', 'Wi'],
            ['Bwat gratis', '{free_mailboxes} bwat (1 Go) pou chak kont; domèn nan peye', 'Wi, ak yon adrès @gmail.com', 'Non: òf ki peye', 'Verifye'],
            ['Suit biwotik, ajanda, videyokonferans', 'Non: imèl sèlman', 'Sèvis Google pou piblik la', 'Wi, suit konplè', 'Dapre òf la'],
            ['Peman ak MonCash oswa NatCash', 'Wi', 'Pa konsène (gratis)', 'Verifye', 'Verifye'],
            ['Sipò an kreyòl ayisyen', 'Wi', 'Verifye', 'Verifye', 'Verifye'],
            ['Pri', 'Gade paj tarif Freda Workspace', 'Gratis', 'Gade sit Google', 'Gade sit Zoho'],
          ],
        },
      },
      {
        h2: 'Ki lè pou chwazi Freda Mail',
        paragraphs: [
          'Chwazi Freda Mail si ou vle sitou yon adrès pwofesyonèl sou pwòp non domèn ou (kontak@biznis-ou.com), san abònman pou kòmanse, epi si ou peye pi fasil ak MonCash oswa NatCash pase ak yon kat entènasyonal. Domèn nan ak imèl la konfigire nan menm kote, ak SPF, DKIM ak DMARC ajoute pou ou.',
          'Bwat ou yo mache tou ak nenpòt lojisyèl ki sipòte IMAP ak SMTP, ansanm ak Gmail, Outlook ak Apple Mail: ou pa oblije chanje fason ou abitye li imèl ou.',
        ],
      },
      {
        h2: 'Ki lè pou chwazi Gmail, Google Workspace oswa Zoho',
        paragraphs: [
          'Chwazi Gmail si ou bezwen sèlman yon adrès pèsonèl gratis epi adrès @gmail.com an ase pou ou.',
          'Chwazi Google Workspace oswa Zoho si ekip ou a bezwen yon suit konplè: dokiman ak tablo pataje, ajanda an komen, videyokonferans, stokaj fichye ak zouti administrasyon avanse. Freda Mail pa ofri yo.',
          'De demach yo ka melanje: ou ka achte non domèn ou nan Freda Connect epi sèvi ak li ak founisè imèl ou chwazi a, oswa kenbe yon zouti kolaboratif sou kote ou epi pran adrès ou yo sèlman nan Freda Mail.',
        ],
      },
      {
        h2: 'Kijan pou konpare pri yo',
        paragraphs: ['Pou yon adrès sou pwòp domèn ou, ou toujou bezwen yon non domèn, ki peye nan tout founisè. Apre sa, konpare kou pa bwat ak pa mwa sou sit ofisyèl yo, nan dat ou deside a. Nan Freda Workspace, pri yo se sa ki sou paj tarif la, an dola ameriken, ak konvèsyon an goud ak to ki endike anvan ou peye.'],
      },
    ],
    faq: [
      ['Èske Freda Mail ranplase Google Workspace?', 'Pa nèt. Freda Mail se yon imèl pwofesyonèl: adrès sou domèn ou, aplikasyon mobil, konpatibilite IMAP ak SMTP. Si ekip ou a bezwen dokiman pataje, ajanda an komen oswa videyokonferans entegre, Google Workspace oswa Zoho pi bon.'],
      ['Poukisa pa sèvi ak Gmail senpleman?', 'Gmail gratis ba ou yon adrès @gmail.com. Yon adrès sou pwòp domèn ou (kontak@biznis-ou.com) bay kliyan ou plis konfyans epi li rete pa w kèlkeswa founisè a. Si ou pa bezwen sa, Gmail ase.'],
      ['Èske mwen ka li imèl Freda Mail mwen nan Gmail?', 'Wi. Bwat ou yo mache ak nenpòt lojisyèl ki sipòte IMAP ak SMTP, tankou Gmail, Outlook ak Apple Mail, ansanm ak aplikasyon Freda Mail la.'],
      ['Èske Freda Mail pi bon mache pase Google Workspace oswa Zoho?', 'Nou pa pibliye pri yo, paske yo chanje. Sa nou ka di: Freda Mail ofri {free_mailboxes} bwat gratis pou chak kont, epi òf ki peye yo kòmanse a {starter_price}/mwa. Konpare ak sit Google ak sit Zoho lè ou pral deside.'],
      ['Èske mwen ka peye Freda Mail ak MonCash oswa NatCash?', 'Wi. MonCash ak NatCash pa pèmèt retire lajan otomatikman: ou rechaje yon balans Freda Workspace ki peye òf ou a otomatikman apre. Frè pwosesis: MonCash ak NatCash 6 %, kat 3,5 % + 0,40 $.'],
    ],
    related: [['ht/freda-mail.html', 'Freda Mail: imèl pwofesyonèl'], ['ht/imel-pwofesyonel-gratis.html', 'Imèl pwofesyonèl gratis ak domèn ou'], ['ht/peye-ak-moncash-natcash.html', 'Peye ak MonCash oswa NatCash']],
    cta: [['Kreye imèl Freda Mail mwen', 'inscription.html'], ['Gade òf yo', 'index.html#tarifs']],
  },
  {
    id: 'compare-en', priority: '0.6', lang: EN, path: 'en/freda-mail-vs-gmail-google-workspace-zoho.html', alt: { fr: 'freda-mail-vs-gmail-google-workspace-zoho.html', ht: 'ht/freda-mail-kont-gmail-google-workspace-zoho.html' },
    breadcrumb: 'Freda Mail vs Gmail, Google Workspace, Zoho',
    title: 'Freda Mail vs Gmail, Google Workspace, Zoho: differences',
    description: 'Freda Mail, Gmail, Google Workspace or Zoho Mail? What Freda Mail offers (1 free mailbox on your domain, MonCash) and when to choose another.',
    h1: 'Freda Mail vs Gmail / Google Workspace / Zoho: what is the difference?',
    lead: 'Freda Mail is professional email on your own domain name, built for entrepreneurs in Haiti and elsewhere: {free_mailboxes} free mailbox per account, payment with MonCash or NatCash, support in three languages. Gmail, Google Workspace and Zoho Mail are good products that do more; this page explains honestly who should choose what. We do not quote those providers’ prices because they change: check their official websites.',
    facts: [
      ['What Freda Mail is', 'Professional email (addresses on your domain, mobile app, IMAP/SMTP), not an office suite'],
      ['Free mailbox', '{free_mailboxes} mailbox (1 GB) per account, no subscription, no bank card; the domain name is paid'],
      ['Paid plans', 'Starter {starter_price}/month, Business {business_price}/month, Enterprise {enterprise_price}/month'],
      ['Payment', 'MonCash, NatCash, card; prepaid balance for subscriptions. Processing fees: card 3.5% + $0.40, MonCash/NatCash 6%'],
      ['Support', 'French, Haitian Creole and English, Monday to Saturday, 8am to 6pm (Haiti time)'],
      ['When to choose another', 'If you need a built-in office suite, shared calendars or video meetings: Google Workspace or Zoho'],
      ['Competitors’ prices', 'Not listed here because they change; see the Google and Zoho websites'],
    ],
    sections: [
      {
        h2: 'The differences at a glance',
        paragraphs: ['“Check” means we do not claim it either way: see the provider’s website for the current situation.'],
        table: {
          head: ['', 'Freda Mail', 'Gmail (free account)', 'Google Workspace', 'Zoho Mail'],
          rows: [
            ['Address on your own domain', 'Yes', 'No: @gmail.com address', 'Yes', 'Yes'],
            ['Free mailbox', '{free_mailboxes} mailbox (1 GB) per account; domain is paid', 'Yes, with an @gmail.com address', 'No: paid plans', 'Check'],
            ['Office suite, calendar, video meetings', 'No: email only', 'Consumer Google services', 'Yes, full suite', 'Depends on the plan'],
            ['Pay with MonCash or NatCash', 'Yes', 'Not applicable (free)', 'Check', 'Check'],
            ['Support in Haitian Creole', 'Yes', 'Check', 'Check', 'Check'],
            ['Price', 'See the Freda Workspace pricing page', 'Free', 'See Google’s website', 'See Zoho’s website'],
          ],
        },
      },
      {
        h2: 'When to choose Freda Mail',
        paragraphs: [
          'Choose Freda Mail if what you mainly want is a professional address on your own domain name (contact@your-company.com), with no subscription to start, and if paying with MonCash or NatCash is easier for you than an international card. The domain and the email are set up in one place, with SPF, DKIM and DMARC added for you.',
          'Your mailboxes also work with any IMAP and SMTP client, including Gmail, Outlook and Apple Mail, so you do not have to change how you read your email.',
        ],
      },
      {
        h2: 'When to choose Gmail, Google Workspace or Zoho',
        paragraphs: [
          'Choose Gmail if you only need a free personal address and an @gmail.com address is enough.',
          'Choose Google Workspace or Zoho if your team needs a full suite: shared documents and spreadsheets, shared calendars, video meetings, file storage and advanced admin tools. Freda Mail does not offer these.',
          'The two approaches can be combined: you can buy your domain name from Freda Connect and use it with the email provider of your choice, or keep a collaboration tool elsewhere and take only your addresses from Freda Mail.',
        ],
      },
      {
        h2: 'How to compare prices',
        paragraphs: ['For an address on your own domain you always need a domain name, which every provider charges for. Then compare the cost per mailbox per month on the official websites, on the day you decide. At Freda Workspace, prices are those on the pricing page, in US dollars, with conversion to gourdes at the rate shown before you pay.'],
      },
    ],
    faq: [
      ['Does Freda Mail replace Google Workspace?', 'Not entirely. Freda Mail is professional email: addresses on your domain, a mobile app, IMAP and SMTP compatibility. If your team needs shared documents, shared calendars or built-in video meetings, Google Workspace or Zoho fit better.'],
      ['Why not just use Gmail?', 'Free Gmail gives you an @gmail.com address. An address on your own domain (contact@your-company.com) builds more trust with customers and stays yours whichever provider you use. If you do not need that, Gmail is enough.'],
      ['Can I read my Freda Mail email in Gmail?', 'Yes. Your mailboxes work with any IMAP and SMTP client, including Gmail, Outlook and Apple Mail, as well as the Freda Mail app.'],
      ['Is Freda Mail cheaper than Google Workspace or Zoho?', 'We do not publish their prices because they change. What we can say: Freda Mail includes {free_mailboxes} free mailbox per account, and paid plans start at {starter_price}/month. Compare with Google’s and Zoho’s websites when you decide.'],
      ['Can I pay for Freda Mail with MonCash or NatCash?', 'Yes. MonCash and NatCash do not allow automatic charges, so you top up a Freda Workspace balance that then pays your plan automatically. Processing fees: MonCash and NatCash 6%, card 3.5% + $0.40.'],
    ],
    related: [['en/freda-mail.html', 'Freda Mail: professional email'], ['en/free-business-email-haiti.html', 'Free business email'], ['en/register-domain-name.html', 'Register a domain name']],
    cta: [['Create my Freda Mail address', '../inscription.html'], ['See the plans', '../index.html#tarifs']],
  },
];
