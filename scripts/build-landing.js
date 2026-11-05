#!/usr/bin/env node
/**
 * Génère les pages d'atterrissage SEO / GEO (scripts/landing-content.js), sitemap.xml, llms.txt et llms-full.txt.
 * Les fichiers générés sont versionnés (comme tailwind.css) ; la CI vérifie qu'ils sont à jour : `npm run build` doit les régénérer à l'identique.
 * Les prix par défaut viennent de assets/js/config.js ; si l'administrateur change un prix, les pages statiques gardent les valeurs par défaut
 * (le site réel, lui, affiche toujours les prix du serveur dans les pages applicatives).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pages, homeFaq } = require('./landing-content');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://fredaworkspace.com';
const LASTMOD = '2026-11-05';                 // date de dernière mise à jour du contenu des pages générées (à changer quand le contenu change)

/* ---------- configuration du site (valeurs par défaut) ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/config.js'), 'utf8'), sandbox);
const C = sandbox.window.FW_CONFIG;
const money = (n) => String(Number(n).toFixed(2)).replace('.', ',') + ' $';
const dict = {
  free_mailboxes: String(C.FREE_PLAN.mailboxes),
  starter_price: money(C.PLANS.starter.monthly), business_price: money(C.PLANS.business.monthly), enterprise_price: money(C.PLANS.enterprise.monthly),
  starter_boxes: String(C.PLANS.starter.mailboxes), business_boxes: String(C.PLANS.business.mailboxes),
  domain_from: money(Math.min(...C.TLDS.map((t) => t.price))),
};
const fill = (s) => String(s).replace(/\{(\w+)\}/g, (m, k) => { if (!(k in dict)) throw new Error('Variable inconnue : ' + m); return dict[k]; });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (p) => SITE + '/' + p;

const UI = {
  fr: { facts: 'En bref', faq: 'Questions fréquentes', related: 'À lire aussi', updated: 'Mise à jour le', home: 'Accueil', skip: 'Aller au contenu', loading: 'Chargement…', ctaTitle: 'Prêt à commencer ?', locale: 'fr_FR', lang: 'fr' },
  en: { facts: 'At a glance', faq: 'Frequently asked questions', related: 'Read next', updated: 'Last updated', home: 'Home', skip: 'Skip to content', loading: 'Loading…', ctaTitle: 'Ready to start?', locale: 'en_US', lang: 'en' },
  ht: { facts: 'Rezime', faq: 'Kesyon moun poze souvan', related: 'Li tou', updated: 'Dènye mizajou', home: 'Akèy', skip: 'Ale nan kontni an', loading: 'Ap chaje…', ctaTitle: 'Pare pou kòmanse?', locale: 'ht_HT', lang: 'ht' },
};
const enDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const frDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const htDate = (iso) => { const m = ['janvye', 'fevriye', 'mas', 'avril', 'me', 'jen', 'jiyè', 'out', 'septanm', 'oktòb', 'novanm', 'desanm']; const d = new Date(iso + 'T12:00:00Z'); return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', name: 'Freda Workspace', url: SITE + '/', logo: SITE + '/android-chrome-512.png', parentOrganization: { '@type': 'Organization', name: 'Freda Pay LLC' }, areaServed: ['Worldwide', { '@type': 'Country', name: 'Haïti' }], knowsLanguage: ['fr', 'ht'], email: 'support@fredaworkspace.com' };

/* ---------- JSON-LD ---------- */
function graph(p) {
  const self = url(p.path);
  const nodes = [
    { '@type': p.type === 'about' ? ['AboutPage', 'WebPage'] : 'WebPage', '@id': self + '#webpage', url: self, name: p.title, description: fill(p.description), inLanguage: p.lang, isPartOf: { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'Freda Workspace' }, publisher: { '@id': ORG['@id'] }, dateModified: LASTMOD, breadcrumb: { '@id': self + '#breadcrumb' }, mainEntity: { '@id': self + '#faq' }, about: { '@id': ORG['@id'] } },
    ORG,
    { '@type': 'BreadcrumbList', '@id': self + '#breadcrumb', itemListElement: [{ '@type': 'ListItem', position: 1, name: UI[p.lang].home, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: p.breadcrumb, item: self }] },
    { '@type': 'FAQPage', '@id': self + '#faq', inLanguage: p.lang, mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: fill(q), acceptedAnswer: { '@type': 'Answer', text: fill(a) } })) },
  ];
  if (p.product) nodes.push({ '@type': 'Product', '@id': self + '#product', name: p.product.name, description: p.product.description, brand: { '@id': ORG['@id'] }, offers: { '@type': 'Offer', price: String(p.product.price), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: self } });
  return { '@context': 'https://schema.org', '@graph': nodes };
}

