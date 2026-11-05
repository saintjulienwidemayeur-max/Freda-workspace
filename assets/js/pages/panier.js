/**
 * Page « Mon panier » : récapitulatif avant le paiement (utilisée surtout sur mobile).
 * Étape suivante : paiement.html.
 */
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = FWUI.esc;
  let cart = FW.cart.get();

  let upKey = null;
  function render() {
    const d = cart.domain;
    const has = !!(d || cart.ownDomain);
    $('#empty').hidden = has;
    $('#cart').hidden = !has;
    if (!has) { FWUI.icons(); return; }

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
      : `<div class="flex items-center gap-3 p-3.5 rounded-xl bg-mist"><i data-lucide="link-2" class="w-5 h-5 text-freda"></i><p class="text-sm font-medium text-ink flex-1">J’utilise mon propre domaine</p></div>`;

    $('#years-wrap').hidden = !d;
    const t = FW.cart.totals(cart);
    if (d) {
      $('#years-pick').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${n === t.years ? 'selected' : ''}>${n} an${n > 1 ? 's' : ''}</option>`).join('');
      const exp = new Date(); exp.setFullYear(exp.getFullYear() + t.years);
      $('#years-note').textContent = 'Expire en ' + exp.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) + ' · renouvellement ' + FW.money(d.renew) + '/an';
    }
    const yl = ' (' + t.years + ' an' + (t.years > 1 ? 's' : '') + ')';
    $('#cart-lines').innerHTML = d
      ? [d, ...(cart.extras || [])].map((x) => `<div class="flex justify-between gap-3"><dt class="text-slate-600 truncate">${esc(x.domain)}${yl}</dt><dd class="text-ink font-medium">${FW.money(FW.cart.priceOf(x, t.years))}</dd></div>`).join('') + `
         <div class="flex justify-between gap-3 pt-3 border-t border-line text-base"><dt class="font-bold text-ink">Total aujourd’hui</dt><dd class="font-extrabold text-ink">${FW.money(t.total)}</dd></div>
         <div class="flex justify-between gap-3 text-xs"><dt class="text-muted">Équivalent MonCash / NatCash</dt><dd class="text-muted">≈ ${FW.money(t.htg, 'HTG')}</dd></div>`
      : `<div class="flex justify-between gap-3 text-base"><dt class="font-bold text-ink">Total aujourd’hui</dt><dd class="font-extrabold text-ink">${FW.money(0)}</dd></div>`;
    $('#next-label').textContent = d ? 'Acheter maintenant' : 'Continuer';
    FWUI.icons();
    const rm = $('#remove-domain');
    rm && rm.addEventListener('click', () => { cart = FW.cart.set({ domain: null, extras: [] }); location.href = 'domaines'; });
    document.querySelectorAll('[data-remove-extra]').forEach((b) => b.addEventListener('click', () => {
      cart = FW.cart.set({ extras: (cart.extras || []).filter((x) => x.domain !== b.dataset.removeExtra) });
      render();
    }));
    const key = d ? d.domain + '|' + (cart.extras || []).map((x) => x.domain).join(',') : '';
    if (key !== upKey) { upKey = key; FWUI.renderUpsell($('#cart-upsell'), cart, (c) => { cart = c; render(); }); }
  }

  FWUI.bindWhoisPrivacy(() => cart.whoisPrivacy, (v) => { cart = FW.cart.set({ whoisPrivacy: v }); });
  $('#years-pick').addEventListener('change', (e) => { cart = FW.cart.set({ years: +e.target.value }); render(); });
  $('#next-btn').addEventListener('click', () => { location.href = 'paiement'; });
  render();
})();
