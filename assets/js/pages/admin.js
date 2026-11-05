/** Tableau de bord administrateur : données de GET /api/admin/overview. Tout le texte passe par textContent (aucune injection possible). */
(function () {
  const C = window.FW_CONFIG;
  const $ = (id) => document.getElementById(id);
  const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const int = (n) => Number(n || 0).toLocaleString('fr-FR');
  const dt = (s) => { const d = new Date(s); return isNaN(d) ? String(s || '') : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const FR = { paid: 'payée', awaiting_payment: 'en attente de paiement', needs_attention: 'à traiter', pending: 'en cours', failed: 'échouée', refunded: 'remboursée', cancelled: 'annulée', subscription: 'abonnement', domain: 'domaine', active: 'actif', expired: 'expiré', past_due: 'impayé', suspended: 'suspendu' };
  const fr = (k) => FR[k] || k;
  let token = '', timer = null;

  function setMsg(text, err) { const m = $('msg'); m.textContent = text || ''; m.className = err ? 'err' : ''; }

  async function load(initial) {
    if (initial) setMsg('Chargement… (le premier appel peut prendre quelques secondes si le serveur dormait)');
    try {
      const res = await fetch(C.API_BASE + '/admin/overview?days=' + encodeURIComponent($('days').value), { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { lock(); setMsg('Jeton refusé.', true); return; }
      if (!res.ok) throw new Error(data.error || 'Erreur ' + res.status);
      show(data);
    } catch (e) {
      if (initial) setMsg(e.message === 'Failed to fetch' ? 'Serveur injoignable. Réessayez dans un instant.' : e.message, true);
      else $('updated').textContent = 'Actualisation impossible (' + e.message + '). Nouvel essai dans 1 minute.';
    }
  }

  function lock() {
    token = ''; clearInterval(timer); timer = null; $('token').value = '';
    $('dash').hidden = true; $('login').hidden = false;
    ['days', 'refresh', 'logout'].forEach((i) => { $(i).hidden = true; });
  }

  function kpi(label, value, sub) { const k = el('div', 'kpi'); k.append(el('div', 'l', label), el('div', 'v', value), el('div', 's', sub || '')); return k; }
  function fill(table, rows, empty, cols) {
    const tb = table.querySelector('tbody'); tb.replaceChildren();
    if (!rows.length) { const tr = el('tr'); const td = el('td', 'empty', empty); td.colSpan = cols; tr.append(td); tb.append(tr); return; }
    rows.forEach((cells) => { const tr = el('tr'); cells.forEach((c) => { const td = el('td', [c.n && 'n', c.mono && 'mono', c.err && 'err-t'].filter(Boolean).join(' '), c.t); tr.append(td); }); tb.append(tr); });
  }
  const c = (t, o) => Object.assign({ t: t === undefined || t === null ? '' : String(t) }, o);
  function pill(text, kind) { return el('span', 'pill ' + kind, text); }

  function chart(series) {
    const NS = 'http://www.w3.org/2000/svg', W = 700, H = 190, pad = { l: 8, r: 8, t: 14, b: 22 };
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
    const max = Math.max(1, ...series.map((d) => d.amount)), bw = (W - pad.l - pad.r) / series.length;
    series.forEach((d, i) => {
      const h = Math.round(((H - pad.t - pad.b) * d.amount) / max), x = pad.l + i * bw;
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', x + bw * 0.12); r.setAttribute('width', Math.max(1, bw * 0.76)); r.setAttribute('y', H - pad.b - h); r.setAttribute('height', Math.max(d.amount > 0 ? 2 : 0, h)); r.setAttribute('rx', 3);
      r.setAttribute('fill', d.amount > 0 ? '#2b64e4' : '#e3e8f2');
      const t = document.createElementNS(NS, 'title'); t.textContent = dt(d.day) + ' : ' + usd(d.amount) + ' (' + d.orders + ' commande' + (d.orders > 1 ? 's' : '') + ')'; r.append(t); svg.append(r);
    });
    [[0, series[0]], [series.length - 1, series[series.length - 1]]].forEach(([i, d], k) => {
      const tx = document.createElementNS(NS, 'text'); tx.textContent = dt(d.day); tx.setAttribute('y', H - 5); tx.setAttribute('font-size', '11'); tx.setAttribute('fill', '#5b6478');
      tx.setAttribute('x', k ? W - pad.r : pad.l); tx.setAttribute('text-anchor', k ? 'end' : 'start'); svg.append(tx);
    });
    $('chart').replaceChildren(svg);
  }

  function show(o) {
    $('login').hidden = true; $('dash').hidden = false;
    ['days', 'refresh', 'logout'].forEach((i) => { $(i).hidden = false; });
    $('updated').textContent = 'Mis à jour à ' + new Date(o.generatedAt).toLocaleTimeString('fr-FR') + ' · actualisation automatique toutes les minutes';

    const al = $('alerts'); al.replaceChildren();
    const list = o.alerts.length ? o.alerts : [{ level: 'ok', text: 'Tout est en ordre : aucune alerte.' }];
    list.forEach((a) => { const d = el('div', 'alert ' + a.level); d.append(el('span', 'dot'), el('span', '', a.text)); al.append(d); });

    const k = $('kpis'); k.replaceChildren(
      kpi('Clients', int(o.customers.total), '+' + int(o.customers.new) + ' sur ' + o.days + ' jours'),
      kpi('Ventes (' + o.days + ' j)', usd(o.revenue.period), int(o.revenue.periodOrders) + ' commande(s) · panier moyen ' + usd(o.revenue.average)),
      kpi('Ventes totales', usd(o.revenue.total), int(o.revenue.totalOrders) + ' commande(s) payée(s)'),
      kpi('Abonnements actifs', int(o.subscriptions.active), o.subscriptions.byPlan.filter((p) => p.status === 'active').map((p) => p.plan + ' ' + p.count).join(' · ') || 'aucun'),
      kpi('Domaines actifs', int(o.domains.byStatus.active), Object.entries(o.domains.byStatus).filter(([s]) => s !== 'active').map(([s, n]) => fr(s) + ' ' + n).join(' · ') || 'aucun autre statut'),
      kpi('Boîtes mail', int(o.mailboxes.active), int(o.mailboxes.loggedInLast7Days) + ' connectée(s) cette semaine' + (o.mailboxes.notActive ? ' · ' + o.mailboxes.notActive + ' en attente' : '')),
      kpi('Notifications push', int(Object.values(o.push.devices).reduce((s, n) => s + n, 0)), int(o.push.mailboxes) + ' boîte(s) · Android ' + int(o.push.devices.android) + ' · iPhone ' + int(o.push.devices.ios)),
    );

    $('rev-sub').textContent = usd(o.revenue.period) + ' sur ' + o.days + ' jours';
    chart(o.revenue.series);
    const kinds = $('kinds'); kinds.replaceChildren(); (o.revenue.byKind.length ? o.revenue.byKind : []).forEach((x) => kinds.append(el('span', 'chip', fr(x.kind) + ' : ' + usd(x.amount) + ' (' + x.orders + ')')));

    const s = o.system, sys = $('system'); sys.replaceChildren();
    const row = (label, kind, text) => { const li = el('li'); li.append(el('span', '', label), pill(text, kind)); sys.append(li); };
    row('Base de données', 'ok', s.database === 'postgresql' ? 'PostgreSQL' : s.database);
    row('Environnement', s.nodeEnv === 'production' ? 'ok' : 'warn', s.nodeEnv);
    row('Registrar (NameSilo)', s.registrar === 'live' ? 'ok' : 'warn', s.registrar === 'live' ? 'réel' : s.registrar);
    row('Paiements', s.payments === 'demo' ? 'warn' : 'ok', s.payments === 'demo' ? 'démo' : s.payments + (s.cards ? ' + cartes' : ''));
    row('E-mails du site (Brevo)', s.mailer === 'console' ? 'warn' : 'ok', s.mailer === 'console' ? 'non configuré' : s.mailer);
    row('Boîtes mail (Purelymail)', s.mailProvider ? 'ok' : 'bad', s.mailProvider ? 'actif' : 'inactif');
    row('Notifications Android (FCM)', s.push.android ? 'ok' : 'off', s.push.android ? 'actif' : 'inactif');
    row('Notifications iPhone (APNs)', s.push.ios ? 'ok' : 'off', s.push.ios ? 'actif' : 'inactif');
    row('Auto-ping (anti-sommeil)', s.keepAlive ? 'ok' : 'warn', s.keepAlive ? 'actif' : 'inactif');
    const up = s.uptimeSeconds; row('Serveur démarré depuis', 'off', up >= 86400 ? Math.floor(up / 86400) + ' j' : up >= 3600 ? Math.floor(up / 3600) + ' h' : Math.max(1, Math.floor(up / 60)) + ' min');
    row('Mémoire', 'off', s.memoryMb + ' Mo');

    const byS = o.orders.byStatus, st = Object.entries(byS).map(([k2, n]) => fr(k2) + ' ' + n).join(' · ');
    $('ord-sub').textContent = st || 'aucune commande';
    fill($('attention'), o.orders.attention.map((x) => [c(x.reference, { mono: true }), c(x.email), c(usd(x.amount), { n: true }), c(x.error || '—', { err: true })]), 'Aucune commande à traiter.', 4);
    fill($('expiring'), o.domains.expiring.map((x) => [c(x.name, { mono: true }), c(x.email), c(dt(x.expires) + ' (' + x.daysLeft + ' j)'), c(x.autoRenew ? 'auto' : 'manuel')]), 'Aucun domaine n’expire dans les 30 prochains jours.', 4);
    fill($('signups'), o.signups.map((x) => [c(x.name ? x.name + ' · ' + x.email : x.email), c(x.company || '—'), c(x.country || '—'), c(dt(x.createdAt))]), 'Aucun client.', 4);
    fill($('recent'), o.orders.recent.map((x) => [c(x.reference, { mono: true }), c(fr(x.kind)), c(fr(x.status)), c(usd(x.amount), { n: true })]), 'Aucune commande.', 4);
  }

  $('login').addEventListener('submit', (e) => { e.preventDefault(); token = $('token').value.trim(); if (!token) return; load(true).then(() => { if (token && !timer) timer = setInterval(() => load(false), 60000); }); });
  $('days').addEventListener('change', () => load(false));
  $('refresh').addEventListener('click', () => load(false));
  $('logout').addEventListener('click', lock);
})();
