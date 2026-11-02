/**
 * Facture PDF (A4) générée dans le navigateur avec jsPDF, chargé à la demande.
 * Production : le backend / Freda Pay peut aussi servir GET /invoices/:id/pdf ;
 * ce générateur reste utilisable pour les reçus instantanés.
 */
(function () {
  const C = window.FW_CONFIG;

  const INK = [6, 17, 55], BLUE = [43, 100, 228], MUTED = [91, 100, 120], LINE = [227, 232, 242], MIST = [238, 243, 253];
  const STATUS = {
    paid: { label: 'PAYÉE', fg: [5, 122, 85], bg: [220, 247, 236] },
    refunded: { label: 'REMBOURSÉE', fg: [91, 100, 120], bg: [236, 239, 245] },
    pending: { label: 'EN ATTENTE', fg: [146, 84, 0], bg: [254, 243, 214] },
    failed: { label: 'ÉCHOUÉE', fg: [185, 28, 28], bg: [254, 226, 226] },
  };

  let libPromise;
  function loadLib() {
    if (window.jspdf) return Promise.resolve();
    if (!libPromise) {
      libPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = (document.body.dataset.base || '') + 'assets/js/vendor/jspdf.umd.min.js';
        s.onload = resolve;
        s.onerror = () => { libPromise = null; reject(new Error('Impossible de charger le générateur de PDF.')); };
        document.head.appendChild(s);
      });
    }
    return libPromise;
  }

  function loadImage(url) {
    return fetch(url).then((r) => r.blob()).then((blob) => new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => resolve({ data: fr.result, w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = fr.result;
      };
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    })).catch(() => null);
  }

  /** Produit et description à partir du libellé de la facture. */
  function describe(inv) {
    const label = inv.label || '';
    if (/^Domaines?\s/i.test(label)) {
      const m = label.match(/^Domaines?\s+(.*?)(?:\s+\((.*?)\))?$/i);
      return { product: 'Freda Connect', title: 'Nom de domaine ' + (m ? m[1] : ''), detail: m && m[2] ? 'Durée d’enregistrement : ' + m[2] : '' };
    }
    const plan = label.match(/^(Starter|Business|Enterprise)\s*[—-]\s*(mensuel|annuel)/i);
    if (plan) return { product: 'Freda Mail', title: 'Offre ' + plan[1] + ' · messagerie professionnelle', detail: 'Facturation ' + plan[2].toLowerCase() };
    return { product: 'Freda Workspace', title: label, detail: '' };
  }

  const money = (n) => '$' + Number(n).toFixed(2);

  async function build(inv, ws) {
    await loadLib();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const B = C.BILLING || {};
    const user = ws.user || {};
    const L = 18, R = 192, W = R - L;
    const base = document.body.dataset.base || '';
    const logo = await loadImage(base + 'assets/img/logo-facture.png');
    const st = STATUS[inv.status] || STATUS.paid;
    const d = describe(inv);

    doc.setProperties({ title: 'Facture ' + inv.id, subject: 'Facture Freda Workspace', author: B.legalName || 'Freda Workspace', creator: 'Freda Workspace' });

    /* Bandeau supérieur */
    doc.setFillColor(...BLUE); doc.rect(0, 0, 210, 3.2, 'F');

    /* En-tête : logo à gauche, titre à droite */
    if (logo) { const w = 50, h = w * logo.h / logo.w; doc.addImage(logo.data, 'PNG', L, 14, w, h, undefined, 'FAST'); }
    else { doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...INK).text('Freda Workspace', L, 22); }
    doc.setFont('helvetica', 'bold').setFontSize(24).setTextColor(...INK).text('FACTURE', R, 22, { align: 'right' });
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED).text('N° ' + inv.id, R, 29, { align: 'right' });

    /* Pastille de statut */
    doc.setFont('helvetica', 'bold').setFontSize(8);
    const tw = doc.getTextWidth(st.label) + 8;
    doc.setFillColor(...st.bg).roundedRect(R - tw, 33, tw, 6.4, 3.2, 3.2, 'F');
    doc.setTextColor(...st.fg).text(st.label, R - tw / 2, 37.3, { align: 'center' });

    /* Émetteur / Client */
    const colY = 56;
    const label = (t, x) => doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...BLUE).text(t.toUpperCase(), x, colY);
    label('Émetteur', L); label('Facturé à', 112);
    const lines = (arr, x, y0) => { let y = y0; arr.filter(Boolean).forEach((t, i) => { doc.setFont('helvetica', i === 0 ? 'bold' : 'normal').setFontSize(i === 0 ? 10.5 : 9.5).setTextColor(...(i === 0 ? INK : MUTED)); const parts = doc.splitTextToSize(t, 76); doc.text(parts, x, y); y += parts.length * 4.7 + (i === 0 ? 0.6 : 0); }); return y; };
    lines([B.legalName || 'Freda Pay LLC', B.brandLine || 'Freda Workspace · Freda Group', B.address, B.email || C.SUPPORT_EMAIL, B.website, B.taxId ? 'N° fiscal : ' + B.taxId : ''], L, colY + 6);
    const place = [user.city, user.country].filter(Boolean).join(', ');
    lines([user.company || user.name, user.company ? user.name : '', user.address, place, user.taxId ? 'NIF : ' + user.taxId : '', user.billingEmail || user.email], 112, colY + 6);

    /* Bandeau d'informations */
    const my = 96;
    doc.setFillColor(...MIST).roundedRect(L, my, W, 17, 2.5, 2.5, 'F');
    const cell = (t, v, x) => { doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...MUTED).text(t.toUpperCase(), x, my + 6.3); doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK).text(v, x, my + 12.2); };
    const nice = (iso) => FW.date ? FW.date(iso) : iso;
    cell('Date d’émission', nice(inv.date), L + 6);
    cell('Moyen de paiement', inv.method || '—', L + 62);
    cell('Devise', 'USD (dollar US)', L + 124);

    /* Tableau */
    const ty = 125;
    doc.setFillColor(...INK).roundedRect(L, ty, W, 9, 1.8, 1.8, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(255, 255, 255);
    doc.text('DESCRIPTION', L + 5, ty + 5.8);
    doc.text('QTÉ', 128, ty + 5.8, { align: 'right' });
    doc.text('PRIX UNIT.', 158, ty + 5.8, { align: 'right' });
    doc.text('MONTANT', R - 5, ty + 5.8, { align: 'right' });

    let y = ty + 20;
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...BLUE).text(d.product.toUpperCase(), L + 5, y - 5.2);
    doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...INK);
    const titleLines = doc.splitTextToSize(d.title, 88);
    doc.text(titleLines, L + 5, y);
    let yy = y + titleLines.length * 4.9;
    if (d.detail) { doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED).text(d.detail, L + 5, yy - 0.4); yy += 4.6; }
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK);
    doc.text('1', 128, y, { align: 'right' });
    doc.text(money(inv.amount), 158, y, { align: 'right' });
    doc.setFont('helvetica', 'bold').text(money(inv.amount), R - 5, y, { align: 'right' });
    yy += 3;
    doc.setDrawColor(...LINE).setLineWidth(0.3).line(L, yy, R, yy);

    /* Totaux */
    let ry = yy + 9;
    const row = (t, v, bold) => { doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(bold ? 12 : 10).setTextColor(...(bold ? INK : MUTED)); doc.text(t, 122, ry); doc.text(v, R - 5, ry, { align: 'right' }); ry += bold ? 8 : 6.5; };
    row('Sous-total', money(inv.amount));
    row('Taxes', 'Incluses');
    doc.setDrawColor(...INK).setLineWidth(0.5).line(120, ry - 3.6, R, ry - 3.6);
    ry += 1.8;
    row(inv.status === 'refunded' ? 'Total remboursé' : inv.status === 'paid' ? 'Total payé' : 'Total à payer', money(inv.amount), true);
    if (C.HTG_RATE) { doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...MUTED).text('Soit environ ' + Math.round(inv.amount * C.HTG_RATE).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' HTG (taux : 1 USD = ' + C.HTG_RATE + ' HTG)', R - 5, ry - 1.5, { align: 'right' }); ry += 5; }

    /* Encadré de règlement */
    const noteY = Math.max(ry + 12, 188);
    doc.setFillColor(...st.bg).roundedRect(L, noteY, W, 15, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...st.fg);
    const note = inv.status === 'paid' ? 'Facture acquittée : paiement reçu le ' + nice(inv.date) + ' par ' + (inv.method || '—') + '.'
      : inv.status === 'refunded' ? 'Cette facture a été remboursée sur le moyen de paiement d’origine.'
      : inv.status === 'pending' ? 'Paiement en attente de confirmation.' : 'Le paiement a échoué. Aucun montant n’a été débité.';
    doc.text(doc.splitTextToSize(note, W - 12), L + 6, noteY + 6.3);
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...MUTED).text('Règlement via Freda Pay (carte, MonCash ou NatCash). Conservez ce document pour votre comptabilité.', L + 6, noteY + 11.5);

    /* Pied de page */
    doc.setDrawColor(...LINE).setLineWidth(0.3).line(L, 277, R, 277);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);
    doc.text((B.legalName || 'Freda Pay LLC') + ' · ' + (B.brandLine || 'Freda Workspace · Freda Group'), L, 282.5);
    doc.text('Une question ? ' + (B.email || C.SUPPORT_EMAIL) + (B.website ? ' · ' + B.website : ''), L, 287);
    doc.text('Facture ' + inv.id + ' · Page 1/1', R, 282.5, { align: 'right' });
    doc.text('Document généré électroniquement', R, 287, { align: 'right' });
    return doc;
  }

  async function download(inv, ws) {
    const doc = await build(inv, ws || FW.workspace.get());
    doc.save('Facture-' + inv.id + '.pdf');
  }

  window.FW = window.FW || {};
  window.FW.invoicePdf = { download, build };
})();
