/**
 * Connexion, inscription, mot de passe oublié et accès webmail.
 * Utilisé par connexion.html et inscription.html.
 */
(function () {
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  /* Redirection après connexion (uniquement vers une page du site). */
  function goNext() {
    const safe = next && !/^(https?:)?\/\//.test(next) ? next : 'espace/';
    location.href = safe.replace(/^\//, '');
  }

  function fieldError(id, show) {
    const input = document.getElementById(id);
    const err = document.querySelector('[data-for="' + id + '"]');
    input && input.classList.toggle('is-invalid', show);
    err && err.classList.toggle('show', show);
    return !show;
  }

  /* Venu du panier : garde la destination d'une page à l'autre et l'explique */
  if (next) {
    document.querySelectorAll('a[href="inscription"], a[href="connexion"]').forEach((a) => { a.href = a.getAttribute('href') + '?next=' + encodeURIComponent(next); });
    const h1 = document.querySelector('h1');
    if (h1 && /paiement|email-pro/.test(next)) h1.insertAdjacentHTML('afterend', '<p class="mt-3 flex items-start gap-2 rounded-xl bg-mist text-deep text-sm p-3.5"><i data-lucide="shopping-cart" class="w-4 h-4 mt-0.5 shrink-0"></i><span>Identifiez-vous pour finaliser votre commande. Votre sélection est conservée.</span></p>');
  }

  /* Logos Google / Apple */
  document.querySelectorAll('[data-brand]').forEach((el) => { el.outerHTML = FWUI.BRAND[el.dataset.brand]; });

  /* ---------- Google / Apple ---------- */
  document.querySelectorAll('[data-oauth]').forEach((b) => b.addEventListener('click', async () => {
    const name = b.dataset.oauth === 'google' ? 'Google' : 'Apple';
    FWUI.setLoading(b, true, 'Connexion à ' + name + '...');
    try {
      await FW.auth.oauth(b.dataset.oauth);
      FWUI.toast('Connecté avec ' + name);
      setTimeout(goNext, 500);
    } catch (e) {
      FWUI.toast('La connexion avec ' + name + ' a échoué. Réessayez.', 'error');
      FWUI.setLoading(b, false);
    }
  }));

  /* ======================= CONNEXION ======================= */
  const loginForm = $('#login-form');
  if (loginForm) {
    const tabs = { client: $('#tab-client'), webmail: $('#tab-webmail') };
    function showTab(t) {
      tabs.client.setAttribute('aria-selected', String(t === 'client'));
      tabs.webmail.setAttribute('aria-selected', String(t === 'webmail'));
      $('#panel-client').hidden = t !== 'client';
      $('#panel-webmail').hidden = t !== 'webmail';
      $('#panel-reset').hidden = true;
    }
    tabs.client.addEventListener('click', () => showTab('client'));
    tabs.webmail.addEventListener('click', () => showTab('webmail'));
    if (!C.WEBMAIL_URL) { tabs.webmail.hidden = true; $('#panel-webmail').hidden = true; }   // pas de webmail confirmé : seule la connexion à l'espace client
    else if (params.get('mode') === 'webmail') showTab('webmail');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      $('#login-error').classList.remove('show');
      const email = $('#login-email').value;
      const pass = $('#login-pass').value;
      let ok = fieldError('login-email', !emailOk(email));
      ok = fieldError('login-pass', !pass) && ok;
      if (!ok) return;
      const btn = loginForm.querySelector('[type=submit]');
      FWUI.setLoading(btn, true, 'Connexion...');
      try {
        await FW.auth.login(email.trim(), pass);
        goNext();
      } catch (err) {
        FWUI.setLoading(btn, false);
        $('#login-error').textContent = err.message;
        $('#login-error').classList.add('show');
      }
    });

    /* Retour de Google (connexion.html#token=…) et lien de réinitialisation (?reset=…) */
    if (location.hash.includes('token=') || location.hash.includes('error=')) {
      FW.auth.completeOAuth(location.hash)
        .then((r) => { if (r) { if (r.isNew && !next) location.href = 'entreprise'; else goNext(); } })
        .catch((err) => { const e = $('#login-error'); if (e) { e.textContent = err.message; e.classList.add('show'); } });
    }
    const resetToken = params.get('reset');
    if (resetToken) {
      $('#panel-client').hidden = true; $('#panel-newpass').hidden = false;
      $('#newpass-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ok = fieldError('np-pass', $('#np-pass').value.length < 8);
        if (!ok) return;
        const btn = e.target.querySelector('[type=submit]');
        FWUI.setLoading(btn, true, 'Enregistrement...');
        try { await FW.auth.confirmReset(resetToken, $('#np-pass').value); goNext(); }
        catch (err) { FWUI.setLoading(btn, false); $('#np-error').textContent = err.message; $('#np-error').classList.add('show'); }
      });
    }

    /* Mot de passe oublié */
    $('#forgot-link').addEventListener('click', () => {
      $('#panel-client').hidden = true;
      $('#panel-reset').hidden = false;
      $('#reset-email').value = $('#login-email').value;
      $('#reset-email').focus();
    });
    $('#back-login').addEventListener('click', () => showTab('client'));
    $('#reset-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!fieldError('reset-email', !emailOk($('#reset-email').value))) return;
      const btn = e.target.querySelector('[type=submit]');
      FWUI.setLoading(btn, true, 'Envoi...');
      await FW.auth.resetPassword($('#reset-email').value.trim());
      FWUI.setLoading(btn, false);
      $('#reset-done').hidden = false;
      FWUI.icons();
    });

    /* Webmail : redirige vers le client webmail avec l'identifiant pré-rempli. */
    $('#webmail-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      let ok = fieldError('wm-email', !emailOk($('#wm-email').value));
      ok = fieldError('wm-pass', !$('#wm-pass').value) && ok;
      if (!ok) return;
      const btn = e.target.querySelector('[type=submit]');
      FWUI.setLoading(btn, true, 'Ouverture...');
      await FW.wait(700);
      FWUI.setLoading(btn, false);
      if (C.DEMO_MODE) {
        FWUI.toast('Démo : vous seriez redirigé vers ' + C.WEBMAIL_URL, 'info');
      } else {
        // Le formulaire réel doit poster directement vers le webmail (Roundcube/SnappyMail) en HTTPS.
        location.href = C.WEBMAIL_URL + '/?_user=' + encodeURIComponent($('#wm-email').value.trim());
      }
    });
  }

  /* ======================= INSCRIPTION ======================= */
  const signupForm = $('#signup-form');
  if (signupForm) {
    const suPhone = FWUI.phoneInput($('#su-phone'));   // indicatif du pays au choix (Haïti par défaut)
    /* Force du mot de passe */
    const pass = $('#su-pass');
    pass.addEventListener('input', () => {
      const v = pass.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v) && v.length >= 10) score++;
      const colors = ['#DC2626', '#F59E0B', '#2B64E4', '#10B981'];
      const labels = ['Trop faible', 'Moyen', 'Bon', 'Excellent'];
      document.querySelectorAll('#strength-bars span').forEach((s, i) => { s.style.background = i < score ? colors[score - 1] : ''; });
      $('#strength-text').textContent = v ? 'Sécurité : ' + labels[Math.max(0, score - 1)] : '8 caractères minimum. Plus il est long et varié, plus il est sûr.';
    });

    $('#su-phone').addEventListener('input', (e) => {
      const d = e.target.value.replace(/\D/g, '').slice(0, 8);
      e.target.value = d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    });

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      $('#signup-error').classList.remove('show');
      let ok = fieldError('su-name', $('#su-name').value.trim().length < 2);
      ok = fieldError('su-email', !emailOk($('#su-email').value)) && ok;
      ok = fieldError('su-pass', pass.value.length < 8) && ok;
      ok = fieldError('su-terms', !$('#su-terms').checked) && ok;
      if (!ok) { (document.querySelector('.is-invalid') || $('#su-terms')).focus(); return; }
      const btn = signupForm.querySelector('[type=submit]');
      FWUI.setLoading(btn, true, 'Création du compte...');
      try {
        await FW.auth.signup({
          name: $('#su-name').value.trim(),
          email: $('#su-email').value.trim(),
          phone: suPhone.get(),
          password: pass.value,
        });
        FWUI.toast('Compte créé. Configurons maintenant votre entreprise.');
        setTimeout(() => { location.href = 'entreprise' + (next ? '?next=' + encodeURIComponent(next) : ''); }, 600);
      } catch (err) {
        FWUI.setLoading(btn, false);
        $('#signup-error').textContent = err.message;
        $('#signup-error').classList.add('show');
      }
    });
  }

  FWUI.icons();
})();
