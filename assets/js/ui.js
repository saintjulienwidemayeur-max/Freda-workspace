/**
 * Freda Workspace — composants d'interface partagés
 * (en-tête, pied de page, notifications, modales, copie, icônes).
 * Les icônes viennent de Lucide : <i data-lucide="nom"></i>.
 */
(function () {
  const C = window.FW_CONFIG;
  /* Chemin relatif vers la racine du site ("" ou "../"), défini sur <body data-base>. */
  const BASE = document.body.dataset.base || '';

  const icons = () => window.lucide && window.lucide.createIcons();

  /* Logos de connexion tierce (marques officielles des boutons « Se connecter avec »). */
  const BRAND = {
    google: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
    apple: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16.37 1.43c0 1.14-.5 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.29-1.82-2.32-4.63-2.32-7.28 0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45z"/></svg>',
  };

  /* Marques des moyens de paiement. */
  function payMark(type, size = 'md') {
    const s = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
    /* Vrais logos : déposez assets/img/pay/moncash.png et natcash.png (fond transparent conseillé).
       Tant que le fichier est absent, le texte de secours s'affiche. */
    if (type === 'moncash' || type === 'natcash') {
      const name = type === 'moncash' ? 'MonCash' : 'NatCash';
      const h = size === 'sm' ? 'h-5' : 'h-7';
      const fb = type === 'moncash' ? 'background:#FDECEC;color:#B4121B' : 'background:#FFF1E2;color:#B45309';
      return `<img src="${BASE}assets/img/pay/${type}.png" alt="${name}" class="${h} w-auto object-contain" data-fallback="${name}" data-fallback-style="${fb}" data-fallback-class="${s}">`;
    }
    /* Visa, Mastercard et American Express : logos vectoriels dans assets/img/pay/ */
    const cards = { visa: ['Visa', 'h-4', 'h-3'], mastercard: ['Mastercard', 'h-6', 'h-5'], amex: ['American Express', 'h-6', 'h-5'] };
    if (cards[type]) {
      const [name, hMd, hSm] = cards[type];
      return `<span class="inline-flex items-center justify-center rounded-md bg-white border border-slate-200 ${size === 'sm' ? 'px-1.5 py-1' : 'px-2.5 py-1.5'}"><img src="${BASE}assets/img/pay/${type}.svg" alt="${name}" class="${size === 'sm' ? hSm : hMd} w-auto"></span>`;
    }
    return '';
  }

  /* Logo absent : affiche le nom en texte (compatible CSP, sans gestionnaire inline). */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.dataset.fallback) return;
    const span = document.createElement('span');
    span.className = 'inline-flex items-center rounded-md font-extrabold tracking-tight ' + (img.dataset.fallbackClass || '');
    span.style.cssText = img.dataset.fallbackStyle || '';
    span.textContent = img.dataset.fallback;
    img.replaceWith(span);
  }, true);

  /* ---------- En-tête du site public ---------- */
  function renderHeader(active = '') {
    const el = document.getElementById('site-header');
    if (!el) return;
    const home = BASE + 'index.html';
    const links = [
      { href: home + '#produits', label: 'Produits', id: 'produits' },
      { href: home + '#tarifs', label: 'Tarifs', id: 'tarifs' },
      { href: home + '#app', label: 'App Mobile', id: 'app' },
      { href: BASE + 'support.html', label: 'Support', id: 'support' },
    ];
    const session = FW.auth.current();
    el.className = 'sticky z-40 bg-white/85 backdrop-blur border-b border-line';
    el.style.top = 'env(safe-area-inset-top, 0px)';
    el.innerHTML = `
      <div class="gutter">
        <nav class="max-w-site mx-auto h-16 flex items-center justify-between gap-4" aria-label="Navigation principale">
          <a href="${home}" class="flex items-center shrink-0 focus-ring rounded-md" aria-label="Freda Workspace, accueil">
            <img src="${BASE}assets/img/logo-horizontal.svg" alt="Freda Workspace" class="h-10 w-auto">
          </a>
          <ul class="hidden lg:flex items-center gap-1">
            ${links.map((l) => `<li><a href="${l.href}" class="px-3 py-2 rounded-lg text-[15px] font-medium ${active === l.id ? 'text-freda' : 'text-slate-600 hover:text-freda'} transition-colors">${l.label}</a></li>`).join('')}
          </ul>
          <div class="hidden lg:flex items-center gap-2">
            ${session
              ? `<a href="${BASE}espace/index.html" class="btn btn-ghost btn-sm"><i data-lucide="layout-dashboard"></i>Mon espace</a>`
              : `<a href="${BASE}inscription.html" class="btn btn-ghost btn-sm">Créer un compte</a>`}
            ${C.WEBMAIL_URL ? `<a href="${BASE}connexion.html?mode=webmail" class="btn btn-navy btn-sm"><i data-lucide="mail"></i>Connexion Webmail</a>` : `<a href="${BASE}connexion.html" class="btn btn-navy btn-sm"><i data-lucide="log-in"></i>Connexion</a>`}
          </div>
          <div class="lg:hidden">
            <button type="button" id="menu-toggle" class="btn btn-ghost btn-icon" aria-expanded="false" aria-controls="mobile-menu" aria-label="Ouvrir le menu">
              <i data-lucide="menu"></i>
            </button>
          </div>
        </nav>
      </div>
      <div id="mobile-menu" class="lg:hidden border-t border-line bg-white gutter" hidden>
        <ul class="max-w-site mx-auto py-3 flex flex-col">
          ${links.map((l) => `<li><a href="${l.href}" class="flex items-center justify-between py-3 text-base font-medium text-ink border-b border-line/70">${l.label}<i data-lucide="chevron-right" class="w-4 h-4 text-muted"></i></a></li>`).join('')}
          <li class="pt-4 grid gap-2">
            ${C.WEBMAIL_URL ? `<a href="${BASE}connexion.html?mode=webmail" class="btn btn-navy w-full"><i data-lucide="mail"></i>Connexion Webmail</a>` : ""}
            <a href="${session ? BASE + 'espace/index.html' : BASE + 'connexion.html'}" class="btn btn-outline w-full"><i data-lucide="${session ? 'layout-dashboard' : 'log-in'}"></i>${session ? 'Mon espace' : 'Espace client'}</a>
          </li>
        </ul>
      </div>`;
    const btn = el.querySelector('#menu-toggle');
    const menu = el.querySelector('#mobile-menu');
    btn.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.innerHTML = `<i data-lucide="${open ? 'x' : 'menu'}"></i>`;
      icons();
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }));
  }

  /* ---------- Pied de page ---------- */
  function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    const year = new Date().getFullYear();
    const col = (title, items) => `
      <div>
        <h3 class="text-white text-sm font-semibold mb-4">${title}</h3>
        <ul class="space-y-2.5 text-sm">${items.map(([href, label]) => `<li><a href="${href}" class="text-slate-300 hover:text-white transition-colors">${label}</a></li>`).join('')}</ul>
      </div>`;
    el.className = 'bg-midnight text-slate-300';
    el.innerHTML = `
      <div class="gutter">
        <div class="max-w-site mx-auto py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div class="max-w-sm">
            <img src="${BASE}assets/img/logo-horizontal-blanc.svg" alt="Freda Workspace" class="h-10 w-auto">
            <p class="mt-4 text-sm leading-relaxed text-slate-400">Freda Workspace, une marque de Freda Pay LLC : Freda Connect (noms de domaine) et Freda Mail (email professionnel), payables par carte, MonCash ou NatCash.</p>
            <div class="mt-5 flex gap-2">
              ${[['facebook', 'Facebook'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn'], ['youtube', 'YouTube']].map(([i, n]) =>
                `<a href="#" aria-label="${n}" class="w-9 h-9 rounded-lg grid place-items-center bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"><i data-lucide="${i}" class="w-4 h-4"></i></a>`).join('')}
            </div>
          </div>
          ${col('Produits', [[BASE + 'freda-connect.html', 'Freda Connect · Domaine et DNS'], [BASE + 'freda-mail.html', 'Freda Mail · Email professionnel'], [BASE + 'index.html#app', 'Application mobile'], [BASE + 'index.html#tarifs', 'Tarifs']])}
          ${col('Guides', [[BASE + 'qui-sommes-nous.html', 'Qui sommes-nous'], [BASE + 'enregistrer-nom-de-domaine.html', 'Enregistrer un nom de domaine'], [BASE + 'email-pro-gratuit.html', 'Email pro gratuit'], [BASE + 'nom-de-domaine-haiti.html', 'Nom de domaine Haïti'], [BASE + 'acheter-domaine-moncash.html', 'Payer avec MonCash ou NatCash'], [BASE + 'ht/imel-pwofesyonel-gratis.html', 'Kreyòl : imèl pwofesyonèl gratis'], [BASE + 'en/free-business-email-haiti.html', 'English : free business email'], [BASE + 'ht/kiyes-nou-ye.html', 'Kreyòl : kiyès nou ye']])}
          ${col('Assistance', [[BASE + 'support.html', 'Centre d’aide'], [BASE + 'support.html#contact', 'Contacter le support'], [BASE + 'support.html#statut', 'État des services']].concat(C.WEBMAIL_URL ? [[BASE + 'connexion.html?mode=webmail', 'Webmail']] : []))}
          ${col('Légal', [[BASE + 'legal.html#cgu', 'Conditions d’utilisation'], [BASE + 'legal.html#paiements', 'Paiements et frais'], [BASE + 'legal.html#confidentialite', 'Confidentialité'], [BASE + 'legal.html#remboursement', 'Remboursement'], [BASE + 'legal.html#cookies', 'Cookies'], [BASE + 'legal.html#propriete', 'Propriété intellectuelle'], [BASE + 'presse.html', 'Presse'], [BASE + 'legal.html#reglementaire', 'Informations réglementaires'], [BASE + 'legal.html#conformite', 'Conformité et sécurité']])}
        </div>
        <div class="max-w-site mx-auto py-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-400" style="padding-bottom:calc(1.5rem + env(safe-area-inset-bottom,0px))">
          <p>© ${year} Freda Pay LLC. Tous droits réservés. Freda Workspace est une marque de Freda Pay LLC.</p>
          <p class="flex items-center gap-2"><i data-lucide="shield-check" class="w-4 h-4 text-cta"></i>Propulsé par <span class="text-white font-semibold">Freda Pay LLC</span> · Freda Group</p>
        </div>
      </div>`;
  }

  /* ---------- Notifications ---------- */
  /**
   * Notification : carte blanche avec pastille d'icône, titre facultatif,
   * barre de progression et fermeture. opts = { title, icon }.
   * Deux notifications au maximum à l'écran.
   */
  function toast(message, type = 'success', opts = {}) {
    let wrap = document.getElementById('fw-toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'fw-toasts'; wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    while (wrap.children.length >= 2) wrap.firstElementChild.remove();
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const icon = opts.icon || { success: 'circle-check', error: 'circle-alert', info: 'info' }[type] || 'info';
    t.innerHTML = `<span class="t-ico"><i data-lucide="${icon}"></i></span>
      <div class="t-body">${opts.title ? `<p class="t-title">${opts.title}</p><p class="t-msg">${message}</p>` : `<p class="t-title t-solo">${message}</p>`}</div>
      <button type="button" class="t-close" aria-label="Fermer"><i data-lucide="x"></i></button>
      <span class="t-bar"></span>`;
    wrap.appendChild(t);
    icons();
    let gone = false;
    const close = () => { if (gone) return; gone = true; t.classList.add('out'); setTimeout(() => t.remove(), 250); };
    t.querySelector('.t-close').addEventListener('click', close);
    setTimeout(close, 3800);
  }

  /* ---------- Modales : <div class="modal" id="x" hidden> ---------- */
  let lastFocus = null;
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    const f = m.querySelector('input:not([type=hidden]), select, textarea, button:not([data-close])');
    setTimeout(() => f && f.focus(), 50);
    icons();
  }
  function closeModal(id) {
    const m = typeof id === 'string' ? document.getElementById(id) : id;
    if (!m) return;
    m.hidden = true;
    if (!document.querySelector('.modal:not([hidden])')) document.body.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  document.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-close]');
    if (closer) closeModal(closer.closest('.modal'));
    const opener = e.target.closest('[data-open]');
    if (opener) openModal(opener.dataset.open);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { const m = [...document.querySelectorAll('.modal:not([hidden])')].pop(); if (m) closeModal(m); }
  });

  /** Fenêtre de confirmation intégrée (remplace window.confirm). */
  function confirmDialog({ title, message, confirmLabel = 'Confirmer', danger = false }) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'modal';
      wrap.innerHTML = `
        <div class="modal-backdrop" data-cancel></div>
        <div class="modal-panel p-6" role="alertdialog" aria-modal="true" aria-labelledby="cf-title">
          <div class="flex gap-4">
            <div class="w-11 h-11 rounded-full grid place-items-center shrink-0 ${danger ? 'bg-red-50 text-red-600' : 'bg-mist text-freda'}"><i data-lucide="${danger ? 'triangle-alert' : 'circle-help'}"></i></div>
            <div><h2 id="cf-title" class="text-lg font-bold">${title}</h2><p class="mt-1.5 text-sm text-muted leading-relaxed">${message}</p></div>
          </div>
          <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" class="btn btn-outline" data-cancel>Annuler</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${confirmLabel}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      icons();
      wrap.querySelector('[data-ok]').focus();
      const done = (v) => { wrap.remove(); resolve(v); };
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('[data-ok]')) done(true);
        else if (e.target.closest('[data-cancel]')) done(false);
      });
    });
  }


  /**
   * Choix du moyen de paiement avant TOUT achat (domaine, offre, renouvellement) : le client choisit toujours, le solde n'est jamais imposé.
   * Retourne { method, methodId? } ('balance' | 'card' | 'moncash' | 'natcash') ou null s'il annule. Les frais sont affichés ; le serveur les recalcule.
   */
  async function choosePayment({ amount, title = 'Choisir le moyen de paiement' }) {
    let bal = 0, saved = [];
    try { const b = await FW.balance.get(); bal = (b && b.balance) || 0; } catch (_) {}
    try { saved = ((FW.workspace.get() || {}).paymentMethods || []).filter((m) => m.type === 'card'); } catch (_) {}
    const usd = (n) => FW.money(n);
    const cardFee = Math.round(amount * 3.5 + 40) / 100, mobFee = Math.round(amount * 6) / 100;
    const opts = [];
    saved.forEach((m) => opts.push({ k: 'card:' + m.id, method: 'card', methodId: m.id, icon: 'credit-card', mark: payMark(String(m.brand || '').toLowerCase(), 'sm'), label: (m.brand || 'Carte') + ' •••• ' + m.last4, sub: 'Carte enregistrée · frais ' + usd(cardFee) + ' (3,5 % + 0,40 $) · total ' + usd(amount + cardFee) }));
    opts.push({ k: 'card', method: 'card', icon: 'credit-card', mark: payMark('visa', 'sm') + payMark('mastercard', 'sm'), label: 'Carte bancaire', sub: 'Frais ' + usd(cardFee) + ' (3,5 % + 0,40 $) · total ' + usd(amount + cardFee) });
    opts.push({ k: 'moncash', method: 'moncash', icon: 'smartphone', mark: payMark('moncash'), label: 'MonCash', sub: 'Frais ' + usd(mobFee) + ' (6 %) · total ' + usd(amount + mobFee) + ' ≈ ' + FW.money((amount + mobFee) * FW.config.HTG_RATE, 'HTG') });
    opts.push({ k: 'natcash', method: 'natcash', icon: 'smartphone', mark: payMark('natcash'), label: 'NatCash', sub: 'Frais ' + usd(mobFee) + ' (6 %) · total ' + usd(amount + mobFee) + ' ≈ ' + FW.money((amount + mobFee) * FW.config.HTG_RATE, 'HTG') });
    if (bal >= amount && amount > 0) opts.push({ k: 'balance', method: 'balance', icon: 'wallet', label: 'Solde Freda Workspace (' + usd(bal) + ')', sub: 'Sans frais · total ' + usd(amount) });
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'modal';
      wrap.innerHTML = `
        <div class="modal-backdrop" data-cancel></div>
        <div class="modal-panel p-6" role="dialog" aria-modal="true" aria-labelledby="cp-title">
          <h2 id="cp-title" class="text-lg font-bold">${esc(title)}</h2>
          <p class="mt-1 text-sm text-muted">Montant : <strong class="text-ink">${usd(amount)}</strong>. Les frais de traitement du moyen choisi s’ajoutent.</p>
          <div class="mt-4" style="display:grid;gap:8px">${opts.map((o, i) => `<label class="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 cursor-pointer has-[:checked]:border-freda has-[:checked]:bg-mist"><input type="radio" name="cp-m" value="${i}" ${i === 0 ? 'checked' : ''}><span style="display:inline-flex;gap:4px;align-items:center;min-width:56px;justify-content:center">${o.mark || `<i data-lucide="${o.icon}"></i>`}</span><span style="min-width:0"><span class="font-semibold text-ink block">${esc(o.label)}</span><span class="text-xs text-muted">${esc(o.sub)}</span></span></label>`).join('')}</div>
          <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" class="btn btn-outline" data-cancel>Annuler</button>
            <button type="button" class="btn btn-cta" data-ok>Continuer</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      icons();
      const done = (v) => { wrap.remove(); resolve(v); };
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('[data-ok]')) { const o = opts[Number((wrap.querySelector('input[name="cp-m"]:checked') || {}).value || 0)]; done(o.methodId ? { method: o.method, methodId: o.methodId } : { method: o.method }); }
        else if (e.target.closest('[data-cancel]')) done(null);
      });
    });
  }

  /* ---------- Copier dans le presse-papiers ---------- */
  async function copy(text, label = 'Copié') {
    try { await navigator.clipboard.writeText(text); toast(label + ' dans le presse-papiers'); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
      ta.remove();
      toast(ok ? label + ' dans le presse-papiers' : 'Copie impossible : sélectionnez le texte manuellement.', ok ? 'success' : 'error');
    }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (b) copy(b.dataset.copy, b.dataset.copyLabel || 'Copié');
  });

  /* ---------- Bouton en cours de chargement ---------- */
  function setLoading(btn, loading, text) {
    if (loading) {
      btn.dataset.html = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span>${text || 'Veuillez patienter...'}`;
    } else {
      btn.disabled = false;
      if (btn.dataset.html) btn.innerHTML = btn.dataset.html;
      icons();
    }
  }

  /* Échappement HTML pour toute donnée saisie par l'utilisateur. */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Bascule d'affichage du mot de passe : <button data-toggle-password="idDuChamp"> */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-toggle-password]');
    if (!b) return;
    const input = document.getElementById(b.dataset.togglePassword);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    b.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}" class="w-[18px] h-[18px]"></i>`;
    icons();
  });


  /* ---------- Suggestions pendant la saisie d'un domaine ----------
     attachSuggest(input, { onPick(domaine) }) affiche, sous le champ, des extensions
     avec leur prix et des variantes du nom (accessible au clavier). */
  function attachSuggest(input, opts = {}) {
    const C = window.FW_CONFIG;
    const host = input.closest('form') || input.parentElement;
    const box = document.createElement('div');
    box.className = 'absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-2xl border border-line shadow-xl overflow-hidden text-left';
    box.setAttribute('role', 'listbox');
    box.hidden = true;
    const anchor = input.closest('[data-suggest-anchor]') || host;
    anchor.style.position = anchor.style.position || 'relative';
    anchor.appendChild(box);
    let items = [], active = -1;

    const promo = C.DEMO_MODE ? new Set(['.site', '.online']) : new Set();   // pas de « Promo » inventée avec les vrais prix
    let book = null;                                                       // tarifs réels (API) ; null tant qu'ils ne sont pas chargés
    window.FW.domainPrices().then((t) => { book = t; if (document.activeElement === input) render(); }).catch(() => { /* sans tarifs : aucune suggestion plutôt qu'un faux prix */ });
    function build(raw) {
      const n = window.FW.normalizeDomain(raw);
      if (n.error || !book || !book.length) return [];
      const label = n.label;
      const tld = n.tld || n.unknownTld;
      const first = ['.com', '.net', '.org'];   // le .com toujours en tête, puis .net, .org, puis le moins cher
      const rank = (t) => (t === tld ? -2 : first.includes(t) ? first.indexOf(t) - 1 : 3);
      const tlds = book.slice().sort((a, b) => rank(a.tld) - rank(b.tld) || a.price - b.price);
      const list = tlds.slice(0, 5).map((t) => ({ domain: label + t.tld, price: t.price, compare: t.compare, promo: promo.has(t.tld), kind: 'tld' }));
      const base = book.find((t) => t.tld === (n.tld || '.com')) || book.find((t) => t.tld === '.com') || book[0];
      const variants = ['get' + label, 'mon' + label, label + 'pro'].filter((v) => v.length <= 63).map((v) => ({ domain: v + base.tld, price: base.price, compare: base.compare, kind: 'idea' }));
      return [...list, ...variants.slice(0, 2)];
    }
    function render() {
      const q = input.value.trim();
      items = q ? build(q) : [];
      active = -1;
      if (!items.length) { box.hidden = true; return; }
      const row = (it, i) => `<button type="button" role="option" data-i="${i}" class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-mist focus:bg-mist focus:outline-none text-left">
          <span class="w-8 h-8 rounded-lg ${it.kind === 'idea' ? 'bg-amber-50 text-amber-600' : 'bg-mist text-freda'} grid place-items-center shrink-0"><i data-lucide="${it.kind === 'idea' ? 'lightbulb' : 'globe'}" class="w-4 h-4"></i></span>
          <span class="mono text-sm font-semibold text-ink flex-1 min-w-0 truncate">${esc(it.domain)}</span>
          ${it.promo ? '<span class="badge badge-success">Promo</span>' : ''}
          <span class="text-xs text-muted tabular shrink-0">${it.compare > it.price ? `<s class="mr-1">$${it.compare.toFixed(2)}</s>` : ''}dès <strong class="text-ink">$${it.price.toFixed(2)}</strong>/an</span>
        </button>`;
      const ext = items.filter((x) => x.kind === 'tld'), ideas = items.filter((x) => x.kind === 'idea');
      box.innerHTML = `<p class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Extensions populaires</p>`
        + ext.map((it) => row(it, items.indexOf(it))).join('')
        + (ideas.length ? `<p class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-t border-line mt-1">Idées de noms</p>` + ideas.map((it) => row(it, items.indexOf(it))).join('') : '')
        + `<p class="px-4 py-2.5 text-xs text-slate-500 bg-slate-50 border-t border-line flex items-center gap-2"><i data-lucide="mail-check" class="w-3.5 h-3.5 text-cta"></i>Email pro inclus avec chaque offre. Disponibilité vérifiée à l’étape suivante.</p>`;
      box.hidden = false;
      icons();
    }
    function pick(i) {
      const it = items[i];
      if (!it) return;
      input.value = it.domain;
      box.hidden = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.blur(); // ferme le clavier du téléphone
      box.hidden = true;
      opts.onPick && opts.onPick(it.domain);
    }
    function highlight() {
      box.querySelectorAll('[role=option]').forEach((b) => b.classList.toggle('bg-mist', +b.dataset.i === active));
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('blur', () => { box.hidden = true; });
    const form = input.closest('form');
    form && form.addEventListener('submit', () => { box.hidden = true; });
    input.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % items.length; highlight(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % items.length; highlight(); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape') { box.hidden = true; }
    });
    box.addEventListener('mousedown', (e) => e.preventDefault());
    box.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) pick(+b.dataset.i); });
    document.addEventListener('click', (e) => { if (!anchor.contains(e.target)) box.hidden = true; });
    input.setAttribute('aria-autocomplete', 'list');
  }

  /**
   * Offre d'extensions économiques quand le client choisit un .com.
   * el : conteneur ; onChange(cart) est appelé après chaque ajout.
   */
  async function renderUpsell(el, cart, onChange) {
    if (!el) return;
    let list = [];
    try { list = await FW.cart.upsell(cart); } catch (e) { list = []; }
    if (!list.length) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = `<div class="rounded-xl border border-dashed border-freda/40 bg-mist/40 p-4">
      <p class="text-sm font-semibold text-ink flex items-center gap-2"><i data-lucide="shield-check" class="w-4 h-4 text-freda"></i>Protégez votre nom de marque</p>
      <p class="mt-0.5 text-xs text-muted">Réservez aussi ces extensions à petit prix, avant qu’un autre ne le fasse.</p>
      <ul class="mt-3 divide-y divide-line">${list.map((r) => `<li class="py-2.5 flex items-center gap-3">
        <div class="min-w-0 flex-1"><p class="mono text-sm font-semibold text-ink truncate">${esc(r.label)}<span class="text-freda">${esc(r.tld)}</span></p><p class="text-xs text-muted tabular">${FW.money(r.price)}/1re année</p></div>
        <button type="button" class="btn btn-outline btn-sm shrink-0" data-upsell="${esc(r.domain)}"><i data-lucide="shopping-cart"></i>Ajouter</button></li>`).join('')}</ul></div>`;
    icons();
    el.querySelectorAll('[data-upsell]').forEach((b) => b.addEventListener('click', () => {
      const r = list.find((x) => x.domain === b.dataset.upsell);
      confetti(b);
      toast(esc(r.domain), 'success', { title: 'Ajouté au panier', icon: 'shopping-cart' });
      const cur = FW.cart.get();
      onChange(FW.cart.set({ extras: [...(cur.extras || []), r] }));
    }));
  }

  /**
   * Explosion de confettis qui part d'un élément (bouton « Choisir »).
   * Canvas plein écran, sans interaction, supprimé à la fin (~1,6 s).
   */
  function confetti(origin) {
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const r = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cv = document.createElement('canvas');
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
      cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv);
      const ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      const colors = ['#2B64E4', '#4A95F5', '#10B981', '#34D399', '#061137', '#93C5FD'];
      const shapes = ['ellipse', 'square', 'circle', 'sliver'];
      const rand = (a, b) => a + Math.random() * (b - a);
      const parts = Array.from({ length: 80 }, () => {
        const ang = rand(0, Math.PI * 2);
        const sp = rand(3, 13);
        return { x: ox, y: oy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - rand(1, 4), size: rand(4, 10), rot: rand(0, 6.28), vr: rand(-0.3, 0.3), color: colors[(Math.random() * colors.length) | 0], shape: shapes[(Math.random() * shapes.length) | 0], life: rand(55, 95), age: 0 };
      });
      let frame = 0;
      (function tick() {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        let alive = 0;
        parts.forEach((p) => {
          p.age++;
          if (p.age > p.life) return;
          alive++;
          p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.22;
          p.x += p.vx; p.y += p.vy; p.rot += p.vr;
          ctx.save();
          ctx.globalAlpha = Math.min(1, (p.life - p.age) / 25);
          ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
          if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 6.28); ctx.fill(); }
          else if (p.shape === 'square') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          else if (p.shape === 'sliver') ctx.fillRect(-p.size, -1, p.size * 2, 2);
          else { ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size / 2.6, 0, 0, 6.28); ctx.fill(); }
          ctx.restore();
        });
        frame++;
        if (alive && frame < 140) requestAnimationFrame(tick); else cv.remove();
      })();
    } catch (e) { /* animation décorative : on ignore toute erreur */ }
  }

  /**
   * Attente d'un paiement MonCash / NatCash (Freda Pay Issuing) : affiche l'URL de paiement dans la fenêtre « traitement » (si présente)
   * et tente de l'ouvrir dans un nouvel onglet. La page reste ouverte et se met à jour dès que le serveur confirme.
   */
  function showPaymentLink(res) {
    const text = document.getElementById('proc-text');
    const link = res.redirectUrl ? '<a class="btn btn-cta mt-4" target="_blank" rel="noopener noreferrer" href="' + esc(res.redirectUrl) + '">Ouvrir la page de paiement</a>' : '';
    const card = /stripe\.com/.test(res.redirectUrl || '');
    const msg = 'Terminez le paiement sur la page ' + (card ? 'de paiement sécurisée' : 'MonCash / NatCash') + ' qui vient de s’ouvrir, puis <strong>revenez ici</strong> : cette page se met à jour toute seule.';
    if (text) text.innerHTML = msg + '<br>' + link;
    else {                                   // pages sans fenêtre « traitement » : bandeau fixe
      let b = document.getElementById('pay-wait-banner');
      if (!b) { b = document.createElement('div'); b.id = 'pay-wait-banner'; b.className = 'fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-50 card-elevated p-5 text-center'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
      b.innerHTML = '<p class="text-sm text-slate-700">' + msg + '</p>' + link;
    }
    if (res.redirectUrl) { try { window.open(res.redirectUrl, '_blank', 'noopener'); } catch (e) { /* bloqué : le bouton reste disponible */ } }
  }
  function hidePaymentLink() { const b = document.getElementById('pay-wait-banner'); if (b) b.remove(); }
  /* ---------- Paiement intégré (Stripe Embedded Checkout) : le formulaire Stripe s'affiche dans une fenêtre du site ----------
   * Les champs (numéro, date, CVC) sont dans une iframe Stripe : ils ne passent jamais par nos pages ni nos serveurs.
   * La confirmation vient du serveur (webhook + sondage de payments.settle), jamais du navigateur : onComplete ne fait qu'informer. */
  let embedded = null;
  function loadStripeScript(url) {
    return new Promise((resolve, reject) => {
      if (window.Stripe) return resolve();
      if (!/^https:\/\/js\.stripe\.com\//.test(String(url))) return reject(new Error('Module de paiement non autorisé.'));
      const sc = document.createElement('script');
      sc.src = url; sc.async = true;
      sc.onload = () => resolve();
      sc.onerror = () => reject(new Error('Impossible de charger le module de paiement. Vérifiez votre connexion et réessayez.'));
      document.head.appendChild(sc);
    });
  }
  function closeEmbedded() {
    if (!embedded) return;
    const e = embedded; embedded = null;
    try { e.checkout && e.checkout.destroy(); } catch (x) { /* déjà détruit */ }
    document.removeEventListener('keydown', e.onKey);
    e.overlay.remove();
    document.body.style.overflow = e.prevOverflow;
    if (e.lastFocus && e.lastFocus.focus) e.lastFocus.focus();
  }
  function hideResumeBanner() { const b = document.getElementById('pay-resume-banner'); if (b) b.remove(); }
  function showResumeBanner(res) {
    hideResumeBanner();
    const b = document.createElement('div');
    b.id = 'pay-resume-banner'; b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;max-width:440px;margin:0 auto;z-index:9999;background:#fff;border-radius:14px;box-shadow:0 10px 40px rgba(15,23,42,.25);padding:16px;text-align:center';
    b.innerHTML = '<p style="font-size:14px;color:#334155">Votre paiement n’est pas terminé.</p><button type="button" class="btn btn-cta btn-sm" style="margin-top:10px" data-resume>Reprendre le paiement</button>';
    b.addEventListener('click', async (ev) => {
      if (!ev.target.closest('[data-resume]')) return;
      try { const r = await window.FW.payments.resumeEmbedded(res.orderId); hideResumeBanner(); showEmbeddedCheckout({ ...res, embedded: r.embedded }); }
      catch (err) { toast(err.message, 'error'); }
    });
    document.body.appendChild(b);
  }
  async function showEmbeddedCheckout(res) {
    closeEmbedded(); hidePaymentLink(); hideResumeBanner();
    const overlay = document.createElement('div');
    overlay.id = 'fw-embedded-overlay'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Paiement sécurisé');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.6);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px';
    overlay.innerHTML = '<div style="width:min(560px,100%);background:#fff;border-radius:16px;box-shadow:0 30px 70px rgba(15,23,42,.45);padding:16px 16px 12px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin:0 4px 10px"><strong style="font-size:16px;color:#0f172a">Paiement sécurisé</strong>'
      + '<button type="button" data-fw-close aria-label="Fermer le paiement" style="border:0;background:transparent;font-size:26px;line-height:1;cursor:pointer;color:#64748b;padding:2px 8px">×</button></div>'
      + '<div id="fw-embedded-mount" style="min-height:360px"><p style="padding:24px;text-align:center;color:#64748b;font-size:14px">Chargement du paiement sécurisé…</p></div>'
      + '<p id="fw-embedded-status" role="status" style="margin:8px 4px 0;font-size:13px;color:#0f766e;font-weight:600"></p>'
      + '<p style="margin:6px 4px 0;font-size:12px;color:#64748b">Paiement sécurisé. Vos informations bancaires ne passent jamais par nos serveurs.</p></div>';
    const state = { overlay, checkout: null, prevOverflow: document.body.style.overflow, lastFocus: document.activeElement, res };
    const userClose = () => { closeEmbedded(); showResumeBanner(res); };
    state.onKey = (ev) => { if (ev.key === 'Escape') userClose(); };
    overlay.addEventListener('click', (ev) => { if (ev.target.closest('[data-fw-close]')) userClose(); });
    document.addEventListener('keydown', state.onKey);
    document.body.appendChild(overlay); document.body.style.overflow = 'hidden';
    embedded = state;
    const closeBtn = overlay.querySelector('[data-fw-close]'); if (closeBtn) closeBtn.focus();
    try {
      const info = res.embedded;
      await loadStripeScript(info.scriptUrl);
      const stripe = window.Stripe(info.publishableKey);
      const checkout = await stripe.createEmbeddedCheckoutPage({
        fetchClientSecret: async () => info.clientSecret,
        onComplete: () => { const st = document.getElementById('fw-embedded-status'); if (st) st.textContent = 'Paiement reçu. Confirmation en cours…'; },
      });
      if (embedded !== state) { try { checkout.destroy(); } catch (x) { /* fermé entre-temps */ } return; }
      state.checkout = checkout;
      const mount = document.getElementById('fw-embedded-mount'); if (mount) mount.innerHTML = '';
      checkout.mount('#fw-embedded-mount');
    } catch (err) {
      const mount = document.getElementById('fw-embedded-mount');
      if (mount) mount.innerHTML = '<p role="alert" style="padding:20px;color:#b91c1c;font-size:14px"></p>';
      if (mount) mount.firstChild.textContent = err.message || 'Le paiement n’a pas pu s’afficher. Réessayez.';
    }
  }
  if (window.FW && window.FW.payments) {
    window.FW.payments.onPending = showPaymentLink;
    window.FW.payments.onEmbedded = showEmbeddedCheckout;
    window.FW.payments.onSettled = () => { hidePaymentLink(); closeEmbedded(); hideResumeBanner(); };
  }

  /** Case « Confidentialité Whois gratuite » (cochée par défaut) : lit/écrit le choix via get()/set(valeur). */
  function bindWhoisPrivacy(get, set) {
    const el = document.getElementById('whois-privacy');
    if (!el) return;
    el.checked = get() !== false;
    el.addEventListener('change', () => set(el.checked));
  }

  /** Affiche en direct les règles du mot de passe sous un champ : liveRules(input, listEl, () => nomDeLaBoîte). Renvoie une fonction qui rend la liste et dit si le mot de passe est valide. */
  function liveRules(input, list, getLocal) {
    const render = () => {
      const r = window.FW.passwordRules(input.value, getLocal ? getLocal() : '');
      list.innerHTML = r.items.map((x) => `<li class="flex items-center gap-1.5 ${x.ok ? 'text-emerald-700' : 'text-muted'}"><span aria-hidden="true">${x.ok ? '✓' : '○'}</span>${esc(x.text)}</li>`).join('');
      return r.ok;
    };
    input.addEventListener('input', render);
    render();
    return render;
  }

  window.FWUI = { liveRules, bindWhoisPrivacy, showPaymentLink, hidePaymentLink, showEmbeddedCheckout, confetti, renderUpsell, attachSuggest, BASE, BRAND, payMark, renderHeader, renderFooter, toast, openModal, closeModal, confirmDialog, choosePayment, copy, setLoading, esc, icons };

  /* Initialisation automatique */
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader(document.body.dataset.nav || '');
    renderFooter();
    document.querySelectorAll('[data-brand]').forEach((el) => { el.outerHTML = BRAND[el.dataset.brand] || ''; });
    icons();
  });
})();
