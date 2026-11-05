/**
 * Espace client — offre, changement de plan, moyens de paiement et factures.
 */
(function () {
  if (!window.FWSpace) return;
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const esc = FWUI.esc;
  let viewCycle = FWSpace.ws().plan && FW.validCycle(FWSpace.ws().plan.cycle) ? FWSpace.ws().plan.cycle : 'monthly';

  /* ---------- Offres ---------- */
  function renderPlans() {
    const ws = FWSpace.ws();
    const cs = $('#cycle-select');
    if (!cs.options.length) cs.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map((n) => `<option value="${FW.cycleOf(n)}">${n} mois${n === 12 ? ' (2 mois offerts)' : ''}</option>`).join('');
    cs.value = viewCycle;
    $('#plan-cards').innerHTML = Object.values(C.PLANS).map((p) => {
      const hasPlan = !!ws.plan;
      const current = hasPlan && ws.plan.id === p.id && ws.plan.cycle === viewCycle;
      const tooSmall = p.mailboxes < ws.mailboxes.length;
      return `<div class="rounded-2xl border-2 p-5 flex flex-col ${current ? 'border-freda bg-mist/50' : 'border-line'}">
        <div class="flex items-center justify-between"><p class="font-bold text-ink">${p.name}</p>${current ? '<span class="badge badge-info">Offre actuelle</span>' : ''}</div>
        <p class="mt-2"><span class="font-display text-3xl font-extrabold text-ink tabular">${FW.money(FW.planPrice(p.id, viewCycle))}</span><span class="text-muted text-sm"> ${FW.cycleMonths(viewCycle) === 1 ? '/mois' : FW.cycleMonths(viewCycle) === 12 ? '/an' : 'pour ' + FW.cycleSpan(viewCycle)}</span></p>
        <p class="mt-1 text-sm text-muted">${C.boxLabel(p)} · ${C.storageLabel(p)}</p>
        <div class="mt-4 flex items-end">
          ${current ? '<button type="button" class="btn btn-outline btn-sm w-full" disabled>Offre en cours</button>'
            : tooSmall ? `<p class="text-xs text-amber-700">Supprimez ${ws.mailboxes.length - p.mailboxes} boîte(s) pour passer à cette offre.</p>`
            : !hasPlan ? `<a href="../configurer-email.html?plan=${p.id}&cycle=${viewCycle}" class="btn ${p.popular ? 'btn-cta' : 'btn-outline'} btn-sm w-full">Choisir ${p.name}</a>`
            : `<button type="button" class="btn ${p.monthly > C.PLANS[ws.plan.id].monthly ? 'btn-cta' : 'btn-outline'} btn-sm w-full" data-switch="${p.id}">${ws.plan.id === p.id ? 'Payer ' + FW.cycleSpan(viewCycle) : 'Choisir ' + p.name}</button>`}
        </div>
      </div>`;
    }).join('');
    const pl = ws.plan;
    const ended = pl && ['cancelled', 'suspended'].includes(pl.status);
    $('#renew-line').innerHTML = !pl ? '<i data-lucide="info" class="w-4 h-4"></i>Aucun abonnement email pour le moment. Votre domaine est déjà actif, vous pouvez ajouter l’email pro quand vous voulez.'
      : ended ? '<i data-lucide="alert-triangle" class="w-4 h-4"></i>Offre terminée : vos boîtes sont suspendues (vos messages sont conservés). Choisissez une offre ci-dessus pour les réactiver.'
      : pl.cancelAtPeriodEnd ? `<i data-lucide="circle-slash" class="w-4 h-4"></i>Offre résiliée : vos boîtes restent actives jusqu’au ${FW.date(pl.renews)}, sans nouveau prélèvement. <button type="button" class="underline font-semibold" data-resume>Reprendre l’offre</button>`
      : `<i data-lucide="calendar-clock" class="w-4 h-4"></i>Prochain renouvellement le ${FW.date(pl.renews)} · ${FW.money(FW.planPrice(pl.id, pl.cycle))} <button type="button" class="underline text-muted" data-cancel-plan>Résilier</button>`;
  }
  $('#cycle-select').addEventListener('change', (e) => { viewCycle = e.target.value; renderPlans(); FWUI.icons(); });
  document.addEventListener('fw:plans', () => { renderPlans(); FWUI.icons(); });

  $('#renew-line').addEventListener('click', async (e) => {
    const ws = FWSpace.ws();
    try {
      if (e.target.closest('[data-cancel-plan]')) {
        const ok = await FWUI.confirmDialog({ title: 'Résilier l’offre', message: `Vos boîtes restent utilisables jusqu’au <strong>${FW.date(ws.plan.renews)}</strong>, puis elles sont suspendues (aucun message n’est supprimé). Plus aucun prélèvement n’aura lieu. Vous pouvez reprendre l’offre avant cette date.`, confirmLabel: 'Résilier l’offre' });
        if (!ok) return;
        await FW.plans.cancel(); ws.plan.cancelAtPeriodEnd = true; FWUI.toast('Offre résiliée'); renderPlans(); FWUI.icons();
      } else if (e.target.closest('[data-resume]')) {
        await FW.plans.resume(); ws.plan.cancelAtPeriodEnd = false; FWUI.toast('Offre reprise'); renderPlans(); FWUI.icons();
      }
    } catch (err) { FWUI.toast(err.message, 'error'); }
  });

  $('#plan-cards').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-switch]');
    if (!b) return;
    const p = C.PLANS[b.dataset.switch];
    const ok = await FWUI.confirmDialog({
      title: 'Changer d’offre',
      message: `Passer à <strong>${p.name}</strong> pour ${FW.cycleSpan(viewCycle)} : ${FW.money(FW.planPrice(p.id, viewCycle))}. Le paiement se fait avec votre solde s’il suffit, sinon avec MonCash / NatCash.`,
      confirmLabel: 'Confirmer le changement',
    });
    if (!ok) return;
    if (!FW.config.DEMO_MODE) {
      try { await FW.plans.change({ plan: p.id, cycle: viewCycle }); FWUI.toast('Votre offre est maintenant ' + p.name); setTimeout(() => location.reload(), 700); }
      catch (err) { FWUI.toast(err.message, 'error'); }
      return;
    }
    const ws = FWSpace.ws();
    ws.plan.id = p.id;
    ws.plan.cycle = viewCycle;
    FW.workspace.log(ws, 'layers', 'Offre changée pour ' + p.name);
    FW.workspace.save(ws);
    FWUI.toast('Votre offre est maintenant ' + p.name);
    setTimeout(() => location.reload(), 700);
  });

  /* ---------- Moyens de paiement ---------- */
  function renderPm() {
    const ws = FWSpace.ws();
    $('#pm-list').innerHTML = !ws.paymentMethods.length ? '<li class="text-sm text-muted">Aucun moyen de paiement enregistré.</li>' : ws.paymentMethods.map((m) => `
      <li class="flex items-center gap-3 rounded-xl border ${m.default ? 'border-freda/40 bg-mist/40' : 'border-line'} p-4">
        <span class="w-14 flex justify-center">${m.type === 'card' ? FWUI.payMark(m.brand.toLowerCase()) : FWUI.payMark(m.type)}</span>
        <div class="min-w-0 flex-1">
          <p class="font-medium text-ink tabular whitespace-nowrap">${m.type === 'card' ? esc(m.brand) + ' •••• ' + esc(m.last4) : esc(m.phone)}</p>
          <p class="text-xs text-muted">${m.type === 'card' ? 'Expire ' + esc(m.exp) : m.type === 'moncash' ? 'Portefeuille MonCash' : 'Portefeuille NatCash'}</p>
        </div>
        ${m.default ? '<span class="badge badge-info">Par défaut</span>' : `<button type="button" class="text-sm font-semibold text-freda hover:underline" data-default="${m.id}">Définir par défaut</button>`}
        ${m.default ? '' : `<button type="button" class="btn btn-ghost btn-icon hover:!text-red-600" data-remove="${m.id}" aria-label="Retirer"><i data-lucide="trash-2"></i></button>`}
      </li>`).join('');
  }
  $('#pm-list').addEventListener('click', async (e) => {
    const ws = FWSpace.ws();
    const d = e.target.closest('[data-default]');
    if (d && !FW.config.DEMO_MODE) { try { await FW.methods.setDefault(d.dataset.default); render(); FWUI.toast('Moyen de paiement par défaut mis à jour'); } catch (err) { FWUI.toast(err.message, 'error'); } return; }
    if (d) { ws.paymentMethods.forEach((m) => { m.default = m.id === d.dataset.default; }); FW.workspace.save(ws); render(); FWUI.toast('Moyen de paiement par défaut mis à jour'); }
    const r = e.target.closest('[data-remove]');
    if (r) {
      const ok = await FWUI.confirmDialog({ title: 'Retirer ce moyen de paiement ?', message: 'Il ne sera plus utilisé pour vos renouvellements.', confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      if (!FW.config.DEMO_MODE) { try { await FW.methods.remove(r.dataset.remove); render(); } catch (err) { FWUI.toast(err.message, 'error'); } return; }
      ws.paymentMethods = ws.paymentMethods.filter((m) => m.id !== r.dataset.remove);
      FW.workspace.save(ws); render();
    }
  });

  /* Ajout. Production : la carte se saisit chez Stripe lors d'un paiement (elle est enregistrée à ce moment-là) ; aucun champ de carte ici. */
  const hostedCard = !FW.config.DEMO_MODE;
  let pmType = 'card';
  const syncPmForm = () => { const hideSave = hostedCard && pmType === 'card'; const sb = $('#pm-form [type=submit]'); if (sb) sb.hidden = hideSave; };
  if (hostedCard) {
    const card = $('#pm-card');
    Array.from(card.children).forEach((c) => { c.hidden = true; });
    const note = document.createElement('p');
    note.className = 'text-sm text-slate-600';
    note.textContent = 'Une carte bancaire s’enregistre automatiquement lors de votre prochain paiement par carte : vous la saisissez sur la page sécurisée de Stripe (nous ne voyons jamais votre numéro). Elle servira ensuite à renouveler votre offre et vos domaines ; vous pouvez la supprimer ici à tout moment.';
    card.appendChild(note);
    syncPmForm();
  }
  document.querySelectorAll('[data-pm]').forEach((b) => b.addEventListener('click', () => {
    pmType = b.dataset.pm;
    document.querySelectorAll('[data-pm]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('#pm-card').hidden = pmType !== 'card';
    $('#pm-mobile').hidden = pmType === 'card';
    $('#pm-phone-label').textContent = 'Numéro ' + (pmType === 'moncash' ? 'MonCash' : 'NatCash');
    $('#pm-error').classList.remove('show');
    syncPmForm();
  }));
  $('#pm-number').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '); });
  $('#pm-exp').addEventListener('input', (e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2); e.target.value = v; });
  $('#pm-phone').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{2})(?=\d)/g, '$1 ').trim(); });

  $('#pm-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#pm-error');
    const ws = FWSpace.ws();
    let method;
    if (pmType === 'card') {
      const n = $('#pm-number').value.replace(/\s/g, '');
      if (n.length < 13 || !/^\d{2}\/\d{2}$/.test($('#pm-exp').value) || !/^\d{3,4}$/.test($('#pm-cvc').value)) { err.textContent = 'Vérifiez le numéro, la date d’expiration et le CVC.'; err.classList.add('show'); return; }
      method = { id: Math.random().toString(36).slice(2), type: 'card', brand: /^4/.test(n) ? 'Visa' : /^3[47]/.test(n) ? 'Amex' : 'Mastercard', last4: n.slice(-4), exp: $('#pm-exp').value };
    } else {
      const d = $('#pm-phone').value.replace(/\D/g, '');
      if (d.length !== 8) { err.textContent = 'Entrez un numéro haïtien à 8 chiffres.'; err.classList.add('show'); return; }
      method = { id: Math.random().toString(36).slice(2), type: pmType, phone: '+509 ' + d.slice(0, 2) + '•• ••' + d.slice(-2) };
    }
    const btn = e.target.querySelector('[type=submit]');
    FWUI.setLoading(btn, true, 'Vérification...');
    if (!FW.config.DEMO_MODE) {
      try {
        if (pmType === 'card') throw new Error('Les cartes bancaires ne sont pas encore disponibles. Utilisez MonCash ou NatCash.');
        await FW.methods.add({ type: pmType, phone: $('#pm-phone').value });
        FWUI.closeModal('modal-pm'); e.target.reset(); render(); FWUI.toast('Moyen de paiement ajouté');
      } catch (er) { err.textContent = er.message; err.classList.add('show'); }
      FWUI.setLoading(btn, false);
      return;
    }
    await FW.wait(900); // Tokenisation / vérification via Freda Pay
    FWUI.setLoading(btn, false);
    ws.paymentMethods.push(method);
    FW.workspace.save(ws);
    FWUI.closeModal('modal-pm');
    e.target.reset();
    render();
    FWUI.toast('Moyen de paiement ajouté');
  });

  /* ---------- Factures ---------- */
  function renderInvoices() {
    const ws = FWSpace.ws();
    const STATUS = { paid: ['Payée', 'badge-success'], pending: ['En attente', 'badge-warn'], refunded: ['Remboursée', 'badge-neutral'], failed: ['Échouée', 'badge-danger'] };
    const total = ws.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    $('#inv-total').textContent = 'Total payé en ' + new Date().getFullYear() + ' : ' + FW.money(total);
    $('#inv-body').innerHTML = ws.invoices.map((i) => `
      <tr>
        <td class="mono text-sm font-medium whitespace-nowrap">${esc(i.id)}</td>
        <td class="text-sm text-muted tabular whitespace-nowrap">${FW.date(i.date)}</td>
        <td class="text-sm">${esc(i.label)}</td>
        <td class="text-sm text-muted whitespace-nowrap">${esc(i.method)}</td>
        <td class="text-right font-semibold tabular">${FW.money(i.amount)}</td>
        <td><span class="badge ${STATUS[i.status][1]}">${STATUS[i.status][0]}</span></td>
        <td class="text-right"><button type="button" class="btn btn-ghost btn-sm" data-pdf="${esc(i.id)}"><i data-lucide="download"></i>PDF</button></td>
      </tr>`).join('');
  }
  $('#inv-body').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pdf]');
    if (!b) return;
    const inv = FWSpace.ws().invoices.find((i) => i.id === b.dataset.pdf);
    if (!inv) return;
    FWUI.setLoading(b, true, 'PDF...');
    FW.invoicePdf.download(inv)
      .then(() => FWUI.toast('Facture ' + inv.id + ' téléchargée.'))
      .catch((err) => FWUI.toast(err.message || 'Le PDF n’a pas pu être généré.', 'error'))
      .finally(() => { FWUI.setLoading(b, false); FWUI.icons(); });
  });

  /* ---------- Solde prépayé ---------- */
  const usd = (n) => FW.money(n);
  let bal = null, topupMethod = 'moncash';
  const KIND = { topup: ['Recharge', 'plus-circle', 'text-emerald-600'], charge: ['Paiement', 'minus-circle', 'text-slate-500'], refund: ['Remboursement', 'rotate-ccw', 'text-emerald-600'], adjust: ['Ajustement', 'sliders-horizontal', 'text-slate-500'] };
  function renderBalance() {
    if (!bal) return;
    $('#bal-amount').textContent = usd(bal.balance);
    $('#bal-htg').textContent = '≈ ' + Number(bal.balanceHtg).toLocaleString('fr-FR') + ' HTG';
    $('#bal-auto').checked = !!bal.autoPay;
    const nx = $('#bal-next');
    if (bal.next) {
      const short = bal.next.missing > 0;
      nx.hidden = false;
      nx.className = 'rounded-xl border p-4 text-sm ' + (short ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900');
      nx.innerHTML = short
        ? `<p class="font-semibold">Solde insuffisant pour la prochaine échéance</p><p class="mt-1">Votre offre (${usd(bal.next.amount)}) se renouvelle le ${FW.date(bal.next.renews)}. Il manque <strong>${usd(bal.next.missing)}</strong> (≈ ${Math.ceil(bal.next.missing * bal.htgRate).toLocaleString('fr-FR')} HTG).</p><button type="button" class="btn btn-cta btn-sm mt-3" data-topup="${Math.max(bal.min, Math.ceil(bal.next.missing))}"><i data-lucide="wallet"></i>Recharger ${usd(Math.max(bal.min, Math.ceil(bal.next.missing)))}</button>`
        : `<p class="font-semibold">Prochaine échéance couverte</p><p class="mt-1">Votre offre (${usd(bal.next.amount)}) sera payée avec votre solde ${bal.autoPay ? 'automatiquement' : 'dès que vous la réglerez'} le ${FW.date(bal.next.renews)}.</p>`;
    } else nx.hidden = true;
    $('#bal-entries').innerHTML = !bal.entries.length ? '<li class="py-3 text-sm text-muted">Aucun mouvement pour le moment.</li>' : bal.entries.slice(0, 8).map((e) => {
      const k = KIND[e.kind] || [e.kind, 'circle', 'text-slate-500'];
      return `<li class="py-3 flex items-center gap-3"><i data-lucide="${k[1]}" class="w-5 h-5 shrink-0 ${k[2]}"></i><div class="min-w-0 flex-1"><p class="text-sm font-medium text-ink truncate">${esc(e.note || k[0])}</p><p class="text-xs text-muted tabular">${FW.date(String(e.at).slice(0, 10))}</p></div><p class="font-semibold tabular ${e.amount >= 0 ? 'text-emerald-600' : 'text-ink'}">${e.amount >= 0 ? '+' : '−'}${usd(Math.abs(e.amount))}</p></li>`;
    }).join('');
    FWUI.icons();
  }
  async function loadBalance() { try { bal = await FW.balance.get(); renderBalance(); } catch (err) { $('#bal-amount').textContent = '—'; $('#bal-htg').textContent = 'Solde momentanément indisponible.'; } }

  function openTopup(preset) {
    const min = bal ? bal.min : 5, max = bal ? bal.max : 500;
    $('#topup-presets').innerHTML = [5, 10, 25, 50].filter((a) => a >= min && a <= max).map((a) => `<button type="button" class="btn btn-outline btn-sm flex-1 justify-center tabular" data-preset="${a}">${a} $</button>`).join('');
    $('#topup-amount').value = preset ? String(preset) : '';
    $('#topup-error').classList.remove('show');
    syncTopupHtg();
    FWUI.openModal('modal-topup');
  }
  const topupAmount = () => { const n = Number(String($('#topup-amount').value).replace(',', '.')); return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN; };
  function syncTopupHtg() { const a = topupAmount(); const rate = bal ? bal.htgRate : C.HTG_RATE; $('#topup-htg').textContent = a > 0 ? '≈ ' + Math.ceil(a * rate).toLocaleString('fr-FR') + ' HTG à payer' : ''; document.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('!border-freda', Number(b.dataset.preset) === a)); }
  $('#btn-topup').addEventListener('click', () => openTopup());
  $('#solde').addEventListener('click', (e) => { const t = e.target.closest('[data-topup]'); if (t) openTopup(Number(t.dataset.topup)); });
  $('#topup-presets').addEventListener('click', (e) => { const b = e.target.closest('[data-preset]'); if (b) { $('#topup-amount').value = b.dataset.preset; syncTopupHtg(); } });
  $('#topup-amount').addEventListener('input', syncTopupHtg);
  document.querySelectorAll('[data-topup-method]').forEach((b) => b.addEventListener('click', () => { topupMethod = b.dataset.topupMethod; document.querySelectorAll('[data-topup-method]').forEach((x) => x.setAttribute('aria-selected', String(x === b))); }));
  $('#topup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#topup-error'); const a = topupAmount();
    const min = bal ? bal.min : 5, max = bal ? bal.max : 500;
    if (!(a >= min && a <= max)) { err.textContent = 'Entrez un montant entre ' + min + ' $ et ' + max + ' $.'; err.classList.add('show'); return; }
    err.classList.remove('show');
    const btn = e.target.querySelector('[type=submit]');
    FWUI.setLoading(btn, true, 'Paiement...');
    try {
      await FW.balance.topup(a, topupMethod);
      FWUI.closeModal('modal-topup');
      await loadBalance();
      FWUI.toast('Solde rechargé de ' + usd(a));
    } catch (er) { err.textContent = er.message; err.classList.add('show'); }
    FWUI.setLoading(btn, false);
  });
  $('#bal-auto').addEventListener('change', async (e) => {
    const on = e.target.checked;
    try { await FW.balance.setAutoPay(on); if (bal) bal.autoPay = on; FWUI.toast(on ? 'Paiement automatique avec le solde activé' : 'Paiement automatique désactivé : vous recevrez un rappel avant chaque échéance'); await loadBalance(); }
    catch (er) { e.target.checked = !on; FWUI.toast(er.message, 'error'); }
  });
  loadBalance().then(() => { const q = Number(new URLSearchParams(location.search).get('topup')); if (q > 0 && bal) { history.replaceState(null, '', location.pathname); openTopup(q); } });   // lien reçu par e-mail : ?topup=<montant manquant>

  function render() { renderPlans(); renderPm(); renderInvoices(); FWUI.icons(); }
  render();

  /* Lien reçu par e-mail (?renew=1) : renouvelle l'offre en cours. */
  if (new URLSearchParams(location.search).get('renew') && FWSpace.ws().plan && !FW.config.DEMO_MODE) {
    const cur = FWSpace.ws().plan;
    FWUI.confirmDialog({ title: 'Renouveler votre offre', message: 'Régler maintenant l’offre <strong>' + esc(C.PLANS[cur.id].name) + '</strong> par MonCash ou NatCash.', confirmLabel: 'Payer' }).then(async (ok) => {
      if (!ok) return;
      try { await FW.plans.change({ plan: cur.id, cycle: cur.cycle }); FWUI.toast('Offre renouvelée.'); setTimeout(() => location.reload(), 700); } catch (err) { FWUI.toast(err.message, 'error'); }
    });
  }

  /* ---------- Retour de Stripe : ?payment=success|cancelled&order=… ---------- */
  (async function paymentReturn() {
    const q = new URLSearchParams(location.search);
    const state = q.get('payment');
    if (!state) return;
    const order = q.get('order');
    history.replaceState(null, '', location.pathname + location.hash);        // l'URL de retour ne doit pas rester dans l'historique
    if (state === 'cancelled') { FWUI.toast('Paiement annulé : aucun montant n’a été débité.'); return; }
    const banner = document.createElement('div');
    banner.id = 'pay-return-banner'; banner.setAttribute('role', 'status');
    banner.className = 'fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-50 card-elevated p-5 text-center';
    const show = (html, closable) => { banner.innerHTML = '<p class="text-sm text-slate-700">' + html + '</p>' + (closable ? '<button type="button" class="btn btn-outline btn-sm mt-3" data-close-banner>Fermer</button>' : ''); if (!banner.isConnected) document.body.appendChild(banner); };
    banner.addEventListener('click', (e) => { if (e.target.closest('[data-close-banner]')) banner.remove(); });
    if (!order) { FWUI.toast('Paiement reçu. Votre commande est en cours de traitement.'); return; }
    show('Confirmation de votre paiement en cours…');
    try {
      const r = await FW.payments.awaitOrder(order);
      if (r.status === 'succeeded') { banner.remove(); FWUI.toast('Paiement confirmé. Merci !'); setTimeout(() => location.reload(), 900); }
      else if (r.status === 'failed') show('Le paiement n’a pas abouti' + (r.error ? ' : ' + esc(r.error) : '') + '. Aucun montant n’a été débité.', true);
      else show('Votre paiement est en cours de confirmation. Il sera pris en compte automatiquement dans quelques minutes ; vous recevrez un reçu par e-mail.', true);
    } catch (err) { show(esc(err.message), true); }
  })();
})();
