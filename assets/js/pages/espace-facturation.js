/**
 * Espace client — offre, changement de plan, moyens de paiement et factures.
 */
(function () {
  if (!window.FWSpace) return;
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const esc = FWUI.esc;
  let viewCycle = FWSpace.ws().plan ? FWSpace.ws().plan.cycle : 'monthly';

  /* ---------- Offres ---------- */
  function renderPlans() {
    const ws = FWSpace.ws();
    document.querySelectorAll('[data-cycle]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.cycle === viewCycle)));
    $('#plan-cards').innerHTML = Object.values(C.PLANS).map((p) => {
      const hasPlan = !!ws.plan;
      const current = hasPlan && ws.plan.id === p.id && ws.plan.cycle === viewCycle;
      const tooSmall = p.mailboxes < ws.mailboxes.length;
      return `<div class="rounded-2xl border-2 p-5 flex flex-col ${current ? 'border-freda bg-mist/50' : 'border-line'}">
        <div class="flex items-center justify-between"><p class="font-bold text-ink">${p.name}</p>${current ? '<span class="badge badge-info">Offre actuelle</span>' : ''}</div>
        <p class="mt-2"><span class="font-display text-3xl font-extrabold text-ink tabular">${FW.money(FW.planPrice(p.id, viewCycle))}</span><span class="text-muted text-sm">${viewCycle === 'yearly' ? '/an' : '/mois'}</span></p>
        <p class="mt-1 text-sm text-muted">${C.boxLabel(p)} · ${C.storageLabel(p)}</p>
        <div class="mt-4 flex items-end">
          ${current ? '<button type="button" class="btn btn-outline btn-sm w-full" disabled>Offre en cours</button>'
            : tooSmall ? `<p class="text-xs text-amber-700">Supprimez ${ws.mailboxes.length - p.mailboxes} boîte(s) pour passer à cette offre.</p>`
            : !hasPlan ? `<a href="../configurer-email.html?plan=${p.id}&cycle=${viewCycle}" class="btn ${p.popular ? 'btn-cta' : 'btn-outline'} btn-sm w-full">Choisir ${p.name}</a>`
            : `<button type="button" class="btn ${p.monthly > C.PLANS[ws.plan.id].monthly ? 'btn-cta' : 'btn-outline'} btn-sm w-full" data-switch="${p.id}">${ws.plan.id === p.id ? 'Passer en ' + (viewCycle === 'yearly' ? 'annuel' : 'mensuel') : 'Choisir ' + p.name}</button>`}
        </div>
      </div>`;
    }).join('');
    $('#renew-line').innerHTML = !ws.plan ? '<i data-lucide="info" class="w-4 h-4"></i>Aucun abonnement email pour le moment. Votre domaine est déjà actif, vous pouvez ajouter l’email pro quand vous voulez.' : `<i data-lucide="calendar-clock" class="w-4 h-4"></i>Prochain renouvellement le ${FW.date(ws.plan.renews)} · ${FW.money(FW.planPrice(ws.plan.id, ws.plan.cycle))}`;
  }
  document.querySelectorAll('[data-cycle]').forEach((b) => b.addEventListener('click', () => { viewCycle = b.dataset.cycle; renderPlans(); FWUI.icons(); }));

  $('#plan-cards').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-switch]');
    if (!b) return;
    const p = C.PLANS[b.dataset.switch];
    const ok = await FWUI.confirmDialog({
      title: 'Changer d’offre',
      message: `Passer à <strong>${p.name}</strong> (${viewCycle === 'yearly' ? 'annuel' : 'mensuel'}) pour ${FW.money(FW.planPrice(p.id, viewCycle))}. La différence est calculée au prorata et réglée avec votre moyen de paiement par défaut.`,
      confirmLabel: 'Confirmer le changement',
    });
    if (!ok) return;
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
          <p class="font-medium text-ink tabular">${m.type === 'card' ? esc(m.brand) + ' •••• ' + esc(m.last4) : esc(m.phone)}</p>
          <p class="text-xs text-muted">${m.type === 'card' ? 'Expire ' + esc(m.exp) : m.type === 'moncash' ? 'Portefeuille MonCash' : 'Portefeuille NatCash'}</p>
        </div>
        ${m.default ? '<span class="badge badge-info">Par défaut</span>' : `<button type="button" class="text-sm font-semibold text-freda hover:underline" data-default="${m.id}">Définir par défaut</button>`}
        ${m.default ? '' : `<button type="button" class="btn btn-ghost btn-icon hover:!text-red-600" data-remove="${m.id}" aria-label="Retirer"><i data-lucide="trash-2"></i></button>`}
      </li>`).join('');
  }
  $('#pm-list').addEventListener('click', async (e) => {
    const ws = FWSpace.ws();
    const d = e.target.closest('[data-default]');
    if (d) { ws.paymentMethods.forEach((m) => { m.default = m.id === d.dataset.default; }); FW.workspace.save(ws); render(); FWUI.toast('Moyen de paiement par défaut mis à jour'); }
    const r = e.target.closest('[data-remove]');
    if (r) {
      const ok = await FWUI.confirmDialog({ title: 'Retirer ce moyen de paiement ?', message: 'Il ne sera plus utilisé pour vos renouvellements.', confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      ws.paymentMethods = ws.paymentMethods.filter((m) => m.id !== r.dataset.remove);
      FW.workspace.save(ws); render();
    }
  });

  /* Ajout */
  let pmType = 'card';
  document.querySelectorAll('[data-pm]').forEach((b) => b.addEventListener('click', () => {
    pmType = b.dataset.pm;
    document.querySelectorAll('[data-pm]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('#pm-card').hidden = pmType !== 'card';
    $('#pm-mobile').hidden = pmType === 'card';
    $('#pm-phone-label').textContent = 'Numéro ' + (pmType === 'moncash' ? 'MonCash' : 'NatCash');
    $('#pm-error').classList.remove('show');
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

  function render() { renderPlans(); renderPm(); renderInvoices(); FWUI.icons(); }
  render();
})();
