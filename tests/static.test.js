const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { ROOT, walk, htmlFiles, rel, productionHeaders } = require('./helpers');

const html = htmlFiles().map((f) => ({ file: rel(f), src: fs.readFileSync(f, 'utf8') }));
const PUBLIC = ['index.html', 'domaines.html', 'support.html', 'legal.html'];

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
    assert.match(src, /<html lang="fr">/, file + ' : lang');
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
  assert.deepStrictEqual(locs.sort(), ['/', '/domaines.html', '/legal.html', '/support.html'].sort());
  for (const l of locs) assert.ok(fs.existsSync(path.join(ROOT, l === '/' ? 'index.html' : l.slice(1))), l);
});

test('en-têtes de sécurité de production (render.yaml)', () => {
  const h = productionHeaders();
  const csp = h['Content-Security-Policy'];
  assert.ok(csp, 'CSP manquante');
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp.match(/script-src[^;]*/)[0], /unsafe-inline|unsafe-eval/, 'script-src doit rester strict');
  assert.strictEqual(h['X-Frame-Options'], 'DENY');
  assert.strictEqual(h['X-Content-Type-Options'], 'nosniff');
  assert.ok(h['Strict-Transport-Security']);
});

test('404.html existe et est en noindex', () => {
  const s = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
  assert.match(s, /noindex/);
});
