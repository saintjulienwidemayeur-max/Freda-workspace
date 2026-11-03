const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '.github', 'tests', 'scripts', 'src']);

function walk(dir, ext, out = []) {
  for (const f of fs.readdirSync(dir)) {
    if (SKIP.has(f) || f.startsWith('.')) continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, ext, out);
    else if (ext.test(f)) out.push(p);
  }
  return out;
}
const htmlFiles = () => walk(ROOT, /\.html$/).filter((f) => path.basename(f) !== '404.html' || true);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

/** En-tête CSP de production, lu dans render.yaml (les tests tournent donc avec la même politique). */
function productionHeaders() {
  const yaml = fs.readFileSync(path.join(ROOT, 'render.yaml'), 'utf8');
  const headers = {};
  const re = /- path: \/\*\n\s+name: ([\w-]+)\n\s+value: "?([^\n"]+)"?/g;
  let m;
  while ((m = re.exec(yaml))) headers[m[1]] = m[2];
  return headers;
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };

function startServer(opts = {}) {
  const headers = productionHeaders();
  if (opts.connectSrc && headers['Content-Security-Policy']) headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace(/connect-src [^;]*/, 'connect-src ' + opts.connectSrc);
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(ROOT, p);
    const ok = file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile() && !/\/(node_modules|\.git|tests|scripts)\//.test(p);
    if (!ok) { file = path.join(ROOT, '404.html'); res.statusCode = 404; }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: 'http://127.0.0.1:' + server.address().port })));
}

module.exports = { ROOT, walk, htmlFiles, rel, productionHeaders, startServer };
