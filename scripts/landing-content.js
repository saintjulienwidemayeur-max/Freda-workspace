/**
 * Contenu des pages d'atterrissage SEO / GEO (français et créole haïtien). Source unique : scripts/build-landing.js en tire
 * les pages HTML, le JSON-LD (FAQPage, BreadcrumbList, Product), sitemap.xml, llms.txt et llms-full.txt, donc rien ne peut diverger.
 * Les prix viennent de assets/js/config.js (valeurs par défaut) ; les faits ci-dessous ne doivent décrire QUE ce que le service fait vraiment.
 *
 * Chaque page : { id, lang, path, alt: {fr?, ht?}, title, description, h1, lead, facts, sections, faq, related, cta, breadcrumb }
 * Les chaînes peuvent contenir {free_mailboxes}, {starter_price}, {business_price}, {enterprise_price}, {starter_boxes}, {business_boxes}, {domain_from} ({com_ref}).
 */

const FR = 'fr', HT = 'ht';

const pages = [
  /* ---------------------------------------------------------------- email pro gratuit (FR) */
  {
    id: 'email-gratuit', geo: true, lang: FR, path: 'email-pro-gratuit.html', alt: { ht: 'ht/imel-pwofesyonel-gratis.html', en: 'en/free-business-email-haiti.html' },
    breadcrumb: 'Email pro gratuit',
    title: 'Email pro gratuit avec votre domaine · Freda Workspace',
    description: '1 adresse email professionnelle gratuite sur votre propre nom de domaine, sans abonnement ni carte bancaire. Payez en MonCash, NatCash ou carte pour plus.',
    h1: 'Email professionnel gratuit avec votre propre nom de domaine',
    lead: 'Oui : Freda Workspace offre {free_mailboxes} boîte email professionnelle gratuite sur votre propre nom de domaine (par exemple contact@votre-entreprise.com), sans abonnement et sans carte bancaire. Il vous faut seulement un nom de domaine : acheté chez Freda Workspace ou déjà à vous.',
    facts: [
      ['Prix de la boîte gratuite', '0 $, sans abonnement, sans carte bancaire'],
      ['Ce que vous obtenez', '{free_mailboxes} boîte email professionnelle, 1 Go de stockage'],
      ['Ce qu’il faut avoir', 'Un nom de domaine (acheté chez Freda Workspace ou déjà à vous)'],
      ['Le nom de domaine est-il gratuit ?', 'Non : à partir de {domain_from} ({com_ref}) la première année selon l’extension'],
      ['Sécurité de l’email', 'SPF, DKIM et DMARC configurés automatiquement'],
      ['Frais de traitement', 'Carte 3,5 % + 0,40 $ ; MonCash et NatCash 6 % (pour les offres payantes et le domaine)'],
      ['Pour aller plus loin', 'Starter {starter_price}/mois (2 boîtes), Business {business_price}/mois (5 boîtes), Enterprise {enterprise_price}/mois (illimité)'],
    ],
    sections: [
      {
        h2: 'Ce qui est gratuit, et ce qui ne l’est pas',
        paragraphs: ['La boîte email gratuite est un vrai compte professionnel sur votre domaine, pas un essai limité dans le temps. Les offres payantes ajoutent des boîtes et du stockage. Le nom de domaine, lui, reste payant : c’est le seul élément qui coûte quelque chose pour démarrer.'],
        table: {
          head: ['', 'Gratuit', 'Starter', 'Business', 'Enterprise'],
          rows: [
            ['Prix', '0 $', '{starter_price}/mois', '{business_price}/mois', '{enterprise_price}/mois'],
            ['Boîtes email', '{free_mailboxes}', '{starter_boxes}', '{business_boxes}', 'Illimitées'],
            ['Stockage', '1 Go', '2 Go', '15 Go partagés', '5 Go par boîte'],
            ['Paiement', 'Aucun', 'MonCash, NatCash ou carte', 'MonCash, NatCash ou carte', 'MonCash, NatCash ou carte'],
          ],
        },
      },
      {
        h2: 'Comment obtenir votre email pro gratuit en 4 étapes',
        steps: [
          'Créez votre compte Freda Workspace : c’est gratuit et ne demande pas de carte bancaire.',
          'Choisissez votre nom de domaine : achetez-en un (à partir de {domain_from} ({com_ref}) la première année) ou connectez celui que vous possédez déjà, y compris un domaine en .ht.',
          'Freda Workspace ajoute les enregistrements MX, SPF, DKIM et DMARC, ou vous indique exactement quoi coller chez votre fournisseur de domaine, puis vérifie que le domaine est bien connecté.',
          'Créez votre adresse (par exemple contact@votre-entreprise.com) et lisez vos emails dans l’application Freda Mail ou dans n’importe quel logiciel compatible IMAP et SMTP (Outlook, Apple Mail, Gmail).',
        ],
      },
      {
        h2: 'Pourquoi une adresse sur votre domaine plutôt qu’une adresse Gmail',
        paragraphs: [
          'Une adresse comme contact@votre-entreprise.com montre à vos clients qui vous êtes, reste la vôtre quel que soit le fournisseur et vous permet d’ajouter les adresses de vos collaborateurs (ventes@, direction@) le jour où vous grandissez.',
          'Freda Workspace configure SPF, DKIM et DMARC, les trois protections qui aident vos messages à arriver en boîte de réception plutôt qu’en spam. Une adresse toute neuve sur un domaine tout neuf peut tout de même être traitée prudemment par certains fournisseurs au début : écrivez de vrais messages, demandez des réponses et marquez vos premiers envois comme « Pas spam » pour construire votre réputation.',
        ],
      },
    ],
    faq: [
      ['L’email professionnel de Freda Workspace est-il vraiment gratuit ?', 'Oui. Sans abonnement et sans carte bancaire, votre compte a droit à {free_mailboxes} boîte email professionnelle gratuite (1 Go) sur votre propre nom de domaine. Pour plus de boîtes ou plus de stockage, il existe les offres Starter ({starter_price}/mois, 2 boîtes), Business ({business_price}/mois, 5 boîtes) et Enterprise ({enterprise_price}/mois, boîtes illimitées).'],
      ['Ai-je besoin d’un nom de domaine pour avoir un email pro gratuit ?', 'Oui. Une adresse professionnelle repose sur un nom de domaine, par exemple votre-entreprise.com. Vous pouvez l’acheter chez Freda Workspace ou connecter un domaine que vous possédez déjà.'],
      ['Existe-t-il un nom de domaine gratuit ?', 'Non, Freda Workspace ne vend pas de nom de domaine gratuit : les prix commencent à {domain_from} ({com_ref}) la première année selon l’extension, et le prix exact est affiché avant tout paiement. En revanche, si vous avez déjà un domaine, la boîte email est gratuite.'],
      ['Puis-je lire mes emails dans Gmail, Outlook ou Apple Mail ?', 'Oui. Vos boîtes fonctionnent avec tout logiciel compatible IMAP et SMTP, ainsi qu’avec l’application Freda Mail. Les paramètres de connexion sont affichés dans votre espace.'],
      ['Combien de boîtes email puis-je avoir ?', 'Gratuit : {free_mailboxes} boîte. Starter : {starter_boxes} boîtes. Business : {business_boxes} boîtes. Enterprise : boîtes illimitées. Les alias (par exemple info@ qui redirige vers une boîte) ne coûtent rien de plus.'],
      ['Puis-je payer en MonCash ou NatCash ?', 'Oui. Les offres payantes et les noms de domaine se paient avec MonCash, NatCash ou carte. MonCash et NatCash ne permettent pas de prélèvement automatique : vous rechargez un solde Freda Workspace (de 5 $ à 500 $) qui paie ensuite votre offre automatiquement.'],
    ],
    related: [['nom-de-domaine-haiti.html', 'Nom de domaine pour Haïti'], ['acheter-domaine-moncash.html', 'Acheter un domaine avec MonCash ou NatCash'], ['ht/imel-pwofesyonel-gratis.html', 'Kreyòl : imèl pwofesyonèl gratis']],
    cta: [['Créer mon email pro gratuit', 'inscription.html'], ['Chercher un nom de domaine', 'domaines.html']],
    product: { name: 'Boîte email professionnelle gratuite', description: '1 boîte email professionnelle gratuite (1 Go) sur votre propre nom de domaine, avec SPF, DKIM et DMARC configurés automatiquement.', price: 0 },
  },

  /* ---------------------------------------------------------------- nom de domaine Haïti (FR) */
  {
    id: 'domaine-haiti', geo: true, lang: FR, path: 'nom-de-domaine-haiti.html', alt: { ht: 'ht/non-domenn-ayiti.html' },
    breadcrumb: 'Nom de domaine Haïti',
    title: 'Nom de domaine Haïti (.com, .net, .org) · Freda Workspace',
    description: 'Achetez le nom de domaine de votre entreprise haïtienne et payez en MonCash, NatCash ou carte. Le .ht arrive bientôt ; vous en avez un ? Connectez-le.',
    h1: 'Nom de domaine pour une entreprise en Haïti',
    lead: 'Pour une entreprise haïtienne, le plus simple est un nom de domaine en .com, .net ou .org : un .com coûte {com_price} la première année ({com_renew} au renouvellement), un .net {net_price} et un .org {org_price} ; les extensions les moins chères (comme le .site, {domain_from}) augmentent nettement au renouvellement. Vous pouvez l’acheter sur Freda Workspace et le payer en MonCash, NatCash ou par carte. Le domaine en .ht arrive bientôt chez Freda Connect ; si vous en possédez déjà un, vous pouvez dès maintenant le connecter et lui ajouter une adresse email professionnelle.',
    facts: [
      ['Extensions vendues', '.com, .net, .org, .co, .store, .online, .site, .tech, .io'],
      ['Domaine en .ht', 'Bientôt disponible chez Freda Connect ; en attendant, vous pouvez connecter un .ht existant et y créer vos adresses email'],
      ['Prix', 'À partir de {domain_from} ({com_ref}) la première année, selon l’extension ; prix exact affiché avant paiement ; le renouvellement peut coûter plus cher que la première année'],
      ['Moyens de paiement', 'MonCash, NatCash ou carte ; montants convertis en gourdes (HTG) au taux indiqué au paiement. Frais de traitement : carte 3,5 % + 0,40 $, MonCash/NatCash 6 %'],
      ['Durée', 'De 1 à 10 ans à l’achat'],
      ['Inclus', 'Confidentialité Whois gratuite, verrouillage anti-transfert, DNS géré dans votre espace'],
    ],
    sections: [
      {
        h2: 'Quelle extension choisir pour une entreprise en Haïti ?',
        paragraphs: ['Le choix dépend de votre usage. Pour être facile à retenir et à saisir sur un téléphone, une extension courante reste le choix le plus sûr.'],
        table: {
          head: ['Extension', 'Disponible chez Freda Workspace', 'Pour qui'],
          rows: [
            ['.com', 'Oui', 'Entreprises, commerces, services : l’extension la plus connue'],
            ['.net', 'Oui', 'Réseaux, services en ligne, alternative au .com'],
            ['.org', 'Oui', 'Associations, ONG, fondations, églises'],
            ['.ht', 'Bientôt (connexion d’un .ht existant déjà possible)', 'Identité haïtienne ; géré par son registre national'],
            ['.co, .store, .online, .site, .tech, .io', 'Oui', 'Boutiques en ligne, projets numériques, startups'],
          ],
        },
      },
      {
        h2: 'Acheter un nom de domaine en Haïti avec MonCash ou NatCash',
        steps: [
          'Tapez le nom de votre entreprise dans la recherche de domaine : Freda Workspace vérifie les extensions disponibles et propose des alternatives.',
          'Choisissez la durée (de 1 à 10 ans) et gardez la confidentialité Whois gratuite activée : vos coordonnées personnelles restent masquées.',
          'Payez avec MonCash ou NatCash : vous êtes redirigé vers la page de paiement, vous confirmez avec votre code PIN, puis vous revenez sur Freda Workspace. Le domaine est enregistré dès que le paiement est confirmé.',
        ],
      },
      {
        h2: 'Le nom de domaine .ht arrive bientôt chez Freda Connect',
        paragraphs: ['Le .ht est géré par NIC Haïti (nic.ht). Il est ouvert à tous, mais chez les registraires étrangers il coûte nettement plus cher qu’un .com ou un .net : par exemple environ 112 € par an chez Gandi (prix constaté en novembre 2026, donné à titre indicatif et susceptible de changer). Freda Connect prépare l’enregistrement des noms de domaine en .ht : vous pourrez bientôt l’obtenir au même endroit que votre email professionnel. La date de lancement et les prix seront annoncés ici ; aucun prix n’est fixé pour l’instant. En attendant, si vous possédez déjà un .ht, vous pouvez le connecter à Freda Workspace dès maintenant pour y ajouter une adresse email professionnelle, ou écrire à support@fredaworkspace.com pour être prévenu du lancement.'],
      },
      {
        h2: 'Connecter un domaine .ht que vous possédez déjà',
        paragraphs: ['Dans votre espace, choisissez « Ajouter un domaine existant ». Freda Workspace affiche les enregistrements DNS à ajouter (MX, SPF, DKIM, DMARC et une preuve de propriété) chez le service qui gère votre domaine. Tant que ces enregistrements ne sont pas en place, le domaine apparaît comme « non connecté » : cliquez sur « Vérifier » une fois qu’ils sont ajoutés, la propagation pouvant prendre de quelques minutes à quelques heures. Une fois le domaine connecté, vous pouvez y créer votre boîte email gratuite.'],
      },
      {
        h2: 'Le domaine vous appartient',
        paragraphs: ['Le nom de domaine est enregistré à votre nom. Vous pouvez le transférer chez un autre registraire avec le code d’autorisation (EPP) affiché dans votre espace, selon les règles de l’ICANN (en général 60 jours après l’enregistrement). Les frais d’enregistrement ne sont pas remboursables une fois le domaine enregistré auprès du registre.'],
      },
    ],
    faq: [
      ['Freda Workspace vend-il des noms de domaine en .ht ?', 'Pas encore : le .ht arrive bientôt chez Freda Connect, sans date ni prix annoncés pour l’instant. Aujourd’hui, Freda Workspace vend des .com, .net, .org, .co, .store, .online, .site, .tech et .io. Si vous possédez déjà un domaine en .ht, vous pouvez le connecter dès maintenant et y ajouter une adresse email professionnelle.'],
      ['Combien coûte un nom de domaine pour Haïti ?', 'Les prix commencent à {domain_from} ({com_ref}) la première année selon l’extension. Le prix exact, ainsi que le prix de renouvellement, est affiché avant tout paiement. Il n’y a pas de nom de domaine gratuit.'],
      ['Puis-je payer mon nom de domaine en MonCash ou NatCash ?', 'Oui. Vous pouvez aussi payer par carte. Les montants en dollars sont convertis en gourdes au taux indiqué sur la page de paiement.'],
      ['Combien de temps faut-il pour activer mon domaine ?', 'L’enregistrement est lancé dès que le paiement est confirmé. La propagation DNS mondiale peut prendre de quelques minutes à 24 heures.'],
      ['Puis-je avoir un email professionnel sur mon nom de domaine ?', 'Oui. Chaque compte a droit à 1 boîte email gratuite sur son propre domaine ; les offres Starter, Business et Enterprise ajoutent des boîtes.'],
      ['Que se passe-t-il à l’expiration de mon domaine ?', 'Freda Workspace vous envoie des rappels avant l’expiration. MonCash et NatCash ne permettent pas de prélèvement automatique : rechargez votre solde Freda Workspace pour que le renouvellement soit payé automatiquement avec ce solde.'],
    ],
    related: [['email-pro-gratuit.html', 'Email pro gratuit avec votre domaine'], ['acheter-domaine-moncash.html', 'Acheter un domaine avec MonCash ou NatCash'], ['ht/non-domenn-ayiti.html', 'Kreyòl : non domèn pou Ayiti']],
    cta: [['Chercher un nom de domaine', 'domaines.html'], ['Connecter mon domaine .ht', 'configurer-email.html']],
  },

  /* ---------------------------------------------------------------- MonCash / NatCash (FR) */
  {
    id: 'moncash', geo: true, lang: FR, path: 'acheter-domaine-moncash.html', alt: { ht: 'ht/peye-ak-moncash-natcash.html' },
    breadcrumb: 'Payer avec MonCash ou NatCash',
    title: 'Payer son domaine et son email avec MonCash ou NatCash',
    description: 'Payez votre nom de domaine et votre email pro avec MonCash ou NatCash. Un solde rechargeable paie vos abonnements, car MonCash ne prélève pas seul.',
    h1: 'Payer son nom de domaine et son email pro avec MonCash ou NatCash',
    lead: 'Sur Freda Workspace, vous payez votre nom de domaine et votre offre email avec MonCash, NatCash ou par carte. Comme MonCash et NatCash ne permettent aucun prélèvement automatique, vous rechargez un solde Freda Workspace (de 5 $ à 500 $) : vos abonnements et renouvellements sont ensuite payés automatiquement avec ce solde, et nous vous écrivons si le solde devient trop bas.',
    facts: [
      ['Moyens de paiement', 'MonCash, NatCash, carte'],
      ['Devise affichée', 'Dollars américains ; conversion en gourdes (HTG) au taux indiqué au paiement'],
      ['Paiement récurrent', 'Pas de prélèvement automatique avec MonCash / NatCash : on utilise le solde Freda Workspace'],
      ['Frais de traitement', 'Carte 3,5 % + 0,40 $ ; MonCash et NatCash 6 % (ajoutés au montant et affichés avant le paiement)'],
      ['Recharge du solde', 'De 5 $ à 500 $, par MonCash ou NatCash'],
      ['Durée de l’offre', 'De 1 à 12 mois payés d’avance ; 12 mois = 2 mois offerts'],
      ['Alertes solde bas', 'Email à l’adresse d’inscription et à votre boîte Freda Mail, 7, 3 et 1 jour avant l’échéance puis le jour même'],
    ],
    sections: [
      {
        h2: 'Comment payer avec MonCash ou NatCash',
        steps: [
          'Choisissez votre nom de domaine ou votre offre, puis sélectionnez MonCash ou NatCash comme moyen de paiement.',
          'Vous êtes redirigé vers la page de paiement de MonCash ou de NatCash, où vous confirmez avec votre code PIN.',
          'Vous revenez sur Freda Workspace : la page se met à jour toute seule dès que le paiement est confirmé. Vous recevez un reçu par email.',
        ],
      },
      {
        h2: 'Le solde Freda Workspace : payer les abonnements sans prélèvement',
        paragraphs: [
          'Un abonnement se renouvelle chaque mois ou chaque période choisie. Avec une carte bancaire, le débit peut être automatique. Avec MonCash et NatCash, ce n’est pas possible : c’est le client qui valide chaque paiement.',
          'Pour que votre email ne soit jamais coupé par oubli, Freda Workspace vous propose un solde prépayé. Vous le rechargez quand vous voulez avec MonCash ou NatCash, et il paie automatiquement votre offre Freda Mail 2 jours avant l’échéance et vos noms de domaine 7 jours avant leur expiration. Vous pouvez désactiver ce paiement automatique à tout moment.',
        ],
      },
      {
        h2: 'Que se passe-t-il si le solde est trop bas ?',
        paragraphs: ['Si votre solde ne couvre pas la prochaine échéance, Freda Workspace vous prévient par email, à l’adresse de votre inscription et dans votre boîte Freda Mail, 7, 3 et 1 jour avant l’échéance puis le jour même, avec le montant qui manque en dollars et en gourdes et un lien pour recharger. Dès que le solde suffit, l’offre est renouvelée automatiquement. Sans paiement, les boîtes email sont suspendues après quelques jours (vos messages sont conservés) et se rouvrent dès que l’offre est payée.'],
      },
      {
        h2: 'Combien de mois payer d’avance ?',
        paragraphs: ['Vous choisissez de 1 à 12 mois. Le prix est le prix mensuel multiplié par le nombre de mois ; avec 12 mois, vous payez 10 mois et obtenez 2 mois offerts. Payer plusieurs mois d’avance réduit le nombre de paiements MonCash ou NatCash à faire.'],
      },
    ],
    faq: [
      ['Puis-je payer mon nom de domaine avec MonCash ?', 'Oui. Au paiement, choisissez MonCash : vous êtes redirigé vers MonCash pour confirmer avec votre code PIN, puis vous revenez sur Freda Workspace. NatCash fonctionne de la même façon.'],
      ['Le renouvellement est-il automatique avec MonCash ou NatCash ?', 'Pas directement : MonCash et NatCash ne permettent pas de prélèvement automatique. Rechargez votre solde Freda Workspace ; votre offre et vos domaines sont ensuite payés automatiquement avec ce solde, et vous recevez des alertes par email si le solde est trop bas.'],
      ['Quel est le montant minimum pour recharger mon solde ?', 'Le minimum est de 5 $ et le maximum de 500 $ par recharge, payables en gourdes avec MonCash ou NatCash.'],
      ['Mon paiement MonCash a échoué après avoir payé : suis-je remboursé ?', 'Si l’enregistrement ou le service ne peut pas être livré après paiement, le montant est recrédité sur votre solde Freda Workspace, que vous pouvez réutiliser pour un autre achat.'],
      ['Puis-je aussi payer par carte bancaire ?', 'Oui, la carte bancaire est acceptée. Les cartes enregistrées permettent un renouvellement automatique.'],
      ['Comment connaître le montant en gourdes ?', 'Les prix sont affichés en dollars américains. Le montant en gourdes est calculé au taux indiqué lors du paiement, avant que vous confirmiez.'],
    ],
    related: [['email-pro-gratuit.html', 'Email pro gratuit avec votre domaine'], ['nom-de-domaine-haiti.html', 'Nom de domaine pour Haïti'], ['ht/peye-ak-moncash-natcash.html', 'Kreyòl : peye ak MonCash oswa NatCash']],
    cta: [['Voir les offres', 'index.html#tarifs'], ['Créer un compte', 'inscription.html']],
  },

  /* ---------------------------------------------------------------- email gratuit (HT) */
  {
    id: 'email-gratuit-ht', geo: true, lang: HT, path: 'ht/imel-pwofesyonel-gratis.html', alt: { fr: 'email-pro-gratuit.html', en: 'en/free-business-email-haiti.html' },
    breadcrumb: 'Imèl pwofesyonèl gratis',
    title: 'Imèl pwofesyonèl gratis ak domèn ou · Freda Workspace',
    description: '1 adrès imèl pwofesyonèl gratis sou pwòp non domèn ou, san abònman ni kat labank. Peye ak MonCash, NatCash oswa kat si ou bezwen plis.',
    h1: 'Imèl pwofesyonèl gratis ak pwòp non domèn ou',
    lead: 'Wi: Freda Workspace ba ou {free_mailboxes} bwat imèl pwofesyonèl gratis sou pwòp non domèn ou (pa egzanp kontak@biznis-ou.com), san abònman ak san kat labank. Ou jis bezwen yon non domèn: swa ou achte l nan Freda Workspace, swa ou genyen l deja.',
    facts: [
      ['Pri bwat gratis la', '0 $, san abònman, san kat labank'],
      ['Sa ou jwenn', '{free_mailboxes} bwat imèl pwofesyonèl, 1 Go espas'],
      ['Sa ou bezwen', 'Yon non domèn (ou achte l nan Freda Workspace oswa ou genyen l deja)'],
      ['Èske non domèn nan gratis?', 'Non: li koute a pati de {domain_from} ({com_ref}) premye ane a, dapre ekstansyon an'],
      ['Sekirite imèl la', 'SPF, DKIM ak DMARC konfigire otomatikman'],
      ['Frè pwosesis', 'Kat 3,5 % + 0,40 $; MonCash ak NatCash 6 % (pou òf ki peye yo ak domèn nan)'],
      ['Pou ale pi lwen', 'Starter {starter_price}/mwa (2 bwat), Business {business_price}/mwa (5 bwat), Enterprise {enterprise_price}/mwa (san limit)'],
    ],
    sections: [
      {
        h2: 'Sa ki gratis ak sa ki pa gratis',
        paragraphs: ['Bwat imèl gratis la se yon vrè kont pwofesyonèl sou domèn ou, se pa yon esè ki fini nan yon sèten tan. Òf ki peye yo ajoute plis bwat ak plis espas. Non domèn nan, li menm, rete peye: se sèl bagay ki koute lajan pou kòmanse.'],
        table: {
          head: ['', 'Gratis', 'Starter', 'Business', 'Enterprise'],
          rows: [
            ['Pri', '0 $', '{starter_price}/mwa', '{business_price}/mwa', '{enterprise_price}/mwa'],
            ['Bwat imèl', '{free_mailboxes}', '{starter_boxes}', '{business_boxes}', 'San limit'],
            ['Espas', '1 Go', '2 Go', '15 Go pataje', '5 Go pou chak bwat'],
            ['Peman', 'Pa gen', 'MonCash, NatCash oswa kat', 'MonCash, NatCash oswa kat', 'MonCash, NatCash oswa kat'],
          ],
        },
      },
      {
        h2: 'Kijan pou w jwenn imèl pwofesyonèl gratis ou nan 4 etap',
        steps: [
          'Kreye kont Freda Workspace ou: li gratis epi li pa mande kat labank.',
          'Chwazi non domèn ou: achte youn (a pati de {domain_from} ({com_ref}) premye ane a) oswa konekte youn ou genyen deja, menm yon domèn .ht.',
          'Freda Workspace ajoute enregistreman MX, SPF, DKIM ak DMARC yo, oswa li montre w egzakteman kisa pou w kole kote ou jere domèn ou, apre sa li verifye si domèn nan konekte.',
          'Kreye adrès ou (pa egzanp kontak@biznis-ou.com) epi li imèl ou nan aplikasyon Freda Mail la oswa nan nenpòt lojisyèl ki sipòte IMAP ak SMTP (Outlook, Apple Mail, Gmail).',
        ],
      },
      {
        h2: 'Poukisa yon adrès sou domèn ou olye yon adrès Gmail',
        paragraphs: [
          'Yon adrès tankou kontak@biznis-ou.com montre kliyan ou yo ki moun ou ye, li rete pa w kèlkeswa founisè a, epi li pèmèt ou ajoute adrès kolaboratè ou yo (lavant@, direksyon@) jou biznis ou grandi.',
          'Freda Workspace konfigire SPF, DKIM ak DMARC, twa pwoteksyon ki ede mesaj ou yo rive nan bwat resepsyon olye de nan spam. Yon adrès tou nèf sou yon domèn tou nèf ka toujou jwenn tretman pridan nan men kèk founisè nan kòmansman: ekri vre mesaj, mande repons epi make premye mesaj ou yo "Pa spam" pou bati repitasyon w.',
        ],
      },
    ],
    faq: [
      ['Èske imèl pwofesyonèl Freda Workspace la vrèman gratis?', 'Wi. San abònman ak san kat labank, kont ou gen dwa a {free_mailboxes} bwat imèl pwofesyonèl gratis (1 Go) sou pwòp non domèn ou. Pou plis bwat oswa plis espas, gen òf Starter ({starter_price}/mwa, 2 bwat), Business ({business_price}/mwa, 5 bwat) ak Enterprise ({enterprise_price}/mwa, bwat san limit).'],
      ['Èske mwen bezwen yon non domèn pou m gen imèl pwofesyonèl gratis?', 'Wi. Yon adrès pwofesyonèl baze sou yon non domèn, pa egzanp biznis-ou.com. Ou ka achte l nan Freda Workspace oswa konekte yon domèn ou genyen deja.'],
      ['Èske gen non domèn gratis?', 'Non, Freda Workspace pa vann non domèn gratis: pri yo kòmanse a {domain_from} ({com_ref}) premye ane a dapre ekstansyon an, epi pri egzak la parèt anvan ou peye. Men si ou gen yon domèn deja, bwat imèl la gratis.'],
      ['Èske mwen ka li imèl mwen nan Gmail, Outlook oswa Apple Mail?', 'Wi. Bwat ou yo mache ak nenpòt lojisyèl ki sipòte IMAP ak SMTP, ansanm ak aplikasyon Freda Mail la. Paramèt koneksyon yo parèt nan espas ou.'],
      ['Konbyen bwat imèl mwen ka genyen?', 'Gratis: {free_mailboxes} bwat. Starter: {starter_boxes} bwat. Business: {business_boxes} bwat. Enterprise: bwat san limit. Alyas yo (pa egzanp info@ ki voye nan yon bwat) pa koute anyen anplis.'],
      ['Èske mwen ka peye ak MonCash oswa NatCash?', 'Wi. Òf ki peye yo ak non domèn yo peye ak MonCash, NatCash oswa kat. MonCash ak NatCash pa pèmèt retire lajan otomatikman: ou rechaje yon balans Freda Workspace (de 5 $ a 500 $) ki peye òf ou a otomatikman apre.'],
    ],
    related: [['non-domenn-ayiti.html', 'Non domèn pou Ayiti'], ['peye-ak-moncash-natcash.html', 'Peye ak MonCash oswa NatCash'], ['../email-pro-gratuit.html', 'Version française']],
    cta: [['Kreye imèl pwofesyonèl gratis mwen', '../inscription.html'], ['Chèche yon non domèn', '../domaines.html']],
    product: { name: 'Bwat imèl pwofesyonèl gratis', description: '1 bwat imèl pwofesyonèl gratis (1 Go) sou pwòp non domèn ou, ak SPF, DKIM ak DMARC konfigire otomatikman.', price: 0 },
  },

  /* ---------------------------------------------------------------- domaine Haïti (HT) */
  {
    id: 'domaine-haiti-ht', geo: true, lang: HT, path: 'ht/non-domenn-ayiti.html', alt: { fr: 'nom-de-domaine-haiti.html' },
    breadcrumb: 'Non domèn pou Ayiti',
    title: 'Non domèn pou Ayiti (.com, .net, .org) · Freda Workspace',
    description: 'Achte non domèn biznis ayisyen ou epi peye ak MonCash, NatCash oswa kat. .ht la ap vini byento; ou gen youn deja? Konekte l.',
    h1: 'Non domèn pou yon biznis nan Ayiti',
    lead: 'Pou yon biznis ayisyen, sa ki pi senp se yon non domèn .com, .net oswa .org: yon .com koute {com_price} premye ane a ({com_renew} nan renouvèlman), yon .net {net_price} ak yon .org {org_price}; ekstansyon ki pi bon mache yo (tankou .site, {domain_from}) monte anpil nan renouvèlman. Ou ka achte l sou Freda Workspace epi peye l ak MonCash, NatCash oswa kat. Domèn .ht la ap vini byento nan Freda Connect; si ou genyen youn deja, ou ka konekte l depi kounye a epi ajoute yon adrès imèl pwofesyonèl sou li.',
    facts: [
      ['Ekstansyon nou vann', '.com, .net, .org, .co, .store, .online, .site, .tech, .io'],
      ['Domèn .ht', 'Ap vini byento nan Freda Connect; annatandan, ou ka konekte yon .ht ou genyen deja epi kreye adrès imèl sou li'],
      ['Pri', 'A pati de {domain_from} ({com_ref}) premye ane a, dapre ekstansyon an; pri egzak la parèt anvan ou peye; renouvèlman an ka koute pi chè pase premye ane a'],
      ['Mwayen peman', 'MonCash, NatCash oswa kat; montan yo konvèti an goud (HTG) ak to ki endike lè ou peye. Frè pwosesis: kat 3,5 % + 0,40 $, MonCash/NatCash 6 %'],
      ['Dire', 'De 1 a 10 an lè ou achte'],
      ['Sa ki enkli', 'Konfidansyalite Whois gratis, vèwouyaj kont transfè, DNS jere nan espas ou'],
    ],
    sections: [
      {
        h2: 'Ki ekstansyon pou w chwazi pou yon biznis nan Ayiti?',
        paragraphs: ['Chwa a depann de sa ou bezwen. Pou li fasil pou sonje epi ekri sou yon telefòn, yon ekstansyon komen rete chwa ki pi sèten.'],
        table: {
          head: ['Ekstansyon', 'Disponib nan Freda Workspace', 'Pou ki moun'],
          rows: [
            ['.com', 'Wi', 'Biznis, boutik, sèvis: ekstansyon ki pi konnen an'],
            ['.net', 'Wi', 'Rezo, sèvis sou entènèt, altènativ a .com'],
            ['.org', 'Wi', 'Asosyasyon, ONG, fondasyon, legliz'],
            ['.ht', 'Byento (ou ka konekte yon .ht ou genyen deja depi kounye a)', 'Idantite ayisyen; rejis nasyonal li jere l'],
            ['.co, .store, .online, .site, .tech, .io', 'Wi', 'Boutik sou entènèt, pwojè nimerik, startup'],
          ],
        },
      },
      {
        h2: 'Achte yon non domèn nan Ayiti ak MonCash oswa NatCash',
        steps: [
          'Tape non biznis ou nan rechèch domèn nan: Freda Workspace verifye ekstansyon ki disponib yo epi li pwopoze lòt chwa.',
          'Chwazi dire a (de 1 a 10 an) epi kite konfidansyalite Whois gratis la aktive: enfòmasyon pèsonèl ou yo rete kache.',
          'Peye ak MonCash oswa NatCash: yo voye w sou paj peman an, ou konfime ak kòd PIN ou, epi ou retounen sou Freda Workspace. Yo anrejistre domèn nan lè peman an konfime.',
        ],
      },
      {
        h2: 'Non domèn .ht la ap vini byento nan Freda Connect',
        paragraphs: ['NIC Ayiti (nic.ht) jere .ht la. Li louvri pou tout moun, men nan men rejistrè etranje li koute pi chè pase yon .com oswa yon .net: pa egzanp apeprè 112 € pa ane nan Gandi (pri nou te wè an novanm 2026, se yon endikasyon sèlman epi li ka chanje). Freda Connect ap prepare enskripsyon non domèn .ht yo: byento ou pral ka jwenn li nan menm kote ak imèl pwofesyonèl ou. Nou pral anonse dat lansman an ak pri yo isit la; pa gen pri ki fikse pou kounye a. Annatandan, si ou genyen yon .ht deja, ou ka konekte l ak Freda Workspace depi kounye a pou ajoute yon adrès imèl pwofesyonèl, oswa ekri nan support@fredaworkspace.com pou yo avèti w lè l lanse.'],
      },
      {
        h2: 'Konekte yon domèn .ht ou genyen deja',
        paragraphs: ['Nan espas ou, chwazi "Ajouter un domaine existant". Freda Workspace montre enregistreman DNS pou ajoute yo (MX, SPF, DKIM, DMARC ak yon prèv pwopriyete) kote ou jere domèn ou. Toutotan enregistreman sa yo pa nan plas, domèn nan make "non connecté": klike sou "Vérifier" lè ou fin ajoute yo, paske pwopagasyon an ka pran kèk minit jiska plizyè èdtan. Lè domèn nan konekte, ou ka kreye bwat imèl gratis ou sou li.'],
      },
      {
        h2: 'Domèn nan se pa w',
        paragraphs: ['Yo anrejistre non domèn nan sou non ou. Ou ka transfere l nan yon lòt rejistrè ak kòd otorizasyon an (EPP) ki nan espas ou, dapre règ ICANN (an jeneral 60 jou apre enskripsyon an). Frè enskripsyon yo, yo pa ranbouse yo yon fwa domèn nan anrejistre nan rejis la.'],
      },
    ],
    faq: [
      ['Èske Freda Workspace vann non domèn .ht?', 'Poko: .ht la ap vini byento nan Freda Connect, san dat ni pri anonse pou kounye a. Jodi a, Freda Workspace vann .com, .net, .org, .co, .store, .online, .site, .tech ak .io. Si ou genyen deja yon domèn .ht, ou ka konekte l depi kounye a epi ajoute yon adrès imèl pwofesyonèl sou li.'],
      ['Konbyen yon non domèn pou Ayiti koute?', 'Pri yo kòmanse a {domain_from} ({com_ref}) premye ane a dapre ekstansyon an. Pri egzak la, ansanm ak pri renouvèlman an, parèt anvan ou peye. Pa gen non domèn gratis.'],
      ['Èske mwen ka peye non domèn mwen ak MonCash oswa NatCash?', 'Wi. Ou ka peye ak kat tou. Montan an dola konvèti an goud ak to ki endike sou paj peman an.'],
      ['Konbyen tan sa pran pou domèn mwen an aktive?', 'Enskripsyon an kòmanse lè peman an konfime. Pwopagasyon DNS mondyal la ka pran de kèk minit a 24 è.'],
      ['Èske mwen ka gen yon imèl pwofesyonèl sou non domèn mwen?', 'Wi. Chak kont gen dwa a 1 bwat imèl gratis sou pwòp domèn li; òf Starter, Business ak Enterprise yo ajoute plis bwat.'],
      ['Kisa k pase lè domèn mwen an ekspire?', 'Freda Workspace voye w rapèl anvan ekspirasyon an. MonCash ak NatCash pa pèmèt retire lajan otomatikman: rechaje balans Freda Workspace ou pou renouvèlman an peye otomatikman ak balans sa a.'],
    ],
    related: [['imel-pwofesyonel-gratis.html', 'Imèl pwofesyonèl gratis ak domèn ou'], ['peye-ak-moncash-natcash.html', 'Peye ak MonCash oswa NatCash'], ['../nom-de-domaine-haiti.html', 'Version française']],
    cta: [['Chèche yon non domèn', '../domaines.html'], ['Konekte domèn .ht mwen', '../configurer-email.html']],
  },

  /* ---------------------------------------------------------------- MonCash / NatCash (HT) */
  {
    id: 'moncash-ht', geo: true, lang: HT, path: 'ht/peye-ak-moncash-natcash.html', alt: { fr: 'acheter-domaine-moncash.html' },
    breadcrumb: 'Peye ak MonCash oswa NatCash',
    title: 'Peye ak MonCash oswa NatCash nan Ayiti · Freda Workspace',
    description: 'Peye non domèn ak imèl ou ak MonCash oswa NatCash. Yon balans Freda Workspace ou rechaje peye abònman yo, paske MonCash pa ka peye poukont li chak mwa.',
    h1: 'Peye non domèn ou ak imèl pwofesyonèl ou ak MonCash oswa NatCash',
    lead: 'Sou Freda Workspace, ou peye non domèn ou ak òf imèl ou ak MonCash, NatCash oswa kat. Kòm MonCash ak NatCash pa pèmèt okenn retire lajan otomatikman, ou rechaje yon balans Freda Workspace (de 5 $ a 500 $): abònman ou yo ak renouvèlman yo peye otomatikman ak balans sa a, epi nou ekri w si balans lan vin twò ba.',
    facts: [
      ['Mwayen peman', 'MonCash, NatCash, kat'],
      ['Lajan yo afiche', 'Dola ameriken; konvèsyon an goud (HTG) ak to ki endike lè ou peye'],
      ['Peman repete', 'Pa gen retire lajan otomatikman ak MonCash / NatCash: nou sèvi ak balans Freda Workspace a'],
      ['Frè pwosesis', 'Kat 3,5 % + 0,40 $; MonCash ak NatCash 6 % (ajoute sou montan an epi afiche anvan ou peye)'],
      ['Rechaj balans', 'De 5 $ a 500 $, ak MonCash oswa NatCash'],
      ['Dire òf la', 'De 1 a 12 mwa peye davans; 12 mwa = 2 mwa gratis'],
      ['Alèt balans ba', 'Imèl sou adrès enskripsyon an ak sou bwat Freda Mail ou, 7, 3 ak 1 jou anvan dat la, epi jou a menm'],
    ],
    sections: [
      {
        h2: 'Kijan pou peye ak MonCash oswa NatCash',
        steps: [
          'Chwazi non domèn ou oswa òf ou, apre sa chwazi MonCash oswa NatCash kòm mwayen peman.',
          'Yo voye w sou paj peman MonCash oswa NatCash la, kote ou konfime ak kòd PIN ou.',
          'Ou retounen sou Freda Workspace: paj la mete tèt li ajou lè peman an konfime. Ou resevwa yon resi pa imèl.',
        ],
      },
      {
        h2: 'Balans Freda Workspace a: peye abònman san retire lajan otomatikman',
        paragraphs: [
          'Yon abònman renouvle chak mwa oswa chak peryòd ou chwazi. Ak yon kat labank, debi a ka otomatik. Ak MonCash ak NatCash, sa pa posib: se kliyan an ki konfime chak peman.',
          'Pou imèl ou pa janm koupe paske ou bliye, Freda Workspace ofri w yon balans prepeye. Ou rechaje l lè ou vle ak MonCash oswa NatCash, epi li peye òf Freda Mail ou a otomatikman 2 jou anvan dat la ak non domèn ou yo 7 jou anvan yo ekspire. Ou ka dezaktive peman otomatik sa a nenpòt ki lè.',
        ],
      },
      {
        h2: 'Kisa k pase si balans lan twò ba?',
        paragraphs: ['Si balans ou pa kouvri pwochen dat la, Freda Workspace avèti w pa imèl, sou adrès enskripsyon ou ak nan bwat Freda Mail ou, 7, 3 ak 1 jou anvan dat la epi jou a menm, ak montan ki manke an dola ak an goud ak yon lyen pou rechaje. Lè balans lan ase, òf la renouvle otomatikman. San peman, bwat imèl yo sispann apre kèk jou (mesaj ou yo kenbe) epi yo rouvri lè òf la peye.'],
      },
      {
        h2: 'Konbyen mwa pou w peye davans?',
        paragraphs: ['Ou chwazi de 1 a 12 mwa. Pri a se pri pa mwa a miltipliye pa kantite mwa yo; ak 12 mwa, ou peye 10 mwa epi ou jwenn 2 mwa gratis. Peye plizyè mwa davans redui kantite peman MonCash oswa NatCash ou dwe fè.'],
      },
    ],
    faq: [
      ['Èske mwen ka peye non domèn mwen ak MonCash?', 'Wi. Lè ou peye, chwazi MonCash: yo voye w sou MonCash pou konfime ak kòd PIN ou, apre sa ou retounen sou Freda Workspace. NatCash mache menm jan.'],
      ['Èske renouvèlman an otomatik ak MonCash oswa NatCash?', 'Pa dirèkteman: MonCash ak NatCash pa pèmèt retire lajan otomatikman. Rechaje balans Freda Workspace ou; òf ou ak domèn ou yo peye otomatikman ak balans sa a, epi ou resevwa alèt pa imèl si balans lan twò ba.'],
      ['Ki minimòm pou rechaje balans mwen?', 'Minimòm lan se 5 $ epi maksimòm lan se 500 $ pa rechaj, ou peye an goud ak MonCash oswa NatCash.'],
      ['Peman MonCash mwen an echwe apre m fin peye: èske yo ranbouse m?', 'Si yo pa ka bay enskripsyon an oswa sèvis la apre peman an, montan an retounen sou balans Freda Workspace ou, ou ka itilize l ankò pou yon lòt acha.'],
      ['Èske mwen ka peye ak kat labank tou?', 'Wi, nou aksepte kat labank. Kat ki anrejistre yo pèmèt renouvèlman otomatik.'],
      ['Kijan pou m konnen montan an an goud?', 'Pri yo afiche an dola ameriken. Yo kalkile montan an goud la ak to ki endike lè ou peye, anvan ou konfime.'],
    ],
    related: [['imel-pwofesyonel-gratis.html', 'Imèl pwofesyonèl gratis ak domèn ou'], ['non-domenn-ayiti.html', 'Non domèn pou Ayiti'], ['../acheter-domaine-moncash.html', 'Version française']],
    cta: [['Gade òf yo', '../index.html#tarifs'], ['Kreye yon kont', '../inscription.html']],
  },
  /* ---------------------------------------------------------------- free business email (EN) */
  {
    id: 'email-gratuit-en', geo: true, lang: 'en', path: 'en/free-business-email-haiti.html', alt: { fr: 'email-pro-gratuit.html', ht: 'ht/imel-pwofesyonel-gratis.html' },
    breadcrumb: 'Free business email for Haiti',
    title: 'Free business email for Haiti on your own domain',
    description: '1 free business mailbox on your own domain, no subscription or card needed. Pay with MonCash, NatCash or card. Support in French, Haitian Creole, English.',
    h1: 'Free business email for Haiti, on your own domain name',
    lead: 'Yes: Freda Workspace gives every account {free_mailboxes} free professional mailbox on your own domain name (for example contact@your-company.com), with no subscription and no bank card. You only need a domain name: bought from Freda Workspace or one you already own. The domain name itself is not free.',
    facts: [
      ['Free mailbox price', '$0, no subscription, no bank card'],
      ['What you get', '{free_mailboxes} professional mailbox, 1 GB storage'],
      ['What you need', 'A domain name (bought from Freda Workspace, or one you already own)'],
      ['Is the domain name free?', 'No: from {domain_from} ({com_ref}) for the first year depending on the extension (price shown before payment; renewal can cost more)'],
      ['Domains sold', '.com, .net, .org, .co, .store, .online, .site, .tech, .io (.ht is coming soon; an existing .ht domain can already be connected)'],
      ['Payment', 'MonCash, NatCash or card; MonCash and NatCash cannot auto-debit, so a prepaid Freda Workspace balance ($5 to $500) pays subscriptions automatically. Processing fees: card 3.5% + $0.40, MonCash/NatCash 6%'],
      ['Language and support', 'French, Haitian Creole and English, Monday to Saturday, 8am to 6pm (Haiti time)'],
    ],
    sections: [
      {
        h2: 'What is free and what is not',
        paragraphs: ['The free mailbox is a real professional account on your own domain, not a time-limited trial. Paid plans add mailboxes and storage. The domain name is the only thing you pay for to get started.'],
        table: {
          head: ['', 'Free', 'Starter', 'Business', 'Enterprise'],
          rows: [
            ['Price', '$0', '{starter_price}/month', '{business_price}/month', '{enterprise_price}/month'],
            ['Mailboxes', '{free_mailboxes}', '{starter_boxes}', '{business_boxes}', 'Unlimited'],
            ['Storage', '1 GB', '2 GB', '15 GB shared', '5 GB per mailbox'],
            ['Payment', 'None', 'MonCash, NatCash or card', 'MonCash, NatCash or card', 'MonCash, NatCash or card'],
          ],
        },
      },
      {
        h2: 'How to get your free business email in 4 steps',
        steps: [
          'Create your Freda Workspace account: it is free and needs no bank card.',
          'Choose your domain name: buy one or connect one you already own, including a .ht domain.',
          'Freda Workspace adds the MX, SPF, DKIM and DMARC records, or shows exactly what to paste at your domain provider, then checks that the domain is connected.',
          'Create your address (for example contact@your-company.com) and read your email in the Freda Mail app or in any IMAP/SMTP client (Outlook, Apple Mail, Gmail).',
        ],
      },
      {
        h2: 'Why an address on your own domain rather than a Gmail address',
        paragraphs: [
          'An address like contact@your-company.com shows your customers who you are, stays yours whichever provider you use, and lets you add addresses for your team (sales@, admin@) the day you grow.',
          'Freda Workspace configures SPF, DKIM and DMARC, the three protections that help your messages reach the inbox rather than spam. A brand-new address on a brand-new domain can still be treated cautiously by some providers at first: write real messages, ask for replies and mark your first sends as “Not spam” to build your reputation.',
        ],
      },
      {
        h2: 'Paying from Haiti or from the diaspora',
        paragraphs: ['Domain names and paid plans can be paid with MonCash, NatCash or a bank card. Prices are shown in US dollars; the amount in gourdes is calculated at the rate shown at checkout. Because MonCash and NatCash cannot charge you automatically, you top up a Freda Workspace balance whenever you like and it pays your plan and domain renewals automatically. If the balance is too low, we email you before the due date.'],
      },
    ],
    faq: [
      ['Is the business email really free?', 'Yes. Without any subscription or bank card, your account includes {free_mailboxes} free professional mailbox (1 GB) on your own domain name. For more mailboxes or storage there are Starter ({starter_price}/month, 2 mailboxes), Business ({business_price}/month, 5 mailboxes) and Enterprise ({enterprise_price}/month, unlimited mailboxes).'],
      ['Is there a free domain name?', 'No. Freda Workspace does not sell free domain names: prices start at {domain_from} ({com_ref}) for the first year depending on the extension, and the exact price is shown before you pay. If you already own a domain, the mailbox is free.'],
      ['Does Freda Workspace sell .ht domains?', 'Not yet: .ht is coming soon to Freda Connect, with no date or price announced yet. Today it sells .com, .net, .org, .co, .store, .online, .site, .tech and .io. If you already own a .ht domain you can connect it now and add a professional email address to it.'],
      ['Can I pay with MonCash or NatCash?', 'Yes, or with a bank card. MonCash and NatCash do not allow automatic charges, so you top up a Freda Workspace balance that then pays your subscription automatically.'],
      ['Which languages does support speak?', 'French, Haitian Creole and English. Write to support@fredaworkspace.com, Monday to Saturday, 8am to 6pm (Haiti time).'],
    ],
    related: [['../email-pro-gratuit.html', 'Version française'], ['../ht/imel-pwofesyonel-gratis.html', 'Kreyòl ayisyen'], ['../acheter-domaine-moncash.html', 'Payer avec MonCash ou NatCash']],
    cta: [['Create my free business email', '../inscription.html'], ['Search a domain name', '../domaines.html']],
    product: { name: 'Free professional mailbox', description: '1 free professional mailbox (1 GB) on your own domain name, with SPF, DKIM and DMARC configured automatically.', price: 0 },
  },
];

