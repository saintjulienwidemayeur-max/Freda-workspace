/**
 * Entrée « Configurer mon email pro » : le client dit s'il a déjà un domaine
 * ou s'il doit en acheter un.
 *   - domaine existant  -> compte (paiement.html si besoin) -> email-pro.html (adresse + offre)
 *   - nouveau domaine   -> domaines.html (recherche) -> paiement.html -> email-pro.html
 */
(function () {
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const esc = FWUI.esc;
  const params = new URLSearchParams(location.search);
  const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

  if (C.PLANS[params.get('plan')]) FW.cart.set({ plan: params.get('plan') });
  if (['monthly', 'yearly'].includes(params.get('cycle'))) FW.cart.set({ cycle: params.get('cycle') });

  const cart = FW.cart.get();
  const p = C.PLANS[cart.plan];
  if (p) {
    $('#plan-chip').innerHTML = `<i data-lucide="layers" class="w-4 h-4 text-freda"></i>Offre choisie : <strong class="text-ink">${esc(p.name)}</strong> · ${cart.cycle === 'yearly' ? 'annuel' : 'mensuel'}`;
  }

  const sess = FW.auth.current();

  $('#own-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#own-input');
    const v = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    const err = document.querySelector('[data-for="own-input"]');
    const ok = DOMAIN_RE.test(v);
    err.classList.toggle('show', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    if (!ok) { input.focus(); return; }
    input.blur();
    FW.cart.set({ domain: null, extras: [], ownDomain: true, ownDomainName: v, domainPaid: false });
    // Pas de compte : on le crée d'abord (paiement.html renvoie vers email-pro.html ensuite)
    location.href = sess ? 'email-pro.html' : 'paiement.html';
  });

  $('#new-btn').addEventListener('click', () => {
    FW.cart.set({ domain: null, extras: [], ownDomain: false, ownDomainName: '', domainPaid: false });
  });

  FWUI.icons();
})();
