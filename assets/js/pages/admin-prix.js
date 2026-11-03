const C = window.FW_CONFIG;
  const $ = (id) => document.getElementById(id);
  const usd = (n) => '$' + Number(n).toFixed(2);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('msg'); msg.className = ''; msg.textContent = 'Chargement… (la première requête peut prendre quelques secondes)';
    $('t').hidden = true;
    try {
      const res = await fetch(C.API_BASE + '/admin/domain-prices', { headers: { Authorization: 'Bearer ' + $('token').value.trim() } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? 'Jeton refusé.' : (data.error || 'Erreur ' + res.status));
      $('t').querySelector('tbody').innerHTML = data.tlds.map((r) => '<tr><td>' + r.tld + '</td><td>' + usd(r.cost) + '</td><td>' + usd(r.price) + '</td><td>' + usd(r.margin) + ' (' + r.marginPercent + ' %)</td><td>' + usd(r.costRenew) + '</td><td>' + usd(r.renew) + '</td></tr>').join('');
      $('t').hidden = false;
      msg.textContent = 'Marge configurée : ' + data.markupPercent + ' % (minimum ' + usd(data.minMarkup) + '), arrondi à x.99.';
      $('token').value = '';
    } catch (err) { msg.className = 'err'; msg.textContent = err.message; }
  });
