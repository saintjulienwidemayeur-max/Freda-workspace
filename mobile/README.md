# Freda Mail — application mobile (Expo / React Native)

Application de courrier iPhone + Android pour les boîtes Freda Workspace. Connexion à la vraie boîte (IMAP/SMTP) via l'API Freda, comptes multiples, verrouillage biométrique, photos de profil entre utilisateurs de Freda Mail, mode démo.

## Architecture
- `app/` : écrans (expo-router) — boîte de réception, lecture, écriture, profil, connexion.
- `src/data/imap/` : client IMAP écrit pour l'application (analyse des littéraux, UTF-7 des dossiers, MOVE/COPY, APPEND, reconnexion) ; `src/data/smtp.ts` : envoi SMTP authentifié ; `src/data/mime.ts` : construction du message.
- `src/data/api.ts` : API Freda (`/mail/login`, photos) ; `src/data/sessions.ts` : comptes dans le trousseau sécurisé (Keychain / Keystore).
- `src/state/` : stores (auth multi-comptes, verrouillage, photos, boîte de réception, envoi annulable 6 s).
- Les connexions IMAP/SMTP passent par `react-native-tcp-socket` (module natif) : **l'application ne tourne pas dans Expo Go**, il faut un build (EAS).

## Développement
```bash
npm install
npm test          # 30 tests : analyseur IMAP, client contre faux serveurs IMAP/SMTP, comptes, verrouillage, photos…
npm run typecheck
```
URL de l'API : variable `EXPO_PUBLIC_API_BASE` (défaut `https://fredaworkspace.com/api`).

## Build (EAS)
```bash
npx eas-cli build --platform android --profile preview   # APK à installer sur le téléphone
npx eas-cli build --platform ios --profile production    # iPhone : compte Apple Developer requis
```
Dans un dépôt GitHub relié au projet Expo, le dossier de base est `mobile`.

## Pas encore fait
Pièces jointes à ouvrir / envoyer, brouillons enregistrés, notifications push (le backend est prêt : `/api/mail/push`), test sur vrai téléphone (IMAP/SMTP, biométrie).
