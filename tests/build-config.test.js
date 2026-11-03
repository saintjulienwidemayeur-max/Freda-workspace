const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'build-config.js');
const REAL = path.join(__dirname, '..', 'assets', 'js', 'config.js');
const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'fw-cfg-')); const f = path.join(d, 'config.js'); fs.copyFileSync(REAL, f); return f; };
const run = (file, env) => spawnSync(process.execPath, [SCRIPT, file], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
const load = (file) => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(file, 'utf8'), ctx); return ctx.window.FW_CONFIG; };

test('sans variable FW_* : le fichier reste identique (site en démo)', () => {
  const f = tmp(); const before = fs.readFileSync(f, 'utf8');
  const r = run(f, {});
  assert.strictEqual(r.status, 0); assert.strictEqual(fs.readFileSync(f, 'utf8'), before);
  assert.strictEqual(load(f).DEMO_MODE, true);
});

test('FW_DEMO_MODE=false + FW_API_BASE : écrits, le fichier reste du JavaScript valide, le reste de la configuration est intact', () => {
  const f = tmp(); const ref = load(f);
  const r = run(f, { FW_DEMO_MODE: 'false', FW_API_BASE: 'https://freda-workspace-api.onrender.com/api' });
  assert.strictEqual(r.status, 0, r.stderr);
  const c = load(f);
  assert.strictEqual(c.DEMO_MODE, false); assert.strictEqual(c.API_BASE, 'https://freda-workspace-api.onrender.com/api');
  assert.strictEqual(JSON.stringify({ ...c, DEMO_MODE: 0, API_BASE: 0 }), JSON.stringify({ ...ref, DEMO_MODE: 0, API_BASE: 0 }), 'rien d’autre n’a bougé');
  assert.strictEqual(run(f, { FW_DEMO_MODE: 'false', FW_API_BASE: 'https://autre.example.com/api' }).status, 0, 'relancer sur un fichier déjà modifié fonctionne');
  assert.strictEqual(load(f).API_BASE, 'https://autre.example.com/api');
});

test('valeurs invalides : le build échoue et le fichier n’est pas touché (http, hôte douteux, injection, démo=false sans API)', () => {
  for (const env of [
    { FW_DEMO_MODE: 'false', FW_API_BASE: 'http://api.example.com/api' },
    { FW_DEMO_MODE: 'false', FW_API_BASE: "https://x.com/api'; alert(1); //" },
    { FW_DEMO_MODE: 'false', FW_API_BASE: 'https://x.com/autre' },
    { FW_DEMO_MODE: 'false' },
    { FW_DEMO_MODE: 'false', FW_API_BASE: '/api' },
    { FW_DEMO_MODE: 'peut-etre', FW_API_BASE: 'https://x.com/api' },
  ]) {
    const f = tmp(); const before = fs.readFileSync(f, 'utf8');
    const r = run(f, env);
    assert.strictEqual(r.status, 1, JSON.stringify(env)); assert.match(r.stderr, /build-config/);
    assert.strictEqual(fs.readFileSync(f, 'utf8'), before, 'fichier intact');
  }
});

test('format du fichier changé (valeur absente ou en double) : le build échoue au lieu de publier un site à moitié configuré', () => {
  const f = tmp(); fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('DEMO_MODE: true', 'MODE: true'));
  assert.strictEqual(run(f, { FW_DEMO_MODE: 'false', FW_API_BASE: 'https://x.com/api' }).status, 1);
  const g = tmp(); fs.appendFileSync(g, "\n// API_BASE: 'https://autre.example/api'\n");
  assert.strictEqual(run(g, { FW_API_BASE: 'https://x.com/api' }).status, 1);
});

test('anti-cache : ?v=<commit> ajouté aux scripts et styles locaux (pages racine et sous-dossiers), une seule fois, rien d’externe touché', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fw-ver-'));
  fs.mkdirSync(path.join(root, 'scripts')); fs.mkdirSync(path.join(root, 'espace')); fs.mkdirSync(path.join(root, 'assets', 'js'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(root, 'scripts', 'build-config.js'));
  fs.copyFileSync(REAL, path.join(root, 'assets', 'js', 'config.js'));
  fs.writeFileSync(path.join(root, 'index.html'), '<link rel="stylesheet" href="assets/css/styles.css"><script src="assets/js/api.js"></script><script src="https://js.stripe.com/x.js"></script><a href="domaines.html">x</a>');
  fs.writeFileSync(path.join(root, 'espace', 'a.html'), '<script src="../assets/js/ui.js"></script>');
  const go = () => spawnSync(process.execPath, [path.join(root, 'scripts', 'build-config.js')], { env: { PATH: process.env.PATH, RENDER_GIT_COMMIT: 'abc123def4567890' }, encoding: 'utf8' });
  assert.strictEqual(go().status, 0);
  assert.strictEqual(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), '<link rel="stylesheet" href="assets/css/styles.css?v=abc123def456"><script src="assets/js/api.js?v=abc123def456"></script><script src="https://js.stripe.com/x.js"></script><a href="domaines.html">x</a>');
  assert.strictEqual(fs.readFileSync(path.join(root, 'espace', 'a.html'), 'utf8'), '<script src="../assets/js/ui.js?v=abc123def456"></script>');
  go();
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /\?v=[a-z0-9]+\?v=/, 'idempotent');
  const none = spawnSync(process.execPath, [SCRIPT], { cwd: root, env: { PATH: process.env.PATH }, encoding: 'utf8' });
  assert.strictEqual(none.status, 0);
});
