/**
 * Freda Workspace — cadre de l'espace client (barre latérale + barre du haut).
 * Chaque page de /espace contient :
 *   <body data-base="../" data-page="dns" data-title="DNS">
 *     <div class="espace-layout"><aside id="sidebar" class="espace-sidebar"></aside>
 *       <div class="min-w-0"><header id="topbar"></header><main>...</main></div></div>
 */
window.FW_HOLD_LOADER = true;   // levé par releaseLoader() une fois la page prête
(async function () {
  const C = FW.config;
  const B = FWUI.BASE;
  const page = document.body.dataset.page;
  const title = document.body.dataset.title || '';

  /* ---------- Garde d'accès ---------- */
  let session = FW.auth.current();
  if (!session) {
    if (C.DEMO_MODE) {
      const u = FW.workspace.get().user;
      session = { user: u, provider: 'demo' };
      FW.store.set('session', session);
    } else {
      window.location.href = B + 'connexion.html?next=' + encodeURIComponent(location.pathname);
      return;
    }
  }

  /* Production : charge l'espace client (GET /workspace) AVANT d'afficher quoi que ce soit. */
  if (!C.DEMO_MODE) {
    try { await FW.workspace.load(); }
    catch (err) {
      if (err.status === 401) { FW.auth.logout(); window.location.href = B + 'connexion.html?next=' + encodeURIComponent(location.pathname); return; }
      document.body.insertAdjacentHTML('afterbegin', '<div class="gutter py-10 text-center"><p class="font-semibold text-ink">Impossible de charger votre espace.</p><p class="text-sm text-slate-600 mt-1">' + FWUI.esc(err.message) + '</p><button id="retry-load" class="btn btn-primary mt-4">Réessayer</button></div>');
      document.getElementById('retry-load').addEventListener('click', () => location.reload());
      window.FW_MONITOR && window.FW_MONITOR.releaseLoader();
      return;
    }
  }

  const ws = FW.workspace.get();
  const plan = ws.plan ? C.PLANS[ws.plan.id] : null;
  const user = { ...ws.user, ...(session.provider !== 'demo' && session.user.email ? session.user : {}) };
  const initials = (user.name || 'FW').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  /* Navigation par produit : Freda Connect (domaine) et Freda Mail (email). */
  const navGroups = [
    { label: 'Espace professionnel', items: [{ id: 'index', href: 'index.html', icon: 'layout-dashboard', label: 'Vue d’ensemble' }] },
    { label: 'Freda Connect', items: [
      { id: 'domaines', href: 'domaines.html', icon: 'globe', label: 'Domaines' },
      { id: 'dns', href: 'dns.html', icon: 'server-cog', label: 'DNS' },
    ] },
    { label: 'Freda Mail', items: [{ id: 'emails', href: 'emails.html', icon: 'mail', label: 'Boîtes mail' }] },
    { label: 'Compte', items: [
      { id: 'facturation', href: 'facturation.html', icon: 'receipt', label: 'Facturation' },
      { id: 'parametres', href: 'parametres.html', icon: 'settings', label: 'Paramètres' },
    ] },
  ];

  /* ---------- Barre latérale ---------- */
  const sidebar = document.getElementById('sidebar');
  sidebar.setAttribute('aria-label', 'Menu de l’espace client');
  sidebar.innerHTML = `
    <div class="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
      <a href="index.html" aria-label="Vue d’ensemble"><img src="${B}assets/img/logo-horizontal-blanc.svg" alt="Freda Workspace" class="h-8 w-auto"></a>
      <button type="button" class="lg:hidden text-slate-300 p-1" data-sidebar-close aria-label="Fermer le menu"><i data-lucide="x"></i></button>
    </div>
    <nav class="flex-1 overflow-y-auto px-3 py-5">
      ${navGroups.map((g, i) => `<p class="px-3 ${i ? 'mt-6 ' : ''}mb-2 text-[11px] font-semibold uppercase tracking-[.1em] text-slate-500">${g.label}</p>
      <ul class="space-y-1">
        ${g.items.map((n) => `<li><a href="${n.href}" class="side-link" ${n.id === page ? 'aria-current="page"' : ''}><i data-lucide="${n.icon}"></i>${n.label}</a></li>`).join('')}
      </ul>`).join('')}
      <p class="px-3 mt-7 mb-2 text-[11px] font-semibold uppercase tracking-[.1em] text-slate-500">Raccourcis</p>
      <ul class="space-y-1">
        ${C.WEBMAIL_URL ? `<li><a href="${C.WEBMAIL_URL}" target="_blank" rel="noopener" class="side-link"><i data-lucide="inbox"></i>Ouvrir le webmail<i data-lucide="arrow-up-right" class="ml-auto !w-3.5 !h-3.5 opacity-60"></i></a></li>` : ""}
        <li><a href="acheter-domaine.html" class="side-link"><i data-lucide="search"></i>Acheter un domaine</a></li>
        <li><a href="${B}support.html" class="side-link"><i data-lucide="life-buoy"></i>Support</a></li>
      </ul>
    </nav>
    <div class="p-4 border-t border-white/10 shrink-0" style="padding-bottom:calc(1rem + env(safe-area-inset-bottom,0px))">
      ${plan ? `<div class="rounded-xl bg-white/5 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-white">Freda Mail ${plan.name}</span>
          <span class="badge" style="background:rgba(16,185,129,.15);color:#34D399">Active</span>
        </div>
        <p class="mt-2 text-xs text-slate-400 tabular">${ws.mailboxes.length} / ${plan.mailboxes} boîte${plan.mailboxes > 1 ? 's' : ''} mail utilisée${ws.mailboxes.length > 1 ? 's' : ''}</p>
        <div class="meter mt-2" style="background:rgba(255,255,255,.1)"><span style="width:${plan.mailboxes === Infinity ? 100 : C.boxPct(plan, ws.mailboxes.length)}%;background:#4A95F5"></span></div>
        ${ws.plan.id !== 'enterprise' ? `<a href="facturation.html#offre" class="mt-3 btn btn-cta btn-sm w-full">Changer d’offre</a>` : ''}
      </div>` : `<div class="rounded-xl bg-white/5 p-4">
        <div class="flex items-center gap-2 text-white"><i data-lucide="mail-plus" class="w-4 h-4 text-sky"></i><span class="text-sm font-semibold">Email pro non activé</span></div>
        <p class="mt-2 text-xs text-slate-400">Ajoutez des adresses à votre nom de domaine quand vous voulez.</p>
        <a href="${B}configurer-email.html" class="mt-3 btn btn-cta btn-sm w-full">Activer l’email pro</a>
      </div>`}
    </div>`;

  /* ---------- Barre du haut ---------- */
  const topbar = document.getElementById('topbar');
  topbar.className = 'espace-topbar';
  topbar.innerHTML = `
    ${C.DEMO_MODE ? `<div class="bg-mist text-deep text-xs gutter py-1.5 flex items-center justify-center gap-2 text-center"><i data-lucide="flask-conical" class="w-3.5 h-3.5 shrink-0"></i><span>Mode démonstration : les données affichées sont des exemples enregistrés dans votre navigateur.</span><button type="button" id="demo-reset" class="underline font-semibold shrink-0">Réinitialiser</button></div>` : ''}
    <div class="gutter h-16 flex items-center gap-3">
      <div class="lg:hidden -ml-2"><button type="button" class="btn btn-ghost btn-icon" data-sidebar-open aria-label="Ouvrir le menu"><i data-lucide="menu"></i></button></div>
      <h1 class="text-lg sm:text-xl font-bold truncate">${title}</h1>
      <div class="ml-auto flex items-center gap-1.5">
        <div class="hidden sm:block"><a href="acheter-domaine.html" class="btn btn-cta btn-sm"><i data-lucide="plus"></i>Nouveau domaine</a></div>
        <button type="button" class="btn btn-ghost btn-icon relative" aria-label="Notifications" id="notif-btn"><i data-lucide="bell"></i></button>
        <div class="relative">
          <button type="button" id="user-btn" class="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-mist focus-ring" aria-haspopup="menu" aria-expanded="false">
            <span class="w-8 h-8 rounded-full bg-brand-gradient text-white text-xs font-bold grid place-items-center">${FWUI.esc(initials)}</span>
            <i data-lucide="chevron-down" class="w-4 h-4 text-muted hidden sm:block"></i>
          </button>
          <div id="user-menu" class="absolute right-0 mt-2 w-64 card-elevated p-2 z-50" role="menu" hidden>
            <div class="px-3 py-2 border-b border-line mb-1">
              <p class="text-sm font-semibold text-ink truncate">${FWUI.esc(user.name)}</p>
              <p class="text-xs text-muted truncate">${FWUI.esc(user.email)}</p>
            </div>
            <a href="parametres.html" role="menuitem" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-mist"><i data-lucide="user" class="w-4 h-4"></i>Mon profil</a>
            <a href="facturation.html" role="menuitem" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-mist"><i data-lucide="credit-card" class="w-4 h-4"></i>Facturation</a>
            <a href="${B}index.html" role="menuitem" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-mist"><i data-lucide="house" class="w-4 h-4"></i>Site public</a>
            <button type="button" id="logout-btn" role="menuitem" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"><i data-lucide="log-out" class="w-4 h-4"></i>Se déconnecter</button>
          </div>
        </div>
      </div>
    </div>`;

  /* ---------- Interactions ---------- */
  let overlay;
  function openSidebar() {
    sidebar.classList.add('open');
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay lg:hidden';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }
  function closeSidebar() { sidebar.classList.remove('open'); overlay && overlay.remove(); }
  document.querySelector('[data-sidebar-open]').addEventListener('click', openSidebar);
  sidebar.querySelector('[data-sidebar-close]').addEventListener('click', closeSidebar);

  const ub = document.getElementById('user-btn');
  const um = document.getElementById('user-menu');
  ub.addEventListener('click', (e) => { e.stopPropagation(); um.hidden = !um.hidden; ub.setAttribute('aria-expanded', String(!um.hidden)); });
  document.addEventListener('click', (e) => { if (!um.hidden && !um.contains(e.target)) { um.hidden = true; ub.setAttribute('aria-expanded', 'false'); } });

  document.getElementById('logout-btn').addEventListener('click', () => { FW.auth.logout(); location.href = B + 'connexion.html'; });
  document.getElementById('notif-btn').addEventListener('click', () => FWUI.toast('Aucune nouvelle notification.', 'info'));
  const reset = document.getElementById('demo-reset');
  reset && reset.addEventListener('click', () => { FW.workspace.reset(); location.reload(); });

  FWUI.icons();

  /** Petit utilitaire partagé : rafraîchit les données de l'espace. */
  window.FWSpace = { ws: () => FW.workspace.get(), plan: () => { const p = FW.workspace.get().plan; return p ? C.PLANS[p.id] : null; }, user };

  /* Les scripts de page (<script type="text/plain" data-page-script="…">) ne démarrent qu'ici, une fois FWSpace prêt. */
  if (document.readyState === 'loading') await new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));   // les balises suivantes doivent être analysées
  const pending = [...document.querySelectorAll('script[data-page-script]')];
  await Promise.all(pending.map((tpl) => new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = tpl.dataset.pageScript;
    s.onload = s.onerror = resolve;
    tpl.replaceWith(s);
  })));
  window.FW_MONITOR && window.FW_MONITOR.releaseLoader();
})();
