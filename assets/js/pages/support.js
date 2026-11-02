/**
 * Centre d'aide : FAQ filtrable par catégorie et par recherche, formulaire de contact.
 */
(function () {
  const C = FW.config;
  const $ = (s) => document.querySelector(s);
  const S = C.MAIL_SERVERS;

  $('#support-email').textContent = C.SUPPORT_EMAIL;
  $('#support-wa').textContent = C.SUPPORT_WHATSAPP;

  const CATS = [
    { id: 'all', label: 'Tout', icon: 'layout-grid' },
    { id: 'domaines', label: 'Domaines', icon: 'globe' },
    { id: 'emails', label: 'Emails', icon: 'mail' },
    { id: 'dns', label: 'DNS', icon: 'server-cog' },
    { id: 'paiement', label: 'Paiement', icon: 'wallet' },
  ];

  const FAQ = [
    { cat: 'domaines', q: 'Combien de temps faut-il pour activer un domaine ?', a: 'L’enregistrement est immédiat après le paiement. La propagation DNS mondiale peut prendre de quelques minutes à 24 heures, mais votre boîte mail fonctionne en général en moins de 10 minutes.' },
    { cat: 'domaines', q: 'Comment connecter un domaine que je possède déjà ?', a: 'Dans votre espace, ouvrez Domaines puis « Connecter un domaine existant ». Remplacez les serveurs de noms chez votre registraire actuel par ' + C.NAMESERVERS.join(' et ') + ', ou ajoutez seulement les enregistrements email indiqués dans la page DNS.' },
    { cat: 'domaines', q: 'Puis-je transférer mon domaine ailleurs ?', a: 'Oui. Désactivez le verrouillage dans Domaines, puis demandez le code d’autorisation (EPP). Le transfert est possible 60 jours après l’enregistrement, selon les règles de l’ICANN.' },
    { cat: 'emails', q: 'Comment configurer ma boîte dans Outlook, Gmail ou Apple Mail ?', a: 'Choisissez un compte IMAP. Serveur entrant : ' + S.imap.host + ', port ' + S.imap.port + ' (' + S.imap.security + '). Serveur sortant : ' + S.smtp.host + ', port ' + S.smtp.port + ' (' + S.smtp.security + '). Identifiant : votre adresse complète.' },
    { cat: 'emails', q: 'Quelle est la différence entre une boîte et un alias ?', a: 'Une boîte a son propre mot de passe et son espace de stockage. Un alias (par exemple info@) redirige simplement les messages vers une boîte existante, sans coût supplémentaire.' },
    { cat: 'emails', q: 'Mes emails arrivent dans les spams. Que faire ?', a: 'Ouvrez la page DNS de votre espace et vérifiez que SPF, DKIM et DMARC sont au vert. Si l’un d’eux est en rouge, cliquez sur « Réparer automatiquement ».' },
    { cat: 'dns', q: 'Que signifient MX, SPF, DKIM et DMARC ?', a: 'MX indique quel serveur reçoit vos emails. SPF liste les serveurs autorisés à envoyer en votre nom. DKIM signe vos messages. DMARC dit aux destinataires quoi faire si un message ne passe pas ces contrôles.' },
    { cat: 'dns', q: 'Puis-je pointer mon domaine vers mon site web ?', a: 'Oui. Ajoutez un enregistrement A (adresse IP de votre hébergeur) pour @ et un CNAME pour www. Les enregistrements email gérés par Freda restent intacts.' },
    { cat: 'paiement', q: 'Comment payer avec MonCash ?', a: 'Au paiement, choisissez MonCash et entrez votre numéro. Vous êtes redirigé vers MonCash pour confirmer avec votre code PIN. Le montant est affiché en gourdes au taux du jour.' },
    { cat: 'paiement', q: 'Comment payer avec NatCash ?', a: 'Choisissez NatCash et entrez votre numéro Natcom. Une demande de paiement arrive sur votre téléphone : validez-la avec votre code PIN NatCash.' },
    { cat: 'paiement', q: 'Le renouvellement est-il automatique avec MonCash ou NatCash ?', a: 'Les cartes bancaires sont débitées automatiquement. Pour MonCash et NatCash, vous recevez une demande de paiement 7 jours avant l’échéance, par email et SMS.' },
    { cat: 'paiement', q: 'Puis-je obtenir un remboursement ?', a: 'L’abonnement est remboursable sous 14 jours. Les frais d’enregistrement de domaine ne sont pas remboursables une fois le domaine enregistré auprès du registre.' },
  ];

  let cat = 'all';
  let query = '';
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function renderCats() {
    $('#categories').innerHTML = CATS.map((c) => `
      <button type="button" role="tab" aria-selected="${c.id === cat}" data-cat="${c.id}"
        class="flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${c.id === cat ? 'border-freda bg-mist text-freda' : 'border-line bg-white hover:border-slate-300 text-ink'}">
        <i data-lucide="${c.icon}" class="w-5 h-5 shrink-0"></i><span class="font-semibold text-sm">${c.label}</span>
      </button>`).join('');
  }

  function renderFaq() {
    const q = norm(query);
    const items = FAQ.filter((f) => (cat === 'all' || f.cat === cat) && (!q || norm(f.q + ' ' + f.a).includes(q)));
    $('#faq-list').innerHTML = items.map((f) => `
      <details class="accordion-item px-5 sm:px-6 py-5">
        <summary class="flex items-center justify-between gap-4 font-semibold text-ink">${f.q}<i data-lucide="plus" class="acc-icon w-5 h-5 text-freda shrink-0"></i></summary>
        <p class="mt-3 text-slate-600 leading-relaxed">${f.a}</p>
      </details>`).join('');
    $('#faq-list').hidden = !items.length;
    $('#faq-empty').hidden = !!items.length;
    $('#faq-count').textContent = items.length + ' article' + (items.length > 1 ? 's' : '');
    FWUI.icons();
  }

  $('#categories').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    renderCats(); renderFaq();
  });
  $('#faq-search').addEventListener('input', (e) => { query = e.target.value; renderFaq(); });

  /* ---------- Contact ---------- */
  const session = FW.auth.current();
  if (session) { $('#ct-name').value = session.user.name || ''; $('#ct-email').value = session.user.email || ''; }

  function err(id, show) {
    document.getElementById(id).classList.toggle('is-invalid', show);
    document.querySelector('[data-for="' + id + '"]').classList.toggle('show', show);
    return !show;
  }
  document.querySelectorAll('form[role=search]').forEach((f) => f.addEventListener('submit', (e) => e.preventDefault()));
  $('#contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = err('ct-name', $('#ct-name').value.trim().length < 2);
    ok = err('ct-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#ct-email').value.trim())) && ok;
    ok = err('ct-msg', $('#ct-msg').value.trim().length < 20) && ok;
    if (!ok) return;
    const btn = e.target.querySelector('[type=submit]');
    FWUI.setLoading(btn, true, 'Envoi...');
    await FW.wait(900); // POST /support/tickets côté backend
    FWUI.setLoading(btn, false);
    e.target.reset();
    FWUI.toast('Demande envoyée. Numéro de suivi : FW-T' + Date.now().toString().slice(-6));
  });

  renderCats();
  renderFaq();
})();
