# Stratégie SEO et GEO de Freda Workspace

Objectif : être le premier résultat (et la réponse citée par les assistants IA) pour les recherches liées à **l’email professionnel et au nom de domaine en Haïti**. Document établi le 5 novembre 2026 à partir de cinq analyses indépendantes (mots-clés, concurrents, technique, GEO, contenu et liens locaux). **Aucun classement n’est garanti** : ce plan réduit les obstacles et vise les requêtes où la concurrence est faible.

## 1. Notre positionnement (uniquement ce qui est vrai)

1. **Paiement en gourdes avec MonCash / NatCash** : aucun registraire étranger visible ne l’affiche.
2. **1 boîte email professionnelle gratuite** sur son propre domaine (le domaine, lui, est payant). Différenciant face à Google Workspace, Zoho, Hostinger, Bluehost.
3. **Support et contenu en français, kreyòl et anglais.**
4. **Prix transparents** : un domaine .com / .net / .org à partir de quelques dollars, alors que le .ht coûte souvent plus de 100 € par an chez les registraires étrangers (prix constatés, non officiels).

À ne jamais écrire : « domaine gratuit », « nous vendons le .ht » (le .ht est géré par NIC Haïti, nic.ht ; nous proposons seulement de **connecter** un .ht existant), « classé n° 1 ».

## 2. Ce qui est en place (dépôt `Freda-workspace`)

| Élément | Où | Détail |
|---|---|---|
| 7 pages d’atterrissage | `email-pro-gratuit.html`, `nom-de-domaine-haiti.html`, `acheter-domaine-moncash.html`, `ht/…` (3 pages kreyòl), `en/free-business-email-haiti.html` | Réponse dès la première phrase, tableau « En bref », étapes, FAQ visible, mise à jour datée |
| Source unique | `scripts/landing-content.js` → `npm run build:landing` | Génère les pages, le JSON-LD, `sitemap.xml`, `llms.txt`, `llms-full.txt`, la FAQ et le JSON-LD de l’accueil. La CI refuse un dépôt dont les fichiers générés ne sont pas à jour |
| Données structurées | JSON-LD | Organization (zone : Haïti ; langues fr, ht), WebSite + SearchAction, Product + offres (prix, devise, disponibilité), FAQPage identique au texte visible (testé), BreadcrumbList |
| Langues | `hreflang` fr / ht / en + `x-default`, réciproques (testées), `<html lang>` correct | |
| Géo | `geo.region=HT`, `geo.placename=Haïti`, `areaServed` Haïti | Peu pris en compte par Google, utile à Bing |
| Liens internes | En-tête et pied de page **en dur** dans chaque page générée ; section « Guides » et FAQ en dur dans `index.html` ; liens dans le pied de page JS et la page 404 | Les robots qui n’exécutent pas JavaScript voient les liens |
| Chargement | Pas de voile de chargement sur les pages générées | Évite de retarder le LCP |
| `robots.txt` | Tous les robots de recherche et d’assistants IA autorisés ; `admin-prix.html` interdit | Commentaire pour bloquer les robots d’entraînement si vous le décidez |
| `llms.txt`, `llms-full.txt` | Racine du site | Faits clés, pages, « ce que Freda ne fait pas ». **Sans gain prouvé** (voir §4) : coût quasi nul, gardé pour les usages agentiques |

Limite connue : les pages générées contiennent les prix **par défaut** (config du site). Si vous changez un prix dans l’administration, relancez `npm run build`, changez `LASTMOD` dans `scripts/build-landing.js` et déployez.

## 3. À faire vous-même (je ne peux pas le faire à votre place)

1. **Google Search Console** : ajouter `fredaworkspace.com`, soumettre `sitemap.xml`, demander l’indexation des 8 nouvelles URL.
2. **Bing Webmaster Tools** : idem (Copilot et ChatGPT Search s’appuient largement sur l’index Bing). Activer **IndexNow** (clé hébergée à la racine) après chaque changement de prix ou de page.
3. **www → apex** : dans Render, rediriger `www.fredaworkspace.com` vers `fredaworkspace.com` avant d’activer HSTS `includeSubDomains` partout.
4. **Profils de marque cohérents** : LinkedIn, Facebook, Crunchbase, Product Hunt avec la même description ; puis les ajouter à `sameAs` dans l’Organization (les liens du pied de page sont encore des `#`).
5. **Avis réels** après achat (jamais d’avis achetés ni rédigés par l’équipe).
6. **Google Business Profile** : ne pas créer de fiche avec une fausse adresse haïtienne (suspension probable). Seulement si une adresse réelle et staffée existe.
7. Valider les pages dans le **Rich Results Test** de Google.

## 4. Preuves et limites (GEO)

- **Solide** : Google dit que le SEO classique suffit pour AI Overviews ; OpenAI et Anthropic documentent des robots distincts pour la recherche, les requêtes utilisateur et l’entraînement ; Copilot s’appuie sur l’index Bing.
- **Hype / non prouvé** : `llms.txt` (des études récentes montrent presque aucune requête et aucun gain de citation ; Google déconseille d’y compter). FAQPage/Product aident les résultats enrichis, pas prouvé pour la citation IA.
- **Plausible mais non vérifié** (blogs d’éditeurs d’outils) : les mentions de marque par des tiers pèsent plus que les backlinks bruts ; la fraîcheur compte surtout pour Perplexity.
- Aucun volume de recherche n’a pu être vérifié (outils SEO non disponibles) : les difficultés sont des estimations qualitatives. À mesurer avec Search Console.

