import { dateGroup, shortDate, initialsOf, isValidEmail, fileSize } from '../src/core/format';
import { sanitizeEmailHtml, htmlToText } from '../src/core/htmlSafety';
import { DemoRepository } from '../src/data/demo';

const now = new Date(2026, 10, 4, 12);

test('groupes et dates courtes', () => {
  expect(dateGroup(new Date(2026, 10, 4, 8), now)).toBe("Aujourd'hui");
  expect(dateGroup(new Date(2026, 10, 3, 8), now)).toBe('Hier');
  expect(dateGroup(new Date(2026, 9, 20), now)).toBe('Ce mois-ci');
  expect(shortDate(new Date(2026, 10, 4, 9, 5), now)).toBe('09:05');
  expect(shortDate(new Date(2026, 10, 1), now)).toBe('Dimanche');
  expect(shortDate(new Date(2025, 0, 5), now)).toBe('5 janv. 2025');
  expect(initialsOf('Marie-Claire Joseph')).toBe('MC');
  expect(isValidEmail('a@b.co')).toBe(true);
  expect(isValidEmail('a@b')).toBe(false);
  expect(fileSize(482113)).toBe('471 Ko');
});

test('HTML : scripts retirés, images distantes bloquées puis autorisées', () => {
  const html = '<p onclick="x()">Salut</p><script>alert(1)</script><a href="javascript:evil()">l</a><img src="https://t.co/p.png"><img src="data:image/png;base64,AA">';
  const safe = sanitizeEmailHtml(html);
  expect(safe.html).not.toMatch(/script|onclick|javascript:|<img/i);
  expect(safe.blockedImages).toBe(1);
  expect(sanitizeEmailHtml(html, true).html).toContain('https://t.co/p.png');
  expect(htmlToText('<p>Un</p><p>Deux&nbsp;&amp;&nbsp;trois</p>')).toBe('Un\n\nDeux & trois');
});

test('démo : lecture, déplacement, suppression, envoi', async () => {
  const r = new DemoRepository(() => now, 0);
  const inbox = await r.messages('inbox');
  expect(inbox[0].date.getTime()).toBeGreaterThan(inbox[1].date.getTime());
  expect((await r.folders())[0].unread).toBeGreaterThan(0);
  await r.setRead('inbox', inbox[0].id, true);
  await r.move('inbox', inbox[0].id, 'archive');
  expect((await r.messages('archive')).some((m) => m.id === inbox[0].id)).toBe(true);
  await r.remove('archive', inbox[0].id);
  expect((await r.messages('trash')).some((m) => m.id === inbox[0].id)).toBe(true);
  await r.remove('trash', inbox[0].id);
  expect((await r.messages('trash')).some((m) => m.id === inbox[0].id)).toBe(false);
  await r.send({ to: [{ email: 'a@b.co' }], subject: '', body: 'Salut' });
  expect((await r.messages('sent'))[0].subject).toBe('(sans objet)');
  expect((await r.messages('inbox', 'stripe')).length).toBe(1);
});
