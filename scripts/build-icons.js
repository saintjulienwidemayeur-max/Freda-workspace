/* Génère assets/js/icons.js : uniquement les icônes Lucide utilisées par le site (au lieu des ~390 Ko de la bibliothèque complète). */
const fs = require('fs'), path = require('path');
const { icons } = require('lucide');
const root = path.join(__dirname, '..');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { if (f === 'node_modules' || f.startsWith('.')) continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(html|js)$/.test(f) && f !== 'icons.js' && files.push(p); } })(root);
const text = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const tokens = new Set(text.match(/[a-z][a-z0-9]*(?:-[a-z0-9]+)*/g));
const pascal = (k) => k.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const used = {};
for (const t of tokens) { const p = pascal(t); if (icons[p]) used[t] = icons[p][2]; }
const out = `/* Fichier généré par scripts/build-icons.js — ne pas modifier à la main. */
(function () {
  var ICONS = ${JSON.stringify(used)};
  var NS = 'http://www.w3.org/2000/svg';
  function createIcons() {
    document.querySelectorAll('[data-lucide]').forEach(function (el) {
      var name = el.getAttribute('data-lucide'), node = ICONS[name];
      if (!node) return;
      var svg = document.createElementNS(NS, 'svg');
      var attrs = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' };
      Object.keys(attrs).forEach(function (k) { svg.setAttribute(k, attrs[k]); });
      Array.prototype.forEach.call(el.attributes, function (a) { if (a.name !== 'data-lucide' && a.name !== 'class') svg.setAttribute(a.name, a.value); });
      svg.setAttribute('class', ('lucide lucide-' + name + ' ' + (el.getAttribute('class') || '')).trim());
      node.forEach(function (c) { var e = document.createElementNS(NS, c[0]); Object.keys(c[1]).forEach(function (k) { e.setAttribute(k, c[1][k]); }); svg.appendChild(e); });
      el.replaceWith(svg);
    });
  }
  window.lucide = { createIcons: createIcons };
})();
`;
fs.writeFileSync(path.join(root, 'assets/js/icons.js'), out);
console.log(Object.keys(used).length + ' icônes,', out.length + ' octets');
