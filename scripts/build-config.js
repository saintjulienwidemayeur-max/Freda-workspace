#!/usr/bin/env node
/**
 * Étape de build (Render) : écrit DEMO_MODE et API_BASE dans assets/js/config.js à partir des variables d'environnement du site,
 * pour passer d'une instance à l'autre (démo / essai / production) sans modifier le dépôt.
 *   FW_DEMO_MODE = true | false          FW_API_BASE = https://<api>/api
 * Sans aucune de ces variables : rien ne change (le site reste en démo). Valeurs invalides : le build ÉCHOUE (jamais un site à moitié configuré).
 * Usage : node scripts/build-config.js [fichier]   (défaut : assets/js/config.js)
 */
const fs = require('fs');
const path = require('path');

const fail = (msg) => { console.error('build-config : ' + msg); process.exit(1); };
const file = process.argv[2] || path.join(__dirname, '..', 'assets', 'js', 'config.js');
const demo = process.env.FW_DEMO_MODE;
const api = process.env.FW_API_BASE;

if (demo === undefined && !api) { console.log('build-config : aucune variable FW_*, configuration inchangée (démo).'); process.exit(0); }
if (demo !== undefined && !['true', 'false'].includes(demo)) fail('FW_DEMO_MODE doit valoir « true » ou « false » (reçu : ' + JSON.stringify(demo) + ').');
if (api && api !== '/api' && !/^https:\/\/[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{2,5})?\/api$/i.test(api)) fail('FW_API_BASE doit être https://<hôte>/api (reçu : ' + JSON.stringify(api) + ').');
if (demo === 'false' && (!api || api === '/api')) fail('FW_DEMO_MODE=false exige FW_API_BASE=https://<hôte>/api : sans API, le site ne pourrait rien enregistrer.');

let src = fs.readFileSync(file, 'utf8');
const swap = (re, to, name) => {
  const hits = src.match(new RegExp(re.source, 'g')) || [];
  if (hits.length !== 1) fail(`${name} introuvable (ou en double) dans ${path.basename(file)} : le format du fichier a changé ?`);
  src = src.replace(re, to);
};
if (api) swap(/API_BASE:\s*'[^']*'/, `API_BASE: '${api}'`, 'API_BASE');
if (demo !== undefined) swap(/DEMO_MODE:\s*(true|false)/, `DEMO_MODE: ${demo}`, 'DEMO_MODE');
fs.writeFileSync(file, src);
console.log(`build-config : ${path.basename(file)} écrit (DEMO_MODE=${demo === undefined ? 'inchangé' : demo}, API_BASE=${api || 'inchangé'}).`);
