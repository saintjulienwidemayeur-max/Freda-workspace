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
 *   POST   /checkout (kind 'domain')     -> achat depuis l'espace client avec un moyen de paiement enregistré
 *   POST   /domains/connect              -> ajoute un domaine existant {domain, mode: 'nameservers'|'records'}
 *   POST   /domains/:d/verify            -> vérifie les serveurs de noms / enregistrements -> {connected}
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
  async function request(path, { method = 'GET', body, idempotencyKey } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    const token = store.get('token');                       // jeton JWT fourni par la connexion (Authorization: Bearer)
    if (token) headers.Authorization = 'Bearer ' + token;
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;   // évite un double achat si la requête est rejouée
    const res = await fetch(C.API_BASE + path, { method, credentials: 'include', headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(data.message || 'La requête a échoué (' + res.status + ').'); err.status = res.status; err.code = data.code; throw err; }
    return data;
  }
  const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : 'k' + Date.now() + Math.random().toString(36).slice(2));

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
    const variants = ['get' + n.label, 'mon' + n.label, n.label + '-online', n.label + 'pro', n.label + 'group']
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
  /** Réponse de /auth/login|signup|reset/confirm : { token, user } -> session locale + jeton Bearer. */
  function startSession(r) {
    store.set('token', r.token);
    store.remove('workspace');
    const s = { user: r.user, provider: 'email' };
    store.set('session', s);
    return s;
  }
  const auth = {
    current: () => store.get('session'),

    async login(email, password) {
      if (!C.DEMO_MODE) return startSession(await request('/auth/login', { method: 'POST', body: { email, password } }));
      await wait(700);
      if (password.length < 6) throw new Error('Email ou mot de passe incorrect.');
      const s = { user: { name: email.split('@')[0], email }, provider: 'email' };
      store.set('session', s);
      return s;
    },

    async signup(data) {
      if (!C.DEMO_MODE) return startSession(await request('/auth/signup', { method: 'POST', body: data }));
      await wait(800);
      const s = { user: { name: data.name, email: data.email, company: data.company || '', phone: data.phone || '' }, provider: 'email' };
      store.set('session', s);
      return s;
    },

    /**
     * Connexion Google / Apple.
     * Production : redirige vers le backend qui gère OAuth 2.0 / Sign in with Apple
     * (ou supabase.auth.signInWithOAuth({ provider: 'google' | 'apple' })).
     */
    async oauth(provider) {
      if (!C.DEMO_MODE) { const next = new URLSearchParams(location.search).get('next'); window.location.href = C.API_BASE + '/auth/oauth/' + provider + (next ? '?next=' + encodeURIComponent(next) : ''); return; }
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

    /**
     * Profil de l'entreprise (étape facultative après l'inscription, modifiable dans Paramètres).
     * Champs : company, taxId (NIF), address, city, country, billingEmail, phone. Ils figurent sur les factures PDF.
     * Production : PATCH /me/company
     */
    async updateProfile(patch) {
      if (!C.DEMO_MODE) {
        const user = await request('/me/company', { method: 'PATCH', body: patch });
        const s = store.get('session'); if (s) { s.user = { ...s.user, ...user }; store.set('session', s); }
        const w = store.get('workspace'); if (w) { w.user = { ...w.user, ...user }; store.set('workspace', w); }
        return s;
      }
      await wait(500);
      const s = store.get('session');
      if (s) { s.user = { ...s.user, ...patch }; store.set('session', s); }
      const w = store.get('workspace');
      if (w) { w.user = { ...w.user, ...patch }; store.set('workspace', w); }
      return s;
    },

    /** Fin du retour OAuth : le backend redirige vers connexion.html#token=…&next=…&new=1. */
    async completeOAuth(hash) {
      const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
      if (p.get('error')) throw new Error('La connexion a échoué. Réessayez.');
      const token = p.get('token');
      if (!token) return null;
      store.set('token', token);
      history.replaceState(null, '', location.pathname + location.search);       // le jeton ne reste pas dans l'URL
      const user = await request('/me');
      store.set('session', { user, provider: 'google' });
      return { next: p.get('next') || '', isNew: p.get('new') === '1' };
    },

    /** Nouveau mot de passe depuis le lien reçu par e-mail (connexion.html?reset=JETON). */
    async confirmReset(token, password) {
      if (C.DEMO_MODE) { await wait(500); return { ok: true }; }
      return startSession(await request('/auth/reset/confirm', { method: 'POST', body: { token, password } }));
    },

    async changePassword(oldPassword, newPassword) {
      if (C.DEMO_MODE) { await wait(400); return { ok: true }; }
      return request('/me/password', { method: 'POST', body: { oldPassword, newPassword } });
    },

    logout() { if (!C.DEMO_MODE) request('/auth/logout', { method: 'POST' }).catch(() => {}); store.remove('session'); store.remove('token'); store.remove('workspace'); },
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
    async checkout({ kind, method, payer, saved, domain, plan, cycle, mailbox, mailboxPassword, methodId }) {
      const c = cart.get();
      const amount = kind === 'domain' ? cart.totals(c).domain : planPrice(plan, cycle);
      if (!C.DEMO_MODE) {
        // Le navigateur n'envoie QUE le choix : le serveur recalcule prix, durée et disponibilité. Aucune donnée de carte ne part vers notre API.
        const body = kind === 'domain'
          ? { kind, method, domains: domainsOf(c).map((d) => d.domain), years: cart.totals(c).years }
          : { kind, method, methodId, plan, cycle, domain, mailbox: mailbox ? { local: String(mailbox).split('@')[0], password: mailboxPassword } : null };
        return payments.settle(await request('/checkout', { method: 'POST', body, idempotencyKey: newKey() }));
      }
      const payload = { kind, method, saved: !!saved, domain: domain || c.domain?.domain, years: kind === 'domain' ? cart.totals(c).years : undefined, plan, cycle, mailbox, amount, currency: 'USD', payer };
      void payload;
      await wait(1600);
      if (method === 'card' && payer?.last4 === '0002') throw new Error('Paiement refusé par la banque. Essayez une autre carte ou MonCash.');
      return { status: 'succeeded', kind, reference: 'FP-' + Date.now().toString().slice(-8), amount, method };
    },

    /**
     * Pay'm (MonCash / NatCash) est asynchrone : /checkout répond « pending » avec l'URL de paiement ; on attend la confirmation
     * (GET /orders/:id toutes les 3 s, 25 min maximum). `payments.onPending(res)` permet à l'interface d'afficher le lien de paiement.
     */
    async settle(res) {
      const done = () => { if (payments.onSettled) payments.onSettled(); };
      if (res.status !== 'pending') { await workspace.load().catch(() => {}); return res; }
      if (payments.onPending) payments.onPending(res);
      const deadline = Date.now() + 25 * 60 * 1000;
      while (Date.now() < deadline) {
        await wait(3000);
        const s = await request('/orders/' + res.orderId);
        if (s.status === 'succeeded') { done(); await workspace.load().catch(() => {}); return s; }
        if (s.status === 'failed') { done(); throw new Error(s.error || 'Le paiement n’a pas abouti. Aucun montant n’a été débité.'); }
      }
      done();
      throw new Error('Paiement non confirmé pour le moment. Si vous avez payé, il sera pris en compte automatiquement dans quelques minutes.');
    },
    onPending: null,
    onSettled: null,
  };

  /* ======================================================================
     ESPACE CLIENT — données de démonstration
     ====================================================================== */
  function seedWorkspace() {
    const tpl = C.MAIL_DNS_TEMPLATE;
    const mk = (r) => ({ id: uid(), ttl: 3600, ...r });
    return {
      user: { name: 'Claire Martin', email: 'claire@monentreprise.com', company: 'Mon Entreprise', phone: '+509 3712 4418', city: 'Port-au-Prince', address: '', country: 'Haïti', taxId: '', billingEmail: '' },
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
      if (!s) {
        if (!C.DEMO_MODE) return { user: {}, plan: null, domains: [], dns: {}, mailboxes: [], aliases: [], paymentMethods: [], invoices: [], activity: [] };   // jamais de données de démonstration en production
        s = seedWorkspace(); store.set('workspace', s);
      }
      return s;
    },
    save(s) { store.set('workspace', s); return s; },
    /** Production : charge l'espace client depuis le backend (GET /workspace) dans le cache local lu par les pages. */
    async load() {
      if (C.DEMO_MODE) return workspace.get();
      const w = await request('/workspace');
      store.set('workspace', w);
      return w;
    },
    reset() { store.remove('workspace'); return workspace.get(); },
    /** Nouveau client : espace avec le domaine acheté, sans abonnement email. */
    createFromPurchase({ user, domain, extras = [], years = 1, payer, method, reference, amount }) {
      const today = new Date().toISOString().slice(0, 10);
      const next = new Date(); next.setFullYear(next.getFullYear() + years);
      const mk = (r) => ({ id: uid(), ttl: 3600, ...r });
      const s = {
        user: { name: user.name || '', email: user.email || '', company: user.company || '', phone: user.phone || '', city: user.city || '', address: user.address || '', country: user.country || '', taxId: user.taxId || '', billingEmail: user.billingEmail || '' },
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

  /* ---------- Domaines existants (hébergés chez un autre registraire) ---------- */
  const domains = {
    /** Achat d'un ou plusieurs domaines depuis l'espace client (moyen de paiement déjà enregistré). */
    async buy({ items, years, methodId }) {
      const amount = +items.reduce((sum, d) => sum + cart.priceOf(d, years), 0).toFixed(2);
      if (!C.DEMO_MODE) return payments.settle(await request('/checkout', { method: 'POST', idempotencyKey: newKey(), body: { kind: 'domain', methodId, domains: items.map((d) => d.domain), years } }));
      await wait(1600);
      const s = workspace.get();
      const pm = s.paymentMethods.find((m) => m.id === methodId) || s.paymentMethods[0];
      if (!pm) throw new Error('Ajoutez d’abord un moyen de paiement dans Facturation.');
      if (pm.type === 'card' && pm.last4 === '0002') throw new Error('Paiement refusé par la banque. Essayez un autre moyen de paiement.');
      const today = new Date();
      const exp = new Date(today); exp.setFullYear(exp.getFullYear() + years);
      const iso = (d) => d.toISOString().slice(0, 10);
      const reference = 'FP-' + Date.now().toString().slice(-8);
      items.forEach((d) => {
        if (s.domains.some((x) => x.name === d.domain)) return;
        s.domains.push({ name: d.domain, status: 'active', registered: iso(today), expires: iso(exp), autoRenew: true, locked: true, primary: !s.domains.length });
        s.dns[d.domain] = s.plan ? C.MAIL_DNS_TEMPLATE.map((t) => ({ id: uid(), ttl: 3600, ...t })) : [];
        workspace.log(s, 'globe', 'Domaine ' + d.domain + ' enregistré');
      });
      const names = items.map((d) => d.domain).join(', ');
      s.invoices.unshift({ id: 'FW-' + today.getFullYear() + '-' + reference.slice(-4), date: iso(today), label: (items.length > 1 ? 'Domaines ' : 'Domaine ') + names + ' (' + years + (years > 1 ? ' ans' : ' an') + ')', amount, method: pm.type === 'card' ? pm.brand + ' •••• ' + pm.last4 : (pm.type === 'moncash' ? 'MonCash' : 'NatCash'), status: 'paid' });
      workspace.save(s);
      return { status: 'succeeded', reference, amount };
    },
    /** Ajoute un domaine existant et prépare sa zone DNS (enregistrements email inclus). */
    async connect(domain, mode = 'nameservers') {
      if (!C.DEMO_MODE) { const r = await request('/domains/connect', { method: 'POST', body: { domain, mode } }); await workspace.load(); return r; }
      await wait(600);
      const s = workspace.get();
      const existing = s.domains.find((d) => d.name === domain);
      if (existing && existing.status !== 'pending') throw new Error('Ce domaine est déjà dans votre espace.');
      if (existing) existing.dnsMode = mode;
      else s.domains.push({ name: domain, status: 'pending', external: true, dnsMode: mode, registered: new Date().toISOString().slice(0, 10), expires: '', autoRenew: false, locked: false, primary: !s.domains.length });
      const list = s.dns[domain] || (s.dns[domain] = []);
      C.MAIL_DNS_TEMPLATE.forEach((t) => { if (!list.some((r) => r.type === t.type && r.name === t.name && r.value === t.value)) list.push({ id: uid(), ttl: 3600, ...t }); });
      if (!existing) workspace.log(s, 'link-2', 'Domaine existant ' + domain + ' ajouté');
      workspace.save(s);
      return { domain, mode };
    },
    /** Change la méthode de connexion d'un domaine en attente. */
    setMode(domain, mode) {
      const s = workspace.get();
      const d = s.domains.find((x) => x.name === domain);
      if (d) { d.dnsMode = mode; workspace.save(s); }
    },
    /** Verrouillage et rappels de renouvellement d'un domaine (PATCH /domains/:d). */
    async update(name, patch) {
      if (!C.DEMO_MODE) { const r = await request('/domains/' + name, { method: 'PATCH', body: patch }); await workspace.load(); return r; }
      const s = workspace.get();
      const d = s.domains.find((x) => x.name === name);
      Object.assign(d, patch);
      workspace.save(s);
      return d;
    },
    /** Code de transfert (EPP) : en production NameSilo l'envoie au support Freda, qui le transmet au client. */
    async requestTransferCode(name) {
      if (!C.DEMO_MODE) return request('/domains/' + name + '/auth-code', { method: 'POST' });
      await wait(600);
      return { ok: true, demo: true };
    },
    /** Renouvellement : paiement Pay'm puis renewDomain côté serveur. */
    async renew(name, years = 1) {
      if (!C.DEMO_MODE) return payments.settle(await request('/checkout', { method: 'POST', idempotencyKey: newKey(), body: { kind: 'renewal', domain: name, years, ...preferredPayment() } }));
      await wait(1200);
      const s = workspace.get();
      const d = s.domains.find((x) => x.name === name);
      const exp = new Date(d.expires || Date.now()); exp.setFullYear(exp.getFullYear() + years);
      d.expires = exp.toISOString().slice(0, 10);
      const tld = C.TLDS.find((t) => name.endsWith(t.tld));
      const amount = +((tld ? tld.renew : 14.99) * years).toFixed(2);
      s.invoices.unshift({ id: 'FW-' + new Date().getFullYear() + '-' + String(s.invoices.length + 100).slice(-4), date: new Date().toISOString().slice(0, 10), label: 'Renouvellement ' + name + ' (' + years + (years > 1 ? ' ans' : ' an') + ')', amount, method: 'MonCash', status: 'paid' });
      workspace.log(s, 'refresh-cw', 'Domaine ' + name + ' renouvelé');
      workspace.save(s);
      return { status: 'succeeded', amount, reference: 'FP-' + Date.now().toString().slice(-8) };
    },
    /** Vérifie que le domaine pointe bien vers Freda (simulé en mode démo). */
    async verify(domain) {
      if (!C.DEMO_MODE) { const r = await request('/domains/' + domain + '/verify', { method: 'POST' }); await workspace.load(); return r; }
      await wait(1600);
      const s = workspace.get();
      const d = s.domains.find((x) => x.name === domain);
      if (d) { d.status = 'active'; d.connectedAt = new Date().toISOString().slice(0, 10); }
      workspace.log(s, 'badge-check', 'Domaine ' + domain + ' connecté');
      workspace.save(s);
      return { connected: true };
    },
  };

  /* ---------- Moyens de paiement enregistrés (production : MonCash / NatCash par numéro ; cartes pas encore disponibles) ---------- */
  const methods = {
    async add(body) { const r = await request('/payment-methods', { method: 'POST', body }); await workspace.load(); return r; },
    async setDefault(id) { const r = await request('/payment-methods/' + id, { method: 'PATCH' }); await workspace.load(); return r; },
    async remove(id) { const r = await request('/payment-methods/' + id, { method: 'DELETE' }); await workspace.load(); return r; },
  };

  /**
   * Moyen de paiement par défaut du client : une carte enregistrée est débitée directement (Stripe) ; sinon MonCash / NatCash (Pay'm, avec page de paiement).
   * Le serveur revérifie que le moyen appartient bien au compte ; le navigateur n'envoie jamais de montant.
   */
  function preferredPayment() {
    const list = (workspace.get().paymentMethods || []);
    const d = list.find((m) => m.default) || list[0];
    return d && d.type === 'card' ? { method: 'card', methodId: d.id } : { method: 'all' };
  }

  /** Changement d'offre en production : nouvelle commande « subscription » (carte enregistrée si elle existe, sinon Pay'm). */
  const plans = {
    async change({ plan, cycle }) { return payments.settle(await request('/checkout', { method: 'POST', idempotencyKey: newKey(), body: { kind: 'subscription', plan, cycle, ...preferredPayment() } })); },
    /** Résiliation : plus de prélèvement, boîtes utilisables jusqu'à la fin de la période payée ; reprise possible avant la fin. */
    async cancel() { if (C.DEMO_MODE) return { cancelAtPeriodEnd: true }; const r = await request('/subscription/cancel', { method: 'POST' }); await workspace.load().catch(() => {}); return r; },
    async resume() { if (C.DEMO_MODE) return { cancelAtPeriodEnd: false }; const r = await request('/subscription/resume', { method: 'POST' }); await workspace.load().catch(() => {}); return r; },
  };

  /* ---------- DNS ---------- */
  const dns = {
    async list(domain) {
      if (!C.DEMO_MODE) return request('/domains/' + domain + '/dns');
      await wait(250);
      return workspace.get().dns[domain] || [];
    },
    async save(domain, record) {
      if (!C.DEMO_MODE) { const r = await request('/domains/' + domain + '/dns' + (record.id ? '/' + record.id : ''), { method: record.id ? 'PATCH' : 'POST', body: record }); await workspace.load(); return r; }
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
      if (!C.DEMO_MODE) { const r = await request('/domains/' + domain + '/dns/' + id, { method: 'DELETE' }); await workspace.load(); return r; }
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
      if (!C.DEMO_MODE) { const r = await request('/domains/' + domain + '/dns/autofix', { method: 'POST' }); await workspace.load(); return r; }
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
    async create({ local, domain, name, password }) {
      if (!C.DEMO_MODE) { const r = await request('/mailboxes', { method: 'POST', body: { local, domain, name, password } }); await workspace.load(); return { ...r.mailbox, initialPassword: r.initialPassword, providerReady: r.providerReady }; }
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
    /** Le titulaire du compte change le mot de passe d'une boîte (l'utilisateur de l'application se reconnecte avec le nouveau). */
    async setPassword(id, password) { if (!C.DEMO_MODE) await request('/mailboxes/' + id + '/password', { method: 'POST', body: { password } }); },
    async remove(id) {
      if (!C.DEMO_MODE) { await request('/mailboxes/' + id, { method: 'DELETE' }); await workspace.load(); return; }
      await wait(500);
      const s = workspace.get();
      const box = s.mailboxes.find((m) => m.id === id);
      s.mailboxes = s.mailboxes.filter((m) => m.id !== id);
      workspace.log(s, 'trash-2', 'Boîte ' + box.address + ' supprimée');
      workspace.save(s);
    },
    async addAlias(from, to) {
      if (!C.DEMO_MODE) { await request('/aliases', { method: 'POST', body: { from, to } }); await workspace.load(); return; }
      await wait(500);
      const s = workspace.get();
      if (s.aliases.some((a) => a.from === from) || s.mailboxes.some((m) => m.address === from)) throw new Error('Cette adresse est déjà utilisée.');
      s.aliases.push({ id: uid(), from, to });
      workspace.save(s);
    },
    async removeAlias(id) {
      if (!C.DEMO_MODE) { await request('/aliases/' + id, { method: 'DELETE' }); await workspace.load(); return; }
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

  /* ---------- Évènements de parcours (mesure d'audience, voir monitor.js) ---------- */
  const trackAfter = (obj, name, evt, props) => {
    const fn = obj[name];
    obj[name] = async function (...args) {
      const res = await fn.apply(this, args);
      try { if (window.FW && window.FW.track) window.FW.track(evt, props ? props(args, res) : undefined); } catch (e) { /* ignore */ }
      return res;
    };
  };
  trackAfter(auth, 'signup', 'signup');
  trackAfter(auth, 'login', 'login');
  trackAfter(payments, 'checkout', 'purchase', (a) => ({ kind: a[0].kind, method: a[0].method }));
  trackAfter(domains, 'buy', 'purchase', () => ({ kind: 'domain', source: 'dashboard' }));
  trackAfter(domains, 'connect', 'domain_connect', (a) => ({ mode: a[1] }));
  trackAfter(domains, 'verify', 'domain_verified');

  window.FW = Object.assign(window.FW || {}, { config: C, store, money, date, planPrice, normalizeDomain, searchDomains: async (q) => { const r = await searchDomains(q); try { window.FW.track && window.FW.track('domain_search', { tld: (r.exact && r.exact.tld) || '' }); } catch (e) { /* ignore */ } return r; }, cart, auth, payments, workspace, domains, methods, plans, dns, mailboxes, generatePassword, wait });
})();
