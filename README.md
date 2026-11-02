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