/** FAQ de la page d'accueil : le HTML visible ET le JSON-LD FAQPage de index.html sont générés d'ici (entre les repères <!--faq:start--> / <!--faq:end-->). */
const homeFaq = [
  ['J’ai déjà un nom de domaine. Puis-je l’utiliser ?', 'Oui. Depuis votre espace, choisissez « Connecter un domaine existant ». Vous pouvez soit pointer vos serveurs DNS vers les nôtres, soit ajouter les enregistrements MX, SPF et DKIM que nous affichons. Cela fonctionne aussi avec un domaine en .ht.'],
  ['L’email professionnel est-il gratuit ?', 'Chaque compte a droit à {free_mailboxes} boîte email professionnelle gratuite (1 Go) sur son propre nom de domaine, sans abonnement ni carte bancaire. Le nom de domaine, lui, est payant (à partir de {domain_from} ({com_ref}) la première année selon l’extension). Les offres Starter, Business et Enterprise ajoutent des boîtes et du stockage.'],
  ['Comment payer avec MonCash ou NatCash ?', 'Au paiement, choisissez MonCash ou NatCash : vous êtes redirigé vers la page de paiement, vous confirmez avec votre code PIN et vous revenez sur Freda Workspace. MonCash et NatCash ne permettent pas de prélèvement automatique : rechargez un solde Freda Workspace (de 5 $ à 500 $), qui paie ensuite votre offre et vos renouvellements automatiquement.'],
  ['Vendez-vous des noms de domaine en .ht ?', 'Pas encore : le .ht arrive bientôt chez Freda Connect, sans date ni prix annoncés pour l’instant. Nous vendons aujourd’hui des .com, .net, .org, .co, .store, .online, .site, .tech et .io. Si vous possédez déjà un domaine en .ht, vous pouvez le connecter dès maintenant et y ajouter une adresse email professionnelle.'],
  ['Puis-je utiliser Gmail, Outlook ou Apple Mail ?', 'Oui, vos boîtes fonctionnent avec tout logiciel compatible IMAP et SMTP. Les paramètres de connexion sont affichés dans votre espace, rubrique Boîtes mail.'],
  ['Avis clients ?', 'Les avis clients apparaîtront ici après les premiers achats réels. Nous n’en affichons aucun pour l’instant et nous n’en inventons jamais.'],
  ['Que se passe-t-il si j’annule ?', 'Votre domaine vous appartient. Vous gardez l’accès jusqu’à la fin de la période payée et pouvez transférer le domaine chez un autre registraire avec le code d’autorisation fourni dans votre espace.'],
];

pages.push(...require('./landing-more'));
pages.push(...require('./landing-brands'));
pages.push(...require('./landing-compare'));

module.exports = { pages, homeFaq };
