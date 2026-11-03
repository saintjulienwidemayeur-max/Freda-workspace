/**
 * Recherche de domaine : disponibilité, alternatives, panier, passage au paiement.
 * URL acceptées : domaines.html?q=maboutique.com (plan et cycle : présélection pour l’étape email, facultative)
 */
(function () {
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const esc = FWUI.esc;
  const params = new URLSearchParams(location.search);

  /* Initialise le panier depuis l'URL */
  const init = {};
  if (params.get('plan') && C.PLANS[params.get('plan')]) init.plan = params.get('plan');
  if (['monthly', 'yearly'].includes(params.get('cycle'))) init.cycle = params.get('cycle');
  let cart = FW.cart.set(init);
  let lastResults = [];

  /* ---------- Recherche ---------- */
  const input = $('#q');
  const errorEl = $('#search-error');
  const results = $('#results');

  async function run(query, scroll) {
    errorEl.classList.remove('show');
    results.setAttribute('aria-busy', 'true');
    results.innerHTML = skeleton();
    try {
      const data = await FW.searchDomains(query);
      lastResults = [data.exact, ...data.results, ...data.suggestions];
      render(data);
      const url = new URL(location.href);
      url.searchParams.set('q', data.exact.domain);
      history.replaceState(null, '', url);
      if (scroll && window.innerWidth < 1024) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      errorEl.textContent = e.message;
      errorEl.classList.add('show');
      results.innerHTML = '';
    } finally {
      results.setAttribute('aria-busy', 'false');
    }
  }

  function skeleton() {
    return `<div class="card p-6"><div class="skeleton h-6 w-1/2"></div><div class="skeleton h-4 w-1/3 mt-3"></div><div class="skeleton h-11 w-40 mt-6"></div></div>
      <div class="card mt-6 divide-y divide-line">${'<div class="p-4 flex justify-between"><div class="skeleton h-5 w-40"></div><div class="skeleton h-8 w-24"></div></div>'.repeat(5)}</div>`;
  }

  const priceTag = (r) => r.included
    ? `<span class="badge badge-success"><i data-lucide="gift"></i>Inclus avec l’offre</span><span class="text-xs text-muted line-through tabular">${FW.money(r.price)}</span>`
    : `${r.compare > r.price ? `<span class="text-sm text-muted line-through tabular">${FW.money(r.compare)}</span>` : ''}<span class="text-sm font-semibold text-ink tabular">${FW.money(r.price)}<span class="text-muted font-normal">/1re année</span></span>`;

  function isSelected(r) { return cart.domain && cart.domain.domain === r.domain; }

  function selectBtn(r, big) {
    if (!r.available) return `<span class="badge badge-neutral">Indisponible</span>`;
    const sel = isSelected(r);
    return `<button type="button" class="btn ${sel ? 'btn-outline !border-cta !text-cta' : 'btn-cta'} ${big ? '' : 'btn-sm'}" data-select="${esc(r.domain)}" aria-pressed="${sel}">
      <i data-lucide="${sel ? 'check' : 'shopping-cart'}"></i>${sel ? 'Sélectionné' : 'Choisir'}</button>`;
  }

  function render(data) {
    const r = data.exact;
    const head = r.available
      ? `<div class="card-elevated p-6 sm:p-7 border-cta/40 relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-cta"></div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div class="min-w-0">
              <p class="flex items-center gap-2 text-cta font-semibold text-sm"><i data-lucide="circle-check" class="w-5 h-5"></i>Disponible</p>
              <h2 class="mt-2 text-2xl sm:text-3xl font-extrabold mono break-all">${esc(r.domain)}</h2>
              <div class="mt-2 flex items-center gap-2 flex-wrap">${priceTag(r)}</div>
              <p class="mt-3 text-sm text-slate-600 flex items-center gap-2"><i data-lucide="mail" class="w-4 h-4 text-freda"></i><span class="mono">contact@${esc(r.domain)}</span> sera créée automatiquement.</p>
            </div>
            <div class="shrink-0">${selectBtn(r, true)}</div>
          </div>
        </div>`
      : `<div class="card p-6 sm:p-7">
          <p class="flex items-center gap-2 text-red-600 font-semibold text-sm"><i data-lucide="circle-x" class="w-5 h-5"></i>Déjà enregistré</p>
          <h2 class="mt-2 text-2xl sm:text-3xl font-extrabold mono break-all text-slate-400 line-through decoration-2">${esc(r.domain)}</h2>
          <p class="mt-2 text-sm text-slate-600">Ce nom appartient déjà à quelqu’un. Choisissez une autre extension ou une variante ci-dessous.</p>
        </div>`;

    const row = (x) => `
      <li class="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 ${x.available ? '' : 'opacity-60'}">
        <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0 ${x.available ? 'bg-emerald-50 text-cta' : 'bg-slate-100 text-slate-400'}"><i data-lucide="${x.available ? 'check' : 'x'}" class="w-4 h-4"></i></span>
        <div class="min-w-0 flex-1">
          <p class="font-semibold mono text-ink break-all">${esc(x.label)}<span class="text-freda">${esc(x.tld)}</span></p>
          <div class="mt-1 flex items-center gap-2 flex-wrap">${x.available ? priceTag(x) : '<span class="text-xs text-muted">Non disponible</span>'}</div>
        </div>
        <div class="shrink-0">${selectBtn(x)}</div>
      </li>`;

    results.innerHTML = `
      ${data.unknownTld ? `<div class="mb-4 card p-4 flex gap-3 text-sm bg-amber-50 border-amber-200"><i data-lucide="info" class="w-5 h-5 text-amber-600 shrink-0"></i><p>L’extension <strong class="mono">${esc(data.unknownTld)}</strong> n’est pas encore proposée. Voici les résultats pour les extensions disponibles.</p></div>` : ''}
      ${head}
      <h3 class="mt-9 mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Autres extensions</h3>
      <ul class="card divide-y divide-line">${data.results.map(row).join('')}</ul>
      ${data.suggestions.length ? `
        <h3 class="mt-9 mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Suggestions disponibles</h3>
        <ul class="card divide-y divide-line">${data.suggestions.map(row).join('')}</ul>` : ''}`;
    FWUI.icons();
  }

  results.addEventListener('click', (e) => {
    const b = e.target.closest('[data-select]');
    if (!b) return;
    const r = lastResults.find((x) => x.domain === b.dataset.select);
    if (!isSelected(r)) FWUI.confetti(b); // explosion de confettis à l'ajout
    cart = FW.cart.set({ domain: isSelected(r) ? null : r, extras: [], ownDomain: false, domainPaid: false });
    // Re-rendu léger des boutons
    results.querySelectorAll('[data-select]').forEach((btn) => {
      const x = lastResults.find((y) => y.domain === btn.dataset.select);
      btn.outerHTML = selectBtn(x, btn.classList.contains('btn-lg') || !btn.classList.contains('btn-sm'));
    });
    FWUI.icons();
    renderCart();
    if (cart.domain) FWUI.toast(esc(cart.domain.domain), 'success', { title: 'Ajouté au panier', icon: 'shopping-cart' });
  });

  FWUI.attachSuggest(input, { onPick: (d) => run(d, true) });
  $('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    input.blur(); // referme le clavier pour voir les résultats
    run(input.value, true);
  });

  /* ---------- Panier : domaine seul (l'email pro se choisit à l'étape suivante) ---------- */
  let upKey = null;
  function renderCart() {
    const d = cart.domain;
    $('#cart-domain').innerHTML = d
      ? `<div class="flex items-center gap-3 p-3.5 rounded-xl bg-mist">
          <i data-lucide="globe" class="w-5 h-5 text-freda shrink-0"></i>
          <div class="min-w-0 flex-1"><p class="font-semibold mono text-ink truncate">${esc(d.domain)}</p><p class="text-xs text-muted">Renouvellement ${FW.money(d.renew)}/an</p></div>
          <button type="button" id="remove-domain" class="btn btn-ghost btn-icon" aria-label="Retirer le domaine"><i data-lucide="x"></i></button>
        </div>${(cart.extras || []).map((x) => `<div class="mt-2 flex items-center gap-3 p-3 rounded-xl bg-mist/60">
          <i data-lucide="globe" class="w-4 h-4 text-freda shrink-0"></i>
          <div class="min-w-0 flex-1"><p class="font-medium mono text-sm text-ink truncate">${esc(x.domain)}</p><p class="text-xs text-muted">Renouvellement ${FW.money(x.renew)}/an</p></div>
          <button type="button" class="btn btn-ghost btn-icon" data-remove-extra="${esc(x.domain)}" aria-label="Retirer ${esc(x.domain)}"><i data-lucide="x"></i></button>
        </div>`).join('')}`
      : cart.ownDomain
        ? `<div class="flex items-center gap-3 p-3.5 rounded-xl bg-mist"><i data-lucide="link-2" class="w-5 h-5 text-freda"></i><p class="text-sm font-medium text-ink flex-1">J’utilise mon propre domaine</p><button type="button" id="remove-own" class="btn btn-ghost btn-icon" aria-label="Annuler"><i data-lucide="x"></i></button></div>`
        : `<div class="p-4 rounded-xl border border-dashed border-line-strong text-sm text-muted flex items-center gap-2"><i data-lucide="globe" class="w-4 h-4"></i>Aucun domaine sélectionné</div>`;

    const t = FW.cart.totals(cart);
    const yrs = t.years;
    $('#years-pick').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${n === yrs ? 'selected' : ''}>${n} an${n > 1 ? 's' : ''}</option>`).join('');
    if (!d) $('#years-note').textContent = 'S’applique au domaine que vous choisirez.';
    if (d) {
      const exp = new Date(); exp.setFullYear(exp.getFullYear() + yrs);
      $('#years-note').textContent = 'Expire en ' + exp.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) + ' · renouvellement ' + FW.money(d.renew) + '/an';
    }
    const yl = ' (' + yrs + ' an' + (yrs > 1 ? 's' : '') + ')';
    $('#cart-lines').innerHTML = d
      ? [d, ...(cart.extras || [])].map((x) => `<div class="flex justify-between gap-3"><dt class="text-slate-600 truncate">${esc(x.domain)}${yl}</dt><dd class="text-ink font-medium">${FW.money(FW.cart.priceOf(x, yrs))}</dd></div>`).join('') + `
         <div class="flex justify-between gap-3 pt-3 border-t border-line text-base"><dt class="font-bold text-ink">Total aujourd’hui</dt><dd class="font-extrabold text-ink">${FW.money(t.total)}</dd></div>
         <div class="flex justify-between gap-3 text-xs"><dt class="text-muted">Équivalent MonCash / NatCash</dt><dd class="text-muted">≈ ${FW.money(t.htg, 'HTG')}</dd></div>`
      : cart.ownDomain
        ? `<div class="flex justify-between gap-3 pt-1 text-base"><dt class="font-bold text-ink">Total aujourd’hui</dt><dd class="font-extrabold text-ink">${FW.money(0)}</dd></div>`
        : '';

    const has = !!(d || cart.ownDomain);
    $('#checkout-btn').disabled = !has;
    $('#checkout-btn').innerHTML = '<i data-lucide="shopping-bag"></i>' + (d ? 'Acheter maintenant' : 'Continuer');
    $('#cart-count').textContent = has ? 1 : 0;
    $('#cart-total-top').textContent = has ? FW.money(t.total) : '';
    const bar = $('#cart-bar');
    bar.hidden = !has;
    $('#bar-label').textContent = d ? d.domain + ((cart.extras || []).length ? ' +' + cart.extras.length : '') : 'Domaine existant';
    $('#bar-total').textContent = FW.money(t.total);
    document.body.style.paddingBottom = has && window.innerWidth < 1024 ? '76px' : '';
    FWUI.icons();
    const rm = $('#remove-domain');
    rm && rm.addEventListener('click', () => { cart = FW.cart.set({ domain: null, extras: [] }); renderCart(); if (lastResults.length) $('#search-form').requestSubmit(); });
    document.querySelectorAll('[data-remove-extra]').forEach((b) => b.addEventListener('click', () => {
      cart = FW.cart.set({ extras: (cart.extras || []).filter((x) => x.domain !== b.dataset.removeExtra) });
      renderCart();
    }));
    // Offre d'extensions économiques (uniquement si le domaine choisi est un .com)
    const key = d ? d.domain + '|' + (cart.extras || []).map((x) => x.domain).join(',') : '';
    if (key !== upKey) { upKey = key; FWUI.renderUpsell($('#cart-upsell'), cart, (c) => { cart = c; renderCart(); }); }
    const ro = $('#remove-own');
    ro && ro.addEventListener('click', () => { cart = FW.cart.set({ ownDomain: false }); renderCart(); });
  }

  FWUI.bindWhoisPrivacy(() => cart.whoisPrivacy, (v) => { cart = FW.cart.set({ whoisPrivacy: v }); });
  $('#years-pick').addEventListener('change', (e) => {
    cart = FW.cart.set({ years: +e.target.value });
    renderCart();
  });
  // Téléphone : on passe par la page « Mon panier » ; ordinateur : le panier est déjà à droite
  $('#checkout-btn').addEventListener('click', () => { location.href = window.innerWidth < 1024 ? 'panier.html' : 'paiement.html'; });
  $('#bar-buy').addEventListener('click', () => { location.href = 'panier.html'; });

  /* ---------- Démarrage ---------- */
  renderCart();
  const q = params.get('q') || (cart.domain ? cart.domain.domain : '');
  if (q) { input.value = q; run(q); }
  else input.focus();
})();
