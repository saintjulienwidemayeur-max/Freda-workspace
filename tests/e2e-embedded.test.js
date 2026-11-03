/**
 * Embedded Checkout de bout en bout : le VRAI frontend (production) contre le VRAI backend et ses faux services ; seul Stripe.js est remplacé par un faux
 * (la vraie iframe Stripe est inaccessible hors réseau). Vérifie NOTRE code : fenêtre, montage, fermeture / reprise, confirmation par le serveur, erreurs.
 *   FREDA_BACKEND_DIR=../Freda-workspace-backend npm test
 */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('./helpers');

const dir = process.env.FREDA_BACKEND_DIR && path.resolve(process.env.FREDA_BACKEND_DIR);
const skip = !dir && 'FREDA_BACKEND_DIR non défini : test de bout en bout ignoré';

const FAKE_STRIPE_JS = `
window.Stripe = function (pk) {
  window.__pk = pk;
  return { createEmbeddedCheckoutPage: async function (opts) {
    window.__cs = await opts.fetchClientSecret();
    return {
      mount: function (sel) { document.querySelector(sel).innerHTML = '<div id="fake-stripe-frame">Faux formulaire Stripe</div>'; window.__mounted = (window.__mounted || 0) + 1; window.__complete = opts.onComplete; },
      destroy: function () { window.__destroyed = (window.__destroyed || 0) + 1; }
    };
  } };
};`;

