/**
 * Tunnel de commande, une page par étape :
 *   domaines.html  — étape 1 : recherche et panier
 *   paiement.html  — étape 2 : compte + paiement du domaine seul (data-stage="domain")
 *   email-pro.html — étape 3, facultative : offre email + première adresse (data-stage="email")
 * Le client peut acheter un domaine sans abonnement ni email, et activer
 * l'email plus tard depuis son espace (email-pro.html).
 */
(function () {
  const C = FW.config;
  // Les deux pages partagent ce script : un élément absent d'une page renvoie un nœud vide.
  const $ = (s) => document.querySelector(s) || document.createElement('div');
  const PAGE = document.body.dataset.stage; // 'domain' | 'email'
  const esc = FWUI.esc;
  const params = new URLSearchParams(location.search);

  /* ---------- Quelle étape, avec quoi ? (recalculé à chaque ouverture) ---------- */
  let cart = FW.cart.get();
  let stage;              // 'domain' | 'email'
  let fixedDomain = null; // domaine imposé à l'étape 2
  let domainMode = 'fixed'; // 'fixed' | 'select' | 'input'
  let savedMethod = null; // moyen de paiement déjà enregistré
  let domainFree = false; // étape 1 sans paiement (compte seul, domaine existant)

  /** Prépare l'état. Renvoie false si on redirige, null si le panier est vide. */
  function resolveEntry() {
    cart = FW.cart.get();
    if (params.get('plan') && C.PLANS[params.get('plan')]) cart = FW.cart.set({ plan: params.get('plan') });
    if (FW.validCycle(params.get('cycle'))) cart = FW.cart.set({ cycle: params.get('cycle') });
    const session = FW.auth.current();
    fixedDomain = null; domainMode = 'fixed'; savedMethod = null;
    domainFree = !!cart.ownDomain && !cart.domain;
    stage = PAGE;

    if (PAGE === 'domain') {
      if (!(cart.domain || cart.ownDomain)) return null;
      // Le .ht n'est pas encore vendu : un panier trafiqué ne passe jamais au paiement
      if ([cart.domain, ...(cart.extras || [])].some((d) => d && /\.ht$/i.test(String(d.domain || '')))) { FW.cart.clear && FW.cart.clear(); location.replace('domaines'); return false; }
      // Connexion (ou création de compte) sur sa propre page, puis retour ici pour payer
      if (!session) { location.replace('connexion?next=paiement.html'); return false; }
      // Domaine déjà payé, ou domaine existant avec compte : on passe directement à l'email pro
      if ((cart.domainPaid && cart.domain) || (cart.ownDomain && session)) { location.replace('email-pro'); return false; }
      return true;
    }

    /* Page email pro */
    if (cart.domainPaid && cart.domain) {
      fixedDomain = cart.domain.domain;
      savedMethod = (FW.workspace.get().paymentMethods || [])[0] || null;
      return true;
    }
    if (!session) { location.replace(cart.ownDomain ? 'paiement' : 'connexion?next=' + encodeURIComponent('email-pro')); return false; }
    const ws = FW.workspace.get();
    if (ws.plan) { location.replace('espace/facturation#offre'); return false; }
    if (ws.domains.length === 1 && !cart.ownDomain) fixedDomain = ws.domains[0].name;
    else domainMode = ws.domains.length && !cart.ownDomain ? 'select' : 'input';
    savedMethod = ws.paymentMethods.find((m) => m.default) || ws.paymentMethods[0] || null;
    return true;
  }

  /* Logos tiers */
  document.querySelectorAll('[data-brand]').forEach((el) => { el.outerHTML = FWUI.BRAND[el.dataset.brand]; });
  document.querySelectorAll('[data-mark]').forEach((el) => { el.innerHTML = FWUI.payMark(el.dataset.mark); });

  /* ---------- Etat ---------- */
  let selPlan = 'business';
  let selCycle = 'monthly';
  let method = 'card';

  const amountNow = () => (stage === 'domain' ? FW.cart.totals(cart).domain : FW.planPrice(selPlan, selCycle));
  const useSaved = () => stage === 'email' && !!savedMethod && $('#use-saved').checked;
  const currentDomain = () => (domainMode === 'fixed' ? fixedDomain : domainMode === 'select' ? $('#dom-select').value : $('#dom-input').value.trim().toLowerCase());

  /* ---------- Fil d'étapes ---------- */
  function renderStepper() {
    const done = '<span class="w-6 h-6 rounded-full bg-cta text-white grid place-items-center"><i data-lucide="check" class="w-3.5 h-3.5"></i></span>';
    const cur = (n) => `<span class="w-6 h-6 rounded-full bg-freda text-white grid place-items-center text-xs">${n}</span>`;
    const todo = (n) => `<span class="w-6 h-6 rounded-full border border-slate-300 text-slate-500 grid place-items-center text-xs">${n}</span>`;
    const first = domainFree ? 'Compte' : 'Paiement du domaine';
    $('#stepper-list').innerHTML = `
      ${stage === 'domain' ? `<li><a href="domaines" class="flex items-center gap-2 text-ink font-medium hover:text-freda">${done}Domaine</a></li>` : `<li class="flex items-center gap-2 text-ink font-medium">${done}Domaine</li>`}
      <li aria-hidden="true" class="w-8 h-px bg-line"></li>
      ${stage === 'domain'
        ? `<li class="flex items-center gap-2 text-freda font-semibold" aria-current="step">${cur(2)}${first}</li>`
        : `<li class="flex items-center gap-2 text-ink font-medium">${done}${first}</li>`}
      <li aria-hidden="true" class="w-8 h-px bg-line"></li>
      ${stage === 'email'
        ? `<li class="flex items-center gap-2 text-freda font-semibold" aria-current="step">${cur(3)}Email pro <span class="text-xs font-normal text-muted">(optionnel)</span></li>`
        : `<li class="flex items-center gap-2 text-slate-500">${todo(3)}Email pro <span class="text-xs text-muted">(optionnel)</span></li>`}`;
    FWUI.icons();
  }

  /* ---------- Compte ---------- */
  function renderAccount() {
    const sess = FW.auth.current();
    if (!sess) return;
    $('#account-new').hidden = true;
    const box = $('#account-logged');
    box.hidden = false;
    box.innerHTML = `<div class="flex items-center gap-3 p-4 rounded-xl bg-mist">
      <span class="w-10 h-10 rounded-full bg-brand-gradient text-white grid place-items-center font-bold">${esc((sess.user.name || '?')[0].toUpperCase())}</span>
      <div class="min-w-0 flex-1"><p class="font-semibold text-ink truncate">${esc(sess.user.name)}</p><p class="text-sm text-muted truncate">${esc(sess.user.email)}</p></div>
      <button type="button" id="switch-acc" class="text-sm font-semibold text-freda hover:underline">Changer</button></div>`;
    $('#switch-acc').addEventListener('click', () => { FW.auth.logout(); location.reload(); });
  }
  renderAccount();
  document.querySelectorAll('[data-oauth]').forEach((b) => b.addEventListener('click', async () => {
    FWUI.setLoading(b, true, 'Connexion...');
    try { await FW.auth.oauth(b.dataset.oauth); location.reload(); }
    catch (e) { FWUI.toast(e.message, 'error'); FWUI.setLoading(b, false); }
  }));

  /* ---------- Offre email (étape 2) ---------- */
  function renderPlanPick() {
    const cs = $('#cycle-select');
    if (cs) { if (!cs.options.length) cs.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map((n) => `<option value="${FW.cycleOf(n)}">${n} mois${n === 12 ? ' (2 mois offerts)' : ''}</option>`).join(''); cs.value = selCycle; }
    $('#plan-pick').innerHTML = Object.values(C.PLANS).map((p) => `
      <label class="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${selPlan === p.id ? 'border-freda bg-mist/60' : 'border-line hover:border-slate-300'}">
        <input type="radio" name="plan" value="${p.id}" class="checkbox" ${selPlan === p.id ? 'checked' : ''}>
        <span class="flex-1 min-w-0">
          <span class="flex items-center gap-2"><span class="font-semibold text-ink">${p.name}</span>${p.popular ? '<span class="badge badge-info">Le plus choisi</span>' : ''}</span>
          <span class="block text-xs text-muted">${C.boxLabel(p)} · ${C.storageLabel(p)}</span>
        </span>
        <span class="text-sm font-semibold tabular text-ink whitespace-nowrap">${FW.money(FW.planPrice(p.id, selCycle))}<span class="text-muted font-normal"> ${FW.cycleMonths(selCycle) === 1 ? '/mois' : FW.cycleMonths(selCycle) === 12 ? '/an' : 'pour ' + FW.cycleSpan(selCycle)}</span></span>
      </label>`).join('');
  }
  $('#plan-pick').addEventListener('change', (e) => { selPlan = e.target.value; FW.cart.set({ plan: selPlan }); refresh(); });
  $('#cycle-select').addEventListener('change', (e) => { selCycle = e.target.value; FW.cart.set({ cycle: selCycle }); refresh(); });
  document.addEventListener('fw:plans', () => refresh());      // prix des offres du serveur arrivés après l'affichage

  /* ---------- Domaine de l'adresse ---------- */
  function renderDomainPick() {
    const wrap = $('#dom-pick');
    wrap.hidden = domainMode === 'fixed';
    $('#dom-select').hidden = domainMode !== 'select';
    $('#dom-input').hidden = domainMode !== 'input';
    if (domainMode === 'select') $('#dom-select').innerHTML = FW.workspace.get().domains.map((d) => `<option>${esc(d.name)}</option>`).join('');
    if (domainMode === 'input') {
      $('#dom-label').textContent = 'Votre nom de domaine';
      if (cart.ownDomainName && !$('#dom-input').value) $('#dom-input').value = cart.ownDomainName;
    }
    if (domainMode === 'select') $('#dom-label').textContent = 'Domaine';
    updateMailDomain();
  }
  function updateMailDomain() { $('#mail-domain').textContent = '@' + (currentDomain() || 'votre-domaine.com'); }
  $('#dom-select').addEventListener('change', updateMailDomain);
  $('#dom-input').addEventListener('input', updateMailDomain);

  /* ---------- Récapitulatif ---------- */
  function renderSummary() {
    const t = FW.cart.totals(cart);
    $('#sum-years').hidden = !(stage === 'domain' && cart.domain);
    if (stage === 'domain' && cart.domain) $('#pay-years').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${n === t.years ? 'selected' : ''}>${n} an${n > 1 ? 's' : ''}</option>`).join('');
    if (stage === 'domain') {
      $('#sum-domain').textContent = cart.domain ? cart.domain.domain + ((cart.extras || []).length ? ' +' + cart.extras.length : '') : 'Domaine existant';
      $('#sum-plan').textContent = domainFree ? 'Création de votre compte' : 'Étape 2 · Nom de domaine';
      $('#sum-lines').innerHTML = domainFree
        ? `<div class="flex justify-between gap-3 pt-1 text-base"><dt class="font-bold text-ink">Total</dt><dd class="font-extrabold text-ink">${FW.money(0)}</dd></div>
           <div class="text-xs text-muted">Aucun paiement à cette étape. Vous choisirez votre offre email ensuite.</div>`
        : [cart.domain, ...(cart.extras || [])].map((x) => `<div class="flex justify-between gap-3"><dt class="text-slate-600 truncate">${esc(x.domain)} (${t.years} an${t.years > 1 ? 's' : ''})</dt><dd class="font-medium text-ink">${FW.money(FW.cart.priceOf(x, t.years))}</dd></div>`).join('') + `
           <div class="flex justify-between gap-3 pt-3 border-t border-line text-base"><dt class="font-bold text-ink">Total</dt><dd class="font-extrabold text-ink">${FW.money(t.total)}</dd></div>
           <div class="flex justify-between gap-3 text-xs"><dt class="text-muted">Renouvellement ensuite</dt><dd class="text-muted">${FW.money([cart.domain, ...(cart.extras || [])].reduce((a, x) => a + x.renew, 0))}/an</dd></div>
           `;
      $('#sum-notes').innerHTML = domainFree ? '' : `
        <li class="flex items-center gap-2"><i data-lucide="receipt" class="w-3.5 h-3.5 text-freda"></i>Frais de traitement : carte 3,5 % + 0,40 $, MonCash/NatCash 6 %</li>
        <li class="flex items-center gap-2"><i data-lucide="mail-minus" class="w-3.5 h-3.5 text-freda"></i>Sans email ni abonnement : vous l’ajoutez après, si vous voulez</li>
        <li class="flex items-center gap-2"><i data-lucide="zap" class="w-3.5 h-3.5 text-freda"></i>Domaine enregistré en quelques minutes</li>
        <li class="flex items-center gap-2"><i data-lucide="receipt" class="w-3.5 h-3.5 text-freda"></i>Facture envoyée par email, pour votre comptabilité</li>`;
    } else {
      const p = C.PLANS[selPlan];
      const dom = currentDomain();
      $('#sum-domain').textContent = dom ? ($('#mail-local').value.trim().toLowerCase() || 'contact') + '@' + dom : 'Email pro';
      $('#sum-plan').textContent = 'Étape 3 · Offre ' + p.name + ' · ' + FW.cycleName(selCycle).replace(/^./, (c) => c.toUpperCase());
      const price = FW.planPrice(selPlan, selCycle);
      $('#sum-lines').innerHTML = `
        <div class="flex justify-between gap-3"><dt class="text-slate-600">Offre ${p.name} (${FW.cycleSpan(selCycle)})</dt><dd class="font-medium text-ink">${FW.money(price)}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-slate-600">Boîtes mail</dt><dd class="font-medium text-ink">${C.boxLabel(p)} · ${C.storageLabel(p)}</dd></div>
        <div class="flex justify-between gap-3 pt-3 border-t border-line text-base"><dt class="font-bold text-ink">Total</dt><dd class="font-extrabold text-ink">${FW.money(price)}</dd></div>
        <div class="flex justify-between gap-3 text-xs"><dt class="text-muted">Renouvellement</dt><dd class="text-muted">${FW.money(FW.planPrice(selPlan, selCycle))} tous les ${FW.cycleSpan(selCycle)}</dd></div>`;
      $('#sum-notes').innerHTML = `
        <li class="flex items-center gap-2"><i data-lucide="receipt" class="w-3.5 h-3.5 text-freda"></i>Frais de traitement : carte 3,5 % + 0,40 $, MonCash/NatCash 6 %</li>
        <li class="flex items-center gap-2"><i data-lucide="wand-sparkles" class="w-3.5 h-3.5 text-freda"></i>MX, SPF, DKIM et DMARC configurés automatiquement</li>
        <li class="flex items-center gap-2"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-freda"></i>Remboursement de l’offre sous 14 jours</li>
        <li class="flex items-center gap-2"><i data-lucide="x-circle" class="w-3.5 h-3.5 text-freda"></i>Annulable à tout moment</li>`;
    }
    $('#skip-btn').hidden = stage !== 'email';
  }

  /* ---------- Titres et sections visibles ---------- */
  function renderStage() {
    const email = stage === 'email';
    $('#acc-section').hidden = email;
    $('#plan-section').hidden = !email;
    $('#mail-section').hidden = !email;
    $('#co-title').textContent = email ? 'Ajoutez la messagerie professionnelle de votre entreprise' : (domainFree ? 'Créez votre compte' : 'Achetez votre domaine');
    $('#co-sub').textContent = email
      ? 'Facultatif : choisissez une offre pour créer les adresses de votre entreprise sur son domaine. Vous pouvez aussi le faire plus tard depuis votre espace.'
      : (domainFree ? 'Vous choisirez ensuite l’offre email pour votre domaine existant.' : 'Étape 2 sur 3. Vous payez uniquement le nom de domaine. L’email pro se choisit à l’étape suivante, sans obligation.');
    $('#terms-text').innerHTML = email
      ? 'J’accepte les <a href="legal#cgu" class="text-freda font-medium hover:underline" target="_blank">conditions d’utilisation</a> et la <a href="legal#remboursement" class="text-freda font-medium hover:underline" target="_blank">politique de remboursement</a>. L’abonnement se renouvelle automatiquement, annulable à tout moment.'
      : 'J’accepte les <a href="legal#cgu" class="text-freda font-medium hover:underline" target="_blank">conditions d’utilisation</a> et la <a href="legal#remboursement" class="text-freda font-medium hover:underline" target="_blank">politique de remboursement</a>. Le domaine se renouvelle chaque année tant que l’auto-renouvellement est activé.';
    // Moyen de paiement déjà enregistré
    const sv = $('#saved-pay');
    sv.hidden = !(email && savedMethod);
    if (email && savedMethod) {
      $('#saved-label').textContent = savedMethod.type === 'card' ? savedMethod.brand + ' •••• ' + savedMethod.last4 : (savedMethod.type === 'moncash' ? 'MonCash ' : 'NatCash ') + savedMethod.phone;
      $('#saved-mark').innerHTML = FWUI.payMark(savedMethod.type === 'card' ? savedMethod.brand.toLowerCase() : savedMethod.type, 'sm');
    }
    togglePayFields();
    renderStepper();
    if (email) renderPlanPick();
  }
  function togglePayFields() {
    const free = stage === 'domain' && domainFree;
    const hide = free || useSaved();
    $('#pay-fields').hidden = hide;
    $('#method-picker').hidden = hide;
    $('#pay-title').innerHTML = free ? '<i data-lucide="shield-check" class="w-5 h-5 text-freda"></i>Conditions' : '<i data-lucide="wallet" class="w-5 h-5 text-freda"></i>Moyen de paiement';
    FWUI.icons();
  }
  $('#use-saved').addEventListener('change', () => { togglePayFields(); setMethod(method); });

  function refresh() { if (stage === 'email') renderPlanPick(); renderSummary(); setMethod(method); FWUI.icons(); }
  $('#mail-local').addEventListener('input', renderSummary);
  $('#dom-input').addEventListener('input', renderSummary);
  $('#dom-select').addEventListener('change', renderSummary);

  /* ---------- Choix du moyen de paiement ---------- */
  const mmSteps = {
    moncash: ['Cliquez sur « Payer avec MonCash ».', 'Vous êtes redirigé vers la page sécurisée MonCash (Digicel).', 'Confirmez avec votre code PIN MonCash. Vous revenez ici automatiquement.'],
    natcash: ['Cliquez sur « Payer avec NatCash ».', 'Vous êtes redirigé vers la page sécurisée NatCash (Natcom).', 'Confirmez avec votre code PIN NatCash. Vous revenez ici automatiquement.'],
  };

  /* Production : la carte se saisit sur la page de paiement sécurisée (page hébergée) ; aucun champ de carte n'est affiché ni validé ici, aucune donnée de carte ne transite par notre site. */
  const hostedCard = !C.DEMO_MODE;
  if (hostedCard) {
    const grid = $('[data-panel="card"] > .grid');
    if (grid) {
      grid.hidden = true;
      const note = document.createElement('p');
      note.className = 'text-sm text-slate-600 mt-1';
      note.textContent = 'Vous serez redirigé vers la page de paiement sécurisée pour saisir votre carte. Elle sera enregistrée pour renouveler automatiquement votre offre Freda Mail ; vous pouvez la supprimer à tout moment depuis votre espace.';
      grid.parentNode.insertBefore(note, grid);
    }
  }

  function setMethod(m) {
    method = m;
    document.querySelectorAll('[data-method]').forEach((b) => { b.setAttribute('aria-checked', String(b.dataset.method === m)); b.tabIndex = b.dataset.method === m ? 0 : -1; });   // tabindex itinérant : un seul arrêt Tab dans le groupe
    $('[data-panel="card"]').hidden = m !== 'card';
    $('[data-panel="mobile"]').hidden = m === 'card';
    const name = m === 'moncash' ? 'MonCash' : 'NatCash';
    const amount = amountNow();
    /* Frais de traitement : carte 3,5 % + 0,40 $ ; MonCash / NatCash 6 % (ajoutés au montant, affichés avant paiement ; recalculés côté serveur). */
    const fee = amount > 0 ? (m === 'card' ? Math.round(amount * 3.5 + 40) / 100 : Math.round(amount * 6) / 100) : 0;
    let feeNote = document.getElementById('fee-note');   // ($ renvoie un nœud vide quand l'élément manque : ne pas l'utiliser pour tester l'existence)
    if (!feeNote) { feeNote = document.createElement('p'); feeNote.id = 'fee-note'; feeNote.className = 'mt-3 text-sm text-slate-600 tabular'; $('#method-picker').insertAdjacentElement('afterend', feeNote); }
    feeNote.hidden = !fee;
    feeNote.textContent = fee ? 'Frais de traitement (' + (m === 'card' ? '3,5 % + 0,40 $' : '6 %') + ') : ' + FW.money(fee) + ' · Total à payer : ' + FW.money(amount + fee) : '';
    if (m !== 'card') {
      $('#mm-amount').textContent = FW.money((amount + fee) * C.HTG_RATE, 'HTG');
      $('#mm-rate').textContent = FW.money(amount + fee) + ' (frais inclus) au taux indicatif de 1 USD = ' + C.HTG_RATE + ' HTG';
      $('#mm-steps').innerHTML = mmSteps[m].map((t, i) => `<li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-mist text-freda text-xs font-bold grid place-items-center shrink-0 tabular">${i + 1}</span><span>${t}</span></li>`).join('');
    }
    const total = amount + fee;   // frais de traitement inclus : le bouton affiche toujours ce qui sera débité
    const verb = stage === 'domain' ? (domainFree ? 'Créer mon compte' : 'Payer ' + FW.money(total)) : 'Activer l’email pro · ' + FW.money(total);
    $('#pay-label').textContent = domainFree && stage === 'domain' ? verb : (useSaved() || m === 'card' ? verb : (stage === 'domain' ? 'Payer ' : 'Activer ') + 'avec ' + name);
    clearErrors();
  }
  document.querySelectorAll('[data-method]').forEach((b) => b.addEventListener('click', () => setMethod(b.dataset.method)));
  $('#method-picker').addEventListener('keydown', (e) => {
    const order = ['card', 'moncash', 'natcash'].filter((k) => $('[data-method="' + k + '"]'));
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let i = order.indexOf(method);
    if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = order.length - 1;
    else if (step) i = (i + step + order.length) % order.length;
    else return;
    e.preventDefault();
    setMethod(order[i]);
    $('[data-method="' + order[i] + '"]').focus();
  });

  /* ---------- Masques de saisie ---------- */
  const ccNumber = $('#cc-number');
  function cardBrand(n) {
    if (/^4/.test(n)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    return '';
  }
  ccNumber.addEventListener('input', () => {
    const digits = ccNumber.value.replace(/\D/g, '').slice(0, 19);
    const brand = cardBrand(digits);
    ccNumber.value = brand === 'amex'
      ? digits.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
      : digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    $('#cc-brand').innerHTML = FWUI.payMark(brand, 'sm');
  });
  $('#cc-exp').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });
  $('#cc-cvc').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
  $('#mm-phone').addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').replace(/^509/, '').slice(0, 8);
    e.target.value = d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  });

  /* ---------- Validation ---------- */
  function luhn(num) {
    let sum = 0, dbl = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = +num[i];
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  }
  function expValid(v) {
    const m = /^(\d{2})\/(\d{2})$/.exec(v);
    if (!m) return false;
    const month = +m[1], year = 2000 + +m[2];
    if (month < 1 || month > 12) return false;
    return new Date(year, month, 0, 23, 59) >= new Date();
  }
  function setError(id, show) {
    const input = document.getElementById(id);
    const err = document.querySelector('[data-for="' + id + '"]');
    input && input.classList.toggle('is-invalid', show);
    err && err.classList.toggle('show', show);
    return !show;
  }
  function clearErrors() {
    document.querySelectorAll('.field-error').forEach((e) => e.classList.remove('show'));
    document.querySelectorAll('.is-invalid').forEach((e) => e.classList.remove('is-invalid'));
  }

  if (document.getElementById('mail-pass') && document.getElementById('mail-pass-rules')) {   // ($ renvoie un faux élément quand l'id manque : on teste le vrai DOM)   // règles du mot de passe affichées en direct (email-pro.html)
    const renderRules = FWUI.liveRules($('#mail-pass'), $('#mail-pass-rules'), () => $('#mail-local').value.trim().toLowerCase());
    $('#mail-local').addEventListener('input', renderRules);
  }

  function validate() {
    clearErrors();
    let ok = true;
    if (stage === 'email') {
      ok = setError('mail-local', !/^[a-z0-9]([a-z0-9._-]{0,62})$/i.test($('#mail-local').value.trim())) && ok;
      if (domainMode === 'input') ok = setError('dom-input', !/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test($('#dom-input').value.trim())) && ok;
      const pw = $('#mail-pass').value;
      ok = setError('mail-pass', !FW.passwordRules(pw, $('#mail-local').value.trim().toLowerCase()).ok) && ok;
    }
    const needsPay = !(stage === 'domain' && domainFree) && !useSaved();
    if (needsPay) {
      if (method === 'card' && hostedCard) {
        /* rien à valider : la carte est saisie sur la page de paiement sécurisée */
      } else if (method === 'card') {
        const n = ccNumber.value.replace(/\s/g, '');
        ok = setError('cc-number', !(n.length >= 13 && luhn(n))) && ok;
        ok = setError('cc-name', $('#cc-name').value.trim().length < 2) && ok;
        ok = setError('cc-exp', !expValid($('#cc-exp').value)) && ok;
        ok = setError('cc-cvc', !/^\d{3,4}$/.test($('#cc-cvc').value)) && ok;
      } else {
        /* MonCash / NatCash : redirection vers la page sécurisée, aucun numéro à saisir ici */
      }
    }
    const terms = $('#terms').checked;
    document.querySelector('[data-for="terms"]').classList.toggle('show', !terms);
    ok = terms && ok;
    if (!ok) {
      const first = document.querySelector('.is-invalid') || $('#terms');
      first.focus();
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return ok;
  }

  function payerInfo() {
    if (method === 'card') {
      const n = ccNumber.value.replace(/\s/g, '');
      return { last4: n.slice(-4), brand: cardBrand(n), exp: $('#cc-exp').value };
    }
    return { phone: '' };
  }

  /* ---------- Soumission ---------- */
  $('#checkout').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#pay-error').classList.remove('show');
    if (!validate()) return;

    const btn = $('#pay-btn');
    FWUI.setLoading(btn, true, 'Traitement...');
    const free = stage === 'domain' && domainFree;
    const saved = useSaved();
    if (!free) {
      $('#proc-text').textContent = saved ? 'Paiement avec votre moyen de paiement enregistré.' : {
        card: 'Vérification de votre carte auprès de votre banque (3-D Secure).',
        moncash: 'Confirmez le paiement dans MonCash avec votre code PIN.',
        natcash: 'Redirection vers NatCash : confirmez le paiement avec votre code PIN.',
      }[method];
      FWUI.openModal('modal-processing');
    }

    try {
      /* Compte */
      const user = FW.auth.current().user;

      if (stage === 'domain') {
        let res = { reference: 'FP-' + Date.now().toString().slice(-8), amount: 0 };
        const payer = free ? null : payerInfo();
        if (!free) res = await FW.payments.checkout({ kind: 'domain', method, payer });
        if (FW.config.DEMO_MODE) FW.workspace.createFromPurchase({ user, domain: cart.domain, extras: cart.extras || [], years: FW.cart.totals(cart).years, payer, method, reference: res.reference, amount: res.amount });
        cart = FW.cart.set({ domainPaid: !free, receipt: free ? null : { reference: res.reference, amount: res.amount } });
        // Étape 3 (facultative) : l'email pro a sa propre page
        location.href = 'email-pro';
        return;
      }

      /* Étape 2 : abonnement */
      const dom = currentDomain();
      const local = $('#mail-local').value.trim().toLowerCase();
      const res = await FW.payments.checkout({
        kind: 'subscription', method: saved ? savedMethod.type : method, saved, payer: saved ? null : payerInfo(),
        domain: dom, plan: selPlan, cycle: selCycle, mailbox: local + '@' + dom, mailboxPassword: $('#mail-pass').value,
        methodId: saved && savedMethod ? savedMethod.id : undefined,
      });
      if (FW.config.DEMO_MODE) FW.workspace.subscribe({ domain: dom, plan: selPlan, cycle: selCycle, local, method: saved ? savedMethod.type : method, payer: saved ? null : payerInfo(), saved, reference: res.reference, amount: res.amount });
      FWUI.closeModal('modal-processing');
      showSuccess(res, dom, local);
    } catch (err) {
      FWUI.closeModal('modal-processing');
      FWUI.setLoading(btn, false);
      const pe = $('#pay-error');
      pe.textContent = err.message;
      pe.classList.add('show');
      pe.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  /* ---------- Entrée dans l'étape 2 ---------- */
  function enterEmailStage() {
    renderStage();
    renderDomainPick();
    // Confirmation du domaine acheté
    const banner = $('#stage-banner');
    const receipt = cart.receipt;
    if (receipt && cart.domain) {
      banner.hidden = false;
      banner.innerHTML = `<div class="flex items-start gap-3"><span class="w-9 h-9 rounded-full bg-cta text-white grid place-items-center shrink-0"><i data-lucide="check"></i></span>
        <div class="min-w-0"><p class="font-bold text-ink">${esc(cart.domain.domain)} est à vous.</p>
        <p class="text-sm text-slate-600 mt-0.5">Paiement confirmé · Réf. <span class="mono">${esc(receipt.reference)}</span> · <span class="tabular">${FW.money(receipt.amount)}</span>. Le domaine et ses serveurs DNS sont en cours de configuration.</p></div></div>`;
    } else banner.hidden = true;
    $('#pay-error').classList.remove('show');
    refresh();
  }

  $('#skip-btn').addEventListener('click', () => {
    FW.cart.clear();
    location.href = 'espace/';
  });

  /* ---------- Succès (offre email) ---------- */
  function showSuccess(res, dom, local) {
    $('#checkout').hidden = true;
    $('#stepper').hidden = true;
    $('#success').hidden = false;
    $('#ok-ref').textContent = res.reference;
    $('#ok-amount').textContent = FW.money(res.amount);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const mailbox = local + '@' + dom;
    const external = domainMode === 'input';
    const steps = external
      ? ['Offre ' + C.PLANS[selPlan].name + ' activée', 'Boîte ' + mailbox + ' préparée', 'Instructions DNS générées pour ' + dom]
      : ['Offre ' + C.PLANS[selPlan].name + ' activée', 'Enregistrements MX, SPF, DKIM et DMARC ajoutés à ' + dom, 'Boîte ' + mailbox + ' créée', 'Connectez-vous dans l’application avec cette adresse et votre mot de passe'];
    const list = $('#prov-steps');
    list.innerHTML = steps.map((s) => `<li class="flex items-center gap-3 text-slate-500"><span class="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0 grid place-items-center"></span><span class="break-all">${esc(s)}</span></li>`).join('');
    const items = [...list.children];
    const goBtn = $('#go-space');
    goBtn.classList.add('opacity-60', 'pointer-events-none');

    items.forEach((li, i) => setTimeout(() => {
      li.classList.remove('text-slate-500');
      li.classList.add('text-ink');
      li.firstElementChild.outerHTML = '<span class="w-5 h-5 rounded-full bg-cta text-white grid place-items-center shrink-0"><i data-lucide="check" class="w-3 h-3"></i></span>';
      FWUI.icons();
      if (i === items.length - 1) {
        $('#prov-spinner').outerHTML = '<i data-lucide="circle-check" class="w-5 h-5 text-cta"></i>';
        $('#prov-title').textContent = 'Votre email pro est prêt.';
        goBtn.classList.remove('opacity-60', 'pointer-events-none');
        FWUI.icons();
        FW.cart.clear();
      }
    }, 700 * (i + 1)));
    FWUI.icons();
  }

  FWUI.bindWhoisPrivacy(() => cart.whoisPrivacy, (v) => { cart = FW.cart.set({ whoisPrivacy: v }); });
  $('#pay-years').addEventListener('change', (e) => {
    cart = FW.cart.set({ years: +e.target.value });
    renderSummary();
    setMethod(method);
    FWUI.icons();
  });

  /* ---------- Démarrage ---------- */
  function init() {
    const ok = resolveEntry();
    if (ok === false) return;
    const empty = ok === null;
    $('#checkout').hidden = empty;
    $('#stepper').hidden = empty;
    $('#empty-cart').hidden = !empty;
    if (empty) { FWUI.icons(); return; }
    selPlan = cart.plan && C.PLANS[cart.plan] ? cart.plan : 'business';
    selCycle = FW.validCycle(cart.cycle) ? cart.cycle : 'monthly';
    renderAccount();
    if (stage === 'email') enterEmailStage();
    else { renderStage(); refresh(); }
    setMethod('card');
    FWUI.icons();
  }
  init();
})();
