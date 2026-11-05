/**
 * Espace client — gestion DNS.
 * Diagnostic MX / SPF / DKIM / DMARC, réparation automatique,
 * ajout / modification / suppression d'enregistrements, propagation.
 */
(function () {
  if (!window.FWSpace) return;
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const esc = FWUI.esc;
  const ws = FWSpace.ws();

  const params = new URLSearchParams(location.search);
  let domain = params.get('domain') && ws.domains.some((d) => d.name === params.get('domain')) ? params.get('domain') : (ws.domains[0] || { name: '' }).name;
  let records = [];
  let filterType = 'Tous';
  let query = '';
  let advanced = false;

  /* ---------- Sélecteur de domaine ---------- */
  const sel = $('#domain-select');
  sel.innerHTML = ws.domains.map((d) => `<option value="${esc(d.name)}" ${d.name === domain ? 'selected' : ''}>${esc(d.name)}${d.status === 'pending' ? ' (non connecté)' : ''}</option>`).join('');
  /** Domaine ajouté mais pas encore vérifié : il ne pointe pas vers Freda, ses enregistrements ne sont PAS actifs. */
  const isPending = () => { const d = ws.domains.find((x) => x.name === domain); return !!d && d.status === 'pending'; };
  sel.addEventListener('change', () => {
    domain = sel.value;
    const url = new URL(location.href); url.searchParams.set('domain', domain); history.replaceState(null, '', url);
    $('#propagation').hidden = true;
    load();
  });

  async function load() {
    $('#rec-body').innerHTML = `<tr><td colspan="6"><div class="skeleton h-5 w-full"></div></td></tr>`.repeat(4);
    records = await FW.dns.list(domain);
    render();
  }

  /* ---------- Diagnostic ---------- */
  const DIAG = {
    MX: { title: 'Réception (MX)', desc: 'Les emails envoyés à @' + '{d} arrivent dans vos boîtes.' },
    SPF: { title: 'Expéditeur autorisé (SPF)', desc: 'Les serveurs de Freda peuvent envoyer en votre nom.' },
    DKIM: { title: 'Signature (DKIM)', desc: 'Vos messages sont signés pour prouver leur origine.' },
    DMARC: { title: 'Protection (DMARC)', desc: 'Les faux emails à votre nom sont bloqués.' },
  };
  const STATE = {
    ok: { badge: 'badge-success', icon: 'circle-check', label: 'Valide' },
    partial: { badge: 'badge-warn', icon: 'triangle-alert', label: 'Incomplet' },
    missing: { badge: 'badge-danger', icon: 'circle-x', label: 'Manquant' },
  };

  function renderDiag() {
    if (isPending()) {
      $('#diag-head').innerHTML = `<div class="flex items-center gap-4">
          <span class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 grid place-items-center shrink-0"><i data-lucide="plug-zap"></i></span>
          <div><h2 id="diag-title" class="text-lg font-bold">${esc(domain)} n’est pas encore connecté à Freda</h2><p class="text-sm text-muted">Le domaine ne pointe pas vers nous : les enregistrements ci-dessous ne sont pas actifs. Ajoutez-les chez le service qui gère votre domaine (registrar, hébergeur DNS), puis vérifiez la connexion.</p></div>
        </div>
        <button type="button" id="verify-btn" class="btn btn-cta shrink-0"><i data-lucide="refresh-cw"></i>Vérifier maintenant</button>`;
      $('#diag-grid').innerHTML = '';
      const vb = $('#verify-btn');
      vb && vb.addEventListener('click', async () => {
        FWUI.setLoading(vb, true, 'Vérification...');
        try {
          const r = await FW.domains.verify(domain);
          if (r && r.connected) { FWUI.toast('Domaine connecté.'); setTimeout(() => location.reload(), 600); return; }
          FWUI.toast('Pas encore détecté : les enregistrements peuvent mettre jusqu’à quelques heures à se propager.', 'error');
        } catch (err) { FWUI.toast(err.message, 'error'); }
        FWUI.setLoading(vb, false); FWUI.icons();
      });
      return;
    }
    if (!ws.plan) {
      $('#diag-head').innerHTML = `<div class="flex items-center gap-4"><span class="w-12 h-12 rounded-xl bg-mist text-freda grid place-items-center shrink-0"><i data-lucide="mail-plus"></i></span><div><h2 id="diag-title" class="text-lg font-bold">Email pro non activé</h2><p class="text-sm text-muted">Les enregistrements MX, SPF, DKIM et DMARC seront ajoutés automatiquement à l’activation.</p></div></div><a href="../configurer-email.html" class="btn btn-cta shrink-0"><i data-lucide="mail-plus"></i>Activer l’email pro</a>`;
      $('#diag-grid').innerHTML = '';
      return;
    }
    const h = FW.dns.health(records);
    const issues = Object.values(h).filter((v) => v !== 'ok').length;
    $('#diag-head').innerHTML = issues === 0
      ? `<div class="flex items-center gap-4">
          <span class="w-12 h-12 rounded-xl bg-emerald-50 text-cta grid place-items-center shrink-0"><i data-lucide="shield-check"></i></span>
          <div><h2 id="diag-title" class="text-lg font-bold">Messagerie correctement configurée</h2><p class="text-sm text-muted">Tous les enregistrements email de <span class="mono">${esc(domain)}</span> sont en place.</p></div>
        </div>
        <span class="badge badge-success self-start md:self-auto"><i data-lucide="check"></i>4 / 4 contrôles réussis</span>`
      : `<div class="flex items-center gap-4">
          <span class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 grid place-items-center shrink-0"><i data-lucide="triangle-alert"></i></span>
          <div><h2 id="diag-title" class="text-lg font-bold">${issues} problème${issues > 1 ? 's' : ''} sur ${esc(domain)}</h2><p class="text-sm text-muted">Vos emails risquent d’arriver dans les spams. La réparation ajoute uniquement les enregistrements manquants.</p></div>
        </div>
        <button type="button" id="fix-btn" class="btn btn-cta shrink-0"><i data-lucide="wand-sparkles"></i>Réparer automatiquement</button>`;

    $('#diag-grid').innerHTML = Object.entries(h).map(([k, v]) => `
      <div class="p-5">
        <div class="flex items-center justify-between gap-2">
          <span class="mono text-xs font-bold text-deep tracking-wide">${k}</span>
          <span class="badge ${STATE[v].badge}"><i data-lucide="${STATE[v].icon}"></i>${STATE[v].label}</span>
        </div>
        <p class="mt-3 font-semibold text-ink text-sm">${DIAG[k].title}</p>
        <p class="mt-1 text-xs text-muted leading-relaxed">${DIAG[k].desc.replace('{d}', esc(domain))}</p>
      </div>`).join('');

    const fix = $('#fix-btn');
    fix && fix.addEventListener('click', async () => {
      FWUI.setLoading(fix, true, 'Réparation...');
      const res = await FW.dns.autofix(domain);
      records = await FW.dns.list(domain);
      render();
      FWUI.toast(res.added + ' enregistrement' + (res.added > 1 ? 's' : '') + ' ajouté' + (res.added > 1 ? 's' : '') + '. Propagation en cours.');
    });
  }

  /* ---------- Tableau ---------- */
  const TYPE_COLORS = { A: 'bg-blue-50 text-blue-700', AAAA: 'bg-indigo-50 text-indigo-700', CNAME: 'bg-violet-50 text-violet-700', MX: 'bg-emerald-50 text-emerald-700', TXT: 'bg-amber-50 text-amber-800', SRV: 'bg-pink-50 text-pink-700', CAA: 'bg-slate-100 text-slate-700' };
  const ttlLabel = (t) => t >= 86400 ? (t / 86400) + ' j' : t >= 3600 ? (t / 3600) + ' h' : (t / 60) + ' min';

  function renderFilter() {
    const types = ['Tous', ...new Set(records.map((r) => r.type))];
    $('#type-filter').innerHTML = types.map((t) => `<button type="button" role="tab" aria-selected="${t === filterType}" data-type="${t}" class="px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${t === filterType ? 'bg-ink text-white' : 'text-muted hover:bg-mist'}">${t}</button>`).join('');
  }

  function renderTable() {
    const q = query.toLowerCase();
    const rows = records.filter((r) => (filterType === 'Tous' || r.type === filterType) && (!q || (r.name + ' ' + r.value).toLowerCase().includes(q)));
    const pend = isPending();
    $('#rec-count').textContent = records.length + ' enregistrement' + (records.length > 1 ? 's' : '') + (pend ? ' à ajouter chez votre registrar (pas encore actifs)' : '');
    $('#rec-ttl').hidden = pend;
    if (!rows.length) {
      $('#rec-body').innerHTML = `<tr><td colspan="6" class="!py-10 text-center text-muted">Aucun enregistrement ne correspond au filtre.</td></tr>`;
      return;
    }
    $('#rec-body').innerHTML = rows.map((r) => {
      const locked = r.managed && !advanced;
      return `<tr>
        <td><span class="inline-flex px-2 py-0.5 rounded-md text-xs font-bold mono ${TYPE_COLORS[r.type] || ''}">${r.type}</span></td>
        <td class="mono text-sm whitespace-nowrap">${esc(r.name)}${r.managed ? ` <i data-lucide="lock" class="inline w-3.5 h-3.5 text-muted -mt-0.5" aria-label="Géré par Freda"></i>` : ''}</td>
        <td class="mono text-xs text-slate-600 max-w-[340px]">
          <div class="flex items-center gap-2">
            ${r.priority !== undefined ? `<span class="badge badge-neutral tabular shrink-0">${r.priority}</span>` : ''}
            <span class="truncate" title="${esc(r.value)}">${esc(r.value)}</span>
            <button type="button" class="p-1 text-muted hover:text-freda shrink-0" data-copy="${esc(r.value)}" data-copy-label="Valeur copiée" aria-label="Copier la valeur"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>
          </div>
          ${r.role ? `<span class="text-[11px] text-muted font-sans">${esc(r.role === 'OWNERSHIP' ? 'Vérification email' : r.role)}</span>` : ''}
        </td>
        <td class="text-sm text-muted tabular whitespace-nowrap">${ttlLabel(r.ttl)}</td>
        <td>${pend ? '<span class="badge badge-warn"><span class="dot bg-amber-500"></span>À ajouter</span>' : '<span class="badge badge-success"><span class="dot bg-cta"></span>Actif</span>'}</td>
        <td class="text-right whitespace-nowrap">
          <button type="button" class="btn btn-ghost btn-icon" data-edit="${r.id}" ${locked ? 'disabled title="Activez le mode avancé pour modifier"' : ''} aria-label="Modifier"><i data-lucide="pencil"></i></button>
          <button type="button" class="btn btn-ghost btn-icon hover:!text-red-600 hover:!bg-red-50" data-del="${r.id}" ${locked ? 'disabled title="Activez le mode avancé pour supprimer"' : ''} aria-label="Supprimer"><i data-lucide="trash-2"></i></button>
        </td>
      </tr>`;
    }).join('');
  }

  function render() { renderDiag(); renderFilter(); renderTable(); renderNs(); FWUI.icons(); }

  function renderNs() {
    const nsCfg = FW.dnsConfig();
    const nsCard = document.getElementById('ns-card');
    if (nsCard) nsCard.hidden = !nsCfg.nameserversAvailable;   // pas de serveurs de noms Freda : on n'affiche pas de faux serveurs
    $('#ns-list').innerHTML = nsCfg.nameservers.map((ns, i) => `
      <li class="flex items-center gap-3 rounded-lg border border-line px-4 py-3">
        <span class="text-xs text-muted w-10 tabular">NS${i + 1}</span>
        <span class="mono text-sm text-ink flex-1 truncate">${ns}</span>
        <button type="button" class="p-1 text-muted hover:text-freda" data-copy="${ns}" data-copy-label="Serveur copié" aria-label="Copier"><i data-lucide="copy" class="w-4 h-4"></i></button>
      </li>`).join('');
  }

  $('#type-filter').addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (!b) return; filterType = b.dataset.type; renderFilter(); renderTable(); FWUI.icons(); });
  $('#rec-search').addEventListener('input', (e) => { query = e.target.value; renderTable(); FWUI.icons(); });
  $('#advanced-toggle').addEventListener('change', (e) => {
    advanced = e.target.checked;
    renderTable(); FWUI.icons();
    if (advanced) FWUI.toast('Mode avancé activé. Une erreur sur MX, SPF ou DKIM peut interrompre vos emails.', 'info');
  });

  /* ---------- Formulaire d'enregistrement ---------- */
  const HINTS = {
    A: ['Adresse IPv4', 'Ex. : 76.76.21.21 (fournie par votre hébergeur web).', '76.76.21.21'],
    AAAA: ['Adresse IPv6', 'Ex. : 2606:4700:4700::1111', '2606:4700::1'],
    CNAME: ['Nom cible', 'Ex. : monsite.netlify.app', 'cible.exemple.com'],
    MX: ['Serveur de messagerie', 'Attention : un MX incorrect empêche la réception des emails.', 'mail.exemple.com'],
    TXT: ['Texte', 'Ex. : google-site-verification=..., v=spf1 ...', 'v=spf1 include:... ~all'],
    SRV: ['Cible SRV', 'Format : poids port cible. Ex. : 5 5060 sip.exemple.com', '5 5060 sip.exemple.com'],
    CAA: ['Valeur CAA', 'Ex. : 0 issue "letsencrypt.org"', '0 issue "letsencrypt.org"'],
  };
  const typeSel = $('#rec-type');
  function syncType() {
    const t = typeSel.value;
    $('#prio-wrap').hidden = !['MX', 'SRV'].includes(t);
    $('#rec-value-label').textContent = HINTS[t][0];
    $('#rec-value-hint').textContent = HINTS[t][1];
    $('#rec-value').placeholder = HINTS[t][2];
  }
  typeSel.addEventListener('change', syncType);

  function openForm(rec) {
    $('#rec-id').value = rec ? rec.id : '';
    typeSel.value = rec ? rec.type : 'A';
    typeSel.disabled = !!rec;
    $('#rec-name').value = rec ? rec.name : '';
    $('#rec-value').value = rec ? rec.value : '';
    $('#rec-prio').value = rec && rec.priority !== undefined ? rec.priority : 10;
    $('#rec-ttl').value = rec ? String(rec.ttl) : '3600';
    $('#rec-suffix').textContent = '.' + domain;
    $('#rec-modal-title').textContent = rec ? 'Modifier l’enregistrement' : 'Ajouter un enregistrement';
    $('#rec-submit-label').textContent = rec ? 'Enregistrer' : 'Ajouter';
    document.querySelectorAll('#record-form .field-error').forEach((e) => e.classList.remove('show'));
    document.querySelectorAll('#record-form .is-invalid').forEach((e) => e.classList.remove('is-invalid'));
    syncType();
    FWUI.openModal('modal-record');
  }

  function validateValue(type, v) {
    const ipv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
    const host = /^(?=.{1,253}$)([a-z0-9_]([a-z0-9-_]{0,61}[a-z0-9])?\.)+[a-z]{2,}\.?$/i;
    if (!v) return 'Indiquez une valeur.';
    if (type === 'A' && !ipv4.test(v)) return 'Adresse IPv4 invalide (4 nombres entre 0 et 255 séparés par des points).';
    if (type === 'AAAA' && !/^[0-9a-f:]+$/i.test(v)) return 'Adresse IPv6 invalide.';
    if ((type === 'CNAME' || type === 'MX') && !host.test(v)) return 'Nom de domaine cible invalide.';
    if (type === 'TXT' && v.length > 2048) return 'Texte trop long (2048 caractères maximum).';
    return '';
  }

  $('#record-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = typeSel.value;
    const name = $('#rec-name').value.trim().toLowerCase() || '@';
    const value = $('#rec-value').value.trim();
    const nameOk = name === '@' || /^[a-z0-9_*]([a-z0-9._-]*[a-z0-9])?$/.test(name);
    $('#rec-name').classList.toggle('is-invalid', !nameOk);
    document.querySelector('[data-for="rec-name"]').classList.toggle('show', !nameOk);
    const vErr = validateValue(type, value);
    const ve = document.querySelector('[data-for="rec-value"]');
    ve.textContent = vErr; ve.classList.toggle('show', !!vErr);
    $('#rec-value').classList.toggle('is-invalid', !!vErr);
    if (type === 'CNAME' && name === '@') {
      ve.textContent = 'Un CNAME n’est pas autorisé sur @. Utilisez un enregistrement A.'; ve.classList.add('show'); return;
    }
    if (!nameOk || vErr) return;

    const rec = { type, name, value, ttl: +$('#rec-ttl').value };
    if (['MX', 'SRV'].includes(type)) rec.priority = +$('#rec-prio').value;
    const id = $('#rec-id').value;
    if (id) rec.id = id;
    const btn = e.target.querySelector('[type=submit]');
    FWUI.setLoading(btn, true, 'Enregistrement...');
    await FW.dns.save(domain, rec);
    FWUI.setLoading(btn, false);
    FWUI.closeModal('modal-record');
    records = await FW.dns.list(domain);
    render();
    FWUI.toast(id ? 'Enregistrement mis à jour' : 'Enregistrement ' + type + ' ajouté');
  });

  $('#add-btn').addEventListener('click', () => openForm(null));
  $('#rec-body').addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed && !ed.disabled) openForm(records.find((r) => r.id === ed.dataset.edit));
    const del = e.target.closest('[data-del]');
    if (del && !del.disabled) {
      const r = records.find((x) => x.id === del.dataset.del);
      const ok = await FWUI.confirmDialog({
        title: 'Supprimer cet enregistrement ?',
        message: `${r.type} « ${esc(r.name)} » → <span class="mono">${esc(r.value)}</span>. ${r.managed ? 'Cet enregistrement est nécessaire à vos emails.' : 'Cette action prend effet en quelques minutes.'}`,
        confirmLabel: 'Supprimer', danger: true,
      });
      if (!ok) return;
      await FW.dns.remove(domain, r.id);
      records = await FW.dns.list(domain);
      render();
      FWUI.toast('Enregistrement supprimé');
    }
  });

  /* ---------- Propagation ---------- */
  $('#check-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    FWUI.setLoading(btn, true, 'Vérification...');
    const res = await FW.dns.propagation(domain);
    FWUI.setLoading(btn, false);
    $('#propagation').hidden = false;
    $('#prop-list').innerHTML = res.map((r) => `
      <li class="rounded-xl border ${r.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'} p-4">
        <div class="flex items-center justify-between"><span class="font-semibold text-ink">${r.resolver}</span><i data-lucide="${r.ok ? 'circle-check' : 'clock'}" class="w-5 h-5 ${r.ok ? 'text-cta' : 'text-amber-600'}"></i></div>
        <p class="mono text-xs text-muted mt-1">${r.ip}</p>
        <p class="text-xs mt-2 ${r.ok ? 'text-emerald-700' : 'text-amber-700'}">${r.ok ? 'À jour · ' + r.ms + ' ms' : 'Ancienne valeur en cache'}</p>
      </li>`).join('');
    FWUI.icons();
  });
  $('#close-prop').addEventListener('click', () => { $('#propagation').hidden = true; });

  /* ---------- Export de zone (format BIND) ---------- */
  $('#export-btn').addEventListener('click', () => {
    const lines = ['$ORIGIN ' + domain + '.', '$TTL 3600'];
    records.forEach((r) => {
      const v = r.type === 'TXT' ? '"' + r.value + '"' : (['CNAME', 'MX'].includes(r.type) && !r.value.endsWith('.') ? r.value + '.' : r.value);
      lines.push([r.name, r.ttl, 'IN', r.type, r.priority !== undefined ? r.priority : '', v].filter((x) => x !== '').join('\t'));
    });
    FWUI.copy(lines.join('\n'), 'Fichier de zone copié');
  });

  load();
})();
