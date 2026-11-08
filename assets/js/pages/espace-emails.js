/**
 * Espace client — boîtes mail, alias et paramètres IMAP / SMTP.
 * En production, la création passe par le backend qui appelle l'API Purelymail.
 */
(function () {
  if (!window.FWSpace) return;
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const esc = FWUI.esc;
  let ws = FWSpace.ws();
  const plan = FWSpace.plan();
  const perBox = plan ? C.perBoxGb(plan) : 1;

  /* Sans offre : écran d'activation à la place des boîtes */
  if (!plan) {
    const main = document.querySelector('main > div');
    main.innerHTML = `<section class="card p-8 sm:p-12 text-center max-w-2xl mx-auto">
      <span class="w-14 h-14 mx-auto rounded-2xl bg-mist text-freda grid place-items-center"><i data-lucide="mail-plus" class="w-7 h-7"></i></span>
      <h2 class="mt-5 text-2xl font-bold">Activez votre email professionnel</h2>
      <p class="mt-2 text-slate-600">Votre domaine est prêt. Choisissez une offre pour créer vos adresses (contact@, ventes@...). Le DNS est configuré automatiquement et l’application mobile est incluse.</p>
      <a href="../configurer-email.html" class="mt-6 btn btn-cta btn-lg"><i data-lucide="mail-plus"></i>Activer l’email pro</a>
      <p class="mt-3 text-xs text-muted">À partir de ${FW.money(Math.min(...Object.values(C.PLANS).map((p) => p.monthly)))}/mois · sans engagement</p>
    </section>`;
    FWUI.icons();
    return;
  }

  if (C.MAIL_APP_URL || C.WEBMAIL_URL) $('#webmail-link').href = C.MAIL_APP_URL || C.WEBMAIL_URL; else $('#webmail-link').hidden = true;   // application web Freda Mail en priorité

  { // boutons des applications (Android = Google Play, iPhone = version web installable)
    const isStore = (u) => u && !/^https:\/\/play\.google\.com\/(store\/)?$/.test(u);
    const a = $('#app-android'); if (a && isStore(C.PLAY_STORE_URL)) { a.href = C.PLAY_STORE_URL; a.hidden = false; }
    const i = $('#app-ios'); if (i && C.MAIL_APP_URL) i.href = C.MAIL_APP_URL; else if (i) i.hidden = true;
  }

  function render() {
    ws = FWSpace.ws();
    const used = ws.mailboxes.reduce((s, m) => s + m.usedGb, 0);
    const totalGb = C.storageTotal(plan, ws.mailboxes.length);
    $('#plan-badge').textContent = plan.free ? 'Offre gratuite' : 'Offre ' + plan.name;
    $('#box-usage').textContent = C.boxUsage(plan, ws.mailboxes.length);
    $('#box-meter').style.width = (plan.mailboxes === Infinity ? 100 : C.boxPct(plan, ws.mailboxes.length)) + '%';
    // Hors démo, la consommation réelle n'est pas mesurée : on n'affiche que le stockage inclus (jamais un faux « 0 Go utilisé »).
    $('#storage-usage').textContent = C.DEMO_MODE ? used.toFixed(1) + ' / ' + totalGb + ' Go' : totalGb + ' Go inclus';
    $('#storage-meter').style.width = Math.min(100, (used / totalGb) * 100) + '%';
    if (!C.DEMO_MODE && $('#storage-meter').parentElement) $('#storage-meter').parentElement.hidden = true;

    $('#box-body').innerHTML = ws.mailboxes.map((m) => {
      const pct = Math.min(100, (m.usedGb / perBox) * 100);
      return `<tr>
        <td>
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-full bg-mist text-freda grid place-items-center font-bold text-sm shrink-0">${esc(m.address[0].toUpperCase())}</span>
            <div class="min-w-0"><p class="font-medium mono text-sm whitespace-nowrap">${esc(m.address)}</p><p class="text-xs text-muted">${esc(m.name)}</p></div>
          </div>
        </td>
        <td><span class="badge ${m.role === 'Propriétaire' ? 'badge-info' : 'badge-neutral'}">${esc(m.role)}</span></td>
        <td class="min-w-[160px]">${C.DEMO_MODE ? `<div class="flex items-center gap-2"><div class="meter flex-1"><span style="width:${pct}%;${pct > 85 ? 'background:#DC2626' : ''}"></span></div><span class="text-xs text-muted tabular whitespace-nowrap">${m.usedGb.toFixed(1)} / ${perBox.toFixed(0)} Go</span></div>` : `<span class="text-xs text-muted tabular whitespace-nowrap">${perBox.toFixed(0)} Go inclus</span>`}</td>
        <td class="text-sm text-muted tabular whitespace-nowrap">${m.lastLogin ? FW.date(m.lastLogin) : 'Jamais'}</td>
        <td class="text-right whitespace-nowrap">
          <button type="button" class="btn btn-ghost btn-sm" data-reset="${m.id}"><i data-lucide="key-round"></i><span class="hidden md:inline">Mot de passe</span></button>
          <button type="button" class="btn btn-ghost btn-icon hover:!text-red-600 hover:!bg-red-50" data-del="${m.id}" ${m.role === 'Propriétaire' ? 'disabled title="La boîte propriétaire ne peut pas être supprimée"' : ''} aria-label="Supprimer"><i data-lucide="trash-2"></i></button>
        </td>
      </tr>`;
    }).join('');

    $('#alias-list').innerHTML = ws.aliases.length
      ? ws.aliases.map((a) => `
        <li class="px-5 sm:px-6 py-4 flex items-center gap-3">
          <i data-lucide="forward" class="w-4 h-4 text-freda shrink-0"></i>
          <div class="min-w-0 flex-1 text-sm"><p class="mono text-ink truncate">${esc(a.from)}</p><p class="mono text-xs text-muted truncate">→ ${esc(a.to)}</p></div>
          <button type="button" class="btn btn-ghost btn-icon hover:!text-red-600" data-del-alias="${a.id}" aria-label="Supprimer l’alias"><i data-lucide="x"></i></button>
        </li>`).join('')
      : '<li class="p-6 text-sm text-muted text-center">Aucun alias pour le moment.</li>';

    // Un domaine « à connecter » (pending) ne peut pas encore recevoir de boîtes ni d'alias : on ne le propose pas.
    const usable = ws.domains.filter((d) => d.status !== 'pending');
    const domOpts = usable.length ? usable.map((d) => `<option>${esc(d.name)}</option>`).join('') : '<option value="" disabled selected>Connectez d’abord un domaine</option>';
    $('#box-domain').innerHTML = domOpts;
    $('#alias-domain').innerHTML = domOpts;
    $('#alias-to').innerHTML = ws.mailboxes.map((m) => `<option>${esc(m.address)}</option>`).join('');
    FWUI.icons();
  }

  /* ---------- Paramètres serveur ---------- */
  const S = C.MAIL_SERVERS;
  const row = (label, host, port, sec) => `
    <div class="rounded-xl border border-line p-4">
      <dt class="text-xs font-semibold uppercase tracking-wider text-muted">${label}</dt>
      <dd class="mt-1.5 flex items-center gap-2 justify-between flex-wrap">
        <span class="mono text-sm text-ink break-all">${host}</span>
        <span class="flex items-center gap-2"><span class="badge badge-neutral tabular">Port ${port}</span><span class="badge badge-success">${sec}</span>
        <button type="button" class="p-1 text-muted hover:text-freda" data-copy="${host}" data-copy-label="Serveur copié" aria-label="Copier ${host}"><i data-lucide="copy" class="w-4 h-4"></i></button></span>
      </dd>
    </div>`;
  $('#server-cfg').innerHTML = row('Entrant · IMAP', S.imap.host, S.imap.port, S.imap.security) + row('Sortant · SMTP', S.smtp.host, S.smtp.port, S.smtp.security) + `<p class="text-xs text-muted">SMTP alternatif : port ${S.smtp.alt}. POP3 : ${S.pop.host}, port ${S.pop.port}.</p>`;

  /* ---------- Nouvelle boîte ---------- */
  function openBox() {
    if (ws.mailboxes.length >= plan.mailboxes) {
      if (plan.extraMailboxMonthly) {
        // Business : boîte supplémentaire payante
        FWUI.confirmDialog({ title: 'Ajouter une boîte supplémentaire ?', message: 'Votre offre ' + plan.name + ' inclut ' + plan.mailboxes + ' boîtes. Chaque boîte supplémentaire coûte ' + FW.money(plan.extraMailboxMonthly) + ' par mois, ajouté à votre prochaine facture.', confirmLabel: 'Ajouter (+' + FW.money(plan.extraMailboxMonthly) + '/mois)' })
          .then((ok) => { if (ok) showBoxForm(); });
        return;
      }
      FWUI.confirmDialog({ title: 'Limite de votre offre atteinte', message: 'L’offre ' + plan.name + ' inclut ' + plan.mailboxes + ' boîte' + (plan.mailboxes > 1 ? 's' : '') + '. Créez plutôt un alias gratuit, ou changez d’offre.', confirmLabel: 'Voir les offres' })
        .then((ok) => { if (ok) location.href = 'facturation.html#offre'; });
      return;
    }
    showBoxForm();
  }
  /* ---------- Vérification du domaine pour l'email (TXT de propriété) ---------- */
  const ownBox = $('#own-box');
  let ownSeq = 0;
  function renderOwn(r) {
    if (!r || r.status === 'verified' || r.status === 'dns_ok') { ownBox.hidden = true; return; }
    ownBox.hidden = false;
    const external = !!r.external || !r.managedByFreda;
    $('#own-record').hidden = !external || !r.record;
    $('#own-check').hidden = !external;
    if (external && r.record) {
      $('#own-type').textContent = r.record.type; $('#own-name').textContent = r.record.name === '@' ? '@ (la racine du domaine)' : r.record.name; $('#own-value').textContent = r.record.value;
      ownBox.dataset.name = r.record.name; ownBox.dataset.value = r.record.value;
    }
    $('#own-text').textContent = external
      ? 'Ce domaine n’est pas hébergé chez Freda Workspace : ajoutez cet enregistrement TXT chez l’hébergeur de votre DNS (là où vous avez acheté le domaine), puis cliquez sur « Vérifier maintenant ». La propagation peut prendre jusqu’à 15 minutes.'
      : 'La vérification de votre domaine est automatique : elle peut prendre jusqu’à 15 minutes. La boîte pourra être créée dès qu’elle est terminée.';
  }
  async function checkOwnership() {
    const dom = $('#box-domain').value, seq = ++ownSeq;
    ownBox.hidden = true;
    if (FW.config.DEMO_MODE || !dom) return;
    try { const r = await FW.domains.mailOwnership(dom); if (seq === ownSeq) renderOwn(r); }
    catch (e) { /* messagerie non configurée : la création de la boîte affichera l'erreur précise */ }
  }
  $('#box-domain').addEventListener('change', checkOwnership);
  $('#own-check').addEventListener('click', async (e) => { const btn = e.currentTarget; FWUI.setLoading(btn, true, 'Vérification...'); await checkOwnership(); FWUI.setLoading(btn, false); if (!ownBox.hidden) FWUI.toast('Pas encore visible : réessayez dans quelques minutes.'); else FWUI.toast('Domaine vérifié. Vous pouvez créer la boîte.'); });
  ownBox.addEventListener('click', (e) => { const b = e.target.closest('[data-copy-own]'); if (b) FWUI.copy(ownBox.dataset[b.dataset.copyOwn], 'Copié'); });

  function showBoxForm() {
    const wanted = new URLSearchParams(location.search).get('domain');
    $('#box-form').reset();
    if (wanted && [...$('#box-domain').options].some((o) => o.value === wanted)) $('#box-domain').value = wanted;
    $('#box-pass').value = FW.generatePassword();
    $('#box-pass').type = 'password';   // masqué à l'ouverture : l'œil l'affiche
    const eye = $('#show-pass'); eye.setAttribute('aria-label', 'Afficher le mot de passe'); eye.innerHTML = '<i data-lucide="eye"></i>'; FWUI.icons();
    renderPassRules();
    $('#box-error').classList.remove('show');
    FWUI.openModal('modal-box');
    checkOwnership();
  }
  $('#new-box-btn').addEventListener('click', openBox);
  const renderPassRules = FWUI.liveRules($('#box-pass'), $('#box-pass-rules'), () => $('#box-local').value.trim().toLowerCase());
  $('#box-local').addEventListener('input', renderPassRules);
  $('#regen-pass').addEventListener('click', () => { $('#box-pass').value = FW.generatePassword(); renderPassRules(); });
  $('#copy-pass').addEventListener('click', () => FWUI.copy($('#box-pass').value, 'Mot de passe copié'));

  const localOk = (v) => /^[a-z0-9]([a-z0-9._-]{0,62})$/.test(v) && !/\.\./.test(v) && !/\.$/.test(v);

  $('#box-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const local = $('#box-local').value.trim().toLowerCase();
    const bad = !localOk(local);
    $('#box-local').closest('div').classList.toggle('!border-red-500', bad);
    document.querySelector('[data-for="box-local"]').classList.toggle('show', bad);
    if (bad) return;
    if (!$('#box-domain').value) { $('#box-error').textContent = 'Connectez d’abord un domaine : un domaine « à connecter » ne peut pas encore recevoir de boîtes.'; $('#box-error').classList.add('show'); return; }
    if (!FW.passwordRules($('#box-pass').value, local).ok) { $('#box-error').textContent = 'Ce mot de passe ne respecte pas toutes les règles ci-dessus : corrigez-le ou générez-en un autre.'; $('#box-error').classList.add('show'); return; }
    const btn = e.target.querySelector('[type=submit]');
    FWUI.setLoading(btn, true, 'Création...');
    try {
      const box = await FW.mailboxes.create({ local, domain: $('#box-domain').value, name: $('#box-name').value.trim(), password: $('#box-pass').value });
      FWUI.closeModal('modal-box');
      render();
      FWUI.toast(esc(box.address) + (box.providerReady === false ? ' est enregistrée (en attente du serveur de messagerie)' : ' est prête'));
      if (box.initialPassword) {
        const copy = await FWUI.confirmDialog({ title: 'Mot de passe initial', message: `Boîte <span class="mono">${esc(box.address)}</span><br><span class="mono font-semibold text-ink select-all">${esc(box.initialPassword)}</span><br>Il n’est affiché qu’une seule fois. Changez-le à la première connexion.`, confirmLabel: 'Copier' });
        if (copy) FWUI.copy(box.initialPassword, 'Mot de passe copié');
      }
    } catch (err) {
      $('#box-error').textContent = err.message;
      $('#box-error').classList.add('show');
      if (err.code === 'domain_ownership_required' && err.details && err.details.record) renderOwn({ external: true, managedByFreda: false, status: 'pending', record: err.details.record });
      else if (err.code === 'domain_pending_verification') renderOwn({ external: false, managedByFreda: true, status: 'pending' });
    } finally { FWUI.setLoading(btn, false); }
  });

  /* ---------- Alias ---------- */
  $('#alias-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const local = $('#alias-local').value.trim().toLowerCase();
    const bad = !localOk(local);
    document.querySelector('[data-for="alias-local"]').classList.toggle('show', bad);
    if (bad) return;
    const btn = e.target.querySelector('[type=submit]');
    FWUI.setLoading(btn, true, 'Création...');
    try {
      await FW.mailboxes.addAlias(local + '@' + $('#alias-domain').value, $('#alias-to').value);
      FWUI.closeModal('modal-alias');
      e.target.reset();
      render();
      FWUI.toast('Alias créé');
    } catch (err) {
      $('#alias-error').textContent = err.message;
      $('#alias-error').classList.add('show');
    } finally { FWUI.setLoading(btn, false); }
  });

  /* ---------- Actions sur les lignes ---------- */
  document.addEventListener('click', async (e) => {
    const reset = e.target.closest('[data-reset]');
    if (reset) {
      const m = ws.mailboxes.find((x) => x.id === reset.dataset.reset);
      const pass = FW.generatePassword();
      const ok = await FWUI.confirmDialog({ title: 'Réinitialiser le mot de passe', message: `Nouveau mot de passe pour <span class="mono">${esc(m.address)}</span> :<br><span class="mono text-ink font-semibold select-all break-all">${esc(pass)}</span><br>Les appareils connectés devront se reconnecter.`, confirmLabel: 'Copier et appliquer' });
      if (ok) {
        try { await FW.mailboxes.setPassword(m.id, pass); FWUI.copy(pass, 'Nouveau mot de passe appliqué et copié'); }
        catch (err) { FWUI.toast(err.message, 'error'); }
      }
    }
    const del = e.target.closest('[data-del]');
    if (del && !del.disabled) {
      const m = ws.mailboxes.find((x) => x.id === del.dataset.del);
      const ok = await FWUI.confirmDialog({ title: 'Supprimer cette boîte ?', message: `Tous les messages de <span class="mono">${esc(m.address)}</span> seront définitivement effacés. Cette action est irréversible.`, confirmLabel: 'Supprimer la boîte', danger: true });
      if (!ok) return;
      await FW.mailboxes.remove(m.id);
      render();
      FWUI.toast('Boîte supprimée');
    }
    const da = e.target.closest('[data-del-alias]');
    if (da) { await FW.mailboxes.removeAlias(da.dataset.delAlias); render(); FWUI.toast('Alias supprimé'); }
  });

  render();
  if (new URLSearchParams(location.search).get('new')) openBox();
})();
