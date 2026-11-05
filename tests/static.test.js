const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { ROOT, walk, htmlFiles, rel, productionHeaders } = require('./helpers');

const html = htmlFiles().map((f) => ({ file: rel(f), src: fs.readFileSync(f, 'utf8') }));
const { pages: LANDING } = require('../scripts/landing-content');
const EXTRA_PUBLIC = { 'en/press.html': 'en' };   // pages publiques écrites à la main hors du français
const PUBLIC = ['index.html', 'domaines.html', 'support.html', 'legal.html', 'confidentialite.html', 'presse.html', ...Object.keys(EXTRA_PUBLIC), ...LANDING.map((p) => p.path)];
const CONFIG = (() => { const sb = { window: {} }; require('vm').runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/config.js'), 'utf8'), sb); return sb.window.FW_CONFIG; })();

test('aucune dépendance à un CDN tiers (hors mesure d’audience Plausible)', () => {
  const files = [...html.map((h) => ({ file: h.file, src: h.src })), ...walk(path.join(ROOT, 'assets'), /\.(js|css)$/).filter((f) => !/vendor\/|icons\.js/.test(f)).map((f) => ({ file: rel(f), src: fs.readFileSync(f, 'utf8') }))];
  const bad = [];
  for (const { file, src } of files) {
    for (const m of src.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)|url\(["']?(https?:\/\/[^)"']+)/g)) {
      const url = m[1] || m[2];
      if (/^https:\/\/(plausible\.io|fredaworkspace\.com|apps\.apple\.com|play\.google\.com|webmail\.fredaworkspace\.com)/.test(url)) continue;
      if (file === 'assets/js/monitor.js') continue;
      bad.push(file + ' -> ' + url);
    }
  }
  assert.deepStrictEqual(bad, []);
});

test('compatible CSP stricte : pas de script inline ni de gestionnaire inline', () => {
  const bad = [];
  for (const { file, src } of html) {
    for (const m of src.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>/g)) if (!/application\/ld\+json|text\/plain/.test(m[1])) bad.push(file + ': script inline');
    if (/\son(click|error|load|submit|change|input)=/i.test(src)) bad.push(file + ': gestionnaire inline');
    if (/href="javascript:/i.test(src)) bad.push(file + ': lien javascript:');
  }
  for (const f of walk(path.join(ROOT, 'assets/js'), /\.js$/).filter((f) => !/vendor\//.test(f))) {
    const s = fs.readFileSync(f, 'utf8');
    if (/\son(click|error|load|submit)=["']/.test(s)) bad.push(rel(f) + ': gestionnaire inline dans un gabarit');
    if (/\beval\(|new Function\(/.test(s)) bad.push(rel(f) + ': eval');
  }
  assert.deepStrictEqual(bad, []);
});

test('scripts de page différés (data-page-script) : le fichier existe', () => {
  const bad = [];
  for (const { file, src } of html) {
    const dir = path.dirname(path.join(ROOT, file));
    for (const m of src.matchAll(/data-page-script="([^"]+)"/g)) if (!fs.existsSync(path.join(dir, m[1]))) bad.push(file + ' -> ' + m[1]);
  }
  assert.deepStrictEqual(bad, []);
});

test('tous les liens et ressources locaux existent', () => {
  const bad = [];
  for (const { file, src } of html) {
    const dir = path.dirname(path.join(ROOT, file));
    for (const m of src.matchAll(/(?:href|src)="([^"#?]+)/g)) {
      const u = m[1];
      if (/^(https?:|mailto:|tel:|data:)/.test(u) || u.includes('${')) continue;
      const p = u.startsWith('/') ? path.join(ROOT, u) : path.join(dir, u);
      if (!fs.existsSync(p)) bad.push(file + ' -> ' + u);
    }
  }
  assert.deepStrictEqual(bad, []);
});

test('chaque page a un titre, une description et une langue', () => {
  for (const { file, src } of html) {
    const lang = (LANDING.find((p) => p.path === file) || { lang: EXTRA_PUBLIC[file] || 'fr' }).lang;
    assert.match(src, new RegExp('<html lang="' + lang + '">'), file + ' : lang');
    assert.match(src, /<title>[^<]{5,}<\/title>/, file + ' : title');
    assert.match(src, /<meta name="description" content="[^"]{20,}"/, file + ' : description');
    assert.match(src, /<meta name="viewport"/, file + ' : viewport');
  }
});

test('SEO : pages publiques avec canonical et og:image absolus', () => {
  for (const f of PUBLIC) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.match(src, /<link rel="canonical" href="https:\/\/fredaworkspace\.com\//, f + ' : canonical');
    assert.match(src, /<meta property="og:image" content="https:\/\/fredaworkspace\.com\/[^"]+"/, f + ' : og:image absolu');
    assert.match(src, /<meta name="twitter:card"/, f + ' : twitter:card');
    assert.doesNotMatch(src, /name="robots" content="noindex/, f + ' ne doit pas être noindex');
  }
});

test('SEO : pages privées ou transactionnelles en noindex', () => {
  const priv = html.filter((h) => !PUBLIC.includes(h.file)).map((h) => h.file);
  for (const f of priv) {
    const src = html.find((h) => h.file === f).src;
    assert.match(src, /<meta name="robots" content="noindex/, f + ' doit être en noindex');
  }
});

test('robots.txt et sitemap.xml cohérents', () => {
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/fredaworkspace\.com\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/espace\//);
  const locs = [...sitemap.matchAll(/<loc>https:\/\/fredaworkspace\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  assert.deepStrictEqual(locs.sort(), ['/', '/confidentialite.html', '/domaines.html', '/en/press.html', '/legal.html', '/presse.html', '/support.html', ...LANDING.map((p) => '/' + p.path)].sort());
  for (const l of locs) assert.ok(fs.existsSync(path.join(ROOT, l === '/' ? 'index.html' : l.slice(1))), l);
});

test('SEO : pages d’atterrissage : titre ≤ 65 caractères, description 70-160, un seul h1, hreflang réciproque, lien canonique auto-référencé', () => {
  for (const p of LANDING) {
    const src = fs.readFileSync(path.join(ROOT, p.path), 'utf8');
    const title = src.match(/<title>([^<]*)<\/title>/)[1], desc = src.match(/<meta name="description" content="([^"]*)"/)[1];
    assert.ok(title.length <= 65, p.path + ' : titre trop long (' + title.length + ')');
    assert.ok(desc.length >= 70 && desc.length <= 160, p.path + ' : description ' + desc.length);
    assert.strictEqual((src.match(/<h1[ >]/g) || []).length, 1, p.path + ' : un seul h1');
    assert.ok(src.includes('<link rel="canonical" href="https://fredaworkspace.com/' + p.path + '">'), p.path + ' : canonical');
    if (p.geo) assert.match(src, /<meta name="geo\.region" content="HT">/, p.path + ' : geo Haïti'); else assert.doesNotMatch(src, /geo\.region/, p.path + ' : page internationale sans geo.region');
    const self = src.match(/hreflang="([a-z-]+)" href="https:\/\/fredaworkspace\.com\/([^"]+)"/g) || [];
    const alts = self.map((x) => x.match(/hreflang="([a-z-]+)" href="https:\/\/fredaworkspace\.com\/([^"]+)"/).slice(1));
    assert.ok(alts.some(([l, u]) => l === p.lang && u === p.path), p.path + ' : hreflang auto-référencé');
    assert.ok(alts.some(([l]) => l === 'x-default'), p.path + ' : x-default');
    for (const [l, u] of alts.filter(([l]) => l !== 'x-default' && l !== p.lang)) {
      const other = LANDING.find((q) => q.path === u);
      assert.ok(other && other.lang === l, p.path + ' : hreflang vers une page inconnue ' + u);
      assert.ok(Object.values(other.alt).includes(p.path), u + ' ne renvoie pas vers ' + p.path + ' (hreflang non réciproque)');
    }
  }
});

test('SEO / GEO : JSON-LD valide, FAQPage identique au texte visible, offres avec prix, aucune promesse de domaine gratuit', () => {
  for (const f of PUBLIC.filter((x) => x === 'index.html' || LANDING.some((p) => p.path === x))) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const blocks = [...src.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.ok(blocks.length >= 1, f + ' : JSON-LD');
    const nodes = blocks.flatMap((b) => b['@graph'] || [b]);
    const faq = nodes.find((n) => n['@type'] === 'FAQPage');
    assert.ok(faq && faq.mainEntity.length >= 4, f + ' : FAQPage');
    const visible = src.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
    for (const q of faq.mainEntity) {
      assert.ok(visible.includes(q.name.replace(/\s+/g, ' ')), f + ' : question JSON-LD absente du texte visible : ' + q.name);
      assert.ok(visible.includes(q.acceptedAnswer.text.replace(/\s+/g, ' ')), f + ' : réponse JSON-LD absente du texte visible : ' + q.name);
    }
    for (const n of nodes.filter((x) => x['@type'] === 'Product')) {
      for (const o of [].concat(n.offers)) { assert.ok(o.price !== undefined && o.priceCurrency && o.availability, f + ' : offre incomplète'); }
    }
    assert.ok(nodes.some((n) => n['@type'] === 'Organization' && n.areaServed), f + ' : Organization');
  }
  const claims = LANDING.flatMap((p) => JSON.stringify(p)).join(' ');
  assert.doesNotMatch(claims, /domaine gratuit offert|domaine offert|free domain included|domèn gratis ou ofri/i, 'jamais de promesse de domaine offert');
});

test('GEO : llms.txt et llms-full.txt cohérents avec le sitemap, robots.txt autorise les robots IA', () => {
  const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8'), full = fs.readFileSync(path.join(ROOT, 'llms-full.txt'), 'utf8');
  assert.match(llms, /^# Freda Workspace/);
  assert.match(llms, /^> /m);
  for (const p of LANDING) { assert.ok(llms.includes('https://fredaworkspace.com/' + p.path), 'llms.txt : ' + p.path); assert.ok(full.includes(p.path), 'llms-full.txt : ' + p.path); }
  const linked = [...llms.matchAll(/\]\(https:\/\/fredaworkspace\.com([^)]*)\)/g)].map((m) => m[1] || '/').filter((u) => !/\.txt$/.test(u));
  for (const l of linked) assert.ok(fs.existsSync(path.join(ROOT, l.split('#')[0] === '/' ? 'index.html' : l.split('#')[0].slice(1))), 'llms.txt : lien mort ' + l);
  assert.match(llms, /Ne vend pas de noms de domaine gratuits/);
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  assert.doesNotMatch(robots, /User-agent: (OAI-SearchBot|ChatGPT-User|Claude-SearchBot|Claude-User|PerplexityBot|Googlebot|Bingbot)\s*\nDisallow: \//, 'les robots de recherche IA ne sont pas bloqués');
  assert.match(robots, /Disallow: \/admin-prix\.html/);
});

test('liens internes : chaque page d’atterrissage est liée en dur depuis index.html (sans JavaScript)', () => {
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const p of LANDING) assert.ok(idx.includes('href="' + p.path + '"'), 'index.html ne lie pas ' + p.path);
});

test('en-têtes de sécurité de production (render.yaml)', () => {
  const h = productionHeaders();
  const csp = h['Content-Security-Policy'];
  assert.ok(csp, 'CSP manquante');
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp.match(/script-src[^;]*/)[0], /unsafe-inline|unsafe-eval/, 'script-src doit rester strict');
  assert.match(csp.match(/script-src[^;]*/)[0], /https:\/\/js\.stripe\.com/, 'Stripe.js autorisé');
  assert.match(csp.match(/frame-src[^;]*/)[0], /https:\/\/js\.stripe\.com[^;]*https:\/\/hooks\.stripe\.com/, 'iframe Stripe + 3-D Secure autorisés');
  assert.doesNotMatch(csp.match(/frame-src[^;]*/)[0], /\*(?!\.js\.stripe)/, 'frame-src : pas de joker hors *.js.stripe.com');
  assert.match(csp.match(/connect-src[^;]*/)[0], /https:\/\/api\.stripe\.com/);
  assert.strictEqual(h['X-Frame-Options'], 'DENY');
  assert.strictEqual(h['X-Content-Type-Options'], 'nosniff');
  assert.ok(h['Strict-Transport-Security']);
});

test('404.html existe et est en noindex', () => {
  const s = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
  assert.match(s, /noindex/);
});

test('performance : tous les <script src> sont différés et monitor.js reste le premier script local', () => {
  const bad = [];
  for (const { file, src } of html) {
    const tags = [...src.matchAll(/<script\b[^>]*\ssrc="([^"]+)"[^>]*>/g)];
    for (const m of tags) if (!/\sdefer\b/.test(m[0])) bad.push(file + ' : ' + m[1] + ' sans defer');
    const local = tags.map((m) => m[1]).filter((u) => !/^https?:/.test(u));
    const mon = local.findIndex((u) => /monitor\.js$/.test(u));
    if (mon > -1 && local.slice(0, mon).some((u) => !/(icons|config)\.js$/.test(u))) bad.push(file + ' : monitor.js doit précéder les scripts applicatifs');
  }
  assert.deepStrictEqual(bad, []);
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), /vendor\/qrcode\.js/, 'qrcode.js est chargé à la demande, pas dans index.html');
});

test('SEO : fil d’Ariane JSON-LD sur domaines, support, legal, presse (FR / EN)', () => {
  for (const f of ['domaines.html', 'support.html', 'legal.html', 'presse.html', 'en/press.html']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const nodes = [...src.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const j = JSON.parse(m[1]); return j['@graph'] || [j]; });
    const bc = nodes.find((n) => n['@type'] === 'BreadcrumbList');
    assert.ok(bc && bc.itemListElement.length === 2 && bc.itemListElement[1].item === 'https://fredaworkspace.com/' + f, f + ' : BreadcrumbList');
  }
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(home, /"inLanguage":\["fr","ht","en"\]/, 'WebSite.inLanguage inclut en');
  assert.doesNotMatch(home.match(/id="ld-home">([\s\S]*?)<\/script>/)[1], /"url":"https:\/\/fredaworkspace\.com\/#/, 'offres : pas d’URL réduite à un fragment');
});

test('SEO : Organization avec legalName et chaîne Freda Pay LLC -> Freda Group, sans sameAs inventé', () => {
  for (const f of ['index.html', 'freda-mail.html', 'en/freda-mail.html', 'presse.html']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const org = [...src.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const j = JSON.parse(m[1]); return j['@graph'] || [j]; }).find((n) => n['@type'] === 'Organization');
    assert.ok(org, f);
    assert.strictEqual(org.legalName, 'Freda Pay LLC', f);
    assert.strictEqual(org.parentOrganization.name, 'Freda Pay LLC', f);
    assert.strictEqual(org.parentOrganization.parentOrganization.name, 'Freda Group', f);
    assert.ok(!('sameAs' in org), f + ' : sameAs seulement avec de vrais profils');
  }
});

test('GEO : tableau des prix par extension généré depuis config.js (FR / HT / EN) et présent dans llms-full.txt', () => {
  const full = fs.readFileSync(path.join(ROOT, 'llms-full.txt'), 'utf8');
  const fr = (n) => n.toFixed(2).replace('.', ',') + ' $', en = (n) => '$' + n.toFixed(2);
  for (const [f, fmt] of [['freda-connect.html', fr], ['ht/freda-connect.html', fr], ['en/freda-connect.html', en]]) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const t of CONFIG.TLDS) {
      const row = new RegExp('<th scope="row" class="text-left font-semibold">' + t.tld.replace('.', '\\.') + '</th><td>' + fmt(t.price).replace(/[$]/g, '\\$') + '</td><td>' + fmt(t.renew).replace(/[$]/g, '\\$') + '</td>');
      assert.match(src, row, f + ' : ligne ' + t.tld);
    }
  }
  assert.match(full, /Mise à jour : 2026-11-05/);
  assert.match(full, /\| \.com \| 12,99 \$ \| 14,99 \$ \|/);
  assert.match(full, /\| \.com \| \$12\.99 \| \$14\.99 \|/);
  const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
  assert.doesNotMatch(llms, /\.com, \.net ou \.org à partir de/, 'jamais « .com à partir de 2,99 $ »');
  assert.match(llms, /\.com 12,99 \$ \(renouvellement 14,99 \$\)/);
  assert.match(llms, /en français, en créole haïtien et en anglais/);
  for (const f of ['nom-de-domaine-haiti.html', 'ht/non-domenn-ayiti.html']) assert.doesNotMatch(fs.readFileSync(path.join(ROOT, f), 'utf8'), /\.com, \.net (ou|oswa) \.org[^.]{0,40}(à partir|a pati) de 2,99/, f);
});

test('copie : montants en anglais au format $2.99, pas de 2,99 $ dans les pages /en/', () => {
  for (const p of LANDING.filter((x) => x.lang === 'en')) {
    const visible = fs.readFileSync(path.join(ROOT, p.path), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(visible, /\d,\d\d \$/, p.path + ' : format français dans une page anglaise');
    assert.match(visible, /\$\d+\.\d\d/, p.path + ' : au moins un montant');
    assert.doesNotMatch(visible, /help-centre|management@|authoritative|Local payment:|Creole(?<!Haitian Creole)/, p.path);
  }
});

test('copie : kreyòl corrigé, aucun nom de partenaire visible, aucune promesse « n° 1 »', () => {
  for (const p of LANDING.filter((x) => x.lang === 'ht')) {
    const visible = fs.readFileSync(path.join(ROOT, p.path), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(visible, /kkite|prelèvman|prelve|Frè tretman|kat bankè|ranbousab|8 è a 6 è|rive kèk èdtan| le peman/, p.path);
  }
  const partners = /Stripe|NameSilo|Purelymail|Brevo|Supabase|Pay['’]m|Issuing|\bRender\b/;
  for (const f of [...PUBLIC, 'llms.txt', 'llms-full.txt', 'admin-prix.html']) {
    const visible = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(visible, partners, f + ' : nom de partenaire visible');
    assert.doesNotMatch(visible.replace(/<[^>]+>/g, ' '), /\bFreda\b(?! (Workspace|Mail|Connect|Pay|Group|Blue))/, f + ' : « Freda » seul');
  }
  const claims = fs.readFileSync(path.join(ROOT, 'llms-full.txt'), 'utf8');
  assert.doesNotMatch(claims, /(^|[^"“])\b(n° ?1|#1|number one)\b/i);
});

test('SEO : titres ≤ 60 caractères, page de comparaison FR / HT / EN réciproque, avis clients non inventés, presse EN', () => {
  for (const p of LANDING) assert.ok(fs.readFileSync(path.join(ROOT, p.path), 'utf8').match(/<title>([^<]*)<\/title>/)[1].length <= 60, p.path + ' : titre > 60');
  const cmp = LANDING.filter((p) => p.id.startsWith('compare'));
  assert.deepStrictEqual(cmp.map((p) => p.lang).sort(), ['en', 'fr', 'ht']);
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const p of cmp) assert.ok(idx.includes('href="' + p.path + '"'), p.path + ' lié depuis index.html');
  assert.match(fs.readFileSync(path.join(ROOT, 'freda-mail.html'), 'utf8'), /Avis clients \?/);
  const press = fs.readFileSync(path.join(ROOT, 'en/press.html'), 'utf8'), presse = fs.readFileSync(path.join(ROOT, 'presse.html'), 'utf8');
  assert.match(press, /hreflang="fr" href="https:\/\/fredaworkspace\.com\/presse\.html"/);
  assert.match(presse, /hreflang="en" href="https:\/\/fredaworkspace\.com\/en\/press\.html"/);
  assert.match(presse, /Prix \(au 2026-11-05\)/);
  assert.match(press, /Prices \(as of 2026-11-05\)/);
  assert.match(press, /<html lang="en">/);
});

test('GEO : robots.txt a un groupe explicite par robot IA / moteur, avec les mêmes Disallow', () => {
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Bingbot', 'Google-Extended']) {
    const g = robots.match(new RegExp('User-agent: ' + bot + '\\nAllow: /\\n((?:Disallow: [^\\n]+\\n)+)'));
    assert.ok(g, bot);
    assert.match(g[1], /Disallow: \/espace\//);
    assert.match(g[1], /Disallow: \/admin-prix\.html/);
  }
});

test('pages en ht/en : en-tête et pied de page statiques localisés', () => {
  for (const p of LANDING.filter((x) => x.lang !== 'fr')) {
    const src = fs.readFileSync(path.join(ROOT, p.path), 'utf8');
    assert.doesNotMatch(src, /Navigation principale|Fil d’Ariane|Recherche de domaine|Centre d’aide/, p.path + ' : chrome français');
  }
  const ui = fs.readFileSync(path.join(ROOT, 'assets/js/ui.js'), 'utf8');
  for (const k of ['Create an account', 'Kreye yon kont', 'My account', 'Espas mwen']) assert.ok(ui.includes(k), 'ui.js : ' + k);
});