test('Embedded Checkout : fenêtre, Stripe monté avec client_secret + clé publique, fermeture puis reprise, confirmation par le serveur, erreur de chargement', { skip, timeout: 120000 }, async () => {
  const backend = require(path.join(dir, 'tests/helpers'));
  const front = await startServer({ connectSrc: "'self' http://127.0.0.1:*" });
  const t = await backend.setup({ stripe: true, env: { AUTH_MODE: 'jwt', PAYMENTS_PROVIDER: 'paym', ALLOWED_ORIGINS: front.url, APP_URL: front.url, NAMESILO_MODE: 'live', STRIPE_PUBLISHABLE_KEY: 'pk_test_abc123' } });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('JS : ' + e.message));
  page.on('console', (m) => { if (/Content Security Policy|Refused to/.test(m.text())) problems.push('CSP : ' + m.text()); });
  let failScript = false;
  await ctx.route('https://js.stripe.com/**', (route) => (failScript ? route.abort() : route.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_STRIPE_JS })));
  await ctx.route('**/assets/js/config.js', async (route) => {
    const res = await route.fetch();
    await route.fulfill({ response: res, body: (await res.text()).replace('DEMO_MODE: true', 'DEMO_MODE: false').replace("API_BASE: '/api'", `API_BASE: '${t.base}/api'`) });
  });
  const api = async (p, token, opts = {}) => { const r = await fetch(t.base + '/api' + p, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: opts.body ? JSON.stringify(opts.body) : undefined }); return { status: r.status, json: await r.json() }; };

  try {
    const su = await api('/auth/signup', null, { method: 'POST', body: { name: 'Paul Test', email: 'paul@example.com', password: 'Motdepasse#2026' } });
    const token = su.json.token;
    await api('/me/company', token, { method: 'PATCH', body: { company: 'Atelier Test', address: '12 rue des Fleurs', city: 'Pétion-Ville' } });
    await ctx.addInitScript(([tk, user]) => { localStorage.setItem('fw:token', JSON.stringify(tk)); localStorage.setItem('fw:session', JSON.stringify({ user, provider: 'email' })); }, [token, su.json.user]);
    await page.goto(`${front.url}/espace/facturation.html`);
    await page.waitForSelector('#pm-list');

    /* 1. Le serveur renvoie client_secret + clé publique, sans URL */
    const buy = await api('/checkout', token, { method: 'POST', body: { kind: 'domain', domains: ['atelier-test.com'], years: 1, method: 'card' } });
    assert.strictEqual(buy.json.status, 'pending'); assert.strictEqual(buy.json.redirectUrl, undefined);
    assert.strictEqual(buy.json.embedded.publishableKey, 'pk_test_abc123');

    /* 2. La fenêtre s'ouvre et Stripe est monté avec ce client_secret */
    await page.evaluate((res) => { window.__settle = window.FW.payments.settle(res).then((v) => ({ ok: v }), (e) => ({ err: e.message })); }, buy.json);
    await page.waitForSelector('#fw-embedded-overlay');
    await page.waitForSelector('#fake-stripe-frame');
    assert.strictEqual(await page.evaluate(() => window.__pk), 'pk_test_abc123');
    assert.strictEqual(await page.evaluate(() => window.__cs), buy.json.embedded.clientSecret);
    assert.strictEqual(await page.getAttribute('#fw-embedded-overlay', 'aria-modal'), 'true');
    assert.strictEqual(await page.evaluate(() => document.body.style.overflow), 'hidden', 'le fond ne défile pas');
    assert.strictEqual(await page.evaluate(() => document.querySelectorAll('#fw-embedded-overlay input').length), 0, 'aucun champ de saisie sur NOS pages (tout est dans l’iframe Stripe)');

    /* 3. Fermeture (×) : Stripe détruit, bouton « Reprendre le paiement » ; la reprise relit le client_secret chez le serveur */
    await page.click('[data-fw-close]');
    await page.waitForSelector('#fw-embedded-overlay', { state: 'detached' });
    assert.strictEqual(await page.evaluate(() => window.__destroyed), 1);
    assert.strictEqual(await page.evaluate(() => document.body.style.overflow), '', 'défilement rétabli');
    await page.waitForSelector('#pay-resume-banner [data-resume]');
    await page.click('#pay-resume-banner [data-resume]');
    await page.waitForSelector('#fw-embedded-overlay');
    await page.waitForFunction(() => window.__mounted === 2);
    await page.keyboard.press('Escape');                                   // Échap ferme aussi
    await page.waitForSelector('#fw-embedded-overlay', { state: 'detached' });
    await page.click('#pay-resume-banner [data-resume]');
    await page.waitForFunction(() => window.__mounted === 3);

    /* 4. Le client paie : onComplete informe, MAIS seule la confirmation du serveur ferme la fenêtre et exécute la commande */
    const sid = (await t.db.get('SELECT charge_id FROM orders')).charge_id;
    t.stState.sessions[sid].payment_status = 'paid';
    await page.evaluate(() => window.__complete());
    await page.waitForFunction(() => /Paiement reçu/.test(document.getElementById('fw-embedded-status').textContent));
    const done = await page.evaluate(() => window.__settle);
    assert.strictEqual(done.ok && done.ok.status, 'succeeded', JSON.stringify(done));
    await page.waitForSelector('#fw-embedded-overlay', { state: 'detached' });
    assert.strictEqual(await page.locator('#pay-resume-banner').count(), 0, 'plus de bannière de reprise');
    assert.strictEqual((await t.db.get('SELECT COUNT(*) AS n FROM domains')).n, 1, 'domaine enregistré par le serveur');

    /* 5. Stripe.js injoignable : message clair dans la fenêtre, fermeture possible, pas d'erreur JavaScript */
    await page.evaluate(() => { delete window.Stripe; });
    failScript = true;
    const buy2 = await api('/checkout', token, { method: 'POST', body: { kind: 'domain', domains: ['deux-test.com'], years: 1, method: 'card' } });
    await page.evaluate((res) => { window.__settle2 = window.FW.payments.settle(res).then(() => 'ok', (e) => e.message); }, buy2.json);
    await page.waitForSelector('#fw-embedded-mount [role=alert]');
    assert.match(await page.textContent('#fw-embedded-mount [role=alert]'), /Impossible de charger le module de paiement/);
    await page.click('[data-fw-close]');
    await page.waitForSelector('#fw-embedded-overlay', { state: 'detached' });

    assert.deepStrictEqual(problems.filter((p) => !/Failed to load resource|ERR_FAILED/.test(p)), []);
  } finally {
    await browser.close();
    front.server.close();
    await backend.closeAll();
  }
});
