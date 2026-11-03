/**
 * Test de bout en bout (VRAI frontend en production, VRAI backend et ses faux services) des pages ajoutées pour Stripe et Purelymail :
 *  - retour de Stripe (?payment=cancelled | success&order=…) : message, confirmation serveur, URL nettoyée ;
 *  - fenêtre « Ajouter un moyen de paiement » : aucun champ de carte (la carte se saisit chez Stripe) ;
 *  - création de boîte sur un domaine EXTERNE : enregistrement TXT de vérification affiché, copiable, puis levé une fois visible dans le DNS.
 *   FREDA_BACKEND_DIR=../Freda-workspace-backend npm test
 */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('./helpers');

const dir = process.env.FREDA_BACKEND_DIR && path.resolve(process.env.FREDA_BACKEND_DIR);
const skip = !dir && 'FREDA_BACKEND_DIR non défini : test de bout en bout ignoré';
const CODE = 'purelymail_ownership_proof=abc123';

test('retour Stripe, ajout de moyen de paiement sans champ de carte, vérification TXT d’un domaine externe', { skip, timeout: 120000 }, async () => {
  const backend = require(path.join(dir, 'tests/helpers'));
  const front = await startServer({ connectSrc: "'self' http://127.0.0.1:*" });
  const t = await backend.setup({ stripe: true, env: { AUTH_MODE: 'jwt', PAYMENTS_PROVIDER: 'paym', ALLOWED_ORIGINS: front.url, APP_URL: front.url, NAMESILO_MODE: 'live' } });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('JS : ' + e.message));
  page.on('console', (m) => { if (/Content Security Policy|Refused to/.test(m.text())) problems.push('CSP : ' + m.text()); });
  await ctx.route('**/assets/js/config.js', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace('DEMO_MODE: true', 'DEMO_MODE: false').replace("API_BASE: '/api'", `API_BASE: '${t.base}/api'`);
    await route.fulfill({ response: res, body });
  });
  const api = async (p, token, opts = {}) => { const r = await fetch(t.base + '/api' + p, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: opts.body ? JSON.stringify(opts.body) : undefined }); return { status: r.status, json: await r.json() }; };

  try {
    const su = await api('/auth/signup', null, { method: 'POST', body: { name: 'Paul Test', email: 'paul@example.com', password: 'Motdepasse#2026' } });
    const token = su.json.token; assert.ok(token);
    assert.strictEqual((await api('/me/company', token, { method: 'PATCH', body: { company: 'Atelier Test', address: '12 rue des Fleurs', city: 'Pétion-Ville' } })).status, 200);
    await ctx.addInitScript(([tk, user]) => { localStorage.setItem('fw:token', JSON.stringify(tk)); localStorage.setItem('fw:session', JSON.stringify({ user, provider: 'email' })); }, [token, su.json.user]);

    /* 1. Retour « annulé » : message clair, aucun débit, URL nettoyée */
    await page.goto(`${front.url}/espace/facturation.html?payment=cancelled&order=ord_x`);
    try { await page.waitForSelector('#pm-list', { timeout: 8000 }); } catch (e) { throw new Error('page: ' + page.url() + ' | erreurs: ' + JSON.stringify(problems) + ' | texte: ' + (await page.textContent('body')).replace(/\s+/g, ' ').slice(0, 300)); }
    await page.waitForFunction(() => /Paiement annulé/.test(document.body.textContent));
    assert.strictEqual(new URL(page.url()).search, '', 'l’URL de retour est nettoyée');

    /* 2. Achat d'un domaine par carte (Stripe Checkout), puis retour « succès » : confirmation serveur */
    const buy = await api('/checkout', token, { method: 'POST', body: { kind: 'domain', domains: ['atelier-test.com'], years: 1, method: 'card' } });
    assert.strictEqual(buy.json.status, 'pending'); assert.match(buy.json.redirectUrl, /checkout\.stripe\.test/);
    const sess = t.db.get('SELECT charge_id FROM orders').charge_id;
    assert.match(t.stripe.calls.find((c) => c.path === '/v1/checkout/sessions').f.success_url, new RegExp('order=' + buy.json.orderId));
    t.stState.sessions[sess].payment_status = 'paid';                      // le client a payé sur la page Stripe
    await page.goto(`${front.url}/espace/facturation.html?payment=success&order=${buy.json.orderId}`);
    await page.waitForFunction(() => /Paiement confirmé|Confirmation de votre paiement/.test(document.body.textContent), null, { timeout: 15000 });
    await page.waitForFunction(() => !location.search && document.querySelector('#pm-list') && /visa/i.test(document.querySelector('#pm-list').textContent), null, { timeout: 20000 });
    assert.strictEqual(t.db.get('SELECT COUNT(*) AS n FROM domains').n, 1, 'domaine enregistré après confirmation');
    assert.strictEqual(t.db.get("SELECT status FROM orders").status, 'completed');

    /* 3. Fenêtre d'ajout de moyen de paiement : carte = explication Stripe, sans champ ; MonCash = bouton Enregistrer */
    await page.click('[data-open="modal-pm"]');
    assert.strictEqual(await page.isVisible('#pm-number'), false, 'aucun champ de numéro de carte');
    assert.strictEqual(await page.isVisible('#pm-cvc'), false);
    assert.match(await page.textContent('#pm-card'), /Stripe/);
    assert.strictEqual(await page.isVisible('#pm-form [type=submit]'), false, 'rien à enregistrer pour la carte');
    await page.click('[data-pm="moncash"]');
    assert.strictEqual(await page.isVisible('#pm-form [type=submit]'), true);
    await page.click('[data-pm="card"]');
    assert.strictEqual(await page.isVisible('#pm-form [type=submit]'), false);

    /* 4. Domaine externe : offre active, TXT de vérification affiché dans la fenêtre « Nouvelle boîte » */
    const methodId = (await api('/payment-methods', token)).json.methods[0].id;
    const sub = await api('/checkout', token, { method: 'POST', body: { kind: 'subscription', plan: 'business', cycle: 'monthly', method: 'card', methodId } });
    assert.strictEqual(sub.json.status, 'succeeded');
    assert.strictEqual((await api('/domains/connect', token, { method: 'POST', body: { domain: 'externe.com', mode: 'records' } })).status, 200);
    t.pmState.verifiedTxt = false;
    await page.goto(`${front.url}/espace/emails.html`);
    await page.waitForSelector('#new-box-btn');
    await page.click('#new-box-btn');
    await page.selectOption('#box-domain', 'externe.com');
    await page.waitForSelector('#own-box:not([hidden])');
    assert.strictEqual((await page.textContent('#own-type')).trim(), 'TXT');
    assert.strictEqual((await page.textContent('#own-value')).trim(), CODE);
    assert.match(await page.textContent('#own-text'), /hébergeur/);
    await page.fill('#box-local', 'contact');
    await page.click('#box-form [type=submit]');
    await page.waitForFunction(() => /hébergeur/.test(document.querySelector('#box-error').textContent));
    assert.strictEqual(t.db.get('SELECT COUNT(*) AS n FROM mailboxes').n, 0, 'aucune boîte tant que le domaine n’est pas vérifié');
    assert.ok(await page.isVisible('#own-box'), 'l’enregistrement reste affiché après l’erreur');

    /* 5. Le client publie le TXT : « Vérifier maintenant » lève l'avertissement, la boîte se crée */
    t.pmState.verifiedTxt = true; t.dnsState.txt['externe.com'] = [[CODE]];
    await page.click('#own-check');
    await page.waitForSelector('#own-box', { state: 'hidden' });
    await page.click('#box-form [type=submit]');
    await page.waitForFunction(() => document.querySelector('#box-body') && /contact@externe\.com/.test(document.querySelector('#box-body').textContent), null, { timeout: 15000 });
    assert.strictEqual(t.db.get('SELECT COUNT(*) AS n FROM mailboxes').n, 1);

    assert.deepStrictEqual(problems, []);
  } finally {
    await browser.close();
    front.server.close();
    backend.closeAll();
  }
});
