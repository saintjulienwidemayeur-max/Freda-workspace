/* Espace client — achat d'un domaine sans quitter l'espace. */
(function () {
  if (!window.FWSpace) return;
  const C = FW.config, esc = FWUI.esc, $ = (s) => document.querySelector(s);
  let selected = [];      // [{ domain, label, tld, price, renew }]
  let years = 1, whoisPrivacy = true;
  let methodId = null;
  const owned = () => new Set(FWSpace.ws().domains.map((d) => d.name));

  /* ----- Recherche ----- */
  function row(r) {
    const isOwned = owned().has(r.domain), isSel = selected.some((x) => x.domain === r.domain);
    const action = !r.available || isOwned
      ? `<span class="badge badge-neutral">${isOwned ? 'Déjà à vous' : 'Indisponible'}</span>`
      : `<button type="button" class="btn ${isSel ? 'btn-outline' : 'btn-primary'} btn-sm" data-toggle="${esc(r.domain)}" aria-pressed="${isSel}">${isSel ? '<i data-lucide="check"></i>Ajouté' : '<i data-lucide="plus"></i>Ajouter'}</button>`;
    return `<li class="flex items-center gap-3 px-4 py-3 ${r.available && !isOwned ? '' : 'opacity-60'}">
      <span class="mono font-semibold text-ink truncate min-w-0 flex-1">${esc(r.domain)}</span>
      ${r.available && !isOwned ? `<span class="text-right text-sm tabular shrink-0">${r.compare > r.price ? `<span class="text-xs text-muted line-through mr-1">${FW.money(r.compare)}</span>` : ''}<span class="font-bold text-ink">${FW.money(r.price)}</span><span class="block text-xs text-muted">puis ${FW.money(r.renew)}/an</span></span>` : ''}
      <span class="shrink-0">${action}</span>
    </li>`;
  }
  const cache = {};
  function renderResults(data) {
    Object.assign(cache, ...[data.exact, ...data.results, ...data.suggestions].map((r) => ({ [r.domain]: r })));
    const ex = data.exact;
    $('#buy-results').innerHTML = `
      <section class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-line flex items-center gap-2"><i data-lucide="${ex.available && !owned().has(ex.domain) ? 'circle-check' : 'circle-x'}" class="w-5 h-5 ${ex.available && !owned().has(ex.domain) ? 'text-cta' : 'text-slate-500'}"></i><h2 class="font-bold">${ex.available && !owned().has(ex.domain) ? 'Bonne nouvelle, ce nom est disponible' : 'Ce nom n’est pas disponible'}</h2></div>
        <ul class="divide-y divide-line">${row(ex)}</ul>
      </section>
      <section class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-line"><h2 class="font-bold">Autres extensions</h2></div>
        <ul class="divide-y divide-line">${data.results.map(row).join('')}</ul>
      </section>
      ${data.suggestions.length ? `<section class="card overflow-hidden"><div class="px-4 py-3 border-b border-line"><h2 class="font-bold">Suggestions</h2></div><ul class="divide-y divide-line">${data.suggestions.map(row).join('')}</ul></section>` : ''}`;
    FWUI.icons();
  }
  let lastData = null;
  $('#buy-search').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#buy-error'); err.classList.remove('show');
    const btn = $('#buy-go');
    FWUI.setLoading(btn, true, 'Recherche...');
    try { lastData = await FW.searchDomains($('#buy-q').value); renderResults(lastData); }
    catch (ex) { err.textContent = ex.message; err.classList.add('show'); }
    finally { FWUI.setLoading(btn, false); }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-toggle]');
    if (b) {
      const d = cache[b.dataset.toggle];
      selected = selected.some((x) => x.domain === d.domain) ? selected.filter((x) => x.domain !== d.domain) : selected.concat(d);
      renderCart(); if (lastData) renderResults(lastData);
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) { selected = selected.filter((x) => x.domain !== rm.dataset.remove); renderCart(); if (lastData) renderResults(lastData); }
  });

  /* ----- Sélection et paiement ----- */
  const methodName = (m) => m.type === 'card' ? `${m.brand} •••• ${m.last4}` : (m.type === 'moncash' ? 'MonCash' : 'NatCash') + ' ' + (m.phone || '');
  function renderCart() {
    const ws = FWSpace.ws();
    $('#buy-count').textContent = selected.length;
    $('#buy-empty').hidden = selected.length > 0;
    $('#buy-list').innerHTML = selected.map((d) => `<li class="flex items-center gap-2 rounded-lg border border-line px-3 py-2"><span class="mono text-sm font-semibold truncate flex-1">${esc(d.domain)}</span><span class="text-sm tabular">${FW.money(FW.cart.priceOf(d, years))}</span><button type="button" class="p-1 text-muted hover:text-red-600" data-remove="${esc(d.domain)}" aria-label="Retirer ${esc(d.domain)}"><i data-lucide="x" class="w-4 h-4"></i></button></li>`).join('');
    $('#buy-years').innerHTML = [1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === years ? 'selected' : ''}>${n} an${n > 1 ? 's' : ''}</option>`).join('');
    const pms = ws.paymentMethods;
    if (!methodId || !pms.some((m) => m.id === methodId)) methodId = (pms.find((m) => m.default) || pms[0] || {}).id || null;
    $('#buy-methods').innerHTML = '<p class="text-sm text-muted">Vous choisirez le moyen de paiement (MonCash, NatCash, carte ou solde) en cliquant sur « Payer ».</p>';
    const total = +selected.reduce((s, d) => s + FW.cart.priceOf(d, years), 0).toFixed(2);
    $('#buy-total').textContent = FW.money(total);
    $('#buy-htg').textContent = total ? '≈ ' + FW.money(total * C.HTG_RATE, 'HTG') : '';
    $('#buy-pay').disabled = !selected.length;
    $('#buy-pay span').textContent = total ? 'Payer ' + FW.money(total) : 'Payer';
    FWUI.icons();
  }
  FWUI.bindWhoisPrivacy(() => whoisPrivacy, (v) => { whoisPrivacy = v; });
  $('#buy-years').addEventListener('change', (e) => { years = +e.target.value; renderCart(); });
  document.addEventListener('change', (e) => { if (e.target.name === 'buy-method') methodId = e.target.value; });

  $('#buy-pay').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const total0 = +selected.reduce((s, d) => s + FW.cart.priceOf(d, years), 0).toFixed(2);
    const pay = await FWUI.choosePayment({ amount: total0, title: 'Payer ' + (selected.length > 1 ? 'les domaines' : 'le domaine') });
    if (!pay) return;
    FWUI.setLoading(btn, true, 'Paiement en cours...');
    try {
      const items = selected.slice();
      await FW.domains.buy({ items, years, pay, whoisPrivacy });
      $('#buy-form').hidden = true; $('#buy-done').hidden = false;
      $('#buy-done-text').innerHTML = items.map((d) => `<span class="mono font-semibold text-ink">${esc(d.domain)}</span>`).join(', ') + (items.length > 1 ? ' sont enregistrés' : ' est enregistré') + ' sur votre compte.';
      $('#buy-done-dns').href = 'dns?domain=' + encodeURIComponent(items[0].domain);
      selected = []; lastData = null;
      try { FWUI.confetti(btn); } catch (_) {}
      $('#buy-results').innerHTML = '';
    } catch (ex) { FWUI.toast(ex.message, 'error'); }
    finally { FWUI.setLoading(btn, false); }
  });
  $('#buy-again').addEventListener('click', () => { $('#buy-form').hidden = false; $('#buy-done').hidden = true; $('#buy-q').value = ''; $('#buy-q').focus(); renderCart(); });

  const q = new URLSearchParams(location.search).get('q');
  if (q) { $('#buy-q').value = q; $('#buy-search').requestSubmit(); }
  renderCart();
})();
