/**
 * Freda Workspace — couche d'accès aux données.
 *
 * Chaque méthode a deux chemins :
 *   - DEMO_MODE = true  : données simulées (stockées dans le navigateur)
 *   - DEMO_MODE = false : appel REST vers votre backend (FW_CONFIG.API_BASE)
 *
 * Routes backend attendues (à implémenter côté serveur) :
 *   GET    /domains/search?q=            -> API Registrar (disponibilité + prix)
 *   POST   /auth/login | /auth/signup | /auth/logout | /auth/reset
 *   GET    /auth/oauth/:provider         -> redirection OAuth Google / Apple
 *   GET    /me
 *   POST   /checkout                     -> crée le paiement via Freda Pay
 *   GET    /workspace                    -> domaines, boîtes, factures...
 *   GET/POST/PATCH/DELETE /domains/:d/dns[/:id]
 *   POST   /domains/:d/dns/autofix       -> réaligne MX, SPF, DKIM, DMARC
 *   GET    /domains/:d/dns/check         -> diagnostic + propagation
 *   GET/POST/DELETE /mailboxes[/:id]     -> API Purelymail
 */
(function () {
  const C = window.FW_CONFIG;

  /* ---------- Stockage local sécurisé (peut être indisponible) ---------- */
  const store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem('fw:' + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return memory[key] ?? fallback; }
    },
    set(key, value) {
      memory[key] = value;
      try { localStorage.setItem('fw:' + key, JSON.stringify(value)); } catch (e) { /* mode privé */ }
    },
    remove(key) {
      delete memory[key];
      try { localStorage.removeItem('fw:' + key); } catch (e) { /* ignore */ }
    },
  };
  const memory = {};

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const uid = () => Math.random().toString(36).slice(2, 10);

  /* ---------- Requêtes réelles vers le backend ---------- */
  async function request(path, { method = 'GET', body } = {}) {
    const res = await fetch(C.API_BASE + path, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'La requête a échoué (' + res.status + ').');
    return data;
  }

  /* ---------- Formatage ---------- */
  function money(amount, currency = 'USD') {
    if (currency === 'HTG') return new Intl.NumberFormat('fr-HT', { maximumFractionDigits: 0 }).format(Math.round(amount)) + ' HTG';
    return '$' + Number(amount).toFixed(2);
  }
  function date(iso) {
    return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function planPrice(planId, cycle) {
    const p = C.PLANS[planId];
    return cycle === 'yearly' ? +(p.monthly * C.YEARLY_MONTHS_BILLED).toFixed(2) : p.monthly;
  }

  /* ======================================================================
     DOMAINES
     ====================================================================== */
  const TAKEN = ['google', 'facebook', 'apple', 'amazon', 'microsoft', 'freda', 'fredapay', 'digicel', 'natcom',
    'moncash', 'natcash', 'youtube', 'test', 'exemple', 'example', 'boutique', 'hotel', 'restaurant', 'haiti', 'shop', 'mail'];

  /** Nettoie la saisie : "https://www.Ma Boutique.com/" -> { label: "ma-boutique", tld: ".com" } */
  function normalizeDomain(raw) {
    let q = String(raw || '').trim().toLowerCase();
    q = q.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
    q = q.normalize('NFD').replace(/[̀-ͯ]/g, ''); // retire les accents
    q = q.replace(/\s+/g, '-');
    let tld = null;
    const dot = q.indexOf('.');
    if (dot > -1) { tld = q.slice(dot); q = q.slice(0, dot); }
    const label = q.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!label) return { error: 'Saisissez un nom, par exemple « maboutique ».' };
    if (label.length < 2) return { error: 'Le nom doit contenir au moins 2 caractères.' };
    if (label.length > 63) return { error: 'Le nom ne peut pas dépasser 63 caractères.' };
    const known = C.TLDS.find((t) => t.tld === tld);
    return { label, tld: known ? known.tld : null, unknownTld: tld && !known ? tld : null };
  }

  function hash(str) { let h = 5381; for (const ch of str) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; return h; }

  function mockAvailability(label, tld) {
    if (TAKEN.includes(label) && ['.com', '.net', '.org', '.co'].includes(tld)) return false;
    if (label.length <= 3 && tld === '.com') return false;
    return hash(label + tld) % 10 >= 3; // ~70 % disponibles
  }

  async function searchDomains(raw) {
    const n = normalizeDomain(raw);
    if (n.error) throw new Error(n.error);
    if (!C.DEMO_MODE) return request('/domains/search?q=' + encodeURIComponent(n.label + (n.tld || '')));

    await wait(650);
    const primaryTld = n.tld || '.com';
    const toResult = (label, t) => {
      const info = C.TLDS.find((x) => x.tld === t);
      return { domain: label + t, label, tld: t, available: mockAvailability(label, t), price: info.price, renew: info.renew, included: info.included };
    };
    const exact = toResult(n.label, primaryTld);
    const results = C.TLDS.filter((t) => t.tld !== primaryTld).map((t) => toResult(n.label, t.tld));
    const variants = ['get' + n.label, 'mon' + n.label, n.label + '-ht', n.label + 'pro', n.label + 'group']
      .filter((l) => l.length <= 63)
      .map((l) => toResult(l, '.com'))
      .filter((r) => r.available)
      .slice(0, 4);
    return { query: n.label, unknownTld: n.unknownTld, exact, results, suggestions: variants };
  }

  /* ======================================================================
     PANIER (domaine + offre choisis avant paiement)
     ====================================================================== */
  const domainsOf = (c) => (c.domain ? [c.domain, ...(c.extras || [])] : []);
  const cart = {
    get: () => store.get('cart', { domain: null, plan: 'business', cycle: 'monthly' }),
    set(patch) { const c = { ...cart.get(), ...patch }; store.set('cart', c); return c; },
    clear: () => store.remove('cart'),
    /** Prix d'un domaine pour N ans : 1re année au prix affiché, ensuite au prix de renouvellement. */
    priceOf: (d, years = 1) => +(d.price + (d.renew || d.price) * (Math.max(1, years) - 1)).toFixed(2),
    /** Extensions économiques proposées avec un .com pour protéger le nom de marque. */
    async upsell(c = cart.get()) {
      if (!c.domain || c.domain.tld !== '.com') return [];
      const taken = new Set((c.extras || []).map((x) => x.domain));
      const data = await searchDomains(c.domain.label + '.com');
      return data.results.filter((r) => r.available && r.price <= 10 && r.tld !== '.com' && !taken.has(r.domain)).sort((x, y) => x.price - y.price).slice(0, 4);
    },
    /**
     * Le domaine et l'abonnement email sont deux achats distincts :
     *  - total / domain : ce qui est payé à l'étape 1 (domaine seul) ;
     *  - plan : ce qui est payé à l'étape 2, facultative (offre email).
     */
    totals(c = cart.get()) {
      const years = Math.max(1, Math.min(10, c.years || 1));
      // 1re année au prix affiché, années suivantes au prix de renouvellement
      const domain = +domainsOf(c).reduce((sum, d) => sum + cart.priceOf(d, years), 0).toFixed(2);
      const plan = planPrice(c.plan, c.cycle);
      return { years, count: domainsOf(c).length, domain, domainExtra: domain, plan, total: domain, htg: domain * C.HTG_RATE, planHtg: plan * C.HTG_RATE };
    },
  };

  /* ======================================================================
     AUTHENTIFICATION
     ====================================================================== */
  const auth = {
    current: () => store.get('session'),

    async login(email, password) {
      if (!C.DEMO_MODE) return request('/auth/login', { method: 'POST', body: { email, password } });
      await wait(700);
      if (password.length < 6) throw new Error('Email ou mot de passe incorrect.');
      const s = { user: { name: email.split('@')[0], email }, provider: 'email' };
      store.set('session', s);
      return s;
    },

    async signup(data) {
      if (!C.DEMO_MODE) return request('/auth/signup', { method: 'POST', body: data });
      await wait(800);
      const s = { user: { name: data.name, email: data.email, company: data.company }, provider: 'email' };
      store.set('session', s);
      return s;
    },

    /**
     * Connexion Google / Apple.
     * Production : redirige vers le backend qui gère OAuth 2.0 / Sign in with Apple
     * (ou supabase.auth.signInWithOAuth({ provider: 'google' | 'apple' })).
     */
    async oauth(provider) {
      if (!C.DEMO_MODE) { window.location.href = C.API_BASE + '/auth/oauth/' + provider; return; }
      await wait(900);
      const s = { user: { name: provider === 'google' ? 'Compte Google' : 'Compte Apple', email: 'demo@' + provider + '.com' }, provider };
      store.set('session', s);
      return s;
    },

    async resetPassword(email) {
      if (!C.DEMO_MODE) return request('/auth/reset', { method: 'POST', body: { email } });
      await wait(700);
      return { ok: true };
    },

    logout() { store.remove('session'); if (!C.DEMO_MODE) request('/auth/logout', { method: 'POST' }).catch(() => {}); },
  };

  /* ======================================================================
     PAIEMENTS — via Freda Pay
     ----------------------------------------------------------------------
     Carte bancaire : en production, la carte doit être tokenisée par le
     formulaire sécurisé / SDK de Freda Pay. Ne transmettez jamais le numéro
     complet à votre propre serveur (conformité PCI-DSS).
     MonCash / NatCash : le backend crée la transaction chez Freda Pay qui
     renvoie une URL de redirection ou envoie une demande de confirmation
     sur le téléphone du client.
     ====================================================================== */
  const payments = {
    /**
     * kind = 'domain' : achat du domaine seul (étape 1)
     * kind = 'subscription' : offre email + première boîte (étape 2, facultative)
     * saved = true : réutilise le moyen de paiement déjà enregistré (jeton Freda Pay)
     */
    async checkout({ kind, method, payer, saved, domain, plan, cycle, mailbox }) {
      const c = cart.get();
      const amount = kind === 'domain' ? cart.totals(c).domain : planPrice(plan, cycle);
      const payload = { kind, method, saved: !!saved, domain: domain || c.domain?.domain, years: kind === 'domain' ? cart.totals(c).years : undefined, plan, cycle, mailbox, amount, currency: 'USD', payer };
      if (!C.DEMO_MODE) return request('/checkout', { method: 'POST', body: payload });
      await wait(1600);
      if (method === 'card' && payer?.last4 === '0002') throw new Error('Paiement refusé par la banque. Essayez une autre carte ou MonCash.');
      return { status: 'succeeded', kind, reference: 'FP-' + Date.now().toString().slice(-8), amount, method };
    },
  };

  /* ======================================================================
     ESPACE CLIENT — données de démonstration
     ====================================================================== */
  function seedWorkspace() {
    const tpl = C.MAIL_DNS_TEMPLATE;
    const mk = (r) => ({ id: uid(), ttl: 3600, ...r });
    return {
      user: { name: 'Claire Martin', email: 'claire@monentreprise.com', company: 'Mon Entreprise', phone: '+509 3712 4418', city: 'Port-au-Prince' },
      plan: { id: 'business', cycle: 'monthly', renews: '2026-12-01', status: 'active' },
      domains: [
        { name: 'monentreprise.com', status: 'active', registered: '2026-03-14', expires: '2027-03-14', autoRenew: true, locked: true, primary: true },
        { name: 'monentreprise.net', status: 'active', registered: '2026-09-02', expires: '2027-09-02', autoRenew: false, locked: true },
      ],
      dns: {
        'monentreprise.com': [
          mk({ type: 'A', name: '@', value: '76.76.21.21' }),
          mk({ type: 'CNAME', name: 'www', value: 'monentreprise.com' }),
          ...tpl.map(mk),
          mk({ type: 'TXT', name: '@', value: 'purelymail_ownership_proof=7f3c9a12b8e4', managed: true, role: 'Vérification' }),
        ],
        // Domaine volontairement incomplet (pas de DKIM 3 ni DMARC) pour montrer la réparation auto.
        'monentreprise.net': [
          mk({ type: 'A', name: '@', value: '185.199.108.153' }),
          ...tpl.filter((r) => r.name !== 'purelymail3._domainkey' && r.role !== 'DMARC').map(mk),
        ],
      },
      mailboxes: [
        { id: uid(), address: 'contact@monentreprise.com', name: 'Accueil', usedGb: 2.1, created: '2026-03-14', lastLogin: '2026-10-31', role: 'Propriétaire' },
        { id: uid(), address: 'ventes@monentreprise.com', name: 'Service ventes', usedGb: 0.8, created: '2026-04-02', lastLogin: '2026-10-30', role: 'Utilisateur' },
        { id: uid(), address: 'direction@monentreprise.com', name: 'Claire Martin', usedGb: 3.4, created: '2026-03-14', lastLogin: '2026-11-01', role: 'Administrateur' },
      ],
      aliases: [
        { id: uid(), from: 'info@monentreprise.com', to: 'contact@monentreprise.com' },
        { id: uid(), from: 'commandes@monentreprise.com', to: 'ventes@monentreprise.com' },
      ],
      paymentMethods: [
        { id: uid(), type: 'card', brand: 'Visa', last4: '4242', exp: '08/28', default: true },
        { id: uid(), type: 'moncash', phone: '+509 37•• ••18' },
      ],
      invoices: [
        { id: 'FW-2026-0118', date: '2026-11-01', label: 'Business — mensuel', amount: 9.99, method: 'Visa •••• 4242', status: 'paid' },
        { id: 'FW-2026-0094', date: '2026-10-01', label: 'Business — mensuel', amount: 9.99, method: 'MonCash', status: 'paid' },
        { id: 'FW-2026-0081', date: '2026-09-02', label: 'Domaine monentreprise.net (1 an)', amount: 13.99, method: 'NatCash', status: 'paid' },
        { id: 'FW-2026-0067', date: '2026-09-01', label: 'Business — mensuel', amount: 9.99, method: 'Visa •••• 4242', status: 'paid' },
        { id: 'FW-2026-0042', date: '2026-08-01', label: 'Business — mensuel', amount: 9.99, method: 'Visa •••• 4242', status: 'refunded' },
      ],
      activity: [
        { icon: 'mail-plus', text: 'Boîte ventes@monentreprise.com créée', at: '2026-10-30 14:12' },
        { icon: 'receipt', text: 'Facture FW-2026-0118 payée par carte', at: '2026-11-01 08:00' },
        { icon: 'shield-check', text: 'Enregistrements DKIM vérifiés pour monentreprise.com', at: '2026-10-29 09:41' },
        { icon: 'globe', text: 'Domaine monentreprise.net enregistré', at: '2026-09-02 16:20' },
      ],
    };
  }

  function methodLabel(method, payer) {
    if (method === 'card') return (payer?.brand ? payer.brand[0].toUpperCase() + payer.brand.slice(1) : 'Carte') + ' •••• ' + (payer?.last4 || '');
    return method === 'moncash' ? 'MonCash' : 'NatCash';
  }
  function payerToMethods(method, payer) {
    if (!payer) return [];
    if (method === 'card') return [{ id: uid(), type: 'card', brand: payer.brand ? payer.brand[0].toUpperCase() + payer.brand.slice(1) : 'Visa', last4: payer.last4 || '0000', exp: payer.exp || '12/29', default: true }];
    const d = (payer.phone || '').replace(/\D/g, '').slice(-8);
    return [{ id: uid(), type: method, phone: '+509 ' + d.slice(0, 2) + '•• ••' + d.slice(-2), default: true }];
  }

  const workspace = {
    get() {
      let s = store.get('workspace');
      if (!s) { s = seedWorkspace(); store.set('workspace', s); }
      return s;
    },
    save(s) { store.set('workspace', s); return s; },
    reset() { store.remove('workspace'); return workspace.get(); },
    /** Nouveau client : espace avec le domaine acheté, sans abonnement email. */
    createFromPurchase({ user, domain, extras = [], years = 1, payer, method, reference, amount }) {
      const today = new Date().toISOString().slice(0, 10);
      const next = new Date(); next.setFullYear(next.getFullYear() + years);
      const mk = (r) => ({ id: uid(), ttl: 3600, ...r });
      const s = {
        user: { name: user.name || '', email: user.email || '', company: user.company || '', phone: '', city: '' },
        plan: null,
        domains: [], dns: {}, mailboxes: [], aliases: [], paymentMethods: [], invoices: [], activity: [],
      };
      if (domain) {
        [domain, ...extras].forEach((d, i) => {
          s.domains.push({ name: d.domain, status: 'active', registered: today, expires: next.toISOString().slice(0, 10), autoRenew: true, locked: true, primary: i === 0 });
          s.dns[d.domain] = [mk({ type: 'A', name: '@', value: '76.76.21.21' }), mk({ type: 'CNAME', name: 'www', value: d.domain })];
          workspace.log(s, 'globe', 'Domaine ' + d.domain + ' enregistré');
        });
        const names = [domain, ...extras].map((d) => d.domain).join(', ');
        s.invoices.push({ id: 'FW-' + new Date().getFullYear() + '-' + reference.slice(-4), date: today, label: (extras.length ? 'Domaines ' : 'Domaine ') + names + ' (' + years + (years > 1 ? ' ans' : ' an') + ')', amount, method: methodLabel(method, payer), status: 'paid' });
      }
      s.paymentMethods = payerToMethods(method, payer);
      workspace.save(s);
      return s;
    },
    /** Active l'offre email (étape 2 ou plus tard) : boîte, DNS email et facture. */
    subscribe({ domain, plan, cycle, local, method, payer, saved, reference, amount }) {
      const s = workspace.get();
      const mk = (r) => ({ id: uid(), ttl: 3600, ...r });
      const today = new Date();
      const renews = new Date(today); if (cycle === 'yearly') renews.setFullYear(renews.getFullYear() + 1); else renews.setMonth(renews.getMonth() + 1);
      s.plan = { id: plan, cycle, renews: renews.toISOString().slice(0, 10), status: 'active' };
      if (!s.domains.some((d) => d.name === domain)) {
        // Domaine déjà possédé ailleurs : à connecter par les serveurs DNS
        s.domains.push({ name: domain, status: 'pending', external: true, registered: today.toISOString().slice(0, 10), expires: '', autoRenew: false, locked: false, primary: !s.domains.length });
      }
      const list = s.dns[domain] || (s.dns[domain] = []);
      C.MAIL_DNS_TEMPLATE.forEach((t) => { if (!list.some((r) => r.type === t.type && r.name === t.name && r.value === t.value)) list.push(mk(t)); });
      const address = local + '@' + domain;
      if (!s.mailboxes.some((m) => m.address === address)) s.mailboxes.push({ id: uid(), address, name: local, usedGb: 0, created: today.toISOString().slice(0, 10), lastLogin: null, role: 'Propriétaire' });
      if (!saved || !s.paymentMethods.length) s.paymentMethods = s.paymentMethods.concat(payerToMethods(method, payer)).map((m, i, a) => ({ ...m, default: i === 0 }));
      s.invoices.unshift({ id: 'FW-' + today.getFullYear() + '-' + reference.slice(-4), date: today.toISOString().slice(0, 10), label: C.PLANS[plan].name + ' — ' + (cycle === 'yearly' ? 'annuel' : 'mensuel'), amount, method: saved && s.paymentMethods[0] ? methodLabel(s.paymentMethods[0].type, s.paymentMethods[0]) : methodLabel(method, payer), status: 'paid' });
      workspace.log(s, 'mail-plus', 'Offre ' + C.PLANS[plan].name + ' activée · boîte ' + address + ' créée');
      workspace.save(s);
      return s;
    },
    log(s, icon, text) {
      const now = new Date();
      s.activity.unshift({ icon, text, at: now.toISOString().slice(0, 16).replace('T', ' ') });
      s.activity = s.activity.slice(0, 12);
    },
  };

  /* ---------- DNS ---------- */
  const dns = {
    async list(domain) {
      if (!C.DEMO_MODE) return request('/domains/' + domain + '/dns');
      await wait(250);
      return workspace.get().dns[domain] || [];
    },
    async save(domain, record) {
      if (!C.DEMO_MODE) return request('/domains/' + domain + '/dns' + (record.id ? '/' + record.id : ''), { method: record.id ? 'PATCH' : 'POST', body: record });
      await wait(450);
      const s = workspace.get();
      const list = s.dns[domain] || (s.dns[domain] = []);
      const isNew = !record.id;
      if (!isNew) { const i = list.findIndex((r) => r.id === record.id); list[i] = { ...list[i], ...record }; }
      else { record.id = uid(); list.push(record); }
      workspace.log(s, 'server-cog', 'Enregistrement ' + record.type + ' « ' + record.name + ' » ' + (isNew ? 'ajouté' : 'mis à jour') + ' sur ' + domain);
      workspace.save(s);
      return record;
    },
    async remove(domain, id) {
      if (!C.DEMO_MODE) return request('/domains/' + domain + '/dns/' + id, { method: 'DELETE' });
      await wait(350);
      const s = workspace.get();
      s.dns[domain] = s.dns[domain].filter((r) => r.id !== id);
      workspace.save(s);
    },
    /** Analyse la zone : présence et cohérence des enregistrements email. */
    health(records) {
      const has = (pred) => records.some(pred);
      const dkimCount = records.filter((r) => r.name.endsWith('._domainkey')).length;
      return {
        MX: has((r) => r.type === 'MX' && r.value.includes('purelymail')) ? 'ok' : 'missing',
        SPF: has((r) => r.type === 'TXT' && r.value.startsWith('v=spf1') && r.value.includes('purelymail')) ? 'ok' : 'missing',
        DKIM: dkimCount >= 3 ? 'ok' : dkimCount > 0 ? 'partial' : 'missing',
        DMARC: has((r) => r.name === '_dmarc') ? 'ok' : 'missing',
      };
    },
    /** Ajoute les enregistrements email manquants du modèle Purelymail. */
    async autofix(domain) {
      if (!C.DEMO_MODE) return request('/domains/' + domain + '/dns/autofix', { method: 'POST' });
      await wait(1400);
      const s = workspace.get();
      const list = s.dns[domain] || (s.dns[domain] = []);
      let added = 0;
      C.MAIL_DNS_TEMPLATE.forEach((t) => {
        if (!list.some((r) => r.type === t.type && r.name === t.name && r.value === t.value)) { list.push({ id: uid(), ttl: 3600, ...t }); added++; }
      });
      workspace.log(s, 'wand-sparkles', 'Configuration email réparée sur ' + domain + ' (' + added + ' enregistrement' + (added > 1 ? 's' : '') + ')');
      workspace.save(s);
      return { added };
    },
    async propagation(domain) {
      if (!C.DEMO_MODE) return request('/domains/' + domain + '/dns/check');
      await wait(1200);
      return [
        { resolver: 'Google', ip: '8.8.8.8', ok: true, ms: 24 },
        { resolver: 'Cloudflare', ip: '1.1.1.1', ok: true, ms: 18 },
        { resolver: 'Quad9', ip: '9.9.9.9', ok: true, ms: 41 },
        { resolver: 'OpenDNS', ip: '208.67.222.222', ok: hash(domain) % 2 === 0, ms: 57 },
      ];
    },
  };

  /* ---------- Boîtes mail (Purelymail via backend) ---------- */
  const mailboxes = {
    async create({ local, domain, name }) {
      if (!C.DEMO_MODE) return request('/mailboxes', { method: 'POST', body: { local, domain, name } });
      await wait(900);
      const s = workspace.get();
      const address = local + '@' + domain;
      if (s.mailboxes.some((m) => m.address === address) || s.aliases.some((a) => a.from === address)) throw new Error('Cette adresse existe déjà.');
      if (!s.plan) throw new Error('Activez d’abord une offre email pour créer des boîtes.');
      const limit = C.PLANS[s.plan.id].mailboxes;
      const planDef = C.PLANS[s.plan.id];
      if (s.mailboxes.length >= limit && !planDef.extraMailboxMonthly) throw new Error('Votre offre ' + planDef.name + ' permet ' + limit + ' boîte' + (limit > 1 ? 's' : '') + '. Passez à une offre supérieure pour en ajouter.');
      const box = { id: uid(), address, name: name || local, usedGb: 0, created: new Date().toISOString().slice(0, 10), lastLogin: null, role: 'Utilisateur' };
      s.mailboxes.push(box);
      workspace.log(s, 'mail-plus', 'Boîte ' + address + ' créée');
      workspace.save(s);
      return box;
    },
    async remove(id) {
      if (!C.DEMO_MODE) return request('/mailboxes/' + id, { method: 'DELETE' });
      await wait(500);
      const s = workspace.get();
      const box = s.mailboxes.find((m) => m.id === id);
      s.mailboxes = s.mailboxes.filter((m) => m.id !== id);
      workspace.log(s, 'trash-2', 'Boîte ' + box.address + ' supprimée');
      workspace.save(s);
    },
    async addAlias(from, to) {
      if (!C.DEMO_MODE) return request('/aliases', { method: 'POST', body: { from, to } });
      await wait(500);
      const s = workspace.get();
      if (s.aliases.some((a) => a.from === from) || s.mailboxes.some((m) => m.address === from)) throw new Error('Cette adresse est déjà utilisée.');
      s.aliases.push({ id: uid(), from, to });
      workspace.save(s);
    },
    async removeAlias(id) {
      await wait(300);
      const s = workspace.get();
      s.aliases = s.aliases.filter((a) => a.id !== id);
      workspace.save(s);
    },
  };

  /** Génère un mot de passe robuste (sans caractères ambigus). */
  function generatePassword(len = 16) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*?';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, (n) => chars[n % chars.length]).join('');
  }

  window.FW = { config: C, store, money, date, planPrice, normalizeDomain, searchDomains, cart, auth, payments, workspace, dns, mailboxes, generatePassword, wait };
})();
