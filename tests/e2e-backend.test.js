/**
 * Test de bout en bout : le VRAI frontend (DEMO_MODE=false) contre le VRAI backend (dépôt Freda-workspace-backend) et ses faux
 * services (NameSilo, Pay'm, Purelymail). Exécuté seulement si FREDA_BACKEND_DIR pointe vers une copie du backend :
 *   FREDA_BACKEND_DIR=../freda-workspace-backend npm test
 */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('./helpers');

const dir = process.env.FREDA_BACKEND_DIR && path.resolve(process.env.FREDA_BACKEND_DIR);
const skip = !dir && 'FREDA_BACKEND_DIR non défini : test de bout en bout ignoré';

test('frontend réel + backend réel : inscription, entreprise, moyen de paiement, achat de domaine Pay’m, DNS, offre', { skip, timeout: 120000 }, async () => {
  const backend = require(path.join(dir, 'tests/helpers'));
  const front = await startServer({ connectSrc: "'self' http://127.0.0.1:*" });
  const t = await backend.setup({ env: { AUTH_MODE: 'jwt', PAYMENTS_PROVIDER: 'paym', ALLOWED_ORIGINS: front.url, APP_URL: front.url, NAMESILO_MODE: 'live' } });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('JS : ' + e.message));
  page.on('console', (m) => { if (/Content Security Policy|Refused to/.test(m.text())) problems.push('CSP : ' + m.text()); });
  // Le frontend publié reste en démo : on le bascule en production pour ce test uniquement.
  await ctx.route('**/assets/js/config.js', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace('DEMO_MODE: true', 'DEMO_MODE: false').replace("API_BASE: '/api'", `API_BASE: '${t.base}/api'`);
    await route.fulfill({ response: res, body });
  });
  const api = (p, token, opts = {}) => fetch(t.base + '/api' + p, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opts.headers || {}) } });

  try {
    /* 1. Inscription réelle -> étape entreprise */
    await page.goto(`${front.url}/inscription.html`);
    await page.fill('#su-name', 'Paul Test'); await page.fill('#su-email', 'paul@example.com'); await page.fill('#su-pass', 'Motdepasse#2026'); await page.check('#su-terms');
    await page.click('#signup-form [type=submit]');
    await page.waitForURL('**/entreprise.html');
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('fw:token')));
    assert.ok(token, 'jeton enregistré');

    /* 2. Entreprise (enregistrée côté serveur) */
    await page.fill('#co-name', 'Atelier Test'); await page.fill('#co-address', '12 rue des Fleurs'); await page.fill('#co-city', 'Pétion-Ville');
    await page.click('#company-form [type=submit]');
    await page.waitForURL('**/domaines.html**');
    const me = await (await api('/me', token)).json();
    assert.strictEqual(me.company, 'Atelier Test'); assert.strictEqual(me.address, '12 rue des Fleurs');

    /* 3. L'espace client charge les VRAIES données (vides), pas la démo */
    await page.goto(`${front.url}/espace/index.html`);
    await page.waitForSelector('#stats a');
    assert.doesNotMatch(await page.textContent('body'), /monentreprise\.com/, 'aucune donnée de démonstration en production');

    /* 4. Moyen de paiement MonCash enregistré via l'interface */
    await page.goto(`${front.url}/espace/facturation.html`);
    await page.waitForSelector('#pm-list');
    await page.click('[data-open="modal-pm"]');
    await page.click('[data-pm="moncash"]');
    await page.fill('#pm-phone', '37123456');
    await page.click('#pm-form [type=submit]');
    await page.waitForFunction(() => document.querySelector('#pm-list').textContent.includes('37'));

    /* 5. Achat d'un domaine depuis l'espace : paiement Pay'm asynchrone */
    await page.goto(`${front.url}/espace/acheter-domaine.html`);
    await page.fill('#buy-q', 'atelier-test'); await page.click('#buy-go');
    await page.waitForSelector('[data-toggle]');
    await page.locator('[data-toggle]').first().click();
    assert.strictEqual(await page.isChecked('#whois-privacy'), true, 'confidentialité Whois cochée par défaut');
    await page.uncheck('#whois-privacy');                      // le client la désactive
    await page.click('#buy-pay');
    await page.waitForSelector('#pay-wait-banner');
    assert.match(await page.textContent('#pay-wait-banner'), /paiement/i);
    const ref = (await t.db.get("SELECT reference FROM orders WHERE kind = 'domain'")).reference;
    assert.strictEqual((await t.db.get('SELECT COUNT(*) AS n FROM domains')).n, 0, 'rien n’est acheté avant le paiement');
    t.state.paid.add(ref);                                   // le client a payé sur Pay'm
    await page.waitForSelector('#buy-done:not([hidden])', { timeout: 20000 });
    assert.strictEqual((await t.db.get('SELECT COUNT(*) AS n FROM domains')).n, 1);
    const bought = (await t.db.get('SELECT name FROM domains')).name;
    assert.strictEqual(t.ns.calls.find((c) => c.op === 'registerDomain').q.private, '0', 'choix du client transmis à NameSilo (WHOIS public)');

    /* 6. La page Domaines montre le domaine ; DNS : ajout répercuté chez NameSilo */
    await page.goto(`${front.url}/espace/domaines.html`);
    await page.waitForFunction((n) => document.querySelector('#domain-cards').textContent.includes(n), bought);
    await page.goto(`${front.url}/espace/dns.html?domain=${bought}`);
    await page.waitForSelector('body');
    const added = await (await api(`/domains/${bought}/dns`, token, { method: 'POST', body: JSON.stringify({ type: 'A', name: '@', value: '76.76.21.21' }) })).json();
    assert.ok(added.id);
    assert.ok(t.ns.calls.some((c) => c.op === 'dnsAddRecord'));

    /* 7. Offre Freda Mail (Pay'm) puis boîtes visibles dans l'interface */
    const sub = await (await api('/checkout', token, { method: 'POST', body: JSON.stringify({ kind: 'subscription', plan: 'starter', cycle: 'monthly', domain: bought, mailbox: { local: 'contact' }, method: 'moncash' }) })).json();
    t.state.paid.add(sub.reference);
    await t.app.app.orders.sweep();
    await page.goto(`${front.url}/espace/emails.html`);
    await page.waitForFunction(() => document.querySelector('#box-body') && document.querySelector('#box-body').textContent.includes('contact@'));

    /* 8. Session invalide -> retour à la connexion */
    await page.evaluate(() => localStorage.setItem('fw:token', JSON.stringify('jeton-invalide')));
    await page.goto(`${front.url}/espace/index.html`);
    await page.waitForURL('**/connexion.html**');

    assert.deepStrictEqual(problems, []);
  } finally {
    await browser.close();
    front.server.close();
    backend.closeAll();
  }
});