/* ---------- HTML ---------- */
/** Liens affichés en dur (sans JavaScript) dans l'en-tête et le pied de page de chaque page générée. */
function staticLinks(base) {
  const core = [['domaines.html', 'Recherche de domaine'], ['support.html', 'Centre d’aide'], ['index.html#tarifs', 'Tarifs'], ['legal.html', 'Mentions légales'], ['qui-sommes-nous.html', 'Qui sommes-nous']];
  return [...core, ...pages.filter((p) => p.path !== 'qui-sommes-nous.html').map((p) => [p.path, p.breadcrumb])].map(([h, l]) => [base + h, l]);
}
const arrow = '<i data-lucide="arrow-right"></i>';
function render(p) {
  const resolve = (h, b) => { h = h.replace(/^\.\.\//, ''); const dir = path.dirname(p.path); const local = dir !== '.' ? dir + '/' + h : null; if (local && pages.some((q) => q.path === local)) h = local; return b + h; };
  const ui = UI[p.lang], base = p.lang === 'fr' ? '' : '../', self = url(p.path);
  const alts = [{ lang: p.lang, path: p.path }, ...Object.entries(p.alt).map(([lang, path]) => ({ lang, path }))];
  const frAlt = alts.find((a) => a.lang === 'fr');
  const hreflang = alts.map((a) => `  <link rel="alternate" hreflang="${a.lang}" href="${url(a.path)}">`).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${url(frAlt.path)}">`;
  const title = fill(p.title), desc = fill(p.description);
  const dateLabel = ({ fr: frDate, ht: htDate, en: enDate })[p.lang](LASTMOD);
  const sections = p.sections.map((s) => `
        <section class="mt-12" aria-labelledby="${slug(s.h2)}">
          <h2 id="${slug(s.h2)}" class="text-2xl sm:text-3xl font-extrabold tracking-tight">${esc(fill(s.h2))}</h2>
          ${(s.paragraphs || []).map((t) => `<p class="mt-4 text-slate-600 leading-relaxed">${esc(fill(t))}</p>`).join('\n          ')}
          ${s.steps ? `<ol class="mt-5 space-y-4">${s.steps.map((t, i) => `<li class="flex gap-4"><span class="w-8 h-8 rounded-full bg-mist text-freda grid place-items-center font-bold shrink-0">${i + 1}</span><span class="text-slate-700 leading-relaxed pt-0.5">${esc(fill(t))}</span></li>`).join('')}</ol>` : ''}
          ${s.table ? `<div class="mt-5 table-wrap"><table class="table"><thead><tr>${s.table.head.map((h) => `<th scope="col">${esc(fill(h))}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row" class="text-left font-semibold">${esc(fill(c))}</th>` : `<td>${esc(fill(c))}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
        </section>`).join('\n');
  return `<!DOCTYPE html>
<html lang="${ui.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${self}">
${hreflang}
${p.geo ? '  <meta name="geo.region" content="HT">\n  <meta name="geo.placename" content="Haïti">\n' : ''}  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Freda Workspace">
  <meta property="og:locale" content="${ui.locale}">
  <meta property="og:url" content="${self}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${SITE}/og-image-1200x630.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${SITE}/og-image-1200x630.png">
  <script type="application/ld+json">${JSON.stringify(graph(p))}</script>
  <link rel="icon" href="${base}favicon.ico" sizes="any">
  <link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${base}apple-touch-icon.png">
  <link rel="manifest" href="${base}site.webmanifest">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#2B64E4">
  <link rel="preload" href="${base}assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${base}assets/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${base}assets/css/fonts.css">
  <link rel="stylesheet" href="${base}assets/css/tailwind.css">
  <link rel="stylesheet" href="${base}assets/css/styles.css">
</head>
<body data-base="${base}" data-nav="">
  <a href="#contenu" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-primary">${ui.skip}</a>
  <!-- En-tête et pied de page : liens en dur pour les robots qui n'exécutent pas le JavaScript ; ui.js les remplace par la version complète -->
  <header id="site-header" class="border-b border-line" style="min-height:64px">
    <nav class="gutter max-w-site mx-auto h-16 flex items-center gap-5 text-sm" aria-label="Navigation principale"><a href="${base}index.html" class="font-bold text-ink">Freda Workspace</a>${staticLinks(base).slice(0, 4).map(([h, l]) => `<a href="${h}" class="text-slate-600">${esc(l)}</a>`).join('')}</nav>
  </header>

  <main id="contenu">
    <section class="bg-midnight relative overflow-hidden">
      <div class="absolute inset-0 bg-grid opacity-40" aria-hidden="true"></div>
      <div class="relative gutter">
        <div class="max-w-site mx-auto py-14 md:py-20">
          <nav aria-label="Fil d’Ariane" class="text-sm text-slate-400"><a href="${base}index.html" class="hover:text-white">${ui.home}</a> <span aria-hidden="true">/</span> <span class="text-slate-300">${esc(p.breadcrumb)}</span></nav>
          <h1 class="mt-5 max-w-3xl text-4xl sm:text-5xl font-extrabold tracking-tight !text-white">${esc(fill(p.h1))}</h1>
          <p class="mt-5 max-w-3xl text-lg text-slate-300 leading-relaxed">${esc(fill(p.lead))}</p>
          <div class="mt-8 flex flex-col sm:flex-row gap-3">
            <a href="${resolve(p.cta[0][1], base)}" class="btn btn-cta btn-lg">${esc(p.cta[0][0])}${arrow}</a>
            <a href="${resolve(p.cta[1][1], base)}" class="btn btn-white btn-lg">${esc(p.cta[1][0])}</a>
          </div>
          <p class="mt-6 text-xs text-slate-400">${ui.updated} <time datetime="${LASTMOD}">${dateLabel}</time></p>
        </div>
      </div>
    </section>

    <div class="gutter">
      <article class="max-w-3xl mx-auto py-12 md:py-16">
        <section aria-labelledby="facts-title">
          <h2 id="facts-title" class="text-2xl font-extrabold tracking-tight">${ui.facts}</h2>
          <dl class="mt-5 card divide-y divide-line">
            ${p.facts.map(([k, v]) => `<div class="p-4 sm:p-5 sm:grid sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-4"><dt class="font-semibold text-ink">${esc(fill(k))}</dt><dd class="mt-1 sm:mt-0 text-slate-600">${esc(fill(v))}</dd></div>`).join('\n            ')}
          </dl>
        </section>
${sections}

        <section class="mt-14" aria-labelledby="faq-title">
          <h2 id="faq-title" class="text-2xl sm:text-3xl font-extrabold tracking-tight">${ui.faq}</h2>
          <div class="mt-5 divide-y divide-line border-y border-line">
            ${p.faq.map(([q, a]) => `<details class="accordion-item group py-5">
              <summary class="flex items-center justify-between gap-4 font-semibold text-ink">${esc(fill(q))}<i data-lucide="plus" class="acc-icon w-5 h-5 text-freda shrink-0"></i></summary>
              <p class="mt-3 text-slate-600 leading-relaxed">${esc(fill(a))}</p>
            </details>`).join('\n            ')}
          </div>
        </section>

        <section class="mt-14" aria-labelledby="related-title">
          <h2 id="related-title" class="text-xl font-bold">${ui.related}</h2>
          <ul class="mt-4 grid gap-3 sm:grid-cols-2">
            ${p.related.map(([href, label]) => `<li><a href="${resolve(href, base)}" class="card p-4 flex items-center justify-between gap-3 hover:border-freda/40 transition-colors"><span class="font-semibold text-ink">${esc(label)}</span><i data-lucide="chevron-right" class="w-4 h-4 text-muted shrink-0"></i></a></li>`).join('\n            ')}
          </ul>
        </section>
      </article>
    </div>
  </main>

  <footer id="site-footer" class="bg-midnight text-slate-300">
    <div class="gutter max-w-site mx-auto py-10"><p class="text-white font-semibold">Freda Workspace · Freda Pay LLC</p><ul class="mt-4 grid gap-2 sm:grid-cols-2 text-sm">${staticLinks(base).map(([h, l]) => `<li><a href="${h}" class="text-slate-300">${esc(l)}</a></li>`).join('')}</ul></div>
  </footer>

  <script src="${base}assets/js/icons.js"></script>
  <script src="${base}assets/js/config.js"></script>
  <script src="${base}assets/js/monitor.js"></script>
  <script src="${base}assets/js/api.js"></script>
  <script src="${base}assets/js/ui.js"></script>
</body>
</html>
`;
}
function slug(s) { return 'h-' + String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48); }

/* ---------- sitemap, llms.txt, llms-full.txt ---------- */
const core = [['', '1.0', 'weekly', '2026-11-02'], ['domaines.html', '0.6', 'monthly', '2026-11-02'], ['support.html', '0.6', 'monthly', '2026-11-02'], ['legal.html', '0.4', 'yearly', '2026-11-02']];
function sitemap() {
  const x = [];
  for (const [p, prio, freq, last] of core) x.push(`  <url><loc>${SITE}/${p}</loc><lastmod>${last}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`);
  for (const p of pages) {
    const alts = [{ lang: p.lang, path: p.path }, ...Object.entries(p.alt).map(([lang, path]) => ({ lang, path }))];
    const fr = alts.find((a) => a.lang === 'fr');
    x.push(`  <url><loc>${url(p.path)}</loc><lastmod>${LASTMOD}</lastmod><changefreq>monthly</changefreq><priority>${p.lang === 'fr' ? '0.8' : '0.7'}</priority>\n${alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${url(a.path)}"/>`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${url(fr.path)}"/>\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${x.join('\n')}\n</urlset>\n`;
}
const summary = 'Freda Workspace (Freda Pay LLC) vend des noms de domaine et une messagerie professionnelle pour les entreprises du monde entier, avec un accent sur Haïti : Freda Connect (noms de domaine et DNS) et Freda Mail (email professionnel) ; paiement par MonCash, NatCash, carte et les autres moyens proposés par Stripe ; support en français, en créole haïtien et en anglais. Chaque compte a droit à 1 boîte email professionnelle gratuite sur son propre domaine ; le nom de domaine, lui, est payant.';
function llms() {
  const fr = pages.filter((p) => p.lang === 'fr'), ht = pages.filter((p) => p.lang === 'ht'), en = pages.filter((p) => p.lang === 'en');
  const line = (p) => `- [${fill(p.h1)}](${url(p.path)}): ${fill(p.description)}`;
  return `# Freda Workspace\n\n> ${summary}\n\n## Faits clés (à citer tels quels)\n\n- Email professionnel gratuit : ${dict.free_mailboxes} boîte (1 Go) sur votre propre nom de domaine, sans abonnement ni carte bancaire.\n- Nom de domaine : jamais gratuit ; à partir de ${dict.domain_from} la première année selon l’extension (prix exact affiché avant paiement ; le renouvellement peut coûter plus cher). Extensions vendues : .com, .net, .org, .co, .store, .online, .site, .tech, .io. Le .ht n’est pas vendu, mais un domaine .ht existant peut être connecté.\n- Offres : Starter ${dict.starter_price}/mois (${dict.starter_boxes} boîtes, 2 Go), Business ${dict.business_price}/mois (${dict.business_boxes} boîtes, 15 Go partagés), Enterprise ${dict.enterprise_price}/mois (boîtes illimitées, 5 Go par boîte). Durée au choix de 1 à 12 mois ; 12 mois = 2 mois offerts. Les prix peuvent changer : la page https://fredaworkspace.com/#tarifs fait foi.\n- Paiement : MonCash, NatCash, carte. MonCash et NatCash ne permettent pas de prélèvement automatique : le client recharge un solde Freda (5 $ à 500 $) qui paie ensuite l’offre automatiquement ; des alertes email sont envoyées si le solde est trop bas.\n- Sécurité de l’email : SPF, DKIM et DMARC configurés automatiquement. Compatible IMAP/SMTP (Outlook, Apple Mail, Gmail) et application Freda Mail.\n- Support : support@fredaworkspace.com, du lundi au samedi, 8 h à 18 h (heure d’Haïti), en français et en créole haïtien.\n\n## Pages principales\n\n- [Accueil, offres et tarifs](${SITE}/): présentation, recherche de nom de domaine, tarifs, questions fréquentes.\n- [Recherche de domaine](${SITE}/domaines.html): vérifier la disponibilité d’un nom de domaine.\n- [Centre d’aide](${SITE}/support.html): réponses sur les domaines, emails, DNS et paiements.\n- [Mentions légales, conditions et confidentialité](${SITE}/legal.html)\n\n## Guides (français)\n\n${fr.map(line).join('\n')}\n\n## Gid (kreyòl ayisyen)\n\n${ht.map(line).join('\n')}\n\n## Guide (English)\n\n${en.map(line).join('\n')}\n\n## Ce que Freda Workspace ne fait pas\n\n- Ne vend pas de noms de domaine gratuits.\n- Ne vend pas de noms de domaine en .ht.\n- N’effectue pas de prélèvement automatique avec MonCash ou NatCash (utiliser le solde prépayé).\n\n## Plus de détails\n\n- [Version complète pour les assistants IA](${SITE}/llms-full.txt)\n`;
}
function llmsFull() {
  const body = pages.map((p) => `\n---\n\n# ${fill(p.h1)}\n\nURL : ${url(p.path)}\nLangue : ${({ fr: 'français', ht: 'créole haïtien', en: 'anglais' })[p.lang]}\nMise à jour : ${LASTMOD}\n\n${fill(p.lead)}\n\n## ${UI[p.lang].facts}\n\n${p.facts.map(([k, v]) => `- ${fill(k)} : ${fill(v)}`).join('\n')}\n\n${p.sections.map((s) => `## ${fill(s.h2)}\n\n${(s.paragraphs || []).map(fill).join('\n\n')}${s.steps ? '\n' + s.steps.map((t, i) => `${i + 1}. ${fill(t)}`).join('\n') : ''}${s.table ? '\n\n' + [s.table.head.map(fill).join(' | '), s.table.head.map(() => '---').join(' | '), ...s.table.rows.map((r) => r.map(fill).join(' | '))].map((r) => '| ' + r + ' |').join('\n') : ''}`).join('\n\n')}\n\n## ${UI[p.lang].faq}\n\n${p.faq.map(([q, a]) => `### ${fill(q)}\n\n${fill(a)}`).join('\n\n')}\n`).join('');
  return `# Freda Workspace : informations complètes\n\n> ${summary}\n\nCe fichier regroupe le contenu des guides du site pour les assistants IA. Les prix sont les prix par défaut à la date indiquée ; la page ${SITE}/#tarifs fait foi.\n${body}`;
}

/* ---------- index.html : FAQ visible + JSON-LD (Organization, WebSite, Product/offres, FAQPage) générés ---------- */
function patchHome() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const faqHtml = homeFaq.map(([q, a]) => `          <details class="accordion-item group py-5">
            <summary class="flex items-center justify-between gap-4 font-semibold text-ink">${esc(fill(q))}<i data-lucide="plus" class="acc-icon w-5 h-5 text-freda shrink-0"></i></summary>
            <p class="mt-3 text-slate-600 leading-relaxed">${esc(fill(a))}</p>
          </details>`).join('\n');
  html = html.replace(/<!--faq:start-->[\s\S]*?<!--faq:end-->/, () => `<!--faq:start-->\n${faqHtml}\n          <!--faq:end-->`);
  const offers = [['Gratuit', 0, 'Boîte email professionnelle gratuite : ' + dict.free_mailboxes + ' boîte, 1 Go, sur votre propre domaine'], ...['starter', 'business', 'enterprise'].map((id) => [C.PLANS[id].name, C.PLANS[id].monthly, C.PLANS[id].tagline])];
  const ld = { '@context': 'https://schema.org', '@graph': [
    ORG,
    { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'Freda Workspace', inLanguage: ['fr', 'ht'], publisher: { '@id': ORG['@id'] }, potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: SITE + '/domaines.html?q={search_term_string}' }, 'query-input': 'required name=search_term_string' } },
    { '@type': 'Product', '@id': SITE + '/#freda-mail', name: 'Freda Mail : email professionnel', description: 'Messagerie professionnelle sur votre propre nom de domaine, avec 1 boîte gratuite, SPF, DKIM et DMARC configurés automatiquement.', brand: { '@id': ORG['@id'] }, offers: offers.map(([name, price, description]) => ({ '@type': 'Offer', name, description, price: String(price), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: SITE + '/#tarifs' })) },
    { '@type': 'FAQPage', '@id': SITE + '/#faq', inLanguage: 'fr', mainEntity: homeFaq.map(([q, a]) => ({ '@type': 'Question', name: fill(q), acceptedAnswer: { '@type': 'Answer', text: fill(a) } })) },
  ] };
  html = html.replace(/<script type="application\/ld\+json" id="ld-home">[\s\S]*?<\/script>/, () => `<script type="application/ld+json" id="ld-home">${JSON.stringify(ld)}</script>`);
  fs.writeFileSync(file, html);
}

/* ---------- écriture ---------- */
for (const p of pages) {
  const file = path.join(ROOT, p.path);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, render(p));
}
patchHome();
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms());
fs.writeFileSync(path.join(ROOT, 'llms-full.txt'), llmsFull());
console.log(pages.length + ' pages d’atterrissage, sitemap.xml, llms.txt, llms-full.txt');
