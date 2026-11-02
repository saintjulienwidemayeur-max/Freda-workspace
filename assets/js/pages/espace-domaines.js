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
              <p class="text-sm text-muted mt-0.5 tabular">${d.expires ? `Enregistré le ${FW.date(d.registered)} · expire le ${FW.date(d.expires)} <span class="${days < 30 ? 'text-red-600 font-semibold' : ''}">(${days} j)</span>` : (d.status === 'pending' ? 'Domaine externe · en attente de connexion' : 'Domaine externe · ' + (d.dnsMode === 'records' ? 'DNS conservé chez votre fournisseur' : 'DNS géré par Freda'))}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6 text-sm">
            ${d.external ? `<p class="col-span-2 text-xs text-muted max-w-[22rem]">Renouvellement et verrouillage se gèrent chez le registraire où le domaine est enregistré.</p>` : `<label class="flex items-center gap-3"><span class="switch"><input type="checkbox" data-renew="${esc(d.name)}" ${d.autoRenew ? 'checked' : ''}><span></span></span><span><span class="block font-medium text-ink">Auto-renouvellement</span><span class="text-xs text-muted tabular">${tld ? FW.money(tld.renew) + '/an' : ''}</span></span></label>
            <label class="flex items-center gap-3"><span class="switch"><input type="checkbox" data-lock="${esc(d.name)}" ${d.locked ? 'checked' : ''}><span></span></span><span><span class="block font-medium text-ink">Verrouillage</span><span class="text-xs text-muted">${d.locked ? 'Transfert bloqué' : 'Transfert possible'}</span></span></label>`}
            <div class="col-span-2 sm:col-span-1 flex items-center gap-2">
              ${d.status === 'pending' ? `<button type="button" class="btn btn-primary btn-sm" data-connect="${esc(d.name)}"><i data-lucide="link-2"></i>Connecter</button>` : ''}<a href="dns.html?domain=${encodeURIComponent(d.name)}" class="btn btn-outline btn-sm flex-1"><i data-lucide="server-cog"></i>DNS${ok ? '' : ' <span class="dot bg-amber-500"></span>'}</a>
              <button type="button" class="btn btn-outline btn-icon" data-epp="${esc(d.name)}" aria-label="Code de transfert"><i data-lucide="key-round"></i></button>
            </div>
          </div>
        </div>
      </article>`;
    }).join('');
    FWUI.icons();
  }

  document.addEventListener('change', (e) => {
    const ws = FWSpace.ws();
    const r = e.target.dataset.renew, l = e.target.dataset.lock;
    if (!r && !l) return;
    const d = ws.domains.find((x) => x.name === (r || l));
    if (r) { d.autoRenew = e.target.checked; FWUI.toast('Renouvellement automatique ' + (d.autoRenew ? 'activé' : 'désactivé') + ' pour ' + esc(d.name)); }
    if (l) { d.locked = e.target.checked; FWUI.toast(d.locked ? 'Domaine verrouillé' : 'Domaine déverrouillé : le transfert est possible', d.locked ? 'success' : 'info'); }
    FW.workspace.save(ws);
    render();
  });

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-epp]');
    if (!b) return;
    const d = FWSpace.ws().domains.find((x) => x.name === b.dataset.epp);
    if (d.locked) { FWUI.toast('Déverrouillez le domaine avant de demander le code de transfert.', 'error'); return; }
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
    document.querySelector(`[name="connect-mode"][value="${mode}"]`).checked = true;
    $('#connect-ns').innerHTML = C.NAMESERVERS.map((ns) => `<li class="flex items-center justify-between rounded-lg border border-line px-4 py-2.5"><span class="mono text-sm">${ns}</span>${copyRow(ns)}</li>`).join('');
    $('#connect-records').innerHTML = C.MAIL_DNS_TEMPLATE.map((r) => `<tr><td class="mono text-xs font-bold">${r.type}</td><td class="mono text-xs">${esc(r.name)}</td><td class="mono text-xs"><span class="inline-flex items-center gap-2">${r.priority !== undefined ? r.priority + ' ' : ''}${esc(r.value)}${copyRow(r.value)}</span></td></tr>`).join('');
    toggleMode(mode);
    $('#connect-steps').hidden = false;
    FWUI.icons();
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
    if (d) showSteps(d.name, d.dnsMode || 'nameservers');
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
      await FW.domains.connect(raw, 'nameservers');
      err.classList.remove('show');
      render();
      showSteps(raw, 'nameservers');
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
      else FWUI.toast('Pas encore détecté. La propagation peut prendre jusqu’à 24 h.', 'info');
    } catch (ex) {
      FWUI.toast(ex.message, 'error');
    } finally { FWUI.setLoading(btn, false); }
  });

  if (new URLSearchParams(location.search).get('connect')) openConnect();

  render();
})();
