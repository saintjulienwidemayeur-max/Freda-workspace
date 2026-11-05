const test = require('node:test');
const assert = require('node:assert');
const { chromium } = require('playwright');
const { htmlFiles, rel, startServer } = require('./helpers');

let server, url, browser;
const pages = htmlFiles().map(rel).filter((p) => p !== '404.html');

test.before(async () => {
  ({ server, url } = await startServer());
  browser = await chromium.launch();
});
test.after(async () => { await browser.close(); server.close(); });

async function open(ctxOpts) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('erreur JS : ' + e.message));
  page.on('console', (m) => {
    if (/\/assets\/img\/pay\/(moncash|natcash)\.png/.test(m.location().url || '')) return;   // logos à fournir : repli texte
    if (m.type() === 'error' || /Content Security Policy|Refused to/.test(m.text())) problems.push('console : ' + m.text());
  });
  page.on('requestfailed', (r) => { if (!/\/assets\/img\/pay\/(moncash|natcash)\.png/.test(r.url())) problems.push('requête échouée : ' + r.url()); });
  page.on('response', (r) => { if (r.status() >= 400 && !/\/assets\/img\/pay\/(moncash|natcash)\.png/.test(r.url())) problems.push(r.status() + ' ' + r.url()); });
  return { ctx, page, problems };
}

for (const [label, viewport, isMobile] of [['desktop', { width: 1440, height: 900 }, false], ['mobile', { width: 390, height: 844 }, true]]) {
  test(`pages : aucune erreur, aucune violation CSP, pas de débordement (${label})`, async () => {
    const { ctx, page, problems } = await open({ viewport, isMobile });
    const report = [];
    for (const p of pages) {
      problems.length = 0;
      await page.goto(`${url}/${p}`);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) problems.push('débordement horizontal de ' + overflow + 'px');
      const icons = await page.evaluate(() => document.querySelectorAll('[data-lucide]').length);
      if (icons > 0) problems.push(icons + ' icône(s) non rendue(s)');
      if (problems.length) report.push(p + ' : ' + problems.join(' | '));
    }
    await ctx.close();
    assert.deepStrictEqual(report, []);
  });
}

test('une URL inconnue renvoie la page 404 personnalisée', async () => {
  const { ctx, page } = await open({});
  const res = await page.goto(`${url}/n-existe-pas`);
  assert.strictEqual(res.status(), 404);
  assert.match(await page.textContent('h1'), /introuvable/i);
  await ctx.close();
});

