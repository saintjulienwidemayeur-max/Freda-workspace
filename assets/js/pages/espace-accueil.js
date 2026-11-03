/**
 * Espace client — vue d'ensemble.
 */
(function () {
  if (!window.FWSpace) return;
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const esc = FWUI.esc;
  const ws = FWSpace.ws();
  const plan = FWSpace.plan();

  $('#today').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('#first-name').textContent = (ws.user.name || '').split(' ')[0];
  $('#company-line').textContent = ws.user.company ? ws.user.company + ' · ' + ws.domains.length + ' domaine' + (ws.domains.length > 1 ? 's' : '') : '';
  $('#dl-ios').href = C.APP_STORE_URL;
  $('#dl-android').href = C.PLAY_STORE_URL;
  const genericStore = (u) => !u || /^https:\/\/(apps\.apple\.com|play\.google\.com)\/(store\/)?$/.test(u);
  if (!C.DEMO_MODE && (genericStore(C.APP_STORE_URL) || genericStore(C.PLAY_STORE_URL))) { const sec = $('#dl-ios').closest('section'); if (sec) sec.hidden = true; }

  /* ---------- Indicateurs ---------- */
  const used = ws.mailboxes.reduce((s, m) => s + m.usedGb, 0);
  const totalGb = plan ? C.storageTotal(plan, ws.mailboxes.length) : 0;
  const nextExpiry = ws.domains.map((d) => d.expires).filter(Boolean).sort()[0];
  const daysTo = (iso) => Math.ceil((new Date(iso) - new Date()) / 86400000);
  const stats = [
    { icon: 'globe', label: 'Domaines', value: ws.domains.length, sub: nextExpiry ? 'Prochaine échéance dans ' + daysTo(nextExpiry) + ' j' : 'Aucune échéance', href: 'domaines.html' },
    plan ? { icon: 'mail', label: 'Boîtes mail', value: C.boxUsage(plan, ws.mailboxes.length), sub: ws.aliases.length + ' alias actifs', href: 'emails.html' }
      : { icon: 'mail', label: 'Boîtes mail', value: '—', sub: 'Messagerie non activée', href: 'emails.html' },
    plan ? { icon: 'hard-drive', label: 'Stockage', value: used.toFixed(1) + ' Go', sub: 'sur ' + totalGb + ' Go inclus', meter: used / totalGb, href: 'emails.html' }
      : { icon: 'hard-drive', label: 'Stockage', value: '—', sub: 'Aucune offre email', href: 'emails.html' },
    plan ? { icon: 'calendar-clock', label: 'Prochaine facture', value: FW.money(FW.planPrice(ws.plan.id, ws.plan.cycle)), sub: 'le ' + FW.date(ws.plan.renews), href: 'facturation.html' }
      : { icon: 'calendar-clock', label: 'Abonnement', value: 'Aucun', sub: 'Domaine payé à l’année', href: 'facturation.html' },
  ];
  $('#stats').innerHTML = stats.map((s) => `
    <a href="${s.href}" class="card p-5 hover:border-freda/40 hover:shadow-md transition-all group">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted">${s.label}</span>
        <span class="w-9 h-9 rounded-lg bg-mist text-freda grid place-items-center"><i data-lucide="${s.icon}" class="w-[18px] h-[18px]"></i></span>
      </div>
      <p class="mt-3 font-display text-2xl sm:text-[1.75rem] font-extrabold text-ink tabular">${s.value}</p>
      ${s.meter !== undefined ? `<div class="meter mt-2"><span style="width:${Math.min(100, s.meter * 100).toFixed(0)}%"></span></div>` : ''}
      <p class="mt-1.5 text-xs text-muted tabular">${s.sub}</p>
    </a>`).join('');

  /* ---------- Profil entreprise incomplet : invitation à le compléter (utilisé sur les factures) ---------- */
  const profile = ws.user || {};
  const missing = [!profile.company && 'raison sociale', !profile.address && 'adresse'].filter(Boolean);
  if (missing.length) {
    $('#stats').insertAdjacentHTML('beforebegin', `
      <a href="parametres.html?tab=entreprise" class="flex items-center gap-4 rounded-2xl border border-freda/25 bg-mist p-4 sm:p-5 hover:border-freda/50 transition-colors">
        <span class="w-11 h-11 rounded-xl bg-white text-freda grid place-items-center shrink-0 shadow-sm"><i data-lucide="building-2"></i></span>
        <span class="min-w-0 flex-1"><span class="block font-semibold text-ink">Complétez les informations de votre entreprise</span><span class="block text-sm text-slate-600">Il manque la ${missing.join(' et l’')} : elles apparaissent sur vos factures PDF.</span></span>
        <span class="btn btn-primary btn-sm shrink-0 hidden sm:inline-flex">Compléter<i data-lucide="arrow-right"></i></span>
      </a>`);
  }

  /* ---------- Santé messagerie ---------- */
  const label = { ok: ['Valide', 'badge-success', 'circle-check'], partial: ['Incomplet', 'badge-warn', 'triangle-alert'], missing: ['Manquant', 'badge-danger', 'circle-x'] };
  $('#health-list').innerHTML = !plan ? `<li class="p-6 sm:p-8 text-center">
      <span class="w-12 h-12 mx-auto rounded-xl bg-mist text-freda grid place-items-center"><i data-lucide="mail-plus"></i></span>
      <p class="mt-4 font-semibold text-ink">Ajoutez une adresse email à votre domaine</p>
      <p class="mt-1 text-sm text-muted max-w-md mx-auto">Le domaine de votre entreprise est prêt. Activez la messagerie professionnelle quand vous le souhaitez : les enregistrements MX, SPF, DKIM et DMARC sont configurés automatiquement.</p>
      <a href="../configurer-email.html" class="mt-5 btn btn-cta btn-sm"><i data-lucide="mail-plus"></i>Activer l’email pro</a>
    </li>` : ws.domains.map((d) => {
    const h = FW.dns.health(ws.dns[d.name] || []);
    const allOk = Object.values(h).every((v) => v === 'ok');
    return `<li class="p-5 sm:p-6">
      <div class="flex items-center gap-3 justify-between flex-wrap">
        <p class="font-semibold mono text-ink flex items-center gap-2 min-w-0"><i data-lucide="globe" class="w-4 h-4 text-freda shrink-0"></i><span class="truncate">${esc(d.name)}</span></p>
        ${allOk ? '<span class="badge badge-success"><i data-lucide="shield-check"></i>Délivrabilité optimale</span>'
          : `<a href="dns.html?domain=${encodeURIComponent(d.name)}" class="badge badge-warn hover:underline"><i data-lucide="wrench"></i>Action requise</a>`}
      </div>
      <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        ${Object.entries(h).map(([k, v]) => `<div class="rounded-lg border border-line px-3 py-2.5 flex flex-col items-start gap-1.5"><span class="mono text-xs font-semibold text-ink">${k}</span><span class="badge ${label[v][1]}"><i data-lucide="${label[v][2]}"></i>${label[v][0]}</span></div>`).join('')}
      </div>
    </li>`;
  }).join('');

  /* ---------- Boîtes ---------- */
  const perBox = plan ? C.perBoxGb(plan) : 1;
  $('#mb-list').innerHTML = !ws.mailboxes.length ? '<li class="p-6 text-sm text-muted text-center">Aucune boîte mail pour le moment.</li>' : ws.mailboxes.slice(0, 4).map((m) => `
    <li class="px-5 sm:px-6 py-4 flex items-center gap-3">
      <span class="w-9 h-9 rounded-full bg-mist text-freda grid place-items-center font-bold text-sm shrink-0">${esc(m.address[0].toUpperCase())}</span>
      <div class="min-w-0 flex-1">
        <p class="font-medium mono text-sm text-ink truncate">${esc(m.address)}</p>
        <div class="mt-1.5 flex items-center gap-2"><div class="meter flex-1 max-w-[160px]"><span style="width:${Math.min(100, (m.usedGb / perBox) * 100).toFixed(0)}%"></span></div><span class="text-xs text-muted tabular">${m.usedGb.toFixed(1)} Go</span></div>
      </div>
      <span class="hidden sm:block"><span class="badge badge-neutral">${esc(m.role)}</span></span>
    </li>`).join('');

  /* ---------- Activité ---------- */
  $('#activity').innerHTML = ws.activity.slice(0, 5).map((a) => `
    <li class="flex gap-3">
      <span class="w-8 h-8 rounded-lg bg-mist text-freda grid place-items-center shrink-0"><i data-lucide="${a.icon}" class="w-4 h-4"></i></span>
      <div class="min-w-0"><p class="text-sm text-ink">${esc(a.text)}</p><p class="text-xs text-muted tabular">${FW.date(a.at.slice(0, 10))} · ${a.at.slice(11)}</p></div>
    </li>`).join('');

  FWUI.icons();
})();