## 5. Mots-clés cibles (hypothèses à valider)

Priorité **facile et différenciante** : email professionnel Haïti · acheter nom de domaine Haïti · acheter / payer un domaine avec MonCash · payer domaine NatCash · connecter domaine .ht email · imèl pwofesyonèl gratis · achte non domèn Ayiti · peye domèn ak MonCash · business email Haiti · buy domain Haiti MonCash.
Priorité **longue** (SERP dominées par Google, Hostinger, Bluehost, Zoho) : email professionnel gratuit · adresse email avec le nom de mon entreprise · alternative à Google Workspace.
Pages à créer ensuite : guide « .com, .ht ou .net : lequel choisir ? » (honnête, renvoie vers nic.ht pour le .ht) ; comparatif honnête face à Gmail / Zoho / Google Workspace (avec prix vérifiés) ; « SPF, DKIM, DMARC pour éviter le spam » ; guide pour la diaspora qui paie pour un proche en Haïti.

## 6. Calendrier de contenu sur 90 jours (1 à 2 pièces par semaine)

- **Jours 1-30** : guide email pro avec MonCash (FR) · même guide en kreyòl · « Acheter un domaine en Haïti sans carte internationale » · « Gmail vs email pro » · 1re vidéo courte (configurer l’email sur téléphone).
- **Jours 31-60** : « .com, .ht ou .net » · comparatif honnête · glossaire bilingue domaine / hébergement / email · infographie WhatsApp en kreyòl · un clip vidéo par semaine.
- **Jours 61-90** : étude de cas réelle avec accord écrit (jamais de faux cas) · guide diaspora · « SPF/DKIM/DMARC » simplifié · mise à jour des pages en position 4 à 15 d’après Search Console.
Chaque contenu : publié sur le site, puis décliné en vidéo et en visuel partageable sur WhatsApp.

## 7. Liens et citations (sans achat de liens)

Pistes **à contacter** (existence confirmée, contacts non vérifiés) : écosystème start-up haïtien (Haiti Tech Summit, BANJ / Haiti Start, Haiti Startup Talent, Rebrand Haiti), chambres de commerce, universités, médias (Le Nouvelliste, AyiboPost, HaitiLibre, Loop Haiti), développeurs MonCash (tutoriel « payer son domaine avec MonCash »). Proposer un atelier gratuit « email pro et domaine » en échange d’une mention. Toujours annoncer le lien d’intérêt ; pas de commentaires de masse.

## 8. Mesure : routine mensuelle (1 h à 1 h 30)

1. Search Console : export 28 jours, pays Haïti, FR et KR séparés, comparaison au mois précédent.
2. Bing Webmaster Tools : même export + rapport « AI Performance » (citations Copilot).
3. Positions des 20 mots-clés (liste fixe).
4. Requêtes de marque (« Freda Workspace ») et nouveaux liens.
5. Mettre à jour les pages en position 4 à 15.
6. Décider 3 actions pour le mois suivant.

**10 questions à poser chaque mois** à ChatGPT (recherche), Gemini, Perplexity, Claude (web) et Copilot, en notant : cité / mentionné / URL / prix annoncé :
1. Où acheter un nom de domaine .ht ou .com en Haïti en payant avec MonCash ?
2. Comment créer une adresse email professionnelle avec mon propre nom de domaine en Haïti ?
3. Meilleur fournisseur d’email professionnel pour une PME haïtienne ?
4. Freda Workspace, qu’est-ce que c’est et combien ça coûte ?
5. Peut-on payer un nom de domaine avec NatCash ou MonCash ?
6. Kijan pou m achte yon non domèn ak yon imèl pwofesyonèl an Ayiti ?
7. Quelle différence entre Gmail et une adresse email sur mon domaine pour une entreprise haïtienne ?
8. Alternatives à Google Workspace et Zoho Mail pour des entreprises en Haïti.
9. Le nom de domaine est-il gratuit avec une boîte email ? Freda Workspace.
10. Registrar avec support en créole haïtien et en français.

Risque principal : un assistant qui annonce un prix ou une fonction erronée (par exemple « domaine gratuit »). Mitigation : texte « domaine non inclus » en HTML visible, FAQ « ce qui n’est pas inclus », dates de mise à jour, test mensuel et correction de la source.

## 9. Chantiers techniques restants (audit)

- **Voile de chargement** (`#page-loader`) sur `index.html`, `domaines.html`, `support.html` : retarde l’affichage jusqu’à `load` ; à retirer ou raccourcir après avoir pré-rendu les parties construites par JavaScript (cartes de tarifs).
- **Poids des scripts** de l’accueil (qrcode, api, ui…) : ajouter `defer`, charger le QR code seulement à l’ouverture de la fenêtre.
- **Images** : convertir `app-freda-mail-inbox.jpg` (138 Ko) en WebP/AVIF.
- **Redirections** : `/index.html` double `/` ; à traiter avec prudence (de nombreux liens internes pointent vers `index.html#…`).
- Cache HTML explicite dans `render.yaml`, liens sociaux du pied de page encore vides.