test('recherche de domaine depuis l’accueil', async () => {
  const { ctx, page, problems } = await open({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${url}/index.html`);
  await page.fill('#hero-domain', 'mon projet');
  assert.match(await page.textContent('#hero-preview'), /mon-projet/);
  await page.fill('#hero-domain', '');
  await page.click('#hero-search button[type=submit]');
  assert.ok(await page.locator('#hero-error.show').count(), 'message d’erreur attendu pour un champ vide');
  await ctx.close();
  assert.deepStrictEqual(problems, []);
});

async function login(page) {
  await page.goto(`${url}/connexion.html`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${url}/espace/index.html`);   // le mode démo ouvre une session de démonstration
  await page.waitForSelector('#stats');
}

test('espace client : ajouter un domaine existant (DNS Freda puis enregistrements)', async () => {
  const { ctx, page, problems } = await open({ viewport: { width: 1280, height: 900 } });
  await login(page);
  await page.goto(`${url}/espace/domaines.html`);
  await page.click('[data-open="modal-connect"]');
  await page.fill('#connect-domain', 'pas un domaine');
  await page.click('#connect-submit');
  assert.ok(await page.locator('#connect-error.show').count(), 'domaine invalide refusé');
  await page.fill('#connect-domain', 'https://www.Test-Externe.com/');
  await page.click('#connect-submit');
  await page.waitForSelector('#connect-steps:not([hidden])');
  assert.strictEqual(await page.textContent('#connect-name'), 'test-externe.com');
  assert.ok(await page.locator('#connect-ns li').count() >= 2, 'serveurs de noms affichés');
  await page.click('text=Garder mon DNS actuel');
  assert.strictEqual(await page.locator('#connect-records tr').count(), 6, '6 enregistrements email');
  await page.click('#connect-done');
  await page.waitForSelector('#modal-connect[hidden]', { state: 'attached' });
  assert.match(await page.textContent('#domain-cards'), /test-externe\.com/);
  // doublon refusé
  await page.click('[data-open="modal-connect"]');
  await page.fill('#connect-domain', 'test-externe.com');
  await page.click('#connect-submit');
  await page.waitForSelector('#connect-error.show');
  assert.match(await page.textContent('#connect-error'), /déjà/);
  await ctx.close();
  assert.deepStrictEqual(problems, []);
});

test('espace client : acheter un domaine avec un moyen de paiement enregistré', async () => {
  const { ctx, page, problems } = await open({ viewport: { width: 1280, height: 900 } });
  await login(page);
  await page.goto(`${url}/espace/acheter-domaine.html`);
  await page.fill('#buy-q', 'projet-test');
  await page.click('#buy-go');
  await page.waitForSelector('[data-toggle]');
  assert.strictEqual(await page.isDisabled('#buy-pay'), true, 'paiement désactivé sans sélection');
  await page.locator('[data-toggle]').first().click();
  assert.strictEqual(await page.isDisabled('#buy-pay'), false);
  await page.click('#buy-pay');
  await page.waitForSelector('#cp-title');                       // le client choisit toujours son moyen de paiement
  await page.click('.modal [data-ok]');
  await page.waitForSelector('#buy-done:not([hidden])');
  await page.goto(`${url}/espace/domaines.html`);
  assert.match(await page.textContent('#domain-cards'), /projet-test\./);
  await page.goto(`${url}/espace/facturation.html`);
  assert.match(await page.textContent('body'), /projet-test\./);
  await ctx.close();
  assert.deepStrictEqual(problems, []);
});

test('vue d’ensemble : pas de carte Abonnement', async () => {
  const { ctx, page } = await open({ viewport: { width: 1280, height: 900 } });
  await login(page);
  assert.strictEqual(await page.locator('#sub-title').count(), 0);
  await ctx.close();
});

test('facturation : téléchargement d’une facture PDF valide', async () => {
  const { ctx, page, problems } = await open({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await login(page);
  await page.goto(`${url}/espace/facturation.html`);
  await page.waitForSelector('[data-pdf]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-pdf="FW-2026-0118"]')]);
  assert.strictEqual(dl.suggestedFilename(), 'Facture-FW-2026-0118.pdf');
  const buf = require('fs').readFileSync(await dl.path());
  assert.strictEqual(buf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(buf.length > 20000, 'PDF avec logo');
  await ctx.close();
  assert.deepStrictEqual(problems, []);
});

test('inscription : étape entreprise facultative, puis infos reprises dans Paramètres', async () => {
  const { ctx, page, problems } = await open({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${url}/inscription.html`);
  await page.evaluate(() => localStorage.clear());
  assert.strictEqual(await page.locator('#su-company').count(), 0, 'plus de champ entreprise à l’inscription');
  await page.fill('#su-name', 'Paul Test');
  await page.fill('#su-email', 'paul@example.com');
  await page.fill('#su-pass', 'Motdepasse#2026');
  await page.check('#su-terms');
  await page.click('#signup-form [type=submit]');
  await page.waitForURL('**/entreprise');
  await page.fill('#co-name', 'Atelier Test');
  await page.fill('#co-address', '12 rue des Fleurs');
  await page.fill('#co-city', 'Pétion-Ville');
  await page.fill('#co-nif', '123-456-789-0');
  await page.click('#company-form [type=submit]');
  await page.waitForURL('**/domaines**');
  assert.match(page.url(), /q=ateliertest/);
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('fw:session')));
  assert.strictEqual(session.user.company, 'Atelier Test');
  assert.strictEqual(session.user.taxId, '123-456-789-0');
  await ctx.close();
  assert.deepStrictEqual(problems, []);
});

test('inscription : l’étape entreprise peut être passée', async () => {
  const { ctx, page } = await open({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${url}/connexion.html`);
  await page.evaluate(() => localStorage.setItem('fw:session', JSON.stringify({ user: { name: 'A B', email: 'a@b.co' }, provider: 'email' })));
  await page.goto(`${url}/entreprise.html`);
  await page.click('#skip-bottom');
  await page.waitForURL('**/domaines');
  await ctx.close();
});

test('paramètres : infos entreprise enregistrées et bannière de l’accueil', async () => {
  const { ctx, page, problems } = await open({ viewport: { width: 1280, height: 900 } });
  await login(page);
  assert.ok(await page.locator('a[href="parametres.html?tab=entreprise"]').count(), 'bannière profil incomplet');
  await page.goto(`${url}/espace/parametres.html?tab=entreprise`);
  assert.strictEqual(await page.locator('[data-panel="entreprise"]').isVisible(), true);
  await page.fill('#co-address', '5 avenue Test');
  await page.fill('#co-nif', '111-222-333-4');
  await page.click('[data-panel="entreprise"] [type=submit]');
  await page.waitForSelector('.toast');
  await page.goto(`${url}/espace/index.html`);
  await page.waitForSelector('#stats');
  assert.strictEqual(await page.locator('a[href="parametres.html?tab=entreprise"]').count(), 0, 'bannière masquée une fois complété');
  await ctx.close();
  assert.deepStrictEqual(problems, []);
});
