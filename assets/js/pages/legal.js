/* Affiche la section correspondant à l'ancre (#cgu, #confidentialite...). */
(function () {
  function show() {
    const id = (location.hash || '#cgu').slice(1);
    const target = document.getElementById(id) ? id : 'cgu';
    document.querySelectorAll('.legal-section').forEach((s) => { s.hidden = s.id !== target; });
    document.querySelectorAll('.legal-link').forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + target)));
  }
  window.addEventListener('hashchange', () => { show(); window.scrollTo({ top: 0 }); });
  show();
})();
