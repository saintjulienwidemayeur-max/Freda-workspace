# Freda Workspace — Frontend

Frontend complet de Freda Workspace (Freda Pay LLC · Freda Group) : site public, tunnel d'achat et espace client.
HTML5 + Tailwind CSS + JavaScript pur (sans build), icônes Lucide, polices Manrope et Inter.

## Démarrer

Le CSS Tailwind et les icônes sont déjà compilés et versionnés (`assets/css/tailwind.css`, `assets/js/icons.js`) : aucune installation n'est nécessaire pour déployer. Servez le dossier avec n'importe quel serveur statique :

```bash
npx serve .            # ou
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080`. Netlify, Vercel ou Render (site statique) fonctionnent tels quels.

## Pages

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil : hero avec recherche de domaine, produits, 3 étapes, tarifs, app mobile (QR code), FAQ |
| `domaines.html` | Résultats de recherche, extensions, suggestions, choix de l'offre, récapitulatif |
| `paiement.html` | Compte (Google / Apple / email), première adresse, paiement carte, MonCash ou NatCash, écran de configuration |
| `connexion.html` | Espace client + Webmail, Google, Apple, mot de passe oublié |
| `inscription.html` | Création de compte, force du mot de passe |
| `support.html` | FAQ filtrable, état des services, formulaire de contact |
| `legal.html` | Conditions, confidentialité, remboursement, cookies (modèles à faire valider) |
| `espace/index.html` | Vue d'ensemble : indicateurs, santé MX/SPF/DKIM/DMARC, abonnement, activité |
| `espace/domaines.html` | Domaines, auto-renouvellement, verrouillage, code EPP, connexion d'un domaine externe |
| `espace/emails.html` | Boîtes mail, alias, paramètres IMAP / SMTP |
| `espace/dns.html` | DNS : diagnostic, réparation automatique, CRUD des enregistrements, propagation, export de zone |
| `espace/facturation.html` | Offre, changement de plan, moyens de paiement, factures |
| `espace/parametres.html` | Profil, entreprise, sécurité (2FA, comptes Google/Apple), notifications |

## Organisation du code

```
assets/
  css/styles.css          Composants de la marque (boutons, cartes, formulaires, modales...)
  tailwind.css (généré)    CSS Tailwind compilé ; fonts.css = polices auto-hébergées
  js/icons.js (généré)    Icônes Lucide utilisées uniquement
  js/config.js            Offres, prix, extensions, taux HTG, serveurs mail, DNS
  js/api.js               Couche de données (mode démo + appels REST)
  js/ui.js                En-tête, pied de page, notifications, modales, copie
  js/espace.js            Barre latérale et barre du haut de l'espace client
  js/pages/*.js           Logique propre à chaque page
  img/                    Logos du pack d'identité visuelle
```

## Passer en production

1. **Backend** : dans `assets/js/config.js`, mettez `DEMO_MODE: false` et `API_BASE` vers votre API. Les routes attendues sont listées en tête de `assets/js/api.js`.
2. **Clés secrètes** : le Registrar, Purelymail et Freda Pay sont appelés uniquement depuis le backend. Aucune clé dans le frontend.
3. **Carte bancaire** : utilisez le formulaire sécurisé ou le SDK de Freda Pay pour tokeniser la carte. N'envoyez jamais le numéro complet à votre serveur (PCI-DSS).
4. **MonCash / NatCash** : le backend crée la transaction via Freda Pay et renvoie l'URL de redirection ou déclenche la demande sur le téléphone.
5. **Google / Apple** : `FW.auth.oauth()` redirige vers `/auth/oauth/google|apple`. Avec Supabase, remplacez par `supabase.auth.signInWithOAuth({ provider })`.
6. **Régénérer le CSS / les icônes** après une modification de classes ou d'icônes : `npm install && npm run build` (thème dans `tailwind.config.js`).
7. **À compléter** : liens App Store / Play Store, adresse de support, serveurs de noms, textes légaux, taux HTG dynamique.

