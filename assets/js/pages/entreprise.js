/* Étape facultative après l'inscription : informations de l'entreprise (utilisées sur les factures). */
(function () {
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const session = FW.auth.current();
  if (!session) { location.replace('connexion.html?next=' + encodeURIComponent('entreprise.html')); return; }

  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  const safeNext = next && !/^(https?:)?\/\//.test(next) ? next : null;
  const u = session.user || {};

  $('#co-country').innerHTML = C.COUNTRIES.map((c) => `<option ${c === (u.country || 'Haïti') ? 'selected' : ''}>${c}</option>`).join('');
  $('#co-name').value = u.company || '';
  $('#co-nif').value = u.taxId || '';
  $('#co-address').value = u.address || '';
  $('#co-city').value = u.city || '';
  $('#co-billing').value = u.billingEmail || '';

  /* Étape suivante : le domaine (le nom de l'entreprise sert de première recherche). */
  function goNext() {
    if (safeNext) { location.href = safeNext; return; }
    const n = FW.normalizeDomain($('#co-name').value || u.company || '');
    location.href = 'domaines.html' + (n.error ? '' : '?q=' + encodeURIComponent(n.label.replace(/-/g, '')));
  }
  $('#skip-top').addEventListener('click', (e) => { e.preventDefault(); goNext(); });
  $('#skip-bottom').addEventListener('click', goNext);

  $('#company-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const billing = $('#co-billing').value.trim();
    const bad = billing && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(billing);
    document.querySelector('[data-for="co-billing"]').classList.toggle('show', !!bad);
    if (bad) { $('#co-billing').focus(); return; }
    const patch = {
      company: $('#co-name').value.trim(), taxId: $('#co-nif').value.trim(), address: $('#co-address').value.trim(),
      city: $('#co-city').value.trim(), country: $('#co-country').value, billingEmail: billing,
    };
    const btn = e.target.querySelector('[type=submit]');
    FWUI.setLoading(btn, true, 'Enregistrement...');
    try {
      await FW.auth.updateProfile(patch);
      FWUI.toast('Informations enregistrées.');
      setTimeout(goNext, 500);
    } catch (err) {
      FWUI.setLoading(btn, false);
      $('#company-error').textContent = err.message;
      $('#company-error').classList.add('show');
    }
  });
  FWUI.icons();
})();
