/* Espace client — paramètres du compte. */
(function () {
  if (!window.FWSpace) return;
  const $ = (s) => document.querySelector(s);
  const ws = FWSpace.ws();
  const u = ws.user;

  /* Onglets */
  const tabs = document.querySelectorAll('[data-tab]');
  function show(id) {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== id; });
  }
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));

  /* Profil & entreprise */
  $('#avatar').textContent = u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  $('#pf-name').value = u.name; $('#pf-email').value = u.email; $('#pf-phone').value = u.phone || '';
  $('#co-name').value = u.company || ''; $('#co-city').value = u.city || ''; $('#co-nif').value = u.taxId || '';
  $('#co-address').value = u.address || ''; $('#co-billing').value = u.billingEmail || '';
  $('#co-country').innerHTML = FW.config.COUNTRIES.map((c) => `<option ${c === (u.country || 'Haïti') ? 'selected' : ''}>${c}</option>`).join('');

  /* Ouverture directe sur un onglet : parametres.html?tab=entreprise */
  const wanted = new URLSearchParams(location.search).get('tab');
  if (wanted && document.querySelector(`[data-tab="${wanted}"]`)) show(wanted);

  async function save(f, patch) {
    const btn = f.querySelector('[type=submit]');
    FWUI.setLoading(btn, true, 'Enregistrement...');
    try {
      await FW.auth.updateProfile(patch);
      const s = FWSpace.ws(); Object.assign(s.user, patch); FW.workspace.save(s);
      FWUI.toast('Modifications enregistrées');
    } catch (err) { FWUI.toast(err.message, 'error'); }
    FWUI.setLoading(btn, false);
  }
  document.querySelector('[data-panel="profil"]').addEventListener('submit', (e) => {
    e.preventDefault();
    save(e.target, { name: $('#pf-name').value.trim() || u.name, email: $('#pf-email').value.trim() || u.email, phone: $('#pf-phone').value.trim() });
  });
  document.querySelector('[data-panel="entreprise"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const billing = $('#co-billing').value.trim();
    const bad = billing && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(billing);
    document.querySelector('[data-for="co-billing"]').classList.toggle('show', !!bad);
    if (bad) { $('#co-billing').focus(); return; }
    save(e.target, { company: $('#co-name').value.trim(), taxId: $('#co-nif').value.trim(), address: $('#co-address').value.trim(), city: $('#co-city').value.trim(), country: $('#co-country').value, billingEmail: billing });
  });

  /* Sécurité */
  $('#mfa-toggle').addEventListener('change', (e) => {
    $('#mfa-label').textContent = e.target.checked ? 'Activée' : 'Désactivée';
    FWUI.toast(e.target.checked ? 'Double authentification activée. Scannez le QR code reçu par email.' : 'Double authentification désactivée', e.target.checked ? 'success' : 'info');
  });
  $('#pass-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('#pw-error');
    if (!$('#pw-old').value || $('#pw-new').value.length < 8) { err.textContent = 'Entrez votre mot de passe actuel et un nouveau mot de passe de 8 caractères minimum.'; err.classList.add('show'); return; }
    err.classList.remove('show');
    FW.auth.changePassword($('#pw-old').value, $('#pw-new').value)
      .then(() => { e.target.reset(); FWUI.toast('Mot de passe mis à jour'); })
      .catch((er) => { err.textContent = er.message; err.classList.add('show'); });
  });

  const linked = { google: true, apple: false };
  function renderOauth() {
    $('#oauth-list').innerHTML = ['google', 'apple'].map((p) => `
      <li class="p-5 sm:p-6 flex items-center gap-4">
        <span class="w-10 h-10 rounded-lg border border-line grid place-items-center shrink-0 ${p === 'apple' ? 'text-ink' : ''}">${FWUI.BRAND[p]}</span>
        <div class="flex-1 min-w-0"><p class="font-semibold text-ink">${p === 'google' ? 'Google' : 'Apple'}</p><p class="text-sm text-muted truncate">${linked[p] ? 'Connecté · ' + FWUI.esc(u.email) : 'Non connecté'}</p></div>
        <button type="button" class="btn ${linked[p] ? 'btn-ghost' : 'btn-outline'} btn-sm" data-link="${p}">${linked[p] ? 'Dissocier' : 'Connecter'}</button>
      </li>`).join('');
  }
  $('#oauth-list').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-link]');
    if (!b) return;
    const p = b.dataset.link;
    if (!linked[p]) { FWUI.setLoading(b, true, 'Connexion...'); await FW.wait(800); }
    linked[p] = !linked[p];
    renderOauth();
    FWUI.toast((p === 'google' ? 'Google' : 'Apple') + (linked[p] ? ' connecté' : ' dissocié'));
  });
  renderOauth();

  $('#delete-account').addEventListener('click', async () => {
    const ok = await FWUI.confirmDialog({ title: 'Supprimer définitivement le compte ?', message: 'Toutes vos boîtes mail et leurs messages seront effacés sous 30 jours. Cette action ne peut pas être annulée.', confirmLabel: 'Je comprends, supprimer', danger: true });
    if (ok) FWUI.toast('Demande de suppression enregistrée. Un email de confirmation vous a été envoyé.', 'info');
  });

  /* Hors démo, ces fonctions n'ont pas encore de backend : on ne montre pas de faux boutons. */
  if (!FW.config.DEMO_MODE) {
    const hide = (el, sel) => { const box = el && el.closest(sel); if (box) box.hidden = true; };
    hide($('#mfa-toggle'), 'div.justify-between'); hide($('#oauth-list'), 'section'); hide($('#delete-account'), 'section');
    const dtab = document.querySelector('[data-tab="notifications"]'); if (dtab) dtab.hidden = true;
  }

  /* Notifications */
  const NOTIFS = [
    ['Renouvellement à venir', 'Rappel 30 jours et 7 jours avant chaque échéance.', true],
    ['Reçus de paiement', 'Un reçu après chaque paiement carte, MonCash ou NatCash.', true],
    ['Alertes de stockage', 'Quand une boîte dépasse 85 % de son espace.', true],
    ['Problèmes DNS', 'Si un enregistrement email devient invalide.', true],
    ['Nouveautés Freda Workspace', 'Nouvelles fonctionnalités, au plus une fois par mois.', false],
  ];
  $('#notif-list').innerHTML = NOTIFS.map(([t, d, on], i) => `
    <label class="p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer">
      <span><span class="block font-semibold text-ink">${t}</span><span class="block text-sm text-muted">${d}</span></span>
      <span class="switch"><input type="checkbox" ${on ? 'checked' : ''} data-notif="${i}"><span></span></span>
    </label>`).join('');
  $('#notif-list').addEventListener('change', () => FWUI.toast('Préférences enregistrées'));

  FWUI.icons();
})();
