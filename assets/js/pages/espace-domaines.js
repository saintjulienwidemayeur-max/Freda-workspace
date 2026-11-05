/* Espace client — liste des domaines, renouvellement, verrouillage, connexion d'un domaine externe. */
(function () {
  if (!window.FWSpace) return;
  const C = FW.config, esc = FWUI.esc, $ = (s) => document.querySelector(s);

  function render() {
    const ws = FWSpace.ws();
    $('#domain-cards').innerHTML = ws.domains.map((d) => {
      const days = d.expires ? Math.ceil((new Date(d.expires) - new Date()) / 86400000) : null;
      const h = FW.dns.health(ws.dns[d.name] || []);
      const ok = !ws.plan || Object.values(h).every((v) => v === 'ok');
      const tld = C.TLDS.find((t) => d.name.endsWith(t.tld));
      return `<article class="card p-5 sm:p-6">
        <div class="flex flex-col lg:flex-row lg:items-center gap-5">
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <span class="w-12 h-12 rounded-xl bg-mist text-freda grid place-items-center shrink-0"><i data-lucide="globe"></i></span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-bold mono truncate">${esc(d.name)}</h2>
                ${d.primary ? '<span class="badge badge-info">Principal</span>' : ''}
                ${d.status === 'pending' ? '<span class="badge badge-warn"><span class="dot bg-amber-500"></span>À connecter</span>' : '<span class="badge badge-success"><span class="dot bg-cta"></span>Actif</span>'}
              </div>
              <p class="text-sm text-muted mt-0.5 tabular">${d.expires ? `Enregistré le ${FW.date(d.registered)} · expire le ${FW.date(d.expires)} <span class="${days < 30 ? 'text-red-600 font-semibold' : ''}">(${days} j)</span>` : (d.status === 'pending' ? 'Domaine externe · en attente de connexion' : 'Domaine externe · ' + (d.dnsMode === 'records' ? 'DNS conservé chez votre fournisseur' : 'DNS géré par Freda Workspace'))}</p>
              ${d.external ? `<p class="text-xs text-muted mt-1">Renouvellement et verrouillage se gèrent chez le registraire où le domaine est enregistré.</p>` : ''}
            </div>
          </div>
          <div class="${d.external ? 'flex' : 'grid grid-cols-2 sm:grid-cols-3'} gap-4 lg:gap-6 text-sm">
            ${d.external ? '' : `<label class="flex items-center gap-3"><span class="switch"><input type="checkbox" data-renew="${esc(d.name)}" ${d.autoRenew ? 'checked' : ''}><span></span></span><span><span class="block font-medium text-ink">Auto-renouvellement</span><span class="text-xs text-muted tabular">${tld ? FW.money(tld.renew) + '/an' : ''}</span></span></label>
            <label class="flex items-center gap-3"><span class="switch"><input type="checkbox" data-lock="${esc(d.name)}" ${d.locked ? 'checked' : ''}><span></span></span><span><span class="block font-medium text-ink">Verrouillage</span><span class="text-xs text-muted">${d.locked ? 'Transfert bloqué' : 'Transfert possible'}</span></span></label>`}
            <div class="col-span-2 sm:col-span-1 flex items-center gap-2">
              ${d.status === 'pending' ? `<button type="button" class="btn btn-primary btn-sm" data-connect="${esc(d.name)}"><i data-lucide="link-2"></i>Connecter</button>` : ''}<a href="dns.html?domain=${encodeURIComponent(d.name)}" class="btn btn-outline btn-sm flex-1"><i data-lucide="server-cog"></i>DNS${ok ? '' : ' <span class="dot bg-amber-500"></span>'}</a>
              ${d.external ? '' : `<button type="button" class="btn btn-outline btn-sm" data-renew-btn="${esc(d.name)}"><i data-lucide="refresh-cw"></i>Renouveler</button>`}
              <button type="button" class="btn btn-outline btn-icon" data-epp="${esc(d.name)}" aria-label="Code de transfert"><i data-lucide="key-round"></i></button>
            </div>
          </div>
        </div>
      </article>`;
    }).join('');
    FWUI.icons();
  }

  document.addEventListener('change', async (e) => {
    const r = e.target.dataset.renew, l = e.target.dataset.lock;
    if (!r && !l) return;
    const name = r || l;
    const patch = r ? { autoRenew: e.target.checked } : { locked: e.target.checked };
    try { await FW.domains.update(name, patch); }
    catch (err) { FWUI.toast(err.message, 'error'); render(); return; }
    if (r) FWUI.toast('Rappels de renouvellement ' + (patch.autoRenew ? 'activés' : 'désactivés') + ' pour ' + esc(name));
    if (l) FWUI.toast(patch.locked ? 'Domaine verrouillé' : 'Domaine déverrouillé : le transfert est possible', patch.locked ? 'success' : 'info');
    render();
  });

  /* Renouvellement (bouton « Renouveler » ou lien ?renew=domaine reçu par e-mail) */
  async function renewDomain(name) {
    const d = FWSpace.ws().domains.find((x) => x.name === name);
    if (!d || d.external) return;
    const tld = C.TLDS.find((t) => name.endsWith(t.tld));
    const ok = await FWUI.confirmDialog({ title: 'Renouveler ' + name, message: `Renouvellement d’un an${tld ? ' pour <strong>' + FW.money(tld.renew) + '</strong>' : ''}.`, confirmLabel: 'Continuer' });
    if (!ok) return;
    const pay = await FWUI.choosePayment({ amount: tld ? tld.renew : 0, title: 'Renouveler ' + name });
    if (!pay) return;
    try { await FW.domains.renew(name, 1, pay); FWUI.toast('Domaine ' + name + ' renouvelé.'); render(); }
    catch (err) { FWUI.toast(err.message, 'error'); }
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-renew-btn]'); if (b) renewDomain(b.dataset.renewBtn); });
  const wantRenew = new URLSearchParams(location.search).get('renew');
  if (wantRenew) renewDomain(wantRenew);

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-epp]');
    if (!b) return;
    const d = FWSpace.ws().domains.find((x) => x.name === b.dataset.epp);
    if (d.locked) { FWUI.toast('Déverrouillez le domaine avant de demander le code de transfert.', 'error'); return; }
    if (!C.DEMO_MODE) {
      try { const r = await FW.domains.requestTransferCode(d.name); FWUI.toast(r.message || 'Demande enregistrée.', 'success'); }
      catch (err) { FWUI.toast(err.message, 'error'); }
      return;
    }
    const code = FW.generatePassword(12);
    const ok = await FWUI.confirmDialog({ title: 'Code de transfert (EPP)', message: `Code pour <span class="mono">${esc(d.name)}</span> :<br><span class="mono font-semibold text-ink select-all">${esc(code)}</span><br>Valable 7 jours. Donnez-le uniquement au nouveau registraire.`, confirmLabel: 'Copier le code' });
    if (ok) FWUI.copy(code, 'Code copié');
  });

  /* Ajout d'un domaine existant */
  let current = null;
  const copyRow = (v) => `<button type="button" class="p-1 text-muted hover:text-freda" data-copy="${esc(v)}" aria-label="Copier"><i data-lucide="copy" class="w-4 h-4"></i></button>`;
  function showSteps(name, mode) {
    current = name;
    $('#connect-form').hidden = true;
    $('#connect-name').textContent = name;
    const cfgDns = FW.dnsConfig();
    if (!cfgDns.nameserversAvailable) mode = 'records';   // pas de serveurs de noms Freda Workspace réels : seule la méthode « enregistrements » est sûre
    const nsRadio = document.querySelector('[name="connect-mode"][value="nameservers"]');
    if (nsRadio) nsRadio.closest('label').hidden = !cfgDns.nameserversAvailable;
    document.querySelector(`[name="connect-mode"][value="${mode}"]`).checked = true;
    $('#connect-ns').innerHTML = cfgDns.nameservers.map((ns) => `<li class="flex items-center justify-between rounded-lg border border-line px-4 py-2.5"><span class="mono text-sm">${ns}</span>${copyRow(ns)}</li>`).join('');
    $('#connect-records').innerHTML = (cfgDns.mailTemplate || C.MAIL_DNS_TEMPLATE).map((r) => `<tr><td class="mono text-xs font-bold">${r.type}</td><td class="mono text-xs">${esc(r.name)}</td><td class="mono text-xs"><span class="inline-flex items-center gap-2">${r.priority !== undefined ? r.priority + ' ' : ''}${esc(r.value)}${copyRow(r.value)}</span></td></tr>`).join('');
    toggleMode(mode);
    $('#connect-steps').hidden = false;
    FWUI.icons();
    addOwnershipRow(name);
  }
  /** Mode « enregistrements » : le TXT de preuve de propriété est indispensable pour activer l'email (hors démo). */
  async function addOwnershipRow(name) {
    if (C.DEMO_MODE) return;
    try {
      const r = await FW.domains.mailOwnership(name);
      if (current !== name || !r || !r.record || r.status === 'verified') return;
      const row = `<tr><td class="mono text-xs font-bold">${esc(r.record.type)}</td><td class="mono text-xs">${esc(r.record.name)}</td><td class="mono text-xs"><span class="inline-flex items-center gap-2">${esc(r.record.value)}${copyRow(r.record.value)}</span></td></tr>`;
      $('#connect-records').insertAdjacentHTML('afterbegin', row);
      FWUI.icons();
    } catch (e) { /* messagerie non configurée : la page Emails affichera l'enregistrement quand nécessaire */ }
  }
  function toggleMode(mode) {
    $('#mode-nameservers').hidden = mode !== 'nameservers';
    $('#mode-records').hidden = mode !== 'records';
  }
  function openConnect(name) {
    const d = name && FWSpace.ws().domains.find((x) => x.name === name);
    $('#connect-error').classList.remove('show');
    $('#connect-domain').value = '';
    $('#connect-form').hidden = !!d;
    $('#connect-steps').hidden = true;
    FWUI.openModal('modal-connect');
    if (d) showSteps(d.name, d.dnsMode || (FW.dnsConfig().nameserversAvailable ? 'nameservers' : 'records'));
  }
  document.querySelectorAll('[name="connect-mode"]').forEach((r) => r.addEventListener('change', () => { toggleMode(r.value); if (current) FW.domains.setMode(current, r.value); }));
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-connect]'); if (b) openConnect(b.dataset.connect); });
  document.querySelector('[data-open="modal-connect"]').addEventListener('click', () => { $('#connect-form').hidden = false; $('#connect-steps').hidden = true; $('#connect-error').classList.remove('show'); });

  $('#connect-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = $('#connect-domain').value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    const err = $('#connect-error');
    const valid = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(raw);
    if (!valid) { err.textContent = 'Entrez un domaine complet, par exemple monentreprise.com.'; err.classList.add('show'); return; }
    const btn = $('#connect-submit');
    FWUI.setLoading(btn, true, 'Ajout...');
    try {
      const startMode = FW.dnsConfig().nameserversAvailable ? 'nameservers' : 'records';
      await FW.domains.connect(raw, startMode);
      err.classList.remove('show');
      render();
      showSteps(raw, startMode);
    } catch (ex) {
      err.textContent = ex.message; err.classList.add('show');
    } finally { FWUI.setLoading(btn, false); }
  });

  $('#connect-done').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    FWUI.setLoading(btn, true, 'Vérification...');
    try {
      const res = await FW.domains.verify(current);
      FWUI.closeModal('modal-connect');
      render();
      if (res.connected) FWUI.toast('Domaine ' + current + ' connecté. Vous pouvez gérer son DNS.', 'success');
      else FWUI.toast('Pas encore détecté' + (res.missing && res.missing.length ? ' (manque : ' + res.missing.join(', ') + ')' : '') + '. La propagation est souvent rapide (15 min) mais peut prendre jusqu’à 24 à 48 h ; réessayez plus tard.', 'info');
    } catch (ex) {
      FWUI.toast(ex.message, 'error');
    } finally { FWUI.setLoading(btn, false); }
  });

  if (new URLSearchParams(location.search).get('connect')) openConnect();

  render();
})();