## Mode démonstration

Les données de l'espace client sont des exemples stockés dans le navigateur. Le bouton « Réinitialiser » du bandeau les remet à zéro.
Carte de test refusée : tout numéro valide se terminant par `0002` (ex. `4000 0000 0000 0002`).

## Tests et intégration continue

```bash
npm install
npx playwright install chromium   # une seule fois
npm test                          # tests statiques (SEO, CSP, liens) + parcours navigateur
```

Les tests démarrent un serveur local avec **les mêmes en-têtes que la production** (lus dans `render.yaml`, dont la CSP stricte) et échouent à la moindre erreur JavaScript, violation CSP, lien cassé, débordement horizontal ou page privée indexable. La CI GitHub (`.github/workflows/ci.yml`) les exécute à chaque push et vérifie que `assets/css/tailwind.css` et `assets/js/icons.js` sont à jour.

## Sécurité, SEO et suivi

- **CSP stricte** (`render.yaml`) : `script-src 'self'` seulement, aucun script ni gestionnaire inline, tout est auto-hébergé (polices, icônes, QR code). N'ajoutez pas de script tiers sans mettre à jour la CSP.
- **Validation côté serveur obligatoire** : les contrôles du frontend (formats de domaine, champs, montants, prix) sont une aide pour l'utilisateur, jamais une protection. Le backend doit revalider chaque entrée, recalculer les prix et vérifier les droits de l'utilisateur.
- **SEO** : `robots.txt`, `sitemap.xml`, canonical et Open Graph absolus (`https://fredaworkspace.com`). Les pages de connexion, paiement et espace client sont en `noindex`. Si le domaine change, mettez à jour ces fichiers (les tests le signalent).
- **Audience et erreurs** : renseignez `ANALYTICS_DOMAIN` (Plausible, sans cookie, respecte Do Not Track) et `ERROR_ENDPOINT` (reçoit les erreurs JS en JSON) dans `assets/js/config.js`. Évènements : `domain_search`, `signup`, `login`, `purchase`, `domain_connect`, `domain_verified`. `FW.track(nom, props)` pour en ajouter ; n'y mettez jamais de donnée personnelle.

## Backend

L'API est dans un dépôt séparé : [Freda-workspace-backend](https://github.com/saintjulienwidemayeur-max/Freda-workspace-backend) (comptes, domaines NameSilo, paiements Pay'm, DNS, Freda Mail, renouvellements).

**Passer le site en production** (quand l'API est en ligne) dans `assets/js/config.js` : `DEMO_MODE: false` et `API_BASE: 'https://api.fredaworkspace.com/api'` (la CSP de `render.yaml` autorise déjà cette origine). En production :
- le jeton JWT est conservé dans `localStorage` (`fw:token`) et envoyé en `Authorization: Bearer` ;
- l'espace client charge ses données avec `GET /workspace` avant de s'afficher (les scripts de page, balisés `data-page-script`, démarrent ensuite) ; aucune donnée de démonstration n'est jamais affichée ;
- les paiements MonCash/NatCash sont **asynchrones** : `/checkout` renvoie l'URL de paiement Pay'm, la page l'ouvre et attend la confirmation (`GET /orders/:id`) ; le navigateur n'envoie que le choix (le serveur recalcule les prix) et aucune donnée de carte ;
- les liens de renouvellement reçus par e-mail (`espace/domaines.html?renew=nom`, `espace/facturation.html?renew=1`) créent un paiement frais au clic ; Google renvoie vers `connexion.html#token=…` ; le lien de réinitialisation est `connexion.html?reset=JETON`.

**Test de bout en bout** (vrai frontend en mode production contre le vrai backend et ses faux services) :
```bash
FREDA_BACKEND_DIR=../freda-workspace-backend npm test
```
Sans cette variable (cas de la CI), ce test est ignoré.
