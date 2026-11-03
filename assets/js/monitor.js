/**
 * Mesure d'audience (Plausible, sans cookie) et suivi des erreurs JavaScript.
 * Tout est désactivé tant que ANALYTICS_DOMAIN / ERROR_ENDPOINT sont vides dans config.js.
 * Respecte « Do Not Track ». Aucune donnée personnelle n'est envoyée dans les évènements.
 */
(function () {
  const C = window.FW_CONFIG || {};
  const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';

  /* ----- Audience ----- */
  window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  if (C.ANALYTICS_DOMAIN && !dnt && !/^(localhost|127\.)/.test(location.hostname)) {
    const s = document.createElement('script');
    s.defer = true;
    s.dataset.domain = C.ANALYTICS_DOMAIN;
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
  }
  /** Évènement de parcours : FW.track('domain_search', { tld: '.com' }). N'envoyer ni email, ni nom, ni domaine complet. */
  const track = (name, props) => { try { if (C.ANALYTICS_DOMAIN && !dnt) window.plausible(name, props ? { props } : undefined); } catch (e) { /* ignore */ } };

  /* ----- Erreurs JavaScript ----- */
  let sent = 0;
  const seen = new Set();
  function report(payload) {
    if (sent >= 5) return;               // limite par page vue
    const key = payload.message + '|' + payload.source + '|' + payload.line;
    if (seen.has(key)) return;
    seen.add(key); sent++;
    payload.page = location.pathname;
    payload.ua = navigator.userAgent;
    payload.at = new Date().toISOString();
    if (!C.ERROR_ENDPOINT) return;
    try {
      const body = JSON.stringify(payload);
      if (!(navigator.sendBeacon && navigator.sendBeacon(C.ERROR_ENDPOINT, new Blob([body], { type: 'application/json' })))) {
        fetch(C.ERROR_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
      }
    } catch (e) { /* ignore */ }
  }
  window.addEventListener('error', (e) => {
    if (e.target && e.target !== window) return;   // erreurs de chargement d'image : ignorées
    report({ type: 'error', message: String(e.message || ''), source: e.filename || '', line: e.lineno || 0, stack: e.error && e.error.stack ? String(e.error.stack).slice(0, 1500) : '' });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    report({ type: 'unhandledrejection', message: String(r && r.message ? r.message : r).slice(0, 300), source: '', line: 0, stack: r && r.stack ? String(r.stack).slice(0, 1500) : '' });
  });

  /* ----- Écran de chargement : retiré quand la page et les polices sont prêtes ----- */
  function hideLoader() {
    if (window.FW_HOLD_LOADER) return;       // espace client : le chargeur reste jusqu'à ce que les données soient prêtes (voir espace.js)
    const l = document.getElementById('page-loader');
    if (!l || l.classList.contains('done')) return;
    l.classList.add('done');
    setTimeout(() => l.remove(), 450);
  }
  const ready = new Promise((res) => { if (document.readyState === 'complete') res(); else window.addEventListener('load', res, { once: true }); });
  Promise.race([Promise.all([ready, document.fonts && document.fonts.ready]).catch(() => {}), new Promise((r) => setTimeout(r, 4000))]).then(hideLoader);
  window.addEventListener('pageshow', (e) => { if (e.persisted) hideLoader(); });

  window.FW_MONITOR = { track, hideLoader, releaseLoader() { window.FW_HOLD_LOADER = false; hideLoader(); } };
  window.FW = window.FW || {};
  window.FW.track = track;
})();
