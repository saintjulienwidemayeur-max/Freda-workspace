/**
 * Page d'accueil : recherche de domaine, aperçu de l'adresse,
 * cartes de tarifs (mensuel / annuel) et QR code de l'application.
 */
(function () {
  const C = FW.config;
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- Marques de paiement ---------- */
  $('#pay-marks').innerHTML = ['visa', 'mastercard', 'amex', 'moncash', 'natcash'].map((t) => FWUI.payMark(t)).join('');
  document.querySelectorAll('[data-brand]').forEach((el) => { el.outerHTML = FWUI.BRAND[el.dataset.brand].replace('width="20" height="20"', 'width="16" height="16"'); });

  /* ---------- Recherche de domaine ---------- */
  function goSearch(value, errorEl, input) {
    const n = FW.normalizeDomain(value);
    if (n.error) {
      if (errorEl) { errorEl.textContent = n.error; errorEl.classList.add('show'); }
      input.focus();
      return;
    }
    window.location.href = 'domaines?q=' + encodeURIComponent(n.label + (n.tld || ''));
  }

  const heroInput = $('#hero-domain');
  const heroError = $('#hero-error');
  const preview = $('#hero-preview');

  /* Aperçu en direct : contact@<domaine> */
  heroInput.addEventListener('input', () => {
    heroError.classList.remove('show');
    const n = FW.normalizeDomain(heroInput.value);
    const domain = n.error ? 'votreentreprise.com' : n.label + (n.tld || '.com');
    preview.textContent = domain;
  });

  FWUI.attachSuggest(heroInput, { onPick: (d) => goSearch(d, heroError, heroInput) });
  $('#hero-search').addEventListener('submit', (e) => { e.preventDefault(); goSearch(heroInput.value, heroError, heroInput); });
  $('#cta-search').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#cta-domain'); goSearch(i.value, null, i); });

  document.querySelectorAll('.hero-example').forEach((b) => b.addEventListener('click', () => {
    heroInput.value = b.textContent.trim();
    heroInput.dispatchEvent(new Event('input'));
    heroInput.focus();
  }));

  /* ---------- Tarifs ---------- */
  let cycle = 'monthly';
  function renderPricing() {
    const wrap = $('#pricing-cards');
    wrap.innerHTML = Object.values(C.PLANS).map((p) => {
      const price = FW.planPrice(p.id, cycle);
      const per = cycle === 'yearly' ? '/an' : '/mois';
      const sub = cycle === 'yearly'
        ? `soit ${FW.money(price / 12)}/mois · économie de ${FW.money(p.monthly * 12 - price)}`
        : `ou ${FW.money(FW.planPrice(p.id, 'yearly'))}/an avec 2 mois offerts`;
      const hi = p.popular;
      return `
        <article class="relative rounded-[22px] p-7 sm:p-8 flex flex-col ${hi ? 'bg-midnight text-white shadow-2xl' : 'bg-white border border-line'}">
          ${hi ? '<span class="absolute -top-3 left-8 badge" style="background:#10B981;color:#fff">Le plus choisi</span>' : ''}
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold ${hi ? '!text-white' : ''}">${p.name}</h3>
            <span class="w-10 h-10 rounded-xl grid place-items-center ${hi ? 'bg-white/10 text-sky' : 'bg-mist text-freda'}"><i data-lucide="${hi ? 'building-2' : p.id === 'enterprise' ? 'landmark' : 'user'}"></i></span>
          </div>
          <p class="mt-2 text-sm ${hi ? 'text-slate-300' : 'text-slate-600'}">${p.tagline}</p>
          <p class="mt-6 flex items-baseline gap-1">
            <span class="font-display text-5xl font-extrabold tabular ${hi ? 'text-white' : 'text-ink'}">${FW.money(price)}</span>
            <span class="${hi ? 'text-slate-300' : 'text-slate-500'}">${per}</span>
          </p>
          <p class="mt-1 text-xs ${hi ? 'text-slate-400' : 'text-slate-500'} tabular">${sub}</p>
          <ul class="mt-7 space-y-3 text-[15px] flex-1">
            ${p.features.map((f) => `<li class="flex gap-3"><i data-lucide="check" class="w-5 h-5 shrink-0 ${hi ? 'text-cta' : 'text-cta'}"></i><span>${f}</span></li>`).join('')}
          </ul>
          ${p.extras && p.extras.length ? `<div class="mt-6 pt-5 border-t ${hi ? 'border-white/15' : 'border-line'}"><p class="text-xs font-semibold uppercase tracking-wider ${hi ? 'text-slate-400' : 'text-slate-500'}">Options</p><ul class="mt-2 space-y-1.5 text-sm ${hi ? 'text-slate-300' : 'text-slate-600'}">${p.extras.map((x) => `<li class="flex gap-2"><i data-lucide="plus-circle" class="w-4 h-4 shrink-0 mt-0.5 ${hi ? 'text-sky' : 'text-freda'}"></i><span>${x}</span></li>`).join('')}</ul></div>` : ''}
          <a href="configurer-email?plan=${p.id}&cycle=${cycle}" class="mt-8 btn ${hi ? 'btn-cta' : 'btn-outline'} w-full btn-lg">Choisir ${p.name}<i data-lucide="arrow-right"></i></a>
        </article>`;
    }).join('');
    FWUI.icons();
  }
  document.querySelectorAll('[data-cycle]').forEach((b) => b.addEventListener('click', () => {
    cycle = b.dataset.cycle;
    document.querySelectorAll('[data-cycle]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    renderPricing();
  }));
  renderPricing();
  document.addEventListener('fw:plans', renderPricing);      // prix du serveur arrivés après l'affichage

  /* ---------- Application mobile ---------- */
  $('#appstore-link').href = C.APP_STORE_URL;
  $('#playstore-link').href = C.PLAY_STORE_URL;
  // Tant que les liens sont les pages d'accueil génériques des stores (app pas encore publiée), on ne promet pas de téléchargement.
  const genericStore = (u) => !u || /^https:\/\/(apps\.apple\.com|play\.google\.com)\/(store\/)?$/.test(u);
  if (!C.DEMO_MODE && (genericStore(C.APP_STORE_URL) || genericStore(C.PLAY_STORE_URL))) { const sec = $('#appstore-link').closest('section'); if (sec) sec.hidden = true; }
  function drawQR(el, cell) {
    if (!window.qrcode || !el) return;
    const qr = qrcode(0, 'M');
    qr.addData(C.APP_DOWNLOAD_URL);
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: cell, margin: 0, scalable: true });
    const svg = el.querySelector('svg');
    svg.querySelectorAll('path, rect').forEach((p) => { if (p.getAttribute('fill') === '#000000' || p.getAttribute('fill') === 'black') p.setAttribute('fill', '#071653'); });
  }
  // qrcode.js (≈20 Ko) n'est chargé que lorsqu'un QR code approche de l'écran.
  let qrLib;
  function loadQR() {
    if (window.qrcode) return Promise.resolve();
    if (!qrLib) qrLib = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = (document.body.dataset.base || '') + 'assets/js/vendor/qrcode.js';
      s.onload = resolve; s.onerror = () => { qrLib = null; reject(new Error('qrcode')); };
      document.head.appendChild(s);
    });
    return qrLib;
  }
  [['#qr-code', 4], ['#qr-code-lg', 6]].forEach(([sel, cell]) => {
    const el = $(sel);
    if (!el) return;
    const draw = () => loadQR().then(() => drawQR(el, cell)).catch(() => {});
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); draw(); } }, { rootMargin: '200px' });
      io.observe(el);
    } else draw();
  });
})();
